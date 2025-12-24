import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

export type MessagingProvider = "SLACK" | "TEAMS";

interface SlackConfig {
  botToken: string;
  signingSecret: string;
  defaultChannelId?: string;
  notificationChannels: {
    newApplication?: string;
    interviewScheduled?: string;
    offerAccepted?: string;
    general?: string;
  };
}

interface TeamsConfig {
  webhookUrl: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  notificationChannels: {
    newApplication?: string;
    interviewScheduled?: string;
    offerAccepted?: string;
    general?: string;
  };
}

interface NotificationPayload {
  type:
    | "NEW_APPLICATION"
    | "INTERVIEW_SCHEDULED"
    | "OFFER_ACCEPTED"
    | "OFFER_DECLINED"
    | "CANDIDATE_HIRED"
    | "CUSTOM";
  title: string;
  message: string;
  url?: string;
  fields?: { name: string; value: string }[];
  color?: string;
}

const SLACK_SETTINGS_KEY = "slack_settings";
const TEAMS_SETTINGS_KEY = "teams_settings";

@Injectable()
export class SlackTeamsService {
  private readonly logger = new Logger(SlackTeamsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== SLACK ====================

  /**
   * Get Slack configuration
   */
  async getSlackConfig(
    tenantId: string,
  ): Promise<{ isConfigured: boolean; channels?: string[] }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: SLACK_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as SlackConfig;
    return {
      isConfigured: !!config?.botToken,
      channels: config?.notificationChannels
        ? Object.keys(config.notificationChannels)
        : [],
    };
  }

