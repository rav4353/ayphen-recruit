"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OutlookCalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlookCalendarService = void 0;
const common_1 = require("@nestjs/common");
let OutlookCalendarService = OutlookCalendarService_1 = class OutlookCalendarService {
    constructor() {
        this.logger = new common_1.Logger(OutlookCalendarService_1.name);
        this.defaultRedirectUri = 'http://localhost:3000/settings';
        this.defaultTenantId = 'common';
    }
    getAuthUrl(config, state) {
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
    async exchangeCodeForTokens(config, code, redirectUri) {
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
    async refreshAccessToken(config, refreshToken) {
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
    async getUserEmail(accessToken) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to get user info');
        }
        const data = await response.json();
        return data.mail || data.userPrincipalName;
    }
    async createEvent(accessToken, event) {
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
    async updateEvent(accessToken, eventId, event) {
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
    async deleteEvent(accessToken, eventId) {
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
    async getFreeBusy(accessToken, emails, startTime, endTime) {
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
    async listEvents(accessToken, startTime, endTime) {
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
    async createTeamsMeeting(accessToken, subject, startTime, endTime) {
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
};
exports.OutlookCalendarService = OutlookCalendarService;
exports.OutlookCalendarService = OutlookCalendarService = OutlookCalendarService_1 = __decorate([
    (0, common_1.Injectable)()
], OutlookCalendarService);
//# sourceMappingURL=outlook-calendar.service.js.map