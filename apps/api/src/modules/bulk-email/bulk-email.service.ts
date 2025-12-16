import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';

export type BulkEmailCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
export type BulkEmailRecipientType = 'candidates' | 'talent_pool' | 'custom';

export interface BulkEmailCampaign {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  body: string;
  recipientType: BulkEmailRecipientType;
  recipientIds?: string[];
  talentPoolId?: string;
  filters?: Record<string, unknown>;
  scheduledAt?: string;
  status: BulkEmailCampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  sendSummary?: {
    total: number;
    sent: number;
    failed: number;
  };
}

@Injectable()
export class BulkEmailService {
  private readonly logger = new Logger(BulkEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  private newId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private toCampaign(metadata: any): BulkEmailCampaign {
    return metadata as BulkEmailCampaign;
  }

  private async getLatestCampaignMetadata(id: string, tenantId: string): Promise<BulkEmailCampaign> {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: {
          in: [
            'BULK_EMAIL_CAMPAIGN_CREATED',
            'BULK_EMAIL_CAMPAIGN_UPDATED',
            'BULK_EMAIL_CAMPAIGN_SENT',
            'BULK_EMAIL_CAMPAIGN_CANCELLED',
          ],
        },
        metadata: { path: ['id'], equals: id },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Campaign not found');
    }

    const metadata = log.metadata as any;
    if (metadata?.tenantId !== tenantId) {
      throw new NotFoundException('Campaign not found');
    }

    return this.toCampaign(metadata);
  }

