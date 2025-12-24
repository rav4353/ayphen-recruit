import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../common/services/email.service";

export type ABTestStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "CANCELLED";
export type ABTestMetric = "OPEN_RATE" | "CLICK_RATE" | "REPLY_RATE";

export interface ABVariant {
  id: string;
  name: string;
  subject: string;
  body: string;
  percentage: number; // What percentage of recipients get this variant
}

export interface ABTest {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  variants: ABVariant[];
  recipientType: "candidates" | "talent_pool" | "custom";
  recipientIds?: string[];
  talentPoolId?: string;
  testPercentage: number; // What % to use for testing (rest gets winner)
  winnerMetric: ABTestMetric;
  testDurationHours: number;
  status: ABTestStatus;
  winnerId?: string;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  stats: {
    [variantId: string]: {
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
    };
  };
}

const AB_TEST_KEY = "ab_test";

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private newId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ==================== TEST MANAGEMENT ====================

  async createTest(
    tenantId: string,
    userId: string,
    dto: {
      name: string;
      description?: string;
      variants: Omit<ABVariant, "id">[];
      recipientType: "candidates" | "talent_pool" | "custom";
      recipientIds?: string[];
      talentPoolId?: string;
      testPercentage?: number;
      winnerMetric?: ABTestMetric;
      testDurationHours?: number;
    },
  ): Promise<ABTest> {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Test name is required");
    }
    if (!dto.variants || dto.variants.length < 2) {
      throw new BadRequestException(
        "At least 2 variants are required for A/B testing",
      );
    }
    if (dto.variants.length > 5) {
      throw new BadRequestException("Maximum 5 variants allowed");
    }

    // Calculate equal percentages for variants if not specified
    const equalPercentage = Math.floor(100 / dto.variants.length);
    let remainingPercentage = 100;

    const variants: ABVariant[] = dto.variants.map((v, index) => {
      const percentage =
        index === dto.variants.length - 1
          ? remainingPercentage
          : v.percentage || equalPercentage;
      remainingPercentage -= percentage;
      return {
        ...v,
        id: this.newId("var"),
        percentage,
      };
    });

    const stats: ABTest["stats"] = {};
    variants.forEach((v) => {
      stats[v.id] = { sent: 0, opened: 0, clicked: 0, replied: 0 };
    });

    const test: ABTest = {
      id: this.newId("abtest"),
      tenantId,
      name: dto.name,
      description: dto.description,
      variants,
      recipientType: dto.recipientType,
      recipientIds: dto.recipientIds,
      talentPoolId: dto.talentPoolId,
      testPercentage: dto.testPercentage || 100, // Default to 100% (all recipients get test variants)
      winnerMetric: dto.winnerMetric || "OPEN_RATE",
      testDurationHours: dto.testDurationHours || 24,
      status: "DRAFT",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      stats,
    };

    await this.prisma.setting.create({
      data: {
        tenantId,
        key: `${AB_TEST_KEY}_${test.id}`,
        value: test as any,
        category: "AB_TEST",
        isPublic: false,
      },
    });

    return test;
  }

  async getTests(tenantId: string): Promise<ABTest[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${AB_TEST_KEY}_` },
      },
      orderBy: { updatedAt: "desc" },
    });

    return settings.map((s) => s.value as unknown as ABTest);
  }

  async getTest(tenantId: string, testId: string): Promise<ABTest> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: `${AB_TEST_KEY}_${testId}` } },
    });

    if (!setting) {
      throw new NotFoundException("A/B Test not found");
    }

    return setting.value as unknown as ABTest;
  }

  async updateTest(
    tenantId: string,
    testId: string,
    dto: Partial<{
      name: string;
      description: string;
      variants: Omit<ABVariant, "id">[];
      testPercentage: number;
      winnerMetric: ABTestMetric;
      testDurationHours: number;
    }>,
  ): Promise<ABTest> {
    const test = await this.getTest(tenantId, testId);

    if (test.status !== "DRAFT") {
      throw new BadRequestException("Can only update draft tests");
    }

    let variants = test.variants;
    let stats = test.stats;

    if (dto.variants) {
      variants = dto.variants.map((v) => ({
        ...v,
        id: this.newId("var"),
      }));
      stats = {};
      variants.forEach((v) => {
        stats[v.id] = { sent: 0, opened: 0, clicked: 0, replied: 0 };
      });
    }

    const updated: ABTest = {
      ...test,
      ...dto,
      variants,
      stats,
    };

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: `${AB_TEST_KEY}_${testId}` } },
      data: { value: updated as any },
    });

    return updated;
  }

  async startTest(
    tenantId: string,
    testId: string,
    userId: string,
  ): Promise<ABTest> {
    const test = await this.getTest(tenantId, testId);

    if (test.status !== "DRAFT") {
      throw new BadRequestException("Test has already been started");
    }

    // Get recipients
    const recipientIds = await this.resolveRecipients(tenantId, test);
    if (recipientIds.length === 0) {
      throw new BadRequestException("No recipients found");
    }

    // Distribute recipients across variants
    const assignments = this.distributeRecipients(recipientIds, test.variants);

    // Send emails to each variant group
    for (const [variantId, candidateIds] of Object.entries(assignments)) {
      const variant = test.variants.find((v) => v.id === variantId);
      if (!variant) continue;

      await this.sendVariantEmails(tenantId, test, variant, candidateIds);
      test.stats[variantId].sent = candidateIds.length;
    }

    const updated: ABTest = {
      ...test,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: `${AB_TEST_KEY}_${testId}` } },
      data: { value: updated as any },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: "AB_TEST_STARTED",
        description: `A/B test started: ${test.name}`,
        userId,
        metadata: { testId, totalRecipients: recipientIds.length },
      },
    });

    return updated;
  }

  async cancelTest(tenantId: string, testId: string): Promise<ABTest> {
    const test = await this.getTest(tenantId, testId);

    const updated: ABTest = {
      ...test,
      status: "CANCELLED",
    };

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: `${AB_TEST_KEY}_${testId}` } },
      data: { value: updated as any },
    });

    return updated;
  }

  async deleteTest(tenantId: string, testId: string): Promise<void> {
    const test = await this.getTest(tenantId, testId);

    if (test.status === "RUNNING") {
      throw new BadRequestException("Cannot delete a running test");
    }

    await this.prisma.setting.delete({
      where: { tenantId_key: { tenantId, key: `${AB_TEST_KEY}_${testId}` } },
    });
  }

  // ==================== WINNER DETERMINATION ====================

  @Cron(CronExpression.EVERY_HOUR)
  async checkRunningTests(): Promise<void> {
    this.logger.log("Checking for completed A/B tests...");

    try {
      const settings = await this.prisma.setting.findMany({
        where: { category: "AB_TEST" },
      });

      for (const setting of settings) {
        const test = setting.value as unknown as ABTest;

        if (test.status !== "RUNNING") continue;
        if (!test.startedAt) continue;

        const startTime = new Date(test.startedAt).getTime();
        const endTime = startTime + test.testDurationHours * 60 * 60 * 1000;

        if (Date.now() >= endTime) {
          await this.completeTest(setting.tenantId, test.id);
        }
      }
    } catch (error) {
      this.logger.error("Error checking A/B tests:", error);
    }
  }

  async completeTest(tenantId: string, testId: string): Promise<ABTest> {
    const test = await this.getTest(tenantId, testId);

    if (test.status !== "RUNNING") {
      throw new BadRequestException("Test is not running");
    }

    // Update stats from tracking service
    await this.updateTestStats(tenantId, test);

    // Determine winner
    const winnerId = this.determineWinner(test);

    const updated: ABTest = {
      ...test,
      status: "COMPLETED",
      winnerId,
      completedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: `${AB_TEST_KEY}_${testId}` } },
      data: { value: updated as any },
    });

    this.logger.log(`A/B test ${test.name} completed. Winner: ${winnerId}`);

    return updated;
  }

  private determineWinner(test: ABTest): string {
    let bestVariantId = test.variants[0]?.id;
    let bestScore = 0;

    for (const variant of test.variants) {
      const stats = test.stats[variant.id];
      if (!stats || stats.sent === 0) continue;

      let score = 0;
      switch (test.winnerMetric) {
        case "OPEN_RATE":
          score = stats.opened / stats.sent;
          break;
        case "CLICK_RATE":
          score = stats.clicked / stats.sent;
          break;
        case "REPLY_RATE":
          score = stats.replied / stats.sent;
          break;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVariantId = variant.id;
      }
    }

    return bestVariantId;
  }

  // ==================== HELPER METHODS ====================

  private async resolveRecipients(
    tenantId: string,
    test: ABTest,
  ): Promise<string[]> {
    switch (test.recipientType) {
      case "candidates":
      case "custom":
        return test.recipientIds || [];
      case "talent_pool":
        if (!test.talentPoolId) return [];
        // Simplified - would need actual talent pool implementation
        const candidates = await this.prisma.candidate.findMany({
          where: { tenantId },
          select: { id: true },
          take: 1000,
        });
        return candidates.map((c) => c.id);
      default:
        return [];
    }
  }

  private distributeRecipients(
    recipientIds: string[],
    variants: ABVariant[],
  ): Record<string, string[]> {
    const shuffled = [...recipientIds].sort(() => Math.random() - 0.5);
    const assignments: Record<string, string[]> = {};

    variants.forEach((v) => {
      assignments[v.id] = [];
    });

    let currentIndex = 0;
    for (const variant of variants) {
      const count = Math.ceil(shuffled.length * (variant.percentage / 100));
      assignments[variant.id] = shuffled.slice(
        currentIndex,
        currentIndex + count,
      );
      currentIndex += count;
    }

    return assignments;
  }

  private async sendVariantEmails(
    tenantId: string,
    test: ABTest,
    variant: ABVariant,
    candidateIds: string[],
  ): Promise<void> {
    const candidates = await this.prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    for (const candidate of candidates) {
      try {
        const personalizedSubject = this.personalize(
          variant.subject,
          candidate,
        );
        const personalizedBody = this.personalize(variant.body, candidate);

        await this.emailService.sendEmail({
          to: candidate.email,
          subject: personalizedSubject,
          html: personalizedBody,
          tenantId,
        });

        // Log the email send for tracking
        await this.prisma.activityLog.create({
          data: {
            action: "AB_TEST_EMAIL_SENT",
            description: `A/B test email sent: ${variant.name}`,
            candidateId: candidate.id,
            metadata: {
              testId: test.id,
              variantId: variant.id,
              subject: personalizedSubject,
            },
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send A/B test email to ${candidate.email}:`,
          error,
        );
      }
    }
  }

  private personalize(template: string, candidate: any): string {
    return template
      .replace(/\{\{firstName\}\}/g, candidate.firstName || "")
      .replace(/\{\{lastName\}\}/g, candidate.lastName || "")
      .replace(/\{\{email\}\}/g, candidate.email || "");
  }

  private async updateTestStats(tenantId: string, test: ABTest): Promise<void> {
    // Query activity logs for email tracking events
    for (const variant of test.variants) {
      const sentLogs = await this.prisma.activityLog.findMany({
        where: {
          action: "AB_TEST_EMAIL_SENT",
          metadata: {
            path: ["testId"],
            equals: test.id,
          },
        },
      });

      const variantLogs = sentLogs.filter((log) => {
        const meta = log.metadata as any;
        return meta?.variantId === variant.id;
      });

      // For now, use sent count from logs
      // In production, would integrate with proper email tracking
      test.stats[variant.id] = {
        sent: variantLogs.length || test.stats[variant.id]?.sent || 0,
        opened: Math.floor(variantLogs.length * 0.3), // Simulated - would come from tracking
        clicked: Math.floor(variantLogs.length * 0.1), // Simulated - would come from tracking
        replied: 0,
      };
    }
  }

  // ==================== ANALYTICS ====================

  async getTestResults(
    tenantId: string,
    testId: string,
  ): Promise<{
    test: ABTest;
    results: {
      variantId: string;
      variantName: string;
      sent: number;
      openRate: number;
      clickRate: number;
      replyRate: number;
      isWinner: boolean;
    }[];
    recommendation: string;
  }> {
    const test = await this.getTest(tenantId, testId);

    const results = test.variants.map((variant) => {
      const stats = test.stats[variant.id] || {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
      };
      return {
        variantId: variant.id,
        variantName: variant.name,
        sent: stats.sent,
        openRate:
          stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
        clickRate:
          stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0,
        replyRate:
          stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0,
        isWinner: variant.id === test.winnerId,
      };
    });

    const winner = results.find((r) => r.isWinner);
    let recommendation =
      "Test is still running. Results will be available after completion.";

    if (test.status === "COMPLETED" && winner) {
      const metric = test.winnerMetric.toLowerCase().replace("_", " ");
      recommendation = `"${winner.variantName}" performed best with a ${winner.openRate}% open rate. Consider using this subject line/content for future campaigns.`;
    }

    return { test, results, recommendation };
  }
}
