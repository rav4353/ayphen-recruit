interface MicrosoftTokens {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}
interface OutlookEvent {
    id?: string;
    subject: string;
    body?: {
        contentType: string;
        content: string;
    };
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    location?: {
        displayName: string;
    };
    attendees?: {
        emailAddress: {
            address: string;
            name?: string;
        };
        type: string;
    }[];
    onlineMeeting?: {
        joinUrl: string;
    };
    isOnlineMeeting?: boolean;
    onlineMeetingProvider?: string;
}
interface FreeBusyResponse {
    value: {
        scheduleId: string;
        availabilityView: string;
        scheduleItems: {
            status: string;
            start: {
                dateTime: string;
            };
            end: {
                dateTime: string;
            };
        }[];
    }[];
}
export interface OutlookCalendarConfig {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
    tenantId?: string;
}
export declare class OutlookCalendarService {
    private readonly logger;
    private readonly defaultRedirectUri;
    private readonly defaultTenantId;
    getAuthUrl(config: OutlookCalendarConfig, state?: string): string;
    exchangeCodeForTokens(config: OutlookCalendarConfig, code: string, redirectUri?: string): Promise<MicrosoftTokens>;
    refreshAccessToken(config: OutlookCalendarConfig, refreshToken: string): Promise<MicrosoftTokens>;
    getUserEmail(accessToken: string): Promise<string>;
    createEvent(accessToken: string, event: OutlookEvent): Promise<OutlookEvent>;
    updateEvent(accessToken: string, eventId: string, event: Partial<OutlookEvent>): Promise<OutlookEvent>;
    deleteEvent(accessToken: string, eventId: string): Promise<void>;
    getFreeBusy(accessToken: string, emails: string[], startTime: string, endTime: string): Promise<FreeBusyResponse>;
    listEvents(accessToken: string, startTime?: string, endTime?: string): Promise<OutlookEvent[]>;
    createTeamsMeeting(accessToken: string, subject: string, startTime: string, endTime: string): Promise<string>;
}
export {};
