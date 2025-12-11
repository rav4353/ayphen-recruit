"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GoogleCalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const common_1 = require("@nestjs/common");
let GoogleCalendarService = GoogleCalendarService_1 = class GoogleCalendarService {
    constructor() {
        this.logger = new common_1.Logger(GoogleCalendarService_1.name);
        this.defaultRedirectUri = 'http://localhost:3000/settings';
    }
    getAuthUrl(config, state) {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
        ];
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri || this.defaultRedirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            ...(state && { state }),
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    async exchangeCodeForTokens(config, code, redirectUri) {
        const response = await fetch('https://oauth2.googleapis.com/token', {
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
            this.logger.error('Google token exchange failed:', error);
            throw new Error(`Failed to exchange code: ${error}`);
        }
        return response.json();
    }
    async refreshAccessToken(config, refreshToken) {
        const response = await fetch('https://oauth2.googleapis.com/token', {
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
            this.logger.error('Google token refresh failed:', error);
            throw new Error(`Failed to refresh token: ${error}`);
        }
        return response.json();
    }
    async getUserEmail(accessToken) {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to get user info');
        }
        const data = await response.json();
        return data.email;
    }
    async getPrimaryCalendarId(accessToken) {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to get calendar');
        }
        const data = await response.json();
        return data.id;
    }
    async createEvent(accessToken, event, calendarId = 'primary') {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to create Google event:', error);
            throw new Error(`Failed to create event: ${error}`);
        }
        return response.json();
    }
    async updateEvent(accessToken, eventId, event, calendarId = 'primary') {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to update Google event:', error);
            throw new Error(`Failed to update event: ${error}`);
        }
        return response.json();
    }
    async deleteEvent(accessToken, eventId, calendarId = 'primary') {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            this.logger.error('Failed to delete Google event:', error);
            throw new Error(`Failed to delete event: ${error}`);
        }
    }
    async getFreeBusy(accessToken, emails, timeMin, timeMax) {
        const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timeMin,
                timeMax,
                items: emails.map(email => ({ id: email })),
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to get free/busy:', error);
            throw new Error(`Failed to get free/busy: ${error}`);
        }
        return response.json();
    }
    async listEvents(accessToken, calendarId = 'primary', timeMin, timeMax) {
        const params = new URLSearchParams({
            singleEvents: 'true',
            orderBy: 'startTime',
            ...(timeMin && { timeMin }),
            ...(timeMax && { timeMax }),
        });
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to list Google events:', error);
            throw new Error(`Failed to list events: ${error}`);
        }
        const data = await response.json();
        return data.items || [];
    }
    generateIcs(event) {
        const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}@talentx.app`;
        let ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TalentX//Interview Scheduling//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(event.startTime)}`,
            `DTEND:${formatDate(event.endTime)}`,
            `SUMMARY:${event.title}`,
        ];
        if (event.description) {
            ics.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
        }
        if (event.location) {
            ics.push(`LOCATION:${event.location}`);
        }
        if (event.organizer) {
            ics.push(`ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`);
        }
        if (event.attendees) {
            event.attendees.forEach(email => {
                ics.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`);
            });
        }
        ics.push('END:VEVENT', 'END:VCALENDAR');
        return ics.join('\r\n');
    }
};
exports.GoogleCalendarService = GoogleCalendarService;
exports.GoogleCalendarService = GoogleCalendarService = GoogleCalendarService_1 = __decorate([
    (0, common_1.Injectable)()
], GoogleCalendarService);
//# sourceMappingURL=google-calendar.service.js.map