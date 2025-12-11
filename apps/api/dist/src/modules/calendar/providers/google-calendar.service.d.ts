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
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    location?: string;
    attendees?: {
        email: string;
        responseStatus?: string;
    }[];
    conferenceData?: any;
    hangoutLink?: string;
}
interface FreeBusyResponse {
    calendars: {
        [email: string]: {
            busy: {
                start: string;
                end: string;
            }[];
        };
    };
}
export interface GoogleCalendarConfig {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
}
export declare class GoogleCalendarService {
    private readonly logger;
    private readonly defaultRedirectUri;
    getAuthUrl(config: GoogleCalendarConfig, state?: string): string;
    exchangeCodeForTokens(config: GoogleCalendarConfig, code: string, redirectUri?: string): Promise<GoogleTokens>;
    refreshAccessToken(config: GoogleCalendarConfig, refreshToken: string): Promise<GoogleTokens>;
    getUserEmail(accessToken: string): Promise<string>;
    getPrimaryCalendarId(accessToken: string): Promise<string>;
    createEvent(accessToken: string, event: GoogleEvent, calendarId?: string): Promise<GoogleEvent>;
    updateEvent(accessToken: string, eventId: string, event: Partial<GoogleEvent>, calendarId?: string): Promise<GoogleEvent>;
    deleteEvent(accessToken: string, eventId: string, calendarId?: string): Promise<void>;
    getFreeBusy(accessToken: string, emails: string[], timeMin: string, timeMax: string): Promise<FreeBusyResponse>;
    listEvents(accessToken: string, calendarId?: string, timeMin?: string, timeMax?: string): Promise<GoogleEvent[]>;
    generateIcs(event: {
        title: string;
        description?: string;
        startTime: Date;
        endTime: Date;
        location?: string;
        attendees?: string[];
        organizer?: {
            name: string;
            email: string;
        };
    }): string;
}
export {};
