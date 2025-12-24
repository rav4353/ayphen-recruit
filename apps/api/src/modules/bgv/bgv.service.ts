import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CheckrService } from "./providers/checkr.service";
import { NotificationsService } from "../notifications/notifications.service";

type BGVProvider = "CHECKR" | "SPRINGVERIFY" | "AUTHBRIDGE" | "MANUAL";
type BGVStatus =
  | "PENDING"
  | "INITIATED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLEAR"
  | "CONSIDER"
  | "FAILED"
  | "CANCELLED";

interface ConfigureBGVDto {
  provider: BGVProvider;
  apiKey: string;
  apiSecret?: string;
  webhookUrl?: string;
  sandboxMode?: boolean;
}

interface InitiateBGVDto {
  candidateId: string;
  applicationId?: string;
  packageType?: string;
  checkTypes?: string[];
}

@Injectable()
export class BGVService {
  private readonly logger = new Logger(BGVService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkr: CheckrService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get BGV settings for tenant
   */
  async getSettings(tenantId: string) {
    const settings = await this.prisma.bGVSettings.findUnique({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        isConfigured: true,
        sandboxMode: true,
      },
    });
    return settings;
  }

  /**
   * Configure BGV provider
   */
  async configure(tenantId: string, dto: ConfigureBGVDto) {
    const settings = await this.prisma.bGVSettings.upsert({
      where: { tenantId },
      update: {
        provider: dto.provider,
        apiKey: dto.apiKey,
        apiSecret: dto.apiSecret,
        webhookUrl: dto.webhookUrl,
        sandboxMode: dto.sandboxMode ?? true,
        isConfigured: true,
      },
      create: {
        tenantId,
        provider: dto.provider,
        apiKey: dto.apiKey,
        apiSecret: dto.apiSecret,
        webhookUrl: dto.webhookUrl,
        sandboxMode: dto.sandboxMode ?? true,
        isConfigured: true,
      },
    });
    return { id: settings.id, provider: settings.provider, isConfigured: true };
  }

