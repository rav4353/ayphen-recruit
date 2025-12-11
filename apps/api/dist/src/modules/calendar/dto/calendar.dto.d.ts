type CalendarProvider = 'GOOGLE' | 'OUTLOOK';
export declare class ConnectCalendarDto {
    provider: CalendarProvider;
    code: string;
    redirectUri?: string;
}
export declare class CreateCalendarEventDto {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    meetingLink?: string;
    attendees?: string[];
    interviewId?: string;
    provider?: CalendarProvider;
    generateIcs?: boolean;
}
export declare class UpdateCalendarEventDto {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    meetingLink?: string;
    attendees?: string[];
}
export declare class FreeBusyQueryDto {
    userIds: string[];
    startTime: string;
    endTime: string;
    durationMinutes?: number;
}
export declare class AvailabilitySlot {
    start: string;
    end: string;
    available: boolean;
}
export declare class UserAvailability {
    userId: string;
    email: string;
    name: string;
    connected: boolean;
    slots: AvailabilitySlot[];
}
export {};
