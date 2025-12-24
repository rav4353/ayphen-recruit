import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../common/services/email.service";

export type DripCampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type DripStepTrigger = "DELAY" | "CONDITION";

export interface DripStep {
  id: string;
  order: number;
  name: string;
  subject: string;
  body: string;
  delayDays: number;
  delayHours: number;
  trigger: DripStepTrigger;
  condition?: {
    type: "OPENED" | "CLICKED" | "NOT_OPENED" | "NOT_CLICKED";
    previousStepId?: string;
  };
}

export interface DripCampaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  steps: DripStep[];
  recipientType: "candidates" | "talent_pool" | "job_applicants";
  recipientIds?: string[];
  talentPoolId?: string;
  jobId?: string;
  status: DripCampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    enrolled: number;
    completed: number;
    unsubscribed: number;
  };
}

export interface DripEnrollment {
  id: string;
  campaignId: string;
  candidateId: string;
  currentStepIndex: number;
  nextStepAt?: string;
  status: "ACTIVE" | "COMPLETED" | "UNSUBSCRIBED" | "PAUSED";
  stepsCompleted: {
    stepId: string;
    sentAt: string;
    opened?: boolean;
    clicked?: boolean;
  }[];
  enrolledAt: string;
}

const DRIP_CAMPAIGN_KEY = "drip_campaign";
const DRIP_ENROLLMENT_KEY = "drip_enrollment";

@Injectable()
export class DripCampaignsService {
  private readonly logger = new Logger(DripCampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private newId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  async createCampaign(
    tenantId: string,
    userId: string,
    dto: {
      name: string;
      description?: string;
      steps: Omit<DripStep, "id">[];
      recipientType: "candidates" | "talent_pool" | "job_applicants";
      recipientIds?: string[];
      talentPoolId?: string;
      jobId?: string;
    },
  ): Promise<DripCampaign> {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Campaign name is required");
    }
    if (!dto.steps || dto.steps.length === 0) {
      throw new BadRequestException("At least one step is required");
    }

    const campaign: DripCampaign = {
      id: this.newId("drip"),
      tenantId,
      name: dto.name,
      description: dto.description,
      steps: dto.steps.map((step, index) => ({
        ...step,
        id: this.newId("step"),
        order: index,
      })),
      recipientType: dto.recipientType,
      recipientIds: dto.recipientIds,
      talentPoolId: dto.talentPoolId,
      jobId: dto.jobId,
      status: "DRAFT",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { enrolled: 0, completed: 0, unsubscribed: 0 },
    };

    await this.prisma.setting.create({
      data: {
        tenantId,
        key: `${DRIP_CAMPAIGN_KEY}_${campaign.id}`,
        value: campaign as any,
        category: "DRIP_CAMPAIGN",
        isPublic: false,
      },
    });

    return campaign;
  }

