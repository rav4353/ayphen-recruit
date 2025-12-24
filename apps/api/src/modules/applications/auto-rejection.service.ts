import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../common/services/email.service";

export interface RejectionTemplate {
  id: string;
  tenantId: string;
  stage: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  delayHours: number; // Delay before sending (0 = immediate)
  createdAt: string;
  updatedAt: string;
}

export interface RejectionConfig {
  enabled: boolean;
  defaultDelayHours: number;
  excludeStages: string[];
  sendOnWeekends: boolean;
  ccRecruiter: boolean;
}

const REJECTION_TEMPLATE_KEY = "rejection_template";
const REJECTION_CONFIG_KEY = "auto_rejection_config";

@Injectable()
export class AutoRejectionService {
  private readonly logger = new Logger(AutoRejectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private newId(): string {
    return `rej-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ==================== CONFIGURATION ====================

  async getConfig(tenantId: string): Promise<RejectionConfig> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: REJECTION_CONFIG_KEY } },
    });

    if (!setting) {
      return {
        enabled: true,
        defaultDelayHours: 24,
        excludeStages: [],
        sendOnWeekends: false,
        ccRecruiter: true,
      };
    }

    return setting.value as unknown as RejectionConfig;
  }

  async updateConfig(
    tenantId: string,
    config: Partial<RejectionConfig>,
  ): Promise<RejectionConfig> {
    const current = await this.getConfig(tenantId);
    const updated = { ...current, ...config };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: REJECTION_CONFIG_KEY } },
      update: { value: updated as any },
      create: {
        tenantId,
        key: REJECTION_CONFIG_KEY,
        value: updated as any,
        category: "AUTO_REJECTION",
        isPublic: false,
      },
    });

    return updated;
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  async createTemplate(
    tenantId: string,
    dto: {
      stage: string;
      name: string;
      subject: string;
      body: string;
      isDefault?: boolean;
      delayHours?: number;
    },
  ): Promise<RejectionTemplate> {
    const template: RejectionTemplate = {
      id: this.newId(),
      tenantId,
      stage: dto.stage,
      name: dto.name,
      subject: dto.subject,
      body: dto.body,
      isDefault: dto.isDefault || false,
      delayHours: dto.delayHours || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.create({
      data: {
        tenantId,
        key: `${REJECTION_TEMPLATE_KEY}_${template.id}`,
        value: template as any,
        category: "REJECTION_TEMPLATE",
        isPublic: false,
      },
    });

    return template;
  }

  async getTemplates(
    tenantId: string,
    stage?: string,
  ): Promise<RejectionTemplate[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${REJECTION_TEMPLATE_KEY}_` },
      },
    });

    let templates = settings.map(
      (s) => s.value as unknown as RejectionTemplate,
    );

    if (stage) {
      templates = templates.filter(
        (t) => t.stage === stage || t.stage === "ALL",
      );
    }

    return templates.sort((a, b) => a.stage.localeCompare(b.stage));
  }

  async getTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<RejectionTemplate | null> {
    const setting = await this.prisma.setting.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key: `${REJECTION_TEMPLATE_KEY}_${templateId}`,
        },
      },
    });

    return setting?.value as unknown as RejectionTemplate | null;
  }

  async updateTemplate(
    tenantId: string,
    templateId: string,
    dto: Partial<{
      name: string;
      subject: string;
      body: string;
      isDefault: boolean;
      delayHours: number;
    }>,
  ): Promise<RejectionTemplate> {
    const template = await this.getTemplate(tenantId, templateId);
    if (!template) throw new Error("Template not found");

    const updated: RejectionTemplate = {
      ...template,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: {
          tenantId,
          key: `${REJECTION_TEMPLATE_KEY}_${templateId}`,
        },
      },
      data: { value: updated as any },
    });

    return updated;
  }

  async deleteTemplate(tenantId: string, templateId: string): Promise<void> {
    await this.prisma.setting.delete({
      where: {
        tenantId_key: {
          tenantId,
          key: `${REJECTION_TEMPLATE_KEY}_${templateId}`,
        },
      },
    });
  }

  // ==================== REJECTION SENDING ====================

  async sendRejection(
    applicationId: string,
    options?: {
      templateId?: string;
      customMessage?: string;
      immediate?: boolean;
    },
  ): Promise<{ success: boolean; scheduledAt?: string; error?: string }> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: { include: { tenant: true, recruiter: true } },
      },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    const tenantId = application.job.tenantId;
    const config = await this.getConfig(tenantId);

    if (!config.enabled) {
      return { success: false, error: "Auto-rejection is disabled" };
    }

    // Get template
    let template: RejectionTemplate | null = null;
    if (options?.templateId) {
      template = await this.getTemplate(tenantId, options.templateId);
    } else {
      // Find default template for current stage
      const templates = await this.getTemplates(tenantId, application.status);
      template = templates.find((t) => t.isDefault) || templates[0];
    }

    // Build email content
    const subject = this.personalizeContent(
      template?.subject || this.getDefaultSubject(),
      application,
    );
    const body = this.personalizeContent(
      options?.customMessage ||
        template?.body ||
        this.getDefaultBody(application.status),
      application,
    );

    // Determine send time
    const delayHours = options?.immediate
      ? 0
      : template?.delayHours || config.defaultDelayHours;
    const sendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);

    // Check weekend restriction
    if (
      !config.sendOnWeekends &&
      (sendAt.getDay() === 0 || sendAt.getDay() === 6)
    ) {
      // Push to Monday
      const daysToAdd = sendAt.getDay() === 0 ? 1 : 2;
      sendAt.setDate(sendAt.getDate() + daysToAdd);
    }

    // Schedule or send immediately
    if (delayHours === 0) {
      try {
        await this.emailService.sendEmail({
          to: application.candidate.email,
          subject,
          html: body,
          tenantId,
        });

        // Log the rejection
        await this.logRejection(application, "SENT");

        return { success: true };
      } catch (error) {
        this.logger.error(`Failed to send rejection email: ${error}`);
        return { success: false, error: "Failed to send email" };
      }
    } else {
      // Schedule for later (store in activity log for cron job to pick up)
      await this.prisma.activityLog.create({
        data: {
          action: "REJECTION_EMAIL_SCHEDULED",
          description: `Rejection email scheduled for ${sendAt.toISOString()}`,
          candidateId: application.candidateId,
          applicationId: application.id,
          metadata: {
            type: "scheduled_rejection",
            sendAt: sendAt.toISOString(),
            subject,
            body,
            tenantId,
            ccRecruiter: config.ccRecruiter,
            recruiterId: application.job.recruiterId,
          },
        },
      });

      return { success: true, scheduledAt: sendAt.toISOString() };
    }
  }

  async sendBulkRejections(
    applicationIds: string[],
    options?: {
      templateId?: string;
      customMessage?: string;
    },
  ): Promise<{
    total: number;
    sent: number;
    scheduled: number;
    failed: number;
  }> {
    let sent = 0;
    let scheduled = 0;
    let failed = 0;

    for (const applicationId of applicationIds) {
      const result = await this.sendRejection(applicationId, options);
      if (result.success) {
        if (result.scheduledAt) {
          scheduled++;
        } else {
          sent++;
        }
      } else {
        failed++;
      }
    }

    return { total: applicationIds.length, sent, scheduled, failed };
  }

  // ==================== HELPERS ====================

  private personalizeContent(content: string, application: any): string {
    const replacements: Record<string, string> = {
      "{{candidate.firstName}}": application.candidate.firstName || "",
      "{{candidate.lastName}}": application.candidate.lastName || "",
      "{{candidate.fullName}}": `${application.candidate.firstName} ${application.candidate.lastName}`,
      "{{candidate.email}}": application.candidate.email || "",
      "{{job.title}}": application.job.title || "",
      "{{job.location}}": application.job.location || "",
      "{{company.name}}": application.job.tenant?.name || "Our Company",
      "{{stage}}": application.status || "",
    };

    let result = content;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(
        new RegExp(key.replace(/[{}]/g, "\\$&"), "g"),
        value,
      );
    }

    return result;
  }

  private getDefaultSubject(): string {
    return "Update on your application for {{job.title}}";
  }

  private getDefaultBody(stage: string): string {
    const baseMessage = `
<p>Dear {{candidate.firstName}},</p>

<p>Thank you for your interest in the <strong>{{job.title}}</strong> position at {{company.name}} and for taking the time to apply.</p>
`;

    const stageMessages: Record<string, string> = {
      SCREENING: `
<p>After carefully reviewing your application, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
`,
      PHONE_SCREEN: `
<p>Thank you for speaking with us. After careful consideration, we have decided to pursue other candidates for this role.</p>
`,
      INTERVIEW: `
<p>We enjoyed meeting with you and learning more about your background. After thorough consideration, we have decided to move forward with another candidate.</p>
`,
      FINAL: `
<p>Thank you for your time throughout our interview process. After much deliberation, we have decided to extend an offer to another candidate.</p>
`,
      DEFAULT: `
<p>After careful review, we have decided to move forward with other candidates.</p>
`,
    };

    const stageMessage = stageMessages[stage] || stageMessages.DEFAULT;

    return `
${baseMessage}
${stageMessage}
<p>We encourage you to apply for future positions that match your skills and experience.</p>

<p>We wish you the best in your job search.</p>

<p>Best regards,<br>
The Hiring Team at {{company.name}}</p>
`;
  }

  private async logRejection(
    application: any,
    status: "SENT" | "SCHEDULED" | "FAILED",
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        action: "REJECTION_EMAIL_SENT",
        description: `Rejection email ${status.toLowerCase()} to ${application.candidate.email}`,
        candidateId: application.candidateId,
        applicationId: application.id,
        metadata: { status, sentAt: new Date().toISOString() },
      },
    });
  }

  // ==================== PRESET TEMPLATES ====================

  async createPresetTemplates(tenantId: string): Promise<RejectionTemplate[]> {
    const presets = [
      {
        stage: "SCREENING",
        name: "Resume Screening Rejection",
        subject: "Update on your application for {{job.title}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>Thank you for your interest in the <strong>{{job.title}}</strong> position at {{company.name}}.</p>
<p>After reviewing your application, we've decided to move forward with candidates whose experience more closely matches our current requirements.</p>
<p>We encourage you to apply for future openings that align with your background.</p>
<p>Best wishes,<br>{{company.name}} Recruiting Team</p>`,
        isDefault: true,
        delayHours: 24,
      },
      {
        stage: "PHONE_SCREEN",
        name: "Phone Screen Rejection",
        subject: "Following up on your {{job.title}} interview",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>Thank you for taking the time to speak with us about the <strong>{{job.title}}</strong> role.</p>
<p>After careful consideration, we've decided to pursue other candidates whose qualifications more closely align with our needs.</p>
<p>We appreciate your interest in {{company.name}} and wish you success in your job search.</p>
<p>Best regards,<br>{{company.name}} Recruiting Team</p>`,
        isDefault: true,
        delayHours: 48,
      },
      {
        stage: "INTERVIEW",
        name: "Post-Interview Rejection",
        subject: "Thank you for interviewing with {{company.name}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>Thank you for meeting with our team to discuss the <strong>{{job.title}}</strong> position.</p>
<p>We enjoyed learning about your experience and career goals. After thorough evaluation, we've decided to move forward with another candidate.</p>
<p>We were impressed by your background and encourage you to stay connected with us for future opportunities.</p>
<p>Best wishes,<br>{{company.name}} Recruiting Team</p>`,
        isDefault: true,
        delayHours: 48,
      },
      {
        stage: "ALL",
        name: "Generic Rejection",
        subject: "Update regarding your application",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>Thank you for your interest in {{company.name}} and for applying for the <strong>{{job.title}}</strong> position.</p>
<p>We appreciate the time you invested in our hiring process. After careful consideration, we have decided not to move forward with your application at this time.</p>
<p>We encourage you to explore other opportunities with us in the future.</p>
<p>Best regards,<br>{{company.name}} Recruiting Team</p>`,
        isDefault: false,
        delayHours: 24,
      },
    ];

    const created: RejectionTemplate[] = [];
    for (const preset of presets) {
      try {
        const template = await this.createTemplate(tenantId, preset);
        created.push(template);
      } catch (error) {
        this.logger.warn(
          `Failed to create preset template ${preset.name}:`,
          error,
        );
      }
    }

    return created;
  }
}