  /**
   * Initiate a background check
   */
  async initiate(tenantId: string, userId: string, dto: InitiateBGVDto) {
    // Get settings
    const settings = await this.prisma.bGVSettings.findUnique({
      where: { tenantId },
    });
    if (!settings?.apiKey) {
      throw new BadRequestException("BGV provider not configured");
    }

    // Get candidate
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });
    if (!candidate || candidate.tenantId !== tenantId) {
      throw new NotFoundException("Candidate not found");
    }

    // Check for existing pending BGV
    const existing = await this.prisma.bGVCheck.findFirst({
      where: {
        candidateId: dto.candidateId,
        status: { in: ["PENDING", "INITIATED", "IN_PROGRESS"] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        "A background check is already in progress for this candidate",
      );
    }

    let externalId: string | null = null;
    let status: BGVStatus = "PENDING";

    // Initiate with provider
    if (settings.provider === "CHECKR") {
      try {
        const config = {
          apiKey: settings.apiKey,
          sandboxMode: settings.sandboxMode,
        };

        // Create candidate in Checkr
        const checkrCandidate = await this.checkr.createCandidate(config, {
          email: candidate.email,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          phone: candidate.phone || undefined,
        });

        // Create invitation
        const invitation = await this.checkr.createInvitation(
          config,
          checkrCandidate.id,
          dto.packageType || "driver_pro",
        );

        externalId = invitation.id;
        status = "INITIATED";
      } catch (error: any) {
        this.logger.error("Failed to initiate Checkr BGV:", error);
        throw new BadRequestException(
          `Failed to initiate background check: ${error.message}`,
        );
      }
    } else if (settings.provider === "MANUAL") {
      status = "INITIATED";
    }

    // Create BGV record
    const bgvCheck = await this.prisma.bGVCheck.create({
      data: {
        provider: settings.provider,
        externalId,
        status,
        packageType: dto.packageType || "standard",
        checkTypes: (dto.checkTypes as any) || [
          "IDENTITY",
          "CRIMINAL",
          "EMPLOYMENT",
        ],
        candidateId: dto.candidateId,
        applicationId: dto.applicationId,
        initiatedById: userId,
        initiatedAt: new Date(),
      },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            tenantId: true,
          },
        },
        application: {
          select: {
            job: {
              select: {
                recruiterId: true,
                hiringManagerId: true,
                tenantId: true,
              },
            },
          },
        },
      },
    });

    // Notify HR, recruiter, and hiring manager about BGV initiation
    try {
      const recipientIds = Array.from(
        new Set(
          [
            bgvCheck.application?.job?.recruiterId,
            bgvCheck.application?.job?.hiringManagerId,
          ].filter(Boolean) as string[],
        ),
      ).filter((rid) => rid !== userId);

      if (recipientIds.length > 0) {
        await this.notificationsService.createMany(
          recipientIds.map((rid) => ({
            type: "BGV",
            title: "Background Check Initiated",
            message: `Background check initiated for ${bgvCheck.candidate.firstName} ${bgvCheck.candidate.lastName}`,
            link: `/bgv/checks/${bgvCheck.id}`,
            metadata: {
              checkId: bgvCheck.id,
              candidateId: dto.candidateId,
              status,
            },
            userId: rid,
            tenantId: bgvCheck.candidate.tenantId,
          })) as any,
        );
      }
    } catch (error) {
      this.logger.error("Failed to notify BGV initiation:", error);
    }

    return bgvCheck;
  }

  /**
   * Get BGV check status
   */
  async getCheck(tenantId: string, checkId: string) {
    const check = await this.prisma.bGVCheck.findUnique({
      where: { id: checkId },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            tenantId: true,
          },
        },
        application: {
          select: { id: true, job: { select: { title: true } } },
        },
        initiatedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!check || check.candidate.tenantId !== tenantId) {
      throw new NotFoundException("BGV check not found");
    }

    return check;
  }

  /**
   * List BGV checks for tenant
   */
  async listChecks(
    tenantId: string,
    filters?: { status?: BGVStatus; candidateId?: string },
  ) {
    const where: any = {
      candidate: { tenantId },
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.candidateId) where.candidateId = filters.candidateId;

    return this.prisma.bGVCheck.findMany({
      where,
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true } },
        application: { select: { job: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Sync status with provider
   */
  async syncStatus(tenantId: string, checkId: string) {
    const check = await this.getCheck(tenantId, checkId);
    const settings = await this.prisma.bGVSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.apiKey || !check.externalId) {
      return check;
    }

    if (settings.provider === "CHECKR") {
      try {
        const config = {
          apiKey: settings.apiKey,
          sandboxMode: settings.sandboxMode,
        };
        const reports = await this.checkr.getCandidateReports(
          config,
          check.externalId,
        );

        if (reports.length > 0) {
          const latestReport = reports[0];
          const newStatus = this.checkr.mapStatus(
            latestReport.status,
            latestReport.result,
          ) as BGVStatus;
          const previousStatus = check.status;

          await this.prisma.bGVCheck.update({
            where: { id: checkId },
            data: {
              status: newStatus,
              result: latestReport as any,
              reportUrl: `https://dashboard.checkr.com/reports/${latestReport.id}`,
              completedAt: latestReport.completed_at
                ? new Date(latestReport.completed_at)
                : null,
            },
          });

          // Notify if status changed
          if (newStatus !== previousStatus) {
            await this.notifyBGVStatusChange(check, newStatus);
          }
        }
      } catch (error) {
        this.logger.error("Failed to sync Checkr status:", error);
      }
    }

    return this.getCheck(tenantId, checkId);
  }

  /**
   * Handle webhook from BGV provider
   */
  async handleWebhook(provider: string, payload: any) {
    this.logger.log(`Received ${provider} webhook:`, payload);

    if (provider === "checkr") {
      const { type, data } = payload;

      if (type === "report.completed" || type === "report.updated") {
        const reportId = data.object.id;

        // Find the BGV check by external ID
        const check = await this.prisma.bGVCheck.findFirst({
          where: { externalId: reportId },
        });

        if (check) {
          const newStatus = this.checkr.mapStatus(
            data.object.status,
            data.object.result,
          ) as BGVStatus;
          const previousStatus = check.status;

          await this.prisma.bGVCheck.update({
            where: { id: check.id },
            data: {
              status: newStatus,
              result: data.object,
              completedAt: data.object.completed_at
                ? new Date(data.object.completed_at)
                : null,
            },
          });

          // Notify if status changed
          if (newStatus !== previousStatus) {
            await this.notifyBGVStatusChange(check, newStatus);
          }
        }
      }
    }

    return { received: true };
  }

  /**
   * Cancel a BGV check
   */
  async cancel(tenantId: string, checkId: string) {
    const check = await this.getCheck(tenantId, checkId);

    if (!["PENDING", "INITIATED"].includes(check.status)) {
      throw new BadRequestException(
        "Cannot cancel a check that is already in progress or completed",
      );
    }

    await this.prisma.bGVCheck.update({
      where: { id: checkId },
      data: { status: "CANCELLED" },
    });

    return { success: true };
  }

  /**
   * Get available BGV packages
   */
  async getPackages(tenantId: string) {
    const settings = await this.prisma.bGVSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.apiKey) {
      // Return default packages
      return [
        {
          id: "basic",
          name: "Basic",
          description: "Identity + National Criminal",
          checks: ["IDENTITY", "CRIMINAL"],
        },
        {
          id: "standard",
          name: "Standard",
          description: "Basic + Employment Verification",
          checks: ["IDENTITY", "CRIMINAL", "EMPLOYMENT"],
        },
        {
          id: "comprehensive",
          name: "Comprehensive",
          description: "Standard + Education + Reference",
          checks: [
            "IDENTITY",
            "CRIMINAL",
            "EMPLOYMENT",
            "EDUCATION",
            "REFERENCE",
          ],
        },
      ];
    }

    if (settings.provider === "CHECKR") {
      const config = {
        apiKey: settings.apiKey,
        sandboxMode: settings.sandboxMode,
      };
      return this.checkr.getPackages(config);
    }

    return [];
  }

  /**
   * Get BGV dashboard stats
   */
  async getDashboard(tenantId: string) {
    const [total, pending, inProgress, clear, consider] = await Promise.all([
      this.prisma.bGVCheck.count({ where: { candidate: { tenantId } } }),
      this.prisma.bGVCheck.count({
        where: { candidate: { tenantId }, status: "PENDING" },
      }),
      this.prisma.bGVCheck.count({
        where: { candidate: { tenantId }, status: "IN_PROGRESS" },
      }),
      this.prisma.bGVCheck.count({
        where: { candidate: { tenantId }, status: "CLEAR" },
      }),
      this.prisma.bGVCheck.count({
        where: { candidate: { tenantId }, status: "CONSIDER" },
      }),
    ]);

    return {
      total,
      pending,
      inProgress,
      clear,
      consider,
      clearRate: total > 0 ? Math.round((clear / total) * 100) : 0,
    };
  }

  /**
   * Test connection to BGV provider
   */
  async testConnection(tenantId: string) {
    const settings = await this.prisma.bGVSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.apiKey) {
      return { success: false, message: "BGV provider not configured" };
    }

    if (settings.provider === "CHECKR") {
      const config = {
        apiKey: settings.apiKey,
        sandboxMode: settings.sandboxMode,
      };
      return this.checkr.testConnection(config);
    }

    if (settings.provider === "MANUAL") {
      return { success: true, message: "Manual verification mode is active" };
    }

    return { success: false, message: "Unknown provider" };
  }

  /**
   * Get available screening types
   */
  async getScreeningTypes(tenantId: string) {
    const settings = await this.prisma.bGVSettings.findUnique({
      where: { tenantId },
    });

    if (settings?.provider === "CHECKR") {
      return this.checkr.getScreeningTypes();
    }

    // Default screening types for manual or unconfigured
    return [
      {
        id: "IDENTITY",
        name: "Identity Verification",
        description: "Verifies candidate identity documents",
      },
      {
        id: "CRIMINAL",
        name: "Criminal Background",
        description: "Checks criminal history records",
      },
      {
        id: "EMPLOYMENT",
        name: "Employment Verification",
        description: "Verifies past employment history",
      },
      {
        id: "EDUCATION",
        name: "Education Verification",
        description: "Verifies educational credentials",
      },
      {
        id: "REFERENCE",
        name: "Reference Check",
        description: "Contacts provided references",
      },
      {
        id: "CREDIT",
        name: "Credit Check",
        description: "Checks credit history (where applicable)",
      },
      {
        id: "DRUG",
        name: "Drug Screening",
        description: "Pre-employment drug testing",
      },
    ];
  }

  /**
   * Notify relevant users about BGV status change
   */
  private async notifyBGVStatusChange(check: any, newStatus: BGVStatus) {
    try {
      const fullCheck = await this.prisma.bGVCheck.findUnique({
        where: { id: check.id },
        include: {
          candidate: {
            select: { firstName: true, lastName: true, tenantId: true },
          },
          application: {
            select: {
              job: { select: { recruiterId: true, hiringManagerId: true } },
            },
          },
        },
      });

      if (!fullCheck) return;

      const recipientIds = Array.from(
        new Set(
          [
            fullCheck.application?.job?.recruiterId,
            fullCheck.application?.job?.hiringManagerId,
          ].filter(Boolean) as string[],
        ),
      );

      if (recipientIds.length > 0) {
        await this.notificationsService.createMany(
          recipientIds.map((rid) => ({
            type: "BGV",
            title: `BGV Status: ${newStatus}`,
            message: `Background check for ${fullCheck.candidate.firstName} ${fullCheck.candidate.lastName} is now ${newStatus}`,
            link: `/bgv/checks/${fullCheck.id}`,
            metadata: {
              checkId: fullCheck.id,
              candidateId: fullCheck.candidateId,
              status: newStatus,
            },
            userId: rid,
            tenantId: fullCheck.candidate.tenantId,
          })) as any,
        );
      }
    } catch (error) {
      this.logger.error("Failed to notify BGV status change:", error);
    }
  }
}
