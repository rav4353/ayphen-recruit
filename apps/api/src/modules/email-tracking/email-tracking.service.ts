import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export type EmailEventType =
  | "OPEN"
  | "CLICK"
  | "REPLY"
  | "BOUNCE"
  | "UNSUBSCRIBE";

@Injectable()
export class EmailTrackingService {
  private readonly logger = new Logger(EmailTrackingService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>("API_URL") || "http://localhost:3001";
  }

  /**
   * Generate a unique tracking token
   */
  private generateToken(): string {
    return `${Date.now()}-${crypto.randomBytes(12).toString("hex")}`;
  }

  /**
   * Create a tracking pixel URL for email opens
   */
  createTrackingPixel(campaignId: string, candidateId: string): string {
    const token = Buffer.from(
      JSON.stringify({ campaignId, candidateId }),
    ).toString("base64url");
    return `${this.baseUrl}/api/v1/email-tracking/pixel/${token}.png`;
  }

  /**
   * Wrap links in email with tracking URLs
   */
  async wrapLinksWithTracking(
    html: string,
    campaignId: string,
  ): Promise<string> {
    // Match all href attributes
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links: string[] = [];
    let match;

    // Extract all unique links
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      // Skip tracking pixel, mailto, tel, and anchor links
      if (!url.startsWith("http") || url.includes("/email-tracking/")) {
        continue;
      }
      if (!links.includes(url)) {
        links.push(url);
      }
    }

    // Create tracking links for each unique URL
    const trackingMap = new Map<string, string>();
    for (const originalUrl of links) {
      const trackingToken = this.generateToken();

      await this.prisma.emailTrackingLink.create({
        data: {
          campaignId,
          originalUrl,
          trackingToken,
        },
      });

      const trackingUrl = `${this.baseUrl}/api/v1/email-tracking/click/${trackingToken}`;
      trackingMap.set(originalUrl, trackingUrl);
    }