  async getCampaigns(tenantId: string): Promise<DripCampaign[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${DRIP_CAMPAIGN_KEY}_` },
      },
    });

    return settings.map((s) => s.value as unknown as DripCampaign);
  }

  async getCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<DripCampaign> {
    const setting = await this.prisma.setting.findUnique({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaignId}` },
      },
    });

    if (!setting) {
      throw new NotFoundException("Campaign not found");
    }

    return setting.value as unknown as DripCampaign;
  }

  async updateCampaign(
    tenantId: string,
    campaignId: string,
    dto: Partial<{
      name: string;
      description: string;
      steps: Omit<DripStep, "id">[];
    }>,
  ): Promise<DripCampaign> {
    const campaign = await this.getCampaign(tenantId, campaignId);

    if (campaign.status === "ACTIVE") {
      throw new BadRequestException("Cannot edit an active campaign");
    }

    const updated: DripCampaign = {
      ...campaign,
      ...dto,
      steps: dto.steps
        ? dto.steps.map((step, index) => ({
            ...step,
            id: this.newId("step"),
            order: index,
          }))
        : campaign.steps,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaignId}` },
      },
      data: { value: updated as any },
    });

    return updated;
  }

  async activateCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<DripCampaign> {
    const campaign = await this.getCampaign(tenantId, campaignId);

    if (campaign.status === "ACTIVE") {
      throw new BadRequestException("Campaign is already active");
    }

    const updated: DripCampaign = {
      ...campaign,
      status: "ACTIVE",
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaignId}` },
      },
      data: { value: updated as any },
    });

    // Enroll recipients
    await this.enrollRecipients(tenantId, updated);

    return updated;
  }

  async pauseCampaign(
    tenantId: string,
    campaignId: string,
  ): Promise<DripCampaign> {
    const campaign = await this.getCampaign(tenantId, campaignId);

    const updated: DripCampaign = {
      ...campaign,
      status: "PAUSED",
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaignId}` },
      },
      data: { value: updated as any },
    });

    return updated;
  }

  async deleteCampaign(tenantId: string, campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(tenantId, campaignId);

    if (campaign.status === "ACTIVE") {
      throw new BadRequestException("Cannot delete an active campaign");
    }

    await this.prisma.setting.delete({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaignId}` },
      },
    });

    // Delete enrollments
    await this.prisma.setting.deleteMany({
      where: {
        tenantId,
        key: { startsWith: `${DRIP_ENROLLMENT_KEY}_${campaignId}_` },
      },
    });
  }

  // ==================== ENROLLMENT MANAGEMENT ====================

  private async enrollRecipients(
    tenantId: string,
    campaign: DripCampaign,
  ): Promise<void> {
    let candidateIds: string[] = [];

    switch (campaign.recipientType) {
      case "candidates":
        candidateIds = campaign.recipientIds || [];
        break;
      case "talent_pool":
        if (campaign.talentPoolId) {
          // Get candidates from talent pool (simplified - would need actual implementation)
          const candidates = await this.prisma.candidate.findMany({
            where: { tenantId, tags: { has: campaign.talentPoolId } },
            select: { id: true },
          });
          candidateIds = candidates.map((c) => c.id);
        }
        break;
      case "job_applicants":
        if (campaign.jobId) {
          const applications = await this.prisma.application.findMany({
            where: { jobId: campaign.jobId },
            select: { candidateId: true },
          });
          candidateIds = applications.map((a) => a.candidateId);
        }
        break;
    }

    const firstStepDelay = campaign.steps[0];
    const nextStepAt = new Date();
    nextStepAt.setDate(nextStepAt.getDate() + (firstStepDelay?.delayDays || 0));
    nextStepAt.setHours(
      nextStepAt.getHours() + (firstStepDelay?.delayHours || 0),
    );

    for (const candidateId of candidateIds) {
      const enrollment: DripEnrollment = {
        id: this.newId("enroll"),
        campaignId: campaign.id,
        candidateId,
        currentStepIndex: 0,
        nextStepAt: nextStepAt.toISOString(),
        status: "ACTIVE",
        stepsCompleted: [],
        enrolledAt: new Date().toISOString(),
      };

      await this.prisma.setting.create({
        data: {
          tenantId,
          key: `${DRIP_ENROLLMENT_KEY}_${campaign.id}_${candidateId}`,
          value: enrollment as any,
          category: "DRIP_ENROLLMENT",
          isPublic: false,
        },
      });
    }

    // Update campaign stats
    const updatedCampaign: DripCampaign = {
      ...campaign,
      stats: { ...campaign.stats, enrolled: candidateIds.length },
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaign.id}` },
      },
      data: { value: updatedCampaign as any },
    });
  }

  async getEnrollments(
    tenantId: string,
    campaignId: string,
  ): Promise<DripEnrollment[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${DRIP_ENROLLMENT_KEY}_${campaignId}_` },
      },
    });

    return settings.map((s) => s.value as unknown as DripEnrollment);
  }

  async unsubscribeCandidate(
    tenantId: string,
    campaignId: string,
    candidateId: string,
  ): Promise<void> {
    const key = `${DRIP_ENROLLMENT_KEY}_${campaignId}_${candidateId}`;
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });

    if (!setting) return;

    const enrollment = setting.value as unknown as DripEnrollment;
    enrollment.status = "UNSUBSCRIBED";

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key } },
      data: { value: enrollment as any },
    });

    // Update campaign stats
    const campaign = await this.getCampaign(tenantId, campaignId);
    campaign.stats.unsubscribed++;

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${DRIP_CAMPAIGN_KEY}_${campaignId}` },
      },
      data: { value: campaign as any },
    });
  }

  // ==================== DRIP PROCESSING ====================

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processDripCampaigns(): Promise<void> {
    this.logger.log("Processing drip campaigns...");

    try {
      // Get all active enrollments due for next step
      const now = new Date();
      const settings = await this.prisma.setting.findMany({
        where: {
          category: "DRIP_ENROLLMENT",
        },
      });

      for (const setting of settings) {
        const enrollment = setting.value as unknown as DripEnrollment;

        if (enrollment.status !== "ACTIVE") continue;
        if (!enrollment.nextStepAt) continue;
        if (new Date(enrollment.nextStepAt) > now) continue;

        const tenantId = setting.tenantId;

        try {
          await this.processEnrollmentStep(tenantId, enrollment);
        } catch (error) {
          this.logger.error(
            `Error processing enrollment ${enrollment.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error("Error processing drip campaigns:", error);
    }
  }

  private async processEnrollmentStep(
    tenantId: string,
    enrollment: DripEnrollment,
  ): Promise<void> {
    const campaign = await this.getCampaign(tenantId, enrollment.campaignId);

    if (campaign.status !== "ACTIVE") return;

    const currentStep = campaign.steps[enrollment.currentStepIndex];
    if (!currentStep) {
      // Campaign completed
      enrollment.status = "COMPLETED";
      await this.updateEnrollment(tenantId, enrollment);

      campaign.stats.completed++;
      await this.prisma.setting.update({
        where: {
          tenantId_key: {
            tenantId,
            key: `${DRIP_CAMPAIGN_KEY}_${campaign.id}`,
          },
        },
        data: { value: campaign as any },
      });
      return;
    }

    // Get candidate
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: enrollment.candidateId },
    });

    if (!candidate) {
      enrollment.status = "COMPLETED";
      await this.updateEnrollment(tenantId, enrollment);
      return;
    }

    // Check conditions if applicable
    if (currentStep.trigger === "CONDITION" && currentStep.condition) {
      const previousStepCompletion = enrollment.stepsCompleted.find(
        (sc) => sc.stepId === currentStep.condition?.previousStepId,
      );

      if (previousStepCompletion) {
        const conditionMet = this.evaluateCondition(
          currentStep.condition,
          previousStepCompletion,
        );
        if (!conditionMet) {
          // Skip this step
          this.moveToNextStep(enrollment, campaign);
          await this.updateEnrollment(tenantId, enrollment);
          return;
        }
      }
    }

    // Send email
    try {
      const personalizedSubject = this.personalizeContent(
        currentStep.subject,
        candidate,
      );
      const personalizedBody = this.personalizeContent(
        currentStep.body,
        candidate,
      );

      await this.emailService.sendEmail({
        to: candidate.email,
        subject: personalizedSubject,
        html: personalizedBody,
        tenantId,
      });

      enrollment.stepsCompleted.push({
        stepId: currentStep.id,
        sentAt: new Date().toISOString(),
      });

      this.logger.log(
        `Drip email sent to ${candidate.email} for step ${currentStep.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send drip email to ${candidate.email}:`,
        error,
      );
    }

    // Move to next step
    this.moveToNextStep(enrollment, campaign);
    await this.updateEnrollment(tenantId, enrollment);
  }

  private moveToNextStep(
    enrollment: DripEnrollment,
    campaign: DripCampaign,
  ): void {
    enrollment.currentStepIndex++;

    const nextStep = campaign.steps[enrollment.currentStepIndex];
    if (nextStep) {
      const nextStepAt = new Date();
      nextStepAt.setDate(nextStepAt.getDate() + (nextStep.delayDays || 0));
      nextStepAt.setHours(nextStepAt.getHours() + (nextStep.delayHours || 0));
      enrollment.nextStepAt = nextStepAt.toISOString();
    } else {
      enrollment.status = "COMPLETED";
      enrollment.nextStepAt = undefined;
    }
  }

  private evaluateCondition(
    condition: DripStep["condition"],
    stepCompletion: DripEnrollment["stepsCompleted"][0],
  ): boolean {
    if (!condition) return true;

    switch (condition.type) {
      case "OPENED":
        return stepCompletion.opened === true;
      case "NOT_OPENED":
        return stepCompletion.opened !== true;
      case "CLICKED":
        return stepCompletion.clicked === true;
      case "NOT_CLICKED":
        return stepCompletion.clicked !== true;
      default:
        return true;
    }
  }

  private personalizeContent(content: string, candidate: any): string {
    return content
      .replace(/\{\{firstName\}\}/g, candidate.firstName || "")
      .replace(/\{\{lastName\}\}/g, candidate.lastName || "")
      .replace(/\{\{email\}\}/g, candidate.email || "")
      .replace(/\{\{currentTitle\}\}/g, candidate.currentTitle || "")
      .replace(/\{\{currentCompany\}\}/g, candidate.currentCompany || "");
  }

  private async updateEnrollment(
    tenantId: string,
    enrollment: DripEnrollment,
  ): Promise<void> {
    const key = `${DRIP_ENROLLMENT_KEY}_${enrollment.campaignId}_${enrollment.candidateId}`;
    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key } },
      data: { value: enrollment as any },
    });
  }

  // ==================== ANALYTICS ====================

  async getCampaignStats(
    tenantId: string,
    campaignId: string,
  ): Promise<{
    campaign: DripCampaign;
    enrollments: {
      total: number;
      active: number;
      completed: number;
      unsubscribed: number;
    };
    stepStats: {
      stepId: string;
      stepName: string;
      sent: number;
      opened: number;
      clicked: number;
    }[];
  }> {
    const campaign = await this.getCampaign(tenantId, campaignId);
    const enrollments = await this.getEnrollments(tenantId, campaignId);

    const stepStats = campaign.steps.map((step) => {
      const stepsCompleted = enrollments
        .flatMap((e) => e.stepsCompleted)
        .filter((sc) => sc.stepId === step.id);
      return {
        stepId: step.id,
        stepName: step.name,
        sent: stepsCompleted.length,
        opened: stepsCompleted.filter((sc) => sc.opened).length,
        clicked: stepsCompleted.filter((sc) => sc.clicked).length,
      };
    });

    return {
      campaign,
      enrollments: {
        total: enrollments.length,
        active: enrollments.filter((e) => e.status === "ACTIVE").length,
        completed: enrollments.filter((e) => e.status === "COMPLETED").length,
        unsubscribed: enrollments.filter((e) => e.status === "UNSUBSCRIBED")
          .length,
      },
      stepStats,
    };
  }
}
