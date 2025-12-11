import { PrismaService } from '../../prisma/prisma.service';
import { GoogleCalendarService, GoogleCalendarConfig } from './providers/google-calendar.service';
import { OutlookCalendarService, OutlookCalendarConfig } from './providers/outlook-calendar.service';
import { ConnectCalendarDto, CreateCalendarEventDto, UpdateCalendarEventDto, FreeBusyQueryDto, UserAvailability, AvailabilitySlot } from './dto/calendar.dto';
type CalendarProvider = 'GOOGLE' | 'OUTLOOK';
export declare class CalendarService {
    private readonly prisma;
    private readonly googleCalendar;
    private readonly outlookCalendar;
    private readonly logger;
    constructor(prisma: PrismaService, googleCalendar: GoogleCalendarService, outlookCalendar: OutlookCalendarService);
    private getGoogleConfig;
    private getOutlookConfig;
    saveGoogleConfig(tenantId: string, config: GoogleCalendarConfig): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    saveOutlookConfig(tenantId: string, config: OutlookCalendarConfig): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    getCalendarSettings(tenantId: string): Promise<{
        google: {
            clientId: string;
            isConfigured: boolean;
        } | null;
        outlook: {
            clientId: string;
            isConfigured: boolean;
        } | null;
    }>;
    getAuthUrl(provider: CalendarProvider, userId: string, tenantId: string): Promise<string>;
    connectCalendar(userId: string, tenantId: string, dto: ConnectCalendarDto): Promise<{
        id: string;
        provider: import("@prisma/client").$Enums.CalendarProvider;
        email: string | null;
        isActive: boolean;
    }>;
    getConnections(userId: string): Promise<{
        id: string;
        provider: import("@prisma/client").$Enums.CalendarProvider;
        email: string | null;
        isActive: boolean;
        lastSyncAt: Date | null;
        createdAt: Date;
    }[]>;
    disconnectCalendar(userId: string, connectionId: string): Promise<{
        success: boolean;
    }>;
    private getValidAccessToken;
    createEvent(userId: string, dto: CreateCalendarEventDto): Promise<{
        event: {
            id: string;
            updatedAt: Date;
            provider: import("@prisma/client").$Enums.CalendarProvider;
            createdAt: Date;
            userId: string;
            externalId: string | null;
            title: string;
            description: string | null;
            startTime: Date;
            endTime: Date;
            location: string | null;
            meetingLink: string | null;
            attendees: import("@prisma/client/runtime/library").JsonValue | null;
            interviewId: string | null;
        };
        icsContent: string | undefined;
    }>;
    updateEvent(userId: string, eventId: string, dto: UpdateCalendarEventDto): Promise<{
        id: string;
        updatedAt: Date;
        provider: import("@prisma/client").$Enums.CalendarProvider;
        createdAt: Date;
        userId: string;
        externalId: string | null;
        title: string;
        description: string | null;
        startTime: Date;
        endTime: Date;
        location: string | null;
        meetingLink: string | null;
        attendees: import("@prisma/client/runtime/library").JsonValue | null;
        interviewId: string | null;
    }>;
    deleteEvent(userId: string, eventId: string): Promise<{
        success: boolean;
    }>;
    getFreeBusy(userId: string, tenantId: string, dto: FreeBusyQueryDto): Promise<UserAvailability[]>;
    private generateAvailabilitySlots;
    findCommonAvailability(userId: string, tenantId: string, dto: FreeBusyQueryDto): Promise<AvailabilitySlot[]>;
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
