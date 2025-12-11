import { CalendarService } from './calendar.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { ConnectCalendarDto, CreateCalendarEventDto, UpdateCalendarEventDto, FreeBusyQueryDto } from './dto/calendar.dto';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getSettings(req: any): Promise<ApiResponse<{
        google: {
            clientId: string;
            isConfigured: boolean;
        } | null;
        outlook: {
            clientId: string;
            isConfigured: boolean;
        } | null;
    }>>;
    saveGoogleConfig(dto: {
        clientId: string;
        clientSecret: string;
        redirectUri?: string;
    }, req: any): Promise<ApiResponse<null>>;
    saveOutlookConfig(dto: {
        clientId: string;
        clientSecret: string;
        redirectUri?: string;
        tenantId?: string;
    }, req: any): Promise<ApiResponse<null>>;
    getAuthUrl(provider: 'GOOGLE' | 'OUTLOOK', req: any): Promise<ApiResponse<{
        url: string;
    }>>;
    connectCalendar(dto: ConnectCalendarDto, req: any): Promise<ApiResponse<{
        id: string;
        provider: import("@prisma/client").$Enums.CalendarProvider;
        email: string | null;
        isActive: boolean;
    }>>;
    getConnections(req: any): Promise<ApiResponse<{
        id: string;
        provider: import("@prisma/client").$Enums.CalendarProvider;
        email: string | null;
        isActive: boolean;
        lastSyncAt: Date | null;
        createdAt: Date;
    }[]>>;
    disconnectCalendar(connectionId: string, req: any): Promise<ApiResponse<null>>;
    createEvent(dto: CreateCalendarEventDto, req: any): Promise<ApiResponse<{
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
    }>>;
    updateEvent(eventId: string, dto: UpdateCalendarEventDto, req: any): Promise<ApiResponse<{
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
    }>>;
    deleteEvent(eventId: string, req: any): Promise<ApiResponse<null>>;
    getFreeBusy(dto: FreeBusyQueryDto, req: any): Promise<ApiResponse<import("./dto/calendar.dto").UserAvailability[]>>;
    findCommonAvailability(dto: FreeBusyQueryDto, req: any): Promise<ApiResponse<import("./dto/calendar.dto").AvailabilitySlot[]>>;
    generateIcs(dto: CreateCalendarEventDto): Promise<ApiResponse<{
        icsContent: string;
    }>>;
}