  async createCampaign(
    tenantId: string,
    userId: string,
    dto: {
      name: string;
      subject: string;
      body: string;
      recipientType: BulkEmailRecipientType;
      recipientIds?: string[];
      talentPoolId?: string;
      filters?: Record<string, unknown>;
      scheduledAt?: string;
    },
  ) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Campaign name is required');
    }
    if (!dto.subject?.trim()) {
      throw new BadRequestException('Subject is required');
    }
    if (!dto.body?.trim()) {
      throw new BadRequestException('Body is required');
    }

    const id = this.newId('camp');
    const now = new Date().toISOString();

    const campaign: BulkEmailCampaign = {
      id,
      tenantId,
      name: dto.name,
      subject: dto.subject,
      body: dto.body,
      recipientType: dto.recipientType,
      recipientIds: dto.recipientIds,
      talentPoolId: dto.talentPoolId,
      filters: dto.filters,
      scheduledAt: dto.scheduledAt,
      status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'BULK_EMAIL_CAMPAIGN_CREATED',
        description: `Bulk email campaign created: ${campaign.name}`,
        userId,
        metadata: JSON.parse(JSON.stringify({ type: 'bulk_email_campaign', ...campaign })),
      },
    });

    return campaign;
  }

  async getAllCampaigns(tenantId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: {
          in: [
            'BULK_EMAIL_CAMPAIGN_CREATED',
            'BULK_EMAIL_CAMPAIGN_UPDATED',
            'BULK_EMAIL_CAMPAIGN_SENT',
            'BULK_EMAIL_CAMPAIGN_CANCELLED',
          ],
        },
        metadata: { path: ['tenantId'], equals: tenantId },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const map = new Map<string, BulkEmailCampaign>();
    for (const log of logs) {
      const meta = log.metadata as any;
      if (meta?.type !== 'bulk_email_campaign') continue;
      if (!map.has(meta.id)) {
        map.set(meta.id, this.toCampaign(meta));
      }
    }

    return Array.from(map.values());
  }

  async getCampaign(id: string, tenantId: string) {
    return this.getLatestCampaignMetadata(id, tenantId);
  }

  async updateCampaign(
    id: string,
    tenantId: string,
    userId: string,
    dto: Partial<Pick<BulkEmailCampaign, 'name' | 'subject' | 'body' | 'recipientType' | 'recipientIds' | 'talentPoolId' | 'filters' | 'scheduledAt'>>,
  ) {
    const current = await this.getLatestCampaignMetadata(id, tenantId);

    if (current.status === 'SENT') {
      throw new BadRequestException('Cannot update a sent campaign');
    }

    const updated: BulkEmailCampaign = {
      ...current,
      ...dto,
      status: dto.scheduledAt ? 'SCHEDULED' : current.status,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'BULK_EMAIL_CAMPAIGN_UPDATED',
        description: `Bulk email campaign updated: ${updated.name}`,
        userId,
        metadata: JSON.parse(JSON.stringify({ type: 'bulk_email_campaign', ...updated })),
      },
    });

    return updated;
  }

  private async resolveRecipientCandidateIds(campaign: BulkEmailCampaign): Promise<string[]> {
    if (campaign.recipientType === 'candidates' || campaign.recipientType === 'custom') {
      return campaign.recipientIds || [];
    }

    if (campaign.recipientType === 'talent_pool') {
      if (!campaign.talentPoolId) {
        throw new BadRequestException('talentPoolId is required for talent_pool recipient type');
      }

      // Talent pools are stored in ActivityLog metadata with type 'talent_pool'
      const poolLog = await this.prisma.activityLog.findFirst({
        where: {
          action: { in: ['TALENT_POOL_CREATED', 'TALENT_POOL_UPDATED'] },
          metadata: { path: ['id'], equals: campaign.talentPoolId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!poolLog) {
        throw new NotFoundException('Talent pool not found');
      }

      const poolMeta = poolLog.metadata as any;
      const candidateIds = Array.isArray(poolMeta?.candidateIds) ? poolMeta.candidateIds : [];
      return candidateIds;
    }

    return [];
  }

  private personalize(template: string, candidate: { firstName?: string | null; lastName?: string | null; email: string }) {
    return template
      .replace(/{{firstName}}/g, candidate.firstName || '')
      .replace(/{{lastName}}/g, candidate.lastName || '')
      .replace(/{{email}}/g, candidate.email || '');
  }

  async sendCampaign(id: string, tenantId: string, userId: string) {
    const campaign = await this.getLatestCampaignMetadata(id, tenantId);

    if (campaign.status === 'CANCELLED') {
      throw new BadRequestException('Campaign is cancelled');
    }
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Campaign already sent');
    }

    const candidateIds = await this.resolveRecipientCandidateIds(campaign);
    if (candidateIds.length === 0) {
      throw new BadRequestException('No recipients found for this campaign');
    }

    const candidates = await this.prisma.candidate.findMany({
      where: { tenantId, id: { in: candidateIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (candidates.length === 0) {
      throw new BadRequestException('No valid recipients found for this campaign');
    }

    let sent = 0;
    let failed = 0;

    // Sequential send for MVP
    for (const c of candidates) {
      try {
        const subject = this.personalize(campaign.subject, c);
        const html = this.personalize(campaign.body, c).replace(/\n/g, '<br>');
        const ok = await this.emailService.sendEmail({
          to: c.email,
          subject,
          html,
          text: this.personalize(campaign.body, c),
          tenantId,
          purpose: 'bulkEmails',
        });

        if (ok) sent++;
        else failed++;
      } catch (error) {
        failed++;
        this.logger.error(`Failed to send campaign email to candidate ${c.id}`, error as any);
      }
    }

    const now = new Date().toISOString();
    const updated: BulkEmailCampaign = {
      ...campaign,
      status: 'SENT',
      sentAt: now,
      updatedAt: now,
      sendSummary: {
        total: candidates.length,
        sent,
        failed,
      },
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'BULK_EMAIL_CAMPAIGN_SENT',
        description: `Bulk email campaign sent: ${updated.name}`,
        userId,
        metadata: JSON.parse(JSON.stringify({ type: 'bulk_email_campaign', ...updated })),
      },
    });

    return { id: updated.id, ...updated.sendSummary };
  }

  async cancelCampaign(id: string, tenantId: string, userId: string) {
    const campaign = await this.getLatestCampaignMetadata(id, tenantId);

    if (campaign.status === 'SENT') {
      throw new BadRequestException('Cannot cancel a sent campaign');
    }

    const updated: BulkEmailCampaign = {
      ...campaign,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'BULK_EMAIL_CAMPAIGN_CANCELLED',
        description: `Bulk email campaign cancelled: ${updated.name}`,
        userId,
        metadata: JSON.parse(JSON.stringify({ type: 'bulk_email_campaign', ...updated })),
      },
    });

    return updated;
  }

  async getCampaignStats(id: string, tenantId: string) {
    const campaign = await this.getLatestCampaignMetadata(id, tenantId);
    const summary = campaign.sendSummary || { total: 0, sent: 0, failed: 0 };

    return {
      id: campaign.id,
      status: campaign.status,
      totalRecipients: summary.total,
      sent: summary.sent,
      failed: summary.failed,
      deliveryRate: summary.total > 0 ? (summary.sent / summary.total) * 100 : 0,
      // placeholders for future tracking
      opened: 0,
      clicked: 0,
      replied: 0,
      unsubscribed: 0,
    };
  }

  async preview(dto: { subject: string; body: string; sampleCandidateId?: string }, tenantId: string) {
    const { subject, body, sampleCandidateId } = dto;

    if (!subject?.trim() || !body?.trim()) {
      throw new BadRequestException('subject and body are required');
    }

    let sample = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

    if (sampleCandidateId) {
      const candidate = await this.prisma.candidate.findFirst({
        where: { id: sampleCandidateId, tenantId },
        select: { firstName: true, lastName: true, email: true },
      });
      if (candidate) {
        sample = {
          firstName: candidate.firstName || '',
          lastName: candidate.lastName || '',
          email: candidate.email,
        };
      }
    }

    return {
      subject: this.personalize(subject, sample),
      body: this.personalize(body, sample),
      sample,
    };
  }
}
