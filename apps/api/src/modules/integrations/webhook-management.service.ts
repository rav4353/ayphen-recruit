import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export type WebhookEvent = 
  | 'candidate.created'
  | 'candidate.updated'
  | 'application.created'
  | 'application.stage_changed'
  | 'application.status_changed'
  | 'interview.scheduled'
  | 'interview.completed'
  | 'interview.cancelled'
  | 'offer.created'
  | 'offer.sent'
  | 'offer.accepted'
  | 'offer.declined'
  | 'job.created'
  | 'job.published'
  | 'job.closed'
  | 'hire.completed';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  headers?: Record<string, string>;
  retryCount: number;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  statusCode?: number;
  response?: string;
  attempts: number;
  createdAt: Date;
  deliveredAt?: Date;
}

const WEBHOOKS_SETTINGS_KEY = 'webhooks_config';

@Injectable()
export class WebhookManagementService {
  private readonly logger = new Logger(WebhookManagementService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all webhooks for a tenant
   */
  async getWebhooks(tenantId: string): Promise<Omit<WebhookConfig, 'secret'>[]> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];
    
    // Remove secrets from response
    return webhooks.map(({ secret, ...rest }) => rest);
  }

  /**
   * Get a specific webhook
   */
  async getWebhook(tenantId: string, webhookId: string): Promise<Omit<WebhookConfig, 'secret'> | null> {
    const webhooks = await this.getWebhooks(tenantId);
    return webhooks.find(w => w.id === webhookId) || null;
  }

  /**
   * Create a new webhook
   */
  async createWebhook(tenantId: string, data: {
    name: string;
    url: string;
    events: WebhookEvent[];
    headers?: Record<string, string>;
  }): Promise<{ id: string; secret: string }> {
    // Validate URL
    try {
      new URL(data.url);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    // Validate events
    const validEvents = this.getAvailableEvents().map(e => e.id);
    for (const event of data.events) {
      if (!validEvents.includes(event)) {
        throw new BadRequestException(`Invalid event: ${event}`);
      }
    }

    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];

    // Check limit
    if (webhooks.length >= 10) {
      throw new BadRequestException('Maximum 10 webhooks allowed per tenant');
    }

    // Generate webhook ID and secret
    const id = `wh_${crypto.randomBytes(12).toString('hex')}`;
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const newWebhook: WebhookConfig = {
      id,
      name: data.name,
      url: data.url,
      secret,
      events: data.events,
      isActive: true,
      headers: data.headers,
      retryCount: 3,
      createdAt: new Date(),
    };

    webhooks.push(newWebhook);

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
      update: { value: webhooks as any },
      create: {
        tenantId,
        key: WEBHOOKS_SETTINGS_KEY,
        value: webhooks as any,
        category: 'INTEGRATION',
        isPublic: false,
      },
    });

    return { id, secret };
  }

  /**
   * Update a webhook
   */
  async updateWebhook(tenantId: string, webhookId: string, data: {
    name?: string;
    url?: string;
    events?: WebhookEvent[];
    headers?: Record<string, string>;
    isActive?: boolean;
  }): Promise<{ success: boolean }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];
    const index = webhooks.findIndex(w => w.id === webhookId);

    if (index === -1) {
      throw new NotFoundException('Webhook not found');
    }

    webhooks[index] = {
      ...webhooks[index],
      ...data,
    };

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
      data: { value: webhooks as any },
    });

    return { success: true };
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(tenantId: string, webhookId: string): Promise<{ success: boolean }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];
    const filtered = webhooks.filter(w => w.id !== webhookId);

    if (filtered.length === webhooks.length) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
      data: { value: filtered as any },
    });

    return { success: true };
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(tenantId: string, webhookId: string): Promise<{ secret: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];
    const index = webhooks.findIndex(w => w.id === webhookId);

    if (index === -1) {
      throw new NotFoundException('Webhook not found');
    }

    const newSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    webhooks[index].secret = newSecret;

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
      data: { value: webhooks as any },
    });

    return { secret: newSecret };
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhooks(tenantId: string, event: WebhookEvent, payload: any): Promise<{ triggered: number; failed: number }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];
    const matchingWebhooks = webhooks.filter(w => w.isActive && w.events.includes(event));

    let triggered = 0;
    let failed = 0;

    for (const webhook of matchingWebhooks) {
      try {
        await this.deliverWebhook(webhook, event, payload);
        triggered++;
      } catch (error) {
        this.logger.error(`Failed to deliver webhook ${webhook.id}:`, error);
        failed++;
      }
    }

    return { triggered, failed };
  }

  /**
   * Deliver a single webhook
   */
  private async deliverWebhook(webhook: WebhookConfig, event: WebhookEvent, payload: any): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: `evt_${crypto.randomBytes(12).toString('hex')}`,
      event,
      timestamp,
      data: payload,
    });

    // Generate signature
    const signature = this.generateSignature(body, webhook.secret, timestamp);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-Event': event,
      ...webhook.headers,
    };

    this.logger.log(`Delivering webhook ${webhook.id} for event ${event} to ${webhook.url}`);

    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let statusCode: number | undefined;
    let errorMessage: string | undefined;

    // Make actual HTTP request with retries
    for (let attempt = 1; attempt <= webhook.retryCount; attempt++) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body,
        });

        statusCode = response.status;

        if (response.ok) {
          this.logger.log(`Webhook ${webhook.id} delivered successfully (attempt ${attempt})`);
          break;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          this.logger.warn(`Webhook ${webhook.id} failed attempt ${attempt}: ${errorMessage}`);
          
          if (attempt === webhook.retryCount) {
            status = 'FAILED';
          } else {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      } catch (error: any) {
        errorMessage = error.message;
        this.logger.warn(`Webhook ${webhook.id} failed attempt ${attempt}: ${errorMessage}`);
        
        if (attempt === webhook.retryCount) {
          status = 'FAILED';
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Log delivery
    await this.prisma.activityLog.create({
      data: {
        action: 'WEBHOOK_DELIVERED',
        description: `Webhook ${status === 'SUCCESS' ? 'delivered' : 'failed'}: ${event}`,
        metadata: {
          webhookId: webhook.id,
          event,
          url: webhook.url,
          status,
          statusCode,
          errorMessage,
        },
      },
    });

    if (status === 'FAILED') {
      throw new Error(`Webhook delivery failed after ${webhook.retryCount} attempts: ${errorMessage}`);
    }
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string, secret: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `v1=${signature}`;
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifySignature(payload: string, signature: string, secret: string, timestamp: number): boolean {
    const expectedSignature = this.generateSignature(payload, secret, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(tenantId: string, webhookId: string): Promise<{ success: boolean; statusCode?: number; message: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: WEBHOOKS_SETTINGS_KEY } },
    });

    const webhooks = (setting?.value as unknown as WebhookConfig[]) || [];
    const webhook = webhooks.find(w => w.id === webhookId);

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const testPayload = JSON.stringify({
        id: `evt_test_${Date.now()}`,
        event: 'test.ping',
        timestamp,
        data: { message: 'This is a test webhook delivery from TalentX' },
      });

      const signature = this.generateSignature(testPayload, webhook.secret, timestamp);

      this.logger.log(`Testing webhook ${webhookId} at ${webhook.url}`);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp.toString(),
          'X-Webhook-Event': 'test.ping',
          ...webhook.headers,
        },
        body: testPayload,
      });

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          message: 'Webhook endpoint responded successfully',
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          message: `Webhook endpoint returned ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to connect to webhook endpoint: ${error.message}`,
      };
    }
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(tenantId: string, webhookId?: string, limit = 50): Promise<any[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'WEBHOOK_DELIVERED',
        ...(webhookId && {
          metadata: {
            path: ['webhookId'],
            equals: webhookId,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      webhookId: (log.metadata as any)?.webhookId,
      event: (log.metadata as any)?.event,
      status: (log.metadata as any)?.status,
      url: (log.metadata as any)?.url,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get available webhook events
   */
  getAvailableEvents(): { id: WebhookEvent; name: string; description: string }[] {
    return [
      { id: 'candidate.created', name: 'Candidate Created', description: 'Triggered when a new candidate is added' },
      { id: 'candidate.updated', name: 'Candidate Updated', description: 'Triggered when candidate info is updated' },
      { id: 'application.created', name: 'Application Created', description: 'Triggered when a candidate applies for a job' },
      { id: 'application.stage_changed', name: 'Application Stage Changed', description: 'Triggered when application moves to a new stage' },
      { id: 'application.status_changed', name: 'Application Status Changed', description: 'Triggered when application status changes' },
      { id: 'interview.scheduled', name: 'Interview Scheduled', description: 'Triggered when an interview is scheduled' },
      { id: 'interview.completed', name: 'Interview Completed', description: 'Triggered when an interview is marked complete' },
      { id: 'interview.cancelled', name: 'Interview Cancelled', description: 'Triggered when an interview is cancelled' },
      { id: 'offer.created', name: 'Offer Created', description: 'Triggered when a new offer is created' },
      { id: 'offer.sent', name: 'Offer Sent', description: 'Triggered when an offer is sent to candidate' },
      { id: 'offer.accepted', name: 'Offer Accepted', description: 'Triggered when candidate accepts an offer' },
      { id: 'offer.declined', name: 'Offer Declined', description: 'Triggered when candidate declines an offer' },
      { id: 'job.created', name: 'Job Created', description: 'Triggered when a new job is created' },
      { id: 'job.published', name: 'Job Published', description: 'Triggered when a job is published' },
      { id: 'job.closed', name: 'Job Closed', description: 'Triggered when a job is closed' },
      { id: 'hire.completed', name: 'Hire Completed', description: 'Triggered when hiring process is complete' },
    ];
  }
}
