import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface SmsConfig {
  provider: "TWILIO" | "MSG91" | "TEXTLOCAL";
  accountSid: string;
  authToken: string;
  fromNumber: string;
  webhookUrl?: string;
}

interface SendSmsOptions {
  to: string;
  body: string;
  tenantId: string;
  candidateId?: string;
  mediaUrl?: string; // For MMS
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const SMS_CONFIG_KEY = "sms_config";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get SMS config from tenant settings
   */
  private async getConfig(tenantId: string): Promise<SmsConfig | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: SMS_CONFIG_KEY } },
    });
    return setting?.value as unknown as SmsConfig | null;
  }

  /**
   * Save SMS config to tenant settings
   */
  async saveConfig(tenantId: string, config: SmsConfig): Promise<void> {
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: SMS_CONFIG_KEY } },
      update: { value: config as any, category: "INTEGRATION" },
      create: {
        tenantId,
        key: SMS_CONFIG_KEY,
        value: config as any,
        category: "INTEGRATION",
        isPublic: false,
      },
    });
  }

  /**
   * Get SMS settings for frontend display (without secrets)
   */
  async getSettings(tenantId: string): Promise<{
    provider: string;
    fromNumber: string;
    isConfigured: boolean;
  } | null> {
    const config = await this.getConfig(tenantId);
    if (!config?.accountSid) return null;
    return {
      provider: config.provider,
      fromNumber: config.fromNumber,
      isConfigured: true,
    };
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(
    config: SmsConfig,
    options: SendSmsOptions,
  ): Promise<SendSmsResult> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: options.to,
      From: config.fromNumber,
      Body: options.body,
    });

    if (options.mediaUrl) {
      body.append("MediaUrl", options.mediaUrl);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, messageId: data.sid };
      } else {
        this.logger.error("Twilio SMS error:", data);
        return { success: false, error: data.message || "Failed to send SMS" };
      }
    } catch (error: any) {
      this.logger.error("Twilio SMS exception:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS via MSG91 (India-focused provider)
   */
  private async sendViaMsg91(
    config: SmsConfig,
    options: SendSmsOptions,
  ): Promise<SendSmsResult> {
    const url = "https://api.msg91.com/api/v5/flow/";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          authkey: config.authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: config.fromNumber,
          route: "4", // Transactional
          country: "91", // India
          sms: [
            {
              message: options.body,
              to: [options.to.replace("+", "")],
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.type === "success") {
        return { success: true, messageId: data.request_id };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error: any) {
      this.logger.error("MSG91 SMS exception:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS using configured provider
   */
  async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    const config = await this.getConfig(options.tenantId);

    if (!config?.accountSid) {
      return {
        success: false,
        error: "SMS not configured. Please configure SMS settings.",
      };
    }

    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(options.to);
    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number format" };
    }

    let result: SendSmsResult;

    switch (config.provider) {
      case "TWILIO":
        result = await this.sendViaTwilio(config, {
          ...options,
          to: normalizedPhone,
        });
        break;
      case "MSG91":
        result = await this.sendViaMsg91(config, {
          ...options,
          to: normalizedPhone,
        });
        break;
      default:
        result = await this.sendViaTwilio(config, {
          ...options,
          to: normalizedPhone,
        });
    }

    // Log the SMS attempt
    if (options.candidateId) {
      await this.logSmsAttempt(options, result);
    }

    return result;
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSms(
    tenantId: string,
    recipients: { phone: string; body: string; candidateId?: string }[],
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const recipient of recipients) {
      const result = await this.sendSms({
        tenantId,
        to: recipient.phone,
        body: recipient.body,
        candidateId: recipient.candidateId,
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${recipient.phone}: ${result.error}`);
      }

      // Rate limiting - wait 100ms between messages
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string | null {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, "");

    // If it starts with +, it's already in international format
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // If it starts with 0, assume local number - need country code
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // If 10 digits, assume India (+91) or US (+1) based on first digit
    if (cleaned.length === 10) {
      // Check if it looks like an Indian mobile (starts with 6-9)
      if (/^[6-9]/.test(cleaned)) {
        return `+91${cleaned}`;
      }
      // Otherwise assume US
      return `+1${cleaned}`;
    }

    // If 11 digits starting with 1, assume US
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`;
    }

    // If 12 digits starting with 91, assume India
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return `+${cleaned}`;
    }

    // Return with + prefix if reasonable length
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return `+${cleaned}`;
    }

    return null;
  }

  /**
   * Log SMS attempt for audit trail
   */
  private async logSmsAttempt(
    options: SendSmsOptions,
    result: SendSmsResult,
  ): Promise<void> {
    try {
      // Create activity log entry
      await this.prisma.activityLog.create({
        data: {
          action: result.success ? "SMS_SENT" : "SMS_FAILED",
          description: `SMS to ${options.to}: ${result.success ? "Sent" : result.error}`,
          metadata: {
            to: options.to,
            body:
              options.body.substring(0, 100) +
              (options.body.length > 100 ? "..." : ""),
            messageId: result.messageId,
            error: result.error,
          },
          candidateId: options.candidateId,
        },
      });
    } catch (error) {
      this.logger.error("Failed to log SMS attempt:", error);
    }
  }

  /**
   * Get SMS templates
   */
  async getTemplates(tenantId: string) {
    return this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: "sms_template_" },
      },
    });
  }

  /**
   * Save SMS template
   */
  async saveTemplate(tenantId: string, name: string, content: string) {
    const key = `sms_template_${name.toLowerCase().replace(/\s+/g, "_")}`;
    return this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value: { name, content } as any },
      create: {
        tenantId,
        key,
        value: { name, content } as any,
        category: "TEMPLATE",
        isPublic: false,
      },
    });
  }
}