  /**
   * Configure Slack integration
   */
  async configureSlack(tenantId: string, config: SlackConfig) {
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: SLACK_SETTINGS_KEY } },
      update: { value: config as any, category: "INTEGRATION" },
      create: {
        tenantId,
        key: SLACK_SETTINGS_KEY,
        value: config as any,
        category: "INTEGRATION",
        isPublic: false,
      },
    });

    return { success: true };
  }

  /**
   * Send notification to Slack
   */
  async sendSlackNotification(
    tenantId: string,
    payload: NotificationPayload,
    channelOverride?: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: SLACK_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as SlackConfig;
    if (!config?.botToken) {
      throw new BadRequestException("Slack not configured");
    }

    const channel =
      channelOverride || this.getSlackChannelForType(config, payload.type);
    if (!channel) {
      throw new BadRequestException(
        "No channel configured for this notification type",
      );
    }

    const blocks = this.buildSlackBlocks(payload);

    let messageId: string | undefined;

    // Send actual request to Slack Web API
    try {
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.botToken}`,
        },
        body: JSON.stringify({
          channel,
          blocks,
          text: payload.message,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        ts?: string;
        error?: string;
      };

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      messageId = result.ts;
      this.logger.log(
        `Slack notification sent successfully to ${channel}: ${payload.title}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send Slack notification: ${error.message}`);
      throw new BadRequestException(
        `Failed to send Slack notification: ${error.message}`,
      );
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: "SLACK_NOTIFICATION_SENT",
        description: `Slack notification sent: ${payload.title}`,
        metadata: {
          channel,
          type: payload.type,
          messageId,
        },
      },
    });

    return { success: true, messageId };
  }

  /**
   * Get Slack channels
   */
  async getSlackChannels(
    tenantId: string,
  ): Promise<{ id: string; name: string }[]> {
    const config = await this.getSlackConfigOrThrow(tenantId);

    try {
      const response = await fetch(
        "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.botToken}`,
          },
        },
      );

      const result = (await response.json()) as {
        ok: boolean;
        channels?: { id: string; name: string }[];
        error?: string;
      };

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      return (result.channels || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to fetch Slack channels: ${error.message}`);
      // Return empty array on error - the integration is configured but channels couldn't be fetched
      return [];
    }
  }

  /**
   * Test Slack connection
   */
  async testSlackConnection(
    tenantId: string,
  ): Promise<{ success: boolean; message: string; workspace?: string }> {
    try {
      const config = await this.getSlackConfigOrThrow(tenantId);

      const response = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.botToken}`,
        },
      });

      const result = (await response.json()) as {
        ok: boolean;
        team?: string;
        error?: string;
      };

      if (!result.ok) {
        return { success: false, message: `Slack API error: ${result.error}` };
      }

      this.logger.log(
        `Slack connection verified for workspace: ${result.team}`,
      );
      return {
        success: true,
        message: `Connected to Slack workspace: ${result.team}`,
        workspace: result.team,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // ==================== TEAMS ====================

  /**
   * Get Teams configuration
   */
  async getTeamsConfig(
    tenantId: string,
  ): Promise<{ isConfigured: boolean; hasWebhook?: boolean }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: TEAMS_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as TeamsConfig;
    return {
      isConfigured: !!config?.webhookUrl,
      hasWebhook: !!config?.webhookUrl,
    };
  }

  /**
   * Configure Teams integration
   */
  async configureTeams(tenantId: string, config: TeamsConfig) {
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: TEAMS_SETTINGS_KEY } },
      update: { value: config as any, category: "INTEGRATION" },
      create: {
        tenantId,
        key: TEAMS_SETTINGS_KEY,
        value: config as any,
        category: "INTEGRATION",
        isPublic: false,
      },
    });

    return { success: true };
  }

  /**
   * Send notification to Teams
   */
  async sendTeamsNotification(
    tenantId: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: TEAMS_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as TeamsConfig;
    if (!config?.webhookUrl) {
      throw new BadRequestException("Teams not configured");
    }

    const card = this.buildTeamsCard(payload);

    // Send actual HTTP request to Teams webhook
    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        throw new Error(
          `Teams webhook failed: ${response.status} ${response.statusText}`,
        );
      }

      this.logger.log(`Teams notification sent successfully: ${payload.title}`);
    } catch (error: any) {
      this.logger.error(`Failed to send Teams notification: ${error.message}`);
      throw new BadRequestException(
        `Failed to send Teams notification: ${error.message}`,
      );
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: "TEAMS_NOTIFICATION_SENT",
        description: `Teams notification sent: ${payload.title}`,
        metadata: {
          type: payload.type,
        },
      },
    });

    return { success: true };
  }

  /**
   * Test Teams connection
   */
  async testTeamsConnection(
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key: TEAMS_SETTINGS_KEY } },
      });

      const config = setting?.value as unknown as TeamsConfig;
      if (!config?.webhookUrl) {
        throw new BadRequestException("Teams not configured");
      }

      // Send a test message to verify the webhook
      const testCard = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "0076D7",
        summary: "TalentX Connection Test",
        sections: [
          {
            activityTitle: "✅ Connection Test Successful",
            activitySubtitle: new Date().toLocaleString(),
            text: "Your Teams integration with TalentX is working correctly.",
            markdown: true,
          },
        ],
      };

      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCard),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Teams webhook returned status ${response.status}`,
        };
      }

      this.logger.log("Teams connection test successful");
      return {
        success: true,
        message: "Teams webhook verified - test message sent",
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // ==================== UNIFIED ====================

  /**
   * Send notification to all configured channels
   */
  async sendNotification(
    tenantId: string,
    payload: NotificationPayload,
  ): Promise<{ slack?: boolean; teams?: boolean }> {
    const results: { slack?: boolean; teams?: boolean } = {};

    // Try Slack
    try {
      const slackConfig = await this.getSlackConfig(tenantId);
      if (slackConfig.isConfigured) {
        await this.sendSlackNotification(tenantId, payload);
        results.slack = true;
      }
    } catch (error) {
      this.logger.error("Failed to send Slack notification:", error);
      results.slack = false;
    }

    // Try Teams
    try {
      const teamsConfig = await this.getTeamsConfig(tenantId);
      if (teamsConfig.isConfigured) {
        await this.sendTeamsNotification(tenantId, payload);
        results.teams = true;
      }
    } catch (error) {
      this.logger.error("Failed to send Teams notification:", error);
      results.teams = false;
    }

    return results;
  }

  /**
   * Disconnect all messaging integrations
   */
  async disconnectAll(tenantId: string) {
    await this.prisma.setting.deleteMany({
      where: {
        tenantId,
        key: { in: [SLACK_SETTINGS_KEY, TEAMS_SETTINGS_KEY] },
      },
    });

    return { success: true };
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Notify on new application
   */
  async notifyNewApplication(tenantId: string, application: any) {
    const webUrl =
      this.configService.get<string>("WEB_URL") || "http://localhost:3000";

    return this.sendNotification(tenantId, {
      type: "NEW_APPLICATION",
      title: "🆕 New Application Received",
      message: `${application.candidate?.firstName} ${application.candidate?.lastName} applied for ${application.job?.title}`,
      url: `${webUrl}/applications/${application.id}`,
      fields: [
        {
          name: "Candidate",
          value: `${application.candidate?.firstName} ${application.candidate?.lastName}`,
        },
        { name: "Position", value: application.job?.title || "Unknown" },
        { name: "Source", value: application.candidate?.source || "Direct" },
      ],
      color: "#36a64f",
    });
  }

  /**
   * Notify on interview scheduled
   */
  async notifyInterviewScheduled(tenantId: string, interview: any) {
    const webUrl =
      this.configService.get<string>("WEB_URL") || "http://localhost:3000";

    return this.sendNotification(tenantId, {
      type: "INTERVIEW_SCHEDULED",
      title: "📅 Interview Scheduled",
      message: `Interview scheduled with ${interview.candidate?.firstName} ${interview.candidate?.lastName}`,
      url: `${webUrl}/interviews/${interview.id}`,
      fields: [
        {
          name: "Candidate",
          value: `${interview.candidate?.firstName} ${interview.candidate?.lastName}`,
        },
        { name: "Type", value: interview.type },
        {
          name: "Date",
          value: new Date(interview.scheduledAt).toLocaleString(),
        },
        {
          name: "Interviewer",
          value: interview.interviewer?.firstName || "TBD",
        },
      ],
      color: "#2196F3",
    });
  }

  /**
   * Notify on offer accepted
   */
  async notifyOfferAccepted(tenantId: string, offer: any) {
    const webUrl =
      this.configService.get<string>("WEB_URL") || "http://localhost:3000";

    return this.sendNotification(tenantId, {
      type: "OFFER_ACCEPTED",
      title: "🎉 Offer Accepted!",
      message: `${offer.candidate?.firstName} ${offer.candidate?.lastName} accepted the offer for ${offer.job?.title}`,
      url: `${webUrl}/offers/${offer.id}`,
      fields: [
        {
          name: "Candidate",
          value: `${offer.candidate?.firstName} ${offer.candidate?.lastName}`,
        },
        { name: "Position", value: offer.job?.title || "Unknown" },
        {
          name: "Start Date",
          value: offer.startDate
            ? new Date(offer.startDate).toLocaleDateString()
            : "TBD",
        },
      ],
      color: "#4CAF50",
    });
  }

  // ==================== HELPERS ====================

  private async getSlackConfigOrThrow(tenantId: string): Promise<SlackConfig> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: SLACK_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as SlackConfig;
    if (!config?.botToken) {
      throw new BadRequestException("Slack not configured");
    }
    return config;
  }

  private getSlackChannelForType(
    config: SlackConfig,
    type: NotificationPayload["type"],
  ): string | undefined {
    switch (type) {
      case "NEW_APPLICATION":
        return (
          config.notificationChannels?.newApplication || config.defaultChannelId
        );
      case "INTERVIEW_SCHEDULED":
        return (
          config.notificationChannels?.interviewScheduled ||
          config.defaultChannelId
        );
      case "OFFER_ACCEPTED":
      case "CANDIDATE_HIRED":
        return (
          config.notificationChannels?.offerAccepted || config.defaultChannelId
        );
      default:
        return config.notificationChannels?.general || config.defaultChannelId;
    }
  }

  private buildSlackBlocks(payload: NotificationPayload): any[] {
    const blocks: any[] = [
      {
        type: "header",
        text: { type: "plain_text", text: payload.title, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: payload.message },
      },
    ];

    if (payload.fields?.length) {
      blocks.push({
        type: "section",
        fields: payload.fields.map((f) => ({
          type: "mrkdwn",
          text: `*${f.name}:*\n${f.value}`,
        })),
      });
    }

    if (payload.url) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Details", emoji: true },
            url: payload.url,
            style: "primary",
          },
        ],
      });
    }

    return blocks;
  }

  private buildTeamsCard(payload: NotificationPayload): any {
    const facts =
      payload.fields?.map((f) => ({ name: f.name, value: f.value })) || [];

    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: payload.color?.replace("#", "") || "0076D7",
      summary: payload.title,
      sections: [
        {
          activityTitle: payload.title,
          activitySubtitle: new Date().toLocaleString(),
          facts,
          markdown: true,
          text: payload.message,
        },
      ],
      potentialAction: payload.url
        ? [
            {
              "@type": "OpenUri",
              name: "View Details",
              targets: [{ os: "default", uri: payload.url }],
            },
          ]
        : [],
    };
  }
}
