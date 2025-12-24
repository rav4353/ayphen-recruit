import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  GoogleCalendarService,
  GoogleCalendarConfig,
} from "./providers/google-calendar.service";
import {
  OutlookCalendarService,
  OutlookCalendarConfig,
} from "./providers/outlook-calendar.service";
import {
  ConnectCalendarDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  FreeBusyQueryDto,
  UserAvailability,
  AvailabilitySlot,
} from "./dto/calendar.dto";

// Define CalendarProvider locally until prisma generate runs
type CalendarProvider = "GOOGLE" | "OUTLOOK";

// Settings keys for storing calendar configs per tenant
const GOOGLE_CALENDAR_CONFIG_KEY = "google_calendar_config";
const OUTLOOK_CALENDAR_CONFIG_KEY = "outlook_calendar_config";

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly outlookCalendar: OutlookCalendarService,
  ) {}

  /**
   * Get calendar config from tenant settings
   */
  private async getGoogleConfig(
    tenantId: string,
  ): Promise<GoogleCalendarConfig | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: GOOGLE_CALENDAR_CONFIG_KEY } },
    });
    return setting?.value as unknown as GoogleCalendarConfig | null;
  }

  private async getOutlookConfig(
    tenantId: string,
  ): Promise<OutlookCalendarConfig | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: OUTLOOK_CALENDAR_CONFIG_KEY } },
    });
    return setting?.value as unknown as OutlookCalendarConfig | null;
  }

  /**
   * Save calendar config to tenant settings
   */
  async saveGoogleConfig(tenantId: string, config: GoogleCalendarConfig) {
    return this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: GOOGLE_CALENDAR_CONFIG_KEY } },
      update: { value: config as any, category: "INTEGRATION" },
      create: {
        tenantId,
        key: GOOGLE_CALENDAR_CONFIG_KEY,
        value: config as any,
        category: "INTEGRATION",
        isPublic: false,
      },
    });
  }

  async saveOutlookConfig(tenantId: string, config: OutlookCalendarConfig) {
    return this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: OUTLOOK_CALENDAR_CONFIG_KEY } },
      update: { value: config as any, category: "INTEGRATION" },
      create: {
        tenantId,
        key: OUTLOOK_CALENDAR_CONFIG_KEY,
        value: config as any,
        category: "INTEGRATION",
        isPublic: false,
      },
    });
  }

  /**
   * Get calendar settings for a tenant (for frontend display)
   */
  async getCalendarSettings(tenantId: string) {
    const googleConfig = await this.getGoogleConfig(tenantId);
    const outlookConfig = await this.getOutlookConfig(tenantId);

    return {
      google: googleConfig
        ? {
            clientId: googleConfig.clientId,
            isConfigured: !!googleConfig.clientId,
          }
        : null,
      outlook: outlookConfig
        ? {
            clientId: outlookConfig.clientId,
            isConfigured: !!outlookConfig.clientId,
          }
        : null,
    };
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  async getAuthUrl(
    provider: CalendarProvider,
    userId: string,
    tenantId: string,
  ): Promise<string> {
    const state = Buffer.from(
      JSON.stringify({ userId, provider, tenantId }),
    ).toString("base64");

    if (provider === "GOOGLE") {
      const config = await this.getGoogleConfig(tenantId);
      if (!config?.clientId)
        throw new BadRequestException(
          "Google Calendar not configured. Please add credentials in Settings.",
        );
      return this.googleCalendar.getAuthUrl(config, state);
    } else if (provider === "OUTLOOK") {
      const config = await this.getOutlookConfig(tenantId);
      if (!config?.clientId)
        throw new BadRequestException(
          "Outlook Calendar not configured. Please add credentials in Settings.",
        );
      return this.outlookCalendar.getAuthUrl(config, state);
    }

    throw new BadRequestException("Unsupported calendar provider");
  }

  /**
   * Connect a calendar using OAuth code
   */
  async connectCalendar(
    userId: string,
    tenantId: string,
    dto: ConnectCalendarDto,
  ) {
    const { provider, code, redirectUri } = dto;

    let tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    let email: string;
    let calendarId: string | undefined;

    try {
      if (provider === "GOOGLE") {
        const config = await this.getGoogleConfig(tenantId);
        if (!config?.clientId)
          throw new BadRequestException("Google Calendar not configured");
        tokens = await this.googleCalendar.exchangeCodeForTokens(
          config,
          code,
          redirectUri,
        );
        email = await this.googleCalendar.getUserEmail(tokens.access_token);
        calendarId = await this.googleCalendar.getPrimaryCalendarId(
          tokens.access_token,
        );
      } else if (provider === "OUTLOOK") {
        const config = await this.getOutlookConfig(tenantId);
        if (!config?.clientId)
          throw new BadRequestException("Outlook Calendar not configured");
        tokens = await this.outlookCalendar.exchangeCodeForTokens(
          config,
          code,
          redirectUri,
        );
        email = await this.outlookCalendar.getUserEmail(tokens.access_token);
      } else {
        throw new BadRequestException("Unsupported calendar provider");
      }

      // Upsert calendar connection
      const connection = await this.prisma.calendarConnection.upsert({
        where: { userId_provider: { userId, provider } },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          email,
          calendarId,
          isActive: true,
        },
        create: {
          userId,
          provider,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          email,
          calendarId,
          isActive: true,
        },
      });

      return {
        id: connection.id,
        provider: connection.provider,
        email: connection.email,
        isActive: connection.isActive,
      };
    } catch (error) {
      this.logger.error("Failed to connect calendar:", error);
      throw new BadRequestException(
        `Failed to connect calendar: ${error.message}`,
      );
    }
  }

  /**
   * Get user's calendar connections
   */
  async getConnections(userId: string) {
    const connections = await this.prisma.calendarConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    return connections;
  }

  /**
   * Disconnect a calendar
   */
  async disconnectCalendar(userId: string, connectionId: string) {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new NotFoundException("Calendar connection not found");
    }

    await this.prisma.calendarConnection.delete({
      where: { id: connectionId },
    });

    return { success: true };
  }

  /**
   * Get valid access token (refresh if needed)
   */
  private async getValidAccessToken(
    connection: any,
    tenantId: string,
  ): Promise<string> {
    // Check if token is expired or about to expire (5 min buffer)
    if (
      connection.tokenExpiresAt &&
      new Date(connection.tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return connection.accessToken;
    }

    // Refresh token
    if (!connection.refreshToken) {
      throw new BadRequestException(
        "Calendar connection needs re-authorization",
      );
    }

    let tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (connection.provider === "GOOGLE") {
      const config = await this.getGoogleConfig(tenantId);
      if (!config)
        throw new BadRequestException("Google Calendar not configured");
      tokens = await this.googleCalendar.refreshAccessToken(
        config,
        connection.refreshToken,
      );
    } else if (connection.provider === "OUTLOOK") {
      const config = await this.getOutlookConfig(tenantId);
      if (!config)
        throw new BadRequestException("Outlook Calendar not configured");
      tokens = await this.outlookCalendar.refreshAccessToken(
        config,
        connection.refreshToken,
      );
    } else {
      throw new BadRequestException("Unsupported provider");
    }

    // Update stored tokens
    await this.prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || connection.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  /**
   * Create a calendar event
   */
  async createEvent(userId: string, dto: CreateCalendarEventDto) {
    // Get user's active calendar connection
    const connection = await this.prisma.calendarConnection.findFirst({
      where: {
        userId,
        isActive: true,
        ...(dto.provider && { provider: dto.provider }),
      },
    });

    if (!connection) {
      // If no calendar connected, just create local event
      const event = await this.prisma.calendarEvent.create({
        data: {
          provider: dto.provider || "GOOGLE",
          title: dto.title,
          description: dto.description,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          location: dto.location,
          meetingLink: dto.meetingLink,
          attendees: dto.attendees || [],
          userId,
          interviewId: dto.interviewId,
        },
      });

      // Generate ICS if requested
      let icsContent: string | undefined;
      if (dto.generateIcs) {
        icsContent = this.googleCalendar.generateIcs({
          title: dto.title,
          description: dto.description,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          location: dto.location,
          attendees: dto.attendees,
        });
      }

      return { event, icsContent };
    }

    // Get user's tenantId for token refresh
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const accessToken = await this.getValidAccessToken(
      connection,
      user.tenantId,
    );
    let externalId: string | undefined;
    let meetingLink = dto.meetingLink;

    try {
      if (connection.provider === "GOOGLE") {
        const googleEvent = await this.googleCalendar.createEvent(
          accessToken,
          {
            summary: dto.title,
            description: dto.description,
            start: { dateTime: dto.startTime },
            end: { dateTime: dto.endTime },
            location: dto.location,
            attendees: dto.attendees?.map((email) => ({ email })),
          },
          connection.calendarId || "primary",
        );

        externalId = googleEvent.id;
        meetingLink = meetingLink || googleEvent.hangoutLink;
      } else if (connection.provider === "OUTLOOK") {
        const outlookEvent = await this.outlookCalendar.createEvent(
          accessToken,
          {
            subject: dto.title,
            body: dto.description
              ? { contentType: "text", content: dto.description }
              : undefined,
            start: { dateTime: dto.startTime, timeZone: "UTC" },
            end: { dateTime: dto.endTime, timeZone: "UTC" },
            location: dto.location ? { displayName: dto.location } : undefined,
            attendees: dto.attendees?.map((email) => ({
              emailAddress: { address: email },
              type: "required",
            })),
            isOnlineMeeting: true,
          },
        );

        externalId = outlookEvent.id;
        meetingLink = meetingLink || outlookEvent.onlineMeeting?.joinUrl;
      }
    } catch (error) {
      this.logger.error("Failed to create external calendar event:", error);
      // Continue to create local event even if external fails
    }

    // Create local record
    const event = await this.prisma.calendarEvent.create({
      data: {
        externalId,
        provider: connection.provider,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location,
        meetingLink,
        attendees: dto.attendees || [],
        userId,
        interviewId: dto.interviewId,
      },
    });

    // Generate ICS if requested
    let icsContent: string | undefined;
    if (dto.generateIcs) {
      icsContent = this.googleCalendar.generateIcs({
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location,
        attendees: dto.attendees,
      });
    }

    return { event, icsContent };
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    userId: string,
    eventId: string,
    dto: UpdateCalendarEventDto,
  ) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new NotFoundException("Calendar event not found");
    }

    // Update external event if connected
    if (event.externalId) {
      const connection = await this.prisma.calendarConnection.findFirst({
        where: { userId, provider: event.provider, isActive: true },
      });

      if (connection) {
        // Get user's tenantId for token refresh
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { tenantId: true },
        });
        const accessToken = await this.getValidAccessToken(
          connection,
          user?.tenantId || "",
        );

        try {
          if (event.provider === "GOOGLE") {
            await this.googleCalendar.updateEvent(
              accessToken,
              event.externalId,
              {
                summary: dto.title,
                description: dto.description,
                start: dto.startTime ? { dateTime: dto.startTime } : undefined,
                end: dto.endTime ? { dateTime: dto.endTime } : undefined,
                location: dto.location,
                attendees: dto.attendees?.map((email) => ({ email })),
              },
              connection.calendarId || "primary",
            );
          } else if (event.provider === "OUTLOOK") {
            await this.outlookCalendar.updateEvent(
              accessToken,
              event.externalId,
              {
                subject: dto.title,
                body: dto.description
                  ? { contentType: "text", content: dto.description }
                  : undefined,
                start: dto.startTime
                  ? { dateTime: dto.startTime, timeZone: "UTC" }
                  : undefined,
                end: dto.endTime
                  ? { dateTime: dto.endTime, timeZone: "UTC" }
                  : undefined,
                location: dto.location
                  ? { displayName: dto.location }
                  : undefined,
                attendees: dto.attendees?.map((email) => ({
                  emailAddress: { address: email },
                  type: "required",
                })),
              },
            );
          }
        } catch (error) {
          this.logger.error("Failed to update external calendar event:", error);
        }
      }
    }

    // Update local record
    return this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        location: dto.location,
        meetingLink: dto.meetingLink,
        attendees: dto.attendees,
      },
    });
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(userId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new NotFoundException("Calendar event not found");
    }

    // Delete external event if connected
    if (event.externalId) {
      const connection = await this.prisma.calendarConnection.findFirst({
        where: { userId, provider: event.provider, isActive: true },
      });

      if (connection) {
        // Get user's tenantId for token refresh
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { tenantId: true },
        });
        const accessToken = await this.getValidAccessToken(
          connection,
          user?.tenantId || "",
        );

        try {
          if (event.provider === "GOOGLE") {
            await this.googleCalendar.deleteEvent(
              accessToken,
              event.externalId,
              connection.calendarId || "primary",
            );
          } else if (event.provider === "OUTLOOK") {
            await this.outlookCalendar.deleteEvent(
              accessToken,
              event.externalId,
            );
          }
        } catch (error) {
          this.logger.error("Failed to delete external calendar event:", error);
        }
      }
    }

    // Delete local record
    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  /**
   * Get free/busy availability for multiple users
   */
  async getFreeBusy(
    userId: string,
    tenantId: string,
    dto: FreeBusyQueryDto,
  ): Promise<UserAvailability[]> {
    const { userIds, startTime, endTime, durationMinutes = 30 } = dto;

    // Get all users with their calendar connections
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        tenantId,
      },
      include: {
        calendarConnections: {
          where: { isActive: true },
        },
      },
    });

    const results: UserAvailability[] = [];

    for (const user of users) {
      const availability: UserAvailability = {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        connected: user.calendarConnections.length > 0,
        slots: [],
      };

      if (user.calendarConnections.length > 0) {
        const connection = user.calendarConnections[0];

        try {
          const accessToken = await this.getValidAccessToken(
            connection,
            tenantId,
          );

          if (connection.provider === "GOOGLE") {
            const freeBusy = await this.googleCalendar.getFreeBusy(
              accessToken,
              [connection.email || user.email],
              startTime,
              endTime,
            );

            const busySlots = Object.values(freeBusy.calendars)[0]?.busy || [];
            availability.slots = this.generateAvailabilitySlots(
              startTime,
              endTime,
              busySlots,
              durationMinutes,
            );
          } else if (connection.provider === "OUTLOOK") {
            const freeBusy = await this.outlookCalendar.getFreeBusy(
              accessToken,
              [connection.email || user.email],
              startTime,
              endTime,
            );

            const busySlots =
              freeBusy.value[0]?.scheduleItems
                ?.filter((item) => item.status !== "free")
                .map((item) => ({
                  start: item.start.dateTime,
                  end: item.end.dateTime,
                })) || [];

            availability.slots = this.generateAvailabilitySlots(
              startTime,
              endTime,
              busySlots,
              durationMinutes,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to get free/busy for user ${user.id}:`,
            error,
          );
          // Return empty slots if failed
        }
      } else {
        // No calendar connected - assume all available
        availability.slots = this.generateAvailabilitySlots(
          startTime,
          endTime,
          [],
          durationMinutes,
        );
      }

      results.push(availability);
    }

    return results;
  }

  /**
   * Generate availability slots based on busy times
   */
  private generateAvailabilitySlots(
    startTime: string,
    endTime: string,
    busySlots: { start: string; end: string }[],
    durationMinutes: number,
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const start = new Date(startTime);
    const end = new Date(endTime);

    let current = new Date(start);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);
      if (slotEnd > end) break;

      // Check if this slot overlaps with any busy slot
      const isBusy = busySlots.some((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return current < busyEnd && slotEnd > busyStart;
      });

      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBusy,
      });

      current = slotEnd;
    }

    return slots;
  }

  /**
   * Find common available slots across multiple users
   */
  async findCommonAvailability(
    userId: string,
    tenantId: string,
    dto: FreeBusyQueryDto,
  ): Promise<AvailabilitySlot[]> {
    const userAvailabilities = await this.getFreeBusy(userId, tenantId, dto);

    if (userAvailabilities.length === 0) return [];

    // Start with first user's slots
    let commonSlots = userAvailabilities[0].slots.filter((s) => s.available);

    // Intersect with each other user's available slots
    for (let i = 1; i < userAvailabilities.length; i++) {
      const userSlots = userAvailabilities[i].slots.filter((s) => s.available);
      commonSlots = commonSlots.filter((common) =>
        userSlots.some(
          (slot) => slot.start === common.start && slot.end === common.end,
        ),
      );
    }

    return commonSlots;
  }

  /**
   * Generate ICS content for an event
   */
  generateIcs(event: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: string[];
    organizer?: { name: string; email: string };
  }): string {
    return this.googleCalendar.generateIcs(event);
  }
}
