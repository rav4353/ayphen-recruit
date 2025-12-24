import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  category:
  | "CANDIDATE"
  | "INTERVIEWER"
  | "OFFER"
  | "REJECTION"
  | "ONBOARDING"
  | "GENERAL";
  subject: string;
  body: string;
  variables: string[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  category: "candidate" | "job" | "company" | "interview" | "user";
}

const EMAIL_TEMPLATE_KEY = "email_template";

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(private readonly prisma: PrismaService) { }

  private newId(): string {
    return `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Get all available template variables
   */
  getAvailableVariables(): TemplateVariable[] {
    return [
      // Candidate variables
      {
        name: "{{candidate.firstName}}",
        description: "Candidate first name",
        example: "John",
        category: "candidate",
      },
      {
        name: "{{candidate.lastName}}",
        description: "Candidate last name",
        example: "Doe",
        category: "candidate",
      },
      {
        name: "{{candidate.fullName}}",
        description: "Candidate full name",
        example: "John Doe",
        category: "candidate",
      },
      {
        name: "{{candidate.email}}",
        description: "Candidate email",
        example: "john@example.com",
        category: "candidate",
      },
      {
        name: "{{candidate.phone}}",
        description: "Candidate phone",
        example: "+1234567890",
        category: "candidate",
      },
      {
        name: "{{candidate.currentTitle}}",
        description: "Current job title",
        example: "Software Engineer",
        category: "candidate",
      },
      {
        name: "{{candidate.currentCompany}}",
        description: "Current company",
        example: "Acme Inc",
        category: "candidate",
      },

      // Job variables
      {
        name: "{{job.title}}",
        description: "Job title",
        example: "Senior Developer",
        category: "job",
      },
      {
        name: "{{job.department}}",
        description: "Department name",
        example: "Engineering",
        category: "job",
      },
      {
        name: "{{job.location}}",
        description: "Job location",
        example: "San Francisco, CA",
        category: "job",
      },
      {
        name: "{{job.salaryRange}}",
        description: "Salary range",
        example: "$120k - $150k",
        category: "job",
      },

      // Company variables
      {
        name: "{{company.name}}",
        description: "Company name",
        example: "TechCorp",
        category: "company",
      },
      {
        name: "{{company.website}}",
        description: "Company website",
        example: "https://techcorp.com",
        category: "company",
      },

      // Interview variables
      {
        name: "{{interview.date}}",
        description: "Interview date",
        example: "Monday, January 15, 2024",
        category: "interview",
      },
      {
        name: "{{interview.time}}",
        description: "Interview time",
        example: "2:00 PM PST",
        category: "interview",
      },
      {
        name: "{{interview.type}}",
        description: "Interview type",
        example: "Technical Interview",
        category: "interview",
      },
      {
        name: "{{interview.duration}}",
        description: "Interview duration",
        example: "60 minutes",
        category: "interview",
      },
      {
        name: "{{interview.link}}",
        description: "Meeting link",
        example: "https://meet.google.com/abc-xyz",
        category: "interview",
      },
      {
        name: "{{interview.interviewer}}",
        description: "Interviewer name",
        example: "Jane Smith",
        category: "interview",
      },
      {
        name: "{{interview.confirmUrl}}",
        description: "Interview confirmation link",
        example: "https://talentx.com/interviews/confirm/abc-123",
        category: "interview",
      },

      // User/Sender variables
      {
        name: "{{user.firstName}}",
        description: "Sender first name",
        example: "Jane",
        category: "user",
      },
      {
        name: "{{user.lastName}}",
        description: "Sender last name",
        example: "Smith",
        category: "user",
      },
      {
        name: "{{user.fullName}}",
        description: "Sender full name",
        example: "Jane Smith",
        category: "user",
      },
      {
        name: "{{user.email}}",
        description: "Sender email",
        example: "jane@company.com",
        category: "user",
      },
      {
        name: "{{user.title}}",
        description: "Sender job title",
        example: "HR Manager",
        category: "user",
      },
    ];
  }

  /**
   * Create a new email template
   */
  async createTemplate(
    tenantId: string,
    userId: string,
    dto: {
      name: string;
      category: EmailTemplate["category"];
      subject: string;
      body: string;
      isDefault?: boolean;
    },
  ): Promise<EmailTemplate> {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Template name is required");
    }
    if (!dto.subject?.trim()) {
      throw new BadRequestException("Subject is required");
    }
    if (!dto.body?.trim()) {
      throw new BadRequestException("Body is required");
    }

    // Extract variables from subject and body
    const variables = this.extractVariables(dto.subject + " " + dto.body);

    const template: EmailTemplate = {
      id: this.newId(),
      tenantId,
      name: dto.name,
      category: dto.category,
      subject: dto.subject,
      body: dto.body,
      variables,
      isDefault: dto.isDefault || false,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.create({
      data: {
        tenantId,
        key: `${EMAIL_TEMPLATE_KEY}_${template.id}`,
        value: template as any,
        category: "EMAIL_TEMPLATE",
        isPublic: false,
      },
    });

    return template;
  }

  /**
   * Get all templates for a tenant
   */
  async getTemplates(
    tenantId: string,
    category?: EmailTemplate["category"],
  ): Promise<EmailTemplate[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${EMAIL_TEMPLATE_KEY}_` },
      },
    });

    let templates = settings.map((s) => s.value as unknown as EmailTemplate);

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return templates.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  /**
   * Get a template by ID
   */
  async getTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<EmailTemplate> {
    const setting = await this.prisma.setting.findUnique({
      where: {
        tenantId_key: { tenantId, key: `${EMAIL_TEMPLATE_KEY}_${templateId}` },
      },
    });

    if (!setting) {
      throw new NotFoundException("Template not found");
    }

    return setting.value as unknown as EmailTemplate;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    tenantId: string,
    templateId: string,
    dto: Partial<{
      name: string;
      category: EmailTemplate["category"];
      subject: string;
      body: string;
      isDefault: boolean;
    }>,
  ): Promise<EmailTemplate> {
    const template = await this.getTemplate(tenantId, templateId);

    const updated: EmailTemplate = {
      ...template,
      ...dto,
      variables: this.extractVariables(
        (dto.subject || template.subject) + " " + (dto.body || template.body),
      ),
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${EMAIL_TEMPLATE_KEY}_${templateId}` },
      },
      data: { value: updated as any },
    });

    return updated;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(tenantId: string, templateId: string): Promise<void> {
    await this.getTemplate(tenantId, templateId); // Verify exists

    await this.prisma.setting.delete({
      where: {
        tenantId_key: { tenantId, key: `${EMAIL_TEMPLATE_KEY}_${templateId}` },
      },
    });
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(
    tenantId: string,
    templateId: string,
    userId: string,
  ): Promise<EmailTemplate> {
    const original = await this.getTemplate(tenantId, templateId);

    return this.createTemplate(tenantId, userId, {
      name: `${original.name} (Copy)`,
      category: original.category,
      subject: original.subject,
      body: original.body,
      isDefault: false,
    });
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(
    tenantId: string,
    templateId: string,
    sampleData?: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(tenantId, templateId);

    const data = sampleData || this.getSampleData();

    return {
      subject: this.renderTemplate(template.subject, data),
      body: this.renderTemplate(template.body, data),
    };
  }

  /**
   * Render a template with actual data
   */
  async renderTemplateWithData(
    tenantId: string,
    templateId: string,
    data: {
      candidate?: any;
      job?: any;
      company?: any;
      interview?: any;
      user?: any;
    },
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(tenantId, templateId);

    const flatData = this.flattenData(data);

    return {
      subject: this.renderTemplate(template.subject, flatData),
      body: this.renderTemplate(template.body, flatData),
    };
  }

  /**
   * Get default templates for initial setup
   */
  async seedDefaultTemplates(
    tenantId: string,
    userId: string,
  ): Promise<EmailTemplate[]> {
    const defaultTemplates = [
      {
        name: "Application Received",
        category: "CANDIDATE" as const,
        subject: "Thank you for applying to {{job.title}} at {{company.name}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>Thank you for your interest in the <strong>{{job.title}}</strong> position at {{company.name}}.</p>
<p>We have received your application and our team is currently reviewing it. We will be in touch soon regarding next steps.</p>
<p>Best regards,<br>{{user.fullName}}<br>{{company.name}}</p>`,
        isDefault: true,
      },
      {
        name: "Interview Invitation",
        category: "CANDIDATE" as const,
        subject: "Interview Invitation - {{job.title}} at {{company.name}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>We were impressed with your application for the <strong>{{job.title}}</strong> position and would like to invite you for an interview.</p>
<p><strong>Interview Details:</strong></p>
<ul>
<li>Date: {{interview.date}}</li>
<li>Time: {{interview.time}}</li>
<li>Duration: {{interview.duration}}</li>
<li>Type: {{interview.type}}</li>
<li>Meeting Link: <a href="{{interview.link}}">{{interview.link}}</a></li>
</ul>
<div style="margin-top: 24px;">
  <a href="{{interview.confirmUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Accept Interview</a>
</div>
<p style="margin-top: 24px;">Please click the button above to confirm your attendance. If you're unable to make this time, please let us know.</p>
<p>Best regards,<br>{{user.fullName}}<br>{{company.name}}</p>`,
        isDefault: true,
      },
      {
        name: "Interview Reminder",
        category: "CANDIDATE" as const,
        subject: "Reminder: Interview Tomorrow for {{job.title}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>This is a friendly reminder about your upcoming interview for the <strong>{{job.title}}</strong> position.</p>
<p><strong>Interview Details:</strong></p>
<ul>
<li>Date: {{interview.date}}</li>
<li>Time: {{interview.time}}</li>
<li>Interviewer: {{interview.interviewer}}</li>
<li>Meeting Link: <a href="{{interview.link}}">{{interview.link}}</a></li>
</ul>
<p>Good luck!</p>
<p>Best regards,<br>{{user.fullName}}<br>{{company.name}}</p>`,
        isDefault: true,
      },
      {
        name: "Rejection - After Review",
        category: "REJECTION" as const,
        subject: "Update on your application for {{job.title}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>Thank you for taking the time to apply for the <strong>{{job.title}}</strong> position at {{company.name}}.</p>
<p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
<p>We encourage you to apply for future positions that match your skills and experience. We wish you the best in your job search.</p>
<p>Best regards,<br>{{user.fullName}}<br>{{company.name}}</p>`,
        isDefault: true,
      },
      {
        name: "Offer Letter",
        category: "OFFER" as const,
        subject: "Job Offer - {{job.title}} at {{company.name}}",
        body: `<p>Dear {{candidate.firstName}},</p>
<p>We are thrilled to offer you the position of <strong>{{job.title}}</strong> at {{company.name}}!</p>
<p>We were impressed with your skills and experience, and we believe you will be a valuable addition to our team.</p>
<p>Please find the offer details below and let us know if you have any questions.</p>
<p>We look forward to welcoming you to the team!</p>
<p>Best regards,<br>{{user.fullName}}<br>{{company.name}}</p>`,
        isDefault: true,
      },
    ];

    const created: EmailTemplate[] = [];
    for (const tmpl of defaultTemplates) {
      try {
        const template = await this.createTemplate(tenantId, userId, tmpl);
        created.push(template);
      } catch (error) {
        this.logger.warn(
          `Failed to create default template ${tmpl.name}:`,
          error,
        );
      }
    }

    return created;
  }

  // ==================== HELPER METHODS ====================

  private extractVariables(text: string): string[] {
    const matches = text.match(/\{\{[^}]+\}\}/g) || [];
    return [...new Set(matches)];
  }

  private renderTemplate(
    template: string,
    data: Record<string, string>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(this.escapeRegex(key), "g");
      result = result.replace(regex, value || "");
    }

    // Remove any unreplaced variables
    result = result.replace(/\{\{[^}]+\}\}/g, "");

    return result;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private flattenData(data: Record<string, any>): Record<string, string> {
    const flat: Record<string, string> = {};

    for (const [category, values] of Object.entries(data)) {
      if (values && typeof values === "object") {
        for (const [key, value] of Object.entries(values)) {
          flat[`{{${category}.${key}}}`] = String(value || "");
        }
      }
    }

    return flat;
  }

  private getSampleData(): Record<string, string> {
    return {
      "{{candidate.firstName}}": "John",
      "{{candidate.lastName}}": "Doe",
      "{{candidate.fullName}}": "John Doe",
      "{{candidate.email}}": "john.doe@example.com",
      "{{candidate.phone}}": "+1 (555) 123-4567",
      "{{candidate.currentTitle}}": "Software Engineer",
      "{{candidate.currentCompany}}": "Previous Corp",
      "{{job.title}}": "Senior Software Engineer",
      "{{job.department}}": "Engineering",
      "{{job.location}}": "San Francisco, CA",
      "{{job.salaryRange}}": "$150,000 - $180,000",
      "{{company.name}}": "Your Company",
      "{{company.website}}": "https://yourcompany.com",
      "{{interview.date}}": "Wednesday, January 15, 2025",
      "{{interview.time}}": "2:00 PM PST",
      "{{interview.type}}": "Technical Interview",
      "{{interview.duration}}": "60 minutes",
      "{{interview.link}}": "https://meet.google.com/abc-defg-hij",
      "{{interview.interviewer}}": "Jane Smith",
      "{{user.firstName}}": "Jane",
      "{{user.lastName}}": "Smith",
      "{{user.fullName}}": "Jane Smith",
      "{{user.email}}": "jane.smith@yourcompany.com",
      "{{user.title}}": "HR Manager",
    };
  }
}