    // Replace all links with tracking URLs
    let trackedHtml = html;
    trackingMap.forEach((trackingUrl, originalUrl) => {
      const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`href=["']${escapedUrl}["']`, "gi");
      trackedHtml = trackedHtml.replace(regex, `href="${trackingUrl}"`);
    });

    return trackedHtml;
  }

  /**
   * Inject tracking pixel into HTML email
   */
  injectTrackingPixel(html: string, pixelUrl: string): string {
    // Add tracking pixel at the end of the body or at the end of HTML
    const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

    if (html.includes("</body>")) {
      return html.replace("</body>", `${trackingPixel}</body>`);
    } else {
      return html + trackingPixel;
    }
  }

  /**
   * Record an email tracking event
   */
  async recordEvent(
    campaignId: string,
    candidateId: string,
    eventType: EmailEventType,
    eventData?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      // Get tenantId from candidate
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { tenantId: true },
      });

      if (!candidate) {
        this.logger.warn(
          `Candidate ${candidateId} not found for tracking event`,
        );
        return null;
      }

      // Check if this exact event already exists (prevent duplicates)
      if (eventType === "OPEN") {
        const recentOpen = await this.prisma.emailTrackingEvent.findFirst({
          where: {
            campaignId,
            candidateId,
            eventType: "OPEN",
            createdAt: {
              gte: new Date(Date.now() - 60000), // Within last minute
            },
          },
        });

        if (recentOpen) {
          this.logger.debug(
            `Duplicate OPEN event ignored for campaign ${campaignId}, candidate ${candidateId}`,
          );
          return recentOpen;
        }
      }

      const event = await this.prisma.emailTrackingEvent.create({
        data: {
          campaignId,
          candidateId,
          eventType,
          eventData: eventData || {},
          ipAddress,
          userAgent,
          tenantId: candidate.tenantId,
        },
      });

      this.logger.log(
        `Recorded ${eventType} event for campaign ${campaignId}, candidate ${candidateId}`,
      );
      return event;
    } catch (error) {
      this.logger.error(
        `Failed to record tracking event: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Get tracking link by token
   */
  async getTrackingLink(trackingToken: string) {
    return this.prisma.emailTrackingLink.findUnique({
      where: { trackingToken },
    });
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, tenantId: string) {
    // Get all events for this campaign
    const events = await this.prisma.emailTrackingEvent.findMany({
      where: { campaignId, tenantId },
      select: {
        eventType: true,
        candidateId: true,
        createdAt: true,
      },
    });

    // Calculate unique counts
    const uniqueOpens = new Set(
      events.filter((e) => e.eventType === "OPEN").map((e) => e.candidateId),
    ).size;

    const uniqueClicks = new Set(
      events.filter((e) => e.eventType === "CLICK").map((e) => e.candidateId),
    ).size;

    const uniqueReplies = new Set(
      events.filter((e) => e.eventType === "REPLY").map((e) => e.candidateId),
    ).size;

    const unsubscribes = new Set(
      events
        .filter((e) => e.eventType === "UNSUBSCRIBE")
        .map((e) => e.candidateId),
    ).size;

    const bounces = new Set(
      events.filter((e) => e.eventType === "BOUNCE").map((e) => e.candidateId),
    ).size;

    // Total event counts
    const totalOpens = events.filter((e) => e.eventType === "OPEN").length;
    const totalClicks = events.filter((e) => e.eventType === "CLICK").length;

    return {
      uniqueOpens,
      uniqueClicks,
      uniqueReplies,
      unsubscribes,
      bounces,
      totalOpens,
      totalClicks,
      events: events.length,
    };
  }

  /**
   * Get recipient-level analytics for a campaign
   */
  async getRecipientAnalytics(campaignId: string, tenantId: string) {
    const events = await this.prisma.emailTrackingEvent.findMany({
      where: { campaignId, tenantId },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by candidate
    const recipientMap = new Map<string, any>();

    for (const event of events) {
      const candidateId = event.candidateId;

      if (!recipientMap.has(candidateId)) {
        recipientMap.set(candidateId, {
          candidate: event.candidate,
          opened: false,
          clicked: false,
          replied: false,
          unsubscribed: false,
          bounced: false,
          openCount: 0,
          clickCount: 0,
          firstOpenAt: null,
          lastActivityAt: null,
        });
      }

      const recipient = recipientMap.get(candidateId);

      switch (event.eventType) {
        case "OPEN":
          recipient.opened = true;
          recipient.openCount++;
          if (!recipient.firstOpenAt) {
            recipient.firstOpenAt = event.createdAt;
          }
          break;
        case "CLICK":
          recipient.clicked = true;
          recipient.clickCount++;
          break;
        case "REPLY":
          recipient.replied = true;
          break;
        case "UNSUBSCRIBE":
          recipient.unsubscribed = true;
          break;
        case "BOUNCE":
          recipient.bounced = true;
          break;
      }

      recipient.lastActivityAt = event.createdAt;
    }

    return Array.from(recipientMap.values());
  }

  /**
   * Get click details for a campaign
   */
  async getClickDetails(campaignId: string, tenantId: string) {
    const clickEvents = await this.prisma.emailTrackingEvent.findMany({
      where: {
        campaignId,
        tenantId,
        eventType: "CLICK",
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by URL
    const urlMap = new Map<string, any>();

    for (const event of clickEvents) {
      const url = event.eventData?.["url"] || "Unknown URL";

      if (!urlMap.has(url)) {
        urlMap.set(url, {
          url,
          clicks: 0,
          uniqueClickers: new Set(),
          recentClicks: [],
        });
      }

      const urlData = urlMap.get(url);
      urlData.clicks++;
      urlData.uniqueClickers.add(event.candidateId);

      if (urlData.recentClicks.length < 10) {
        urlData.recentClicks.push({
          candidate: event.candidate,
          clickedAt: event.createdAt,
        });
      }
    }

    return Array.from(urlMap.values()).map((data) => ({
      url: data.url,
      clicks: data.clicks,
      uniqueClickers: data.uniqueClickers.size,
      recentClicks: data.recentClicks,
    }));
  }
}
