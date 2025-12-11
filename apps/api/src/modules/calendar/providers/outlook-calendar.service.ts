import { Injectable, Logger } from '@nestjs/common';

interface MicrosoftTokens {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

interface OutlookEvent {
    id?: string;
    subject: string;
    body?: { contentType: string; content: string };
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: { displayName: string };
    attendees?: { emailAddress: { address: string; name?: string }; type: string }[];
    onlineMeeting?: { joinUrl: string };
    isOnlineMeeting?: boolean;
    onlineMeetingProvider?: string;
}

interface FreeBusyResponse {
    value: {
        scheduleId: string;
        availabilityView: string;
        scheduleItems: { status: string; start: { dateTime: string }; end: { dateTime: string } }[];
    }[];
}

export interface OutlookCalendarConfig {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
    tenantId?: string;
}

@Injectable()
export class OutlookCalendarService {
    private readonly logger = new Logger(OutlookCalendarService.name);
    private readonly defaultRedirectUri = 'http://localhost:3000/settings';
    private readonly defaultTenantId = 'common';

    /**
     * Generate OAuth URL for user to authorize
     */
    getAuthUrl(config: OutlookCalendarConfig, state?: string): string {
        const scopes = [
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'https://graph.microsoft.com/User.Read',
            'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
            'offline_access',
        ];

        const tenantId = config.tenantId || this.defaultTenantId;

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri || this.defaultRedirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            response_mode: 'query',
            ...(state && { state }),
        });

        return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(config: OutlookCalendarConfig, code: string, redirectUri?: string): Promise<MicrosoftTokens> {
        const tenantId = config.tenantId || this.defaultTenantId;
        
        const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: redirectUri || config.redirectUri || this.defaultRedirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Microsoft token exchange failed:', error);
            throw new Error(`Failed to exchange code: ${error}`);
        }

        return response.json();
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(config: OutlookCalendarConfig, refreshToken: string): Promise<MicrosoftTokens> {
        const tenantId = config.tenantId || this.defaultTenantId;
        
        const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Microsoft token refresh failed:', error);
            throw new Error(`Failed to refresh token: ${error}`);
        }

        return response.json();
    }

    /**
     * Get user's email from token
     */
    async getUserEmail(accessToken: string): Promise<string> {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        const data = await response.json();
        return data.mail || data.userPrincipalName;
    }

    /**
     * Create a calendar event
     */
    async createEvent(accessToken: string, event: OutlookEvent): Promise<OutlookEvent> {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...event,
                isOnlineMeeting: event.isOnlineMeeting ?? true,
                onlineMeetingProvider: event.onlineMeetingProvider ?? 'teamsForBusiness',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to create Outlook event:', error);
            throw new Error(`Failed to create event: ${error}`);
        }

        return response.json();
    }

    /**
     * Update a calendar event
     */
    async updateEvent(accessToken: string, eventId: string, event: Partial<OutlookEvent>): Promise<OutlookEvent> {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to update Outlook event:', error);
            throw new Error(`Failed to update event: ${error}`);
        }

        return response.json();
    }

    /**
     * Delete a calendar event
     */
    async deleteEvent(accessToken: string, eventId: string): Promise<void> {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            this.logger.error('Failed to delete Outlook event:', error);
            throw new Error(`Failed to delete event: ${error}`);
        }
    }

    /**
     * Get free/busy information for multiple users
     */
    async getFreeBusy(accessToken: string, emails: string[], startTime: string, endTime: string): Promise<FreeBusyResponse> {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                schedules: emails,
                startTime: { dateTime: startTime, timeZone: 'UTC' },
                endTime: { dateTime: endTime, timeZone: 'UTC' },
                availabilityViewInterval: 30,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to get free/busy:', error);
            throw new Error(`Failed to get free/busy: ${error}`);
        }

        return response.json();
    }

    /**
     * List events from calendar
     */
    async listEvents(accessToken: string, startTime?: string, endTime?: string): Promise<OutlookEvent[]> {
        let url = 'https://graph.microsoft.com/v1.0/me/events?$orderby=start/dateTime';

        if (startTime && endTime) {
            url += `&$filter=start/dateTime ge '${startTime}' and end/dateTime le '${endTime}'`;
        }

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to list Outlook events:', error);
            throw new Error(`Failed to list events: ${error}`);
        }

        const data = await response.json();
        return data.value || [];
    }

    /**
     * Create Teams meeting link
     */
    async createTeamsMeeting(accessToken: string, subject: string, startTime: string, endTime: string): Promise<string> {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject,
                startDateTime: startTime,
                endDateTime: endTime,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to create Teams meeting:', error);
            throw new Error(`Failed to create Teams meeting: ${error}`);
        }

        const data = await response.json();
        return data.joinWebUrl;
    }
}
