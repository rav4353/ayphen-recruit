import { Injectable, Logger } from "@nestjs/common";

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  attendees?: { email: string; responseStatus?: string }[];
  conferenceData?: any;
  hangoutLink?: string;
}

interface FreeBusyResponse {
  calendars: {
    [email: string]: {
      busy: { start: string; end: string }[];
    };
  };
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly defaultRedirectUri = "http://localhost:3000/settings";

  /**
   * Generate OAuth URL for user to authorize
   */
  getAuthUrl(config: GoogleCalendarConfig, state?: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri || this.defaultRedirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    config: GoogleCalendarConfig,
    code: string,
    redirectUri?: string,
  ): Promise<GoogleTokens> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri:
          redirectUri || config.redirectUri || this.defaultRedirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error("Google token exchange failed:", error);
      throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    config: GoogleCalendarConfig,
    refreshToken: string,
  ): Promise<GoogleTokens> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error("Google token refresh failed:", error);
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user's email from token
   */
  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const data = await response.json();
    return data.email;
  }

  /**
   * Get primary calendar ID
   */
  async getPrimaryCalendarId(accessToken: string): Promise<string> {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get calendar");
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    accessToken: string,
    event: GoogleEvent,
    calendarId = "primary",
  ): Promise<GoogleEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error("Failed to create Google event:", error);
      throw new Error(`Failed to create event: ${error}`);
    }

    return response.json();
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    accessToken: string,
    eventId: string,
    event: Partial<GoogleEvent>,
    calendarId = "primary",
  ): Promise<GoogleEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error("Failed to update Google event:", error);
      throw new Error(`Failed to update event: ${error}`);
    }

    return response.json();
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    accessToken: string,
    eventId: string,
    calendarId = "primary",
  ): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      this.logger.error("Failed to delete Google event:", error);
      throw new Error(`Failed to delete event: ${error}`);
    }
  }

  /**
   * Get free/busy information for multiple calendars
   */
  async getFreeBusy(
    accessToken: string,
    emails: string[],
    timeMin: string,
    timeMax: string,
  ): Promise<FreeBusyResponse> {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: emails.map((email) => ({ id: email })),
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error("Failed to get free/busy:", error);
      throw new Error(`Failed to get free/busy: ${error}`);
    }

    return response.json();
  }

  /**
   * List events from calendar
   */
  async listEvents(
    accessToken: string,
    calendarId = "primary",
    timeMin?: string,
    timeMax?: string,
  ): Promise<GoogleEvent[]> {
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      ...(timeMin && { timeMin }),
      ...(timeMax && { timeMax }),
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error("Failed to list Google events:", error);
      throw new Error(`Failed to list events: ${error}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Generate ICS file content for an event
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
    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const crypto = require("crypto");
    const uid = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}@talentx.app`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TalentX//Interview Scheduling//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startTime)}`,
      `DTEND:${formatDate(event.endTime)}`,
      `SUMMARY:${event.title}`,
    ];

    if (event.description) {
      ics.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
    }
    if (event.location) {
      ics.push(`LOCATION:${event.location}`);
    }
    if (event.organizer) {
      ics.push(
        `ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`,
      );
    }
    if (event.attendees) {
      event.attendees.forEach((email) => {
        ics.push(
          `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`,
        );
      });
    }

    ics.push("END:VEVENT", "END:VCALENDAR");
    return ics.join("\r\n");
  }
}
