"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const google_calendar_service_1 = require("./providers/google-calendar.service");
const outlook_calendar_service_1 = require("./providers/outlook-calendar.service");
const GOOGLE_CALENDAR_CONFIG_KEY = 'google_calendar_config';
const OUTLOOK_CALENDAR_CONFIG_KEY = 'outlook_calendar_config';
let CalendarService = CalendarService_1 = class CalendarService {
    constructor(prisma, googleCalendar, outlookCalendar) {
        this.prisma = prisma;
        this.googleCalendar = googleCalendar;
        this.outlookCalendar = outlookCalendar;
        this.logger = new common_1.Logger(CalendarService_1.name);
    }
    async getGoogleConfig(tenantId) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: GOOGLE_CALENDAR_CONFIG_KEY } },
        });
        return setting?.value;
    }
    async getOutlookConfig(tenantId) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: OUTLOOK_CALENDAR_CONFIG_KEY } },
        });
        return setting?.value;
    }
    async saveGoogleConfig(tenantId, config) {
        return this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: GOOGLE_CALENDAR_CONFIG_KEY } },
            update: { value: config, category: 'INTEGRATION' },
            create: { tenantId, key: GOOGLE_CALENDAR_CONFIG_KEY, value: config, category: 'INTEGRATION', isPublic: false },
        });
    }
    async saveOutlookConfig(tenantId, config) {
        return this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: OUTLOOK_CALENDAR_CONFIG_KEY } },
            update: { value: config, category: 'INTEGRATION' },
            create: { tenantId, key: OUTLOOK_CALENDAR_CONFIG_KEY, value: config, category: 'INTEGRATION', isPublic: false },
        });
    }
    async getCalendarSettings(tenantId) {
        const googleConfig = await this.getGoogleConfig(tenantId);
        const outlookConfig = await this.getOutlookConfig(tenantId);
        return {
            google: googleConfig ? { clientId: googleConfig.clientId, isConfigured: !!googleConfig.clientId } : null,
            outlook: outlookConfig ? { clientId: outlookConfig.clientId, isConfigured: !!outlookConfig.clientId } : null,
        };
    }
    async getAuthUrl(provider, userId, tenantId) {
        const state = Buffer.from(JSON.stringify({ userId, provider, tenantId })).toString('base64');
        if (provider === 'GOOGLE') {
            const config = await this.getGoogleConfig(tenantId);
            if (!config?.clientId)
                throw new common_1.BadRequestException('Google Calendar not configured. Please add credentials in Settings.');
            return this.googleCalendar.getAuthUrl(config, state);
        }
        else if (provider === 'OUTLOOK') {
            const config = await this.getOutlookConfig(tenantId);
            if (!config?.clientId)
                throw new common_1.BadRequestException('Outlook Calendar not configured. Please add credentials in Settings.');
            return this.outlookCalendar.getAuthUrl(config, state);
        }
        throw new common_1.BadRequestException('Unsupported calendar provider');
    }
    async connectCalendar(userId, tenantId, dto) {
        const { provider, code, redirectUri } = dto;
        let tokens;
        let email;
        let calendarId;
        try {
            if (provider === 'GOOGLE') {
                const config = await this.getGoogleConfig(tenantId);
                if (!config?.clientId)
                    throw new common_1.BadRequestException('Google Calendar not configured');
                tokens = await this.googleCalendar.exchangeCodeForTokens(config, code, redirectUri);
                email = await this.googleCalendar.getUserEmail(tokens.access_token);
                calendarId = await this.googleCalendar.getPrimaryCalendarId(tokens.access_token);
            }
            else if (provider === 'OUTLOOK') {
                const config = await this.getOutlookConfig(tenantId);
                if (!config?.clientId)
                    throw new common_1.BadRequestException('Outlook Calendar not configured');
                tokens = await this.outlookCalendar.exchangeCodeForTokens(config, code, redirectUri);
                email = await this.outlookCalendar.getUserEmail(tokens.access_token);
            }
            else {
                throw new common_1.BadRequestException('Unsupported calendar provider');
            }
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
        }
        catch (error) {
            this.logger.error('Failed to connect calendar:', error);
            throw new common_1.BadRequestException(`Failed to connect calendar: ${error.message}`);
        }
    }
    async getConnections(userId) {
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
    async disconnectCalendar(userId, connectionId) {
        const connection = await this.prisma.calendarConnection.findFirst({
            where: { id: connectionId, userId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Calendar connection not found');
        }
        await this.prisma.calendarConnection.delete({
            where: { id: connectionId },
        });
        return { success: true };
    }
    async getValidAccessToken(connection, tenantId) {
        if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
            return connection.accessToken;
        }
        if (!connection.refreshToken) {
            throw new common_1.BadRequestException('Calendar connection needs re-authorization');
        }
        let tokens;
        if (connection.provider === 'GOOGLE') {
            const config = await this.getGoogleConfig(tenantId);
            if (!config)
                throw new common_1.BadRequestException('Google Calendar not configured');
            tokens = await this.googleCalendar.refreshAccessToken(config, connection.refreshToken);
        }
        else if (connection.provider === 'OUTLOOK') {
            const config = await this.getOutlookConfig(tenantId);
            if (!config)
                throw new common_1.BadRequestException('Outlook Calendar not configured');
            tokens = await this.outlookCalendar.refreshAccessToken(config, connection.refreshToken);
        }
        else {
            throw new common_1.BadRequestException('Unsupported provider');
        }
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
    async createEvent(userId, dto) {
        const connection = await this.prisma.calendarConnection.findFirst({
            where: {
                userId,
                isActive: true,
                ...(dto.provider && { provider: dto.provider }),
            },
        });
        if (!connection) {
            const event = await this.prisma.calendarEvent.create({
                data: {
                    provider: dto.provider || 'GOOGLE',
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
            let icsContent;
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
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const accessToken = await this.getValidAccessToken(connection, user.tenantId);
        let externalId;
        let meetingLink = dto.meetingLink;
        try {
            if (connection.provider === 'GOOGLE') {
                const googleEvent = await this.googleCalendar.createEvent(accessToken, {
                    summary: dto.title,
                    description: dto.description,
                    start: { dateTime: dto.startTime },
                    end: { dateTime: dto.endTime },
                    location: dto.location,
                    attendees: dto.attendees?.map(email => ({ email })),
                }, connection.calendarId || 'primary');
                externalId = googleEvent.id;
                meetingLink = meetingLink || googleEvent.hangoutLink;
            }
            else if (connection.provider === 'OUTLOOK') {
                const outlookEvent = await this.outlookCalendar.createEvent(accessToken, {
                    subject: dto.title,
                    body: dto.description ? { contentType: 'text', content: dto.description } : undefined,
                    start: { dateTime: dto.startTime, timeZone: 'UTC' },
                    end: { dateTime: dto.endTime, timeZone: 'UTC' },
                    location: dto.location ? { displayName: dto.location } : undefined,
                    attendees: dto.attendees?.map(email => ({
                        emailAddress: { address: email },
                        type: 'required',
                    })),
                    isOnlineMeeting: true,
                });
                externalId = outlookEvent.id;
                meetingLink = meetingLink || outlookEvent.onlineMeeting?.joinUrl;
            }
        }
        catch (error) {
            this.logger.error('Failed to create external calendar event:', error);
        }
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
        let icsContent;
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
    async updateEvent(userId, eventId, dto) {
        const event = await this.prisma.calendarEvent.findFirst({
            where: { id: eventId, userId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Calendar event not found');
        }
        if (event.externalId) {
            const connection = await this.prisma.calendarConnection.findFirst({
                where: { userId, provider: event.provider, isActive: true },
            });
            if (connection) {
                const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
                const accessToken = await this.getValidAccessToken(connection, user?.tenantId || '');
                try {
                    if (event.provider === 'GOOGLE') {
                        await this.googleCalendar.updateEvent(accessToken, event.externalId, {
                            summary: dto.title,
                            description: dto.description,
                            start: dto.startTime ? { dateTime: dto.startTime } : undefined,
                            end: dto.endTime ? { dateTime: dto.endTime } : undefined,
                            location: dto.location,
                            attendees: dto.attendees?.map(email => ({ email })),
                        }, connection.calendarId || 'primary');
                    }
                    else if (event.provider === 'OUTLOOK') {
                        await this.outlookCalendar.updateEvent(accessToken, event.externalId, {
                            subject: dto.title,
                            body: dto.description ? { contentType: 'text', content: dto.description } : undefined,
                            start: dto.startTime ? { dateTime: dto.startTime, timeZone: 'UTC' } : undefined,
                            end: dto.endTime ? { dateTime: dto.endTime, timeZone: 'UTC' } : undefined,
                            location: dto.location ? { displayName: dto.location } : undefined,
                            attendees: dto.attendees?.map(email => ({
                                emailAddress: { address: email },
                                type: 'required',
                            })),
                        });
                    }
                }
                catch (error) {
                    this.logger.error('Failed to update external calendar event:', error);
                }
            }
        }
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
    async deleteEvent(userId, eventId) {
        const event = await this.prisma.calendarEvent.findFirst({
            where: { id: eventId, userId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Calendar event not found');
        }
        if (event.externalId) {
            const connection = await this.prisma.calendarConnection.findFirst({
                where: { userId, provider: event.provider, isActive: true },
            });
            if (connection) {
                const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
                const accessToken = await this.getValidAccessToken(connection, user?.tenantId || '');
                try {
                    if (event.provider === 'GOOGLE') {
                        await this.googleCalendar.deleteEvent(accessToken, event.externalId, connection.calendarId || 'primary');
                    }
                    else if (event.provider === 'OUTLOOK') {
                        await this.outlookCalendar.deleteEvent(accessToken, event.externalId);
                    }
                }
                catch (error) {
                    this.logger.error('Failed to delete external calendar event:', error);
                }
            }
        }
        await this.prisma.calendarEvent.delete({
            where: { id: eventId },
        });
        return { success: true };
    }
    async getFreeBusy(userId, tenantId, dto) {
        const { userIds, startTime, endTime, durationMinutes = 30 } = dto;
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
        const results = [];
        for (const user of users) {
            const availability = {
                userId: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                connected: user.calendarConnections.length > 0,
                slots: [],
            };
            if (user.calendarConnections.length > 0) {
                const connection = user.calendarConnections[0];
                try {
                    const accessToken = await this.getValidAccessToken(connection, tenantId);
                    if (connection.provider === 'GOOGLE') {
                        const freeBusy = await this.googleCalendar.getFreeBusy(accessToken, [connection.email || user.email], startTime, endTime);
                        const busySlots = Object.values(freeBusy.calendars)[0]?.busy || [];
                        availability.slots = this.generateAvailabilitySlots(startTime, endTime, busySlots, durationMinutes);
                    }
                    else if (connection.provider === 'OUTLOOK') {
                        const freeBusy = await this.outlookCalendar.getFreeBusy(accessToken, [connection.email || user.email], startTime, endTime);
                        const busySlots = freeBusy.value[0]?.scheduleItems
                            ?.filter(item => item.status !== 'free')
                            .map(item => ({
                            start: item.start.dateTime,
                            end: item.end.dateTime,
                        })) || [];
                        availability.slots = this.generateAvailabilitySlots(startTime, endTime, busySlots, durationMinutes);
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to get free/busy for user ${user.id}:`, error);
                }
            }
            else {
                availability.slots = this.generateAvailabilitySlots(startTime, endTime, [], durationMinutes);
            }
            results.push(availability);
        }
        return results;
    }
    generateAvailabilitySlots(startTime, endTime, busySlots, durationMinutes) {
        const slots = [];
        const start = new Date(startTime);
        const end = new Date(endTime);
        let current = new Date(start);
        while (current < end) {
            const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);
            if (slotEnd > end)
                break;
            const isBusy = busySlots.some(busy => {
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
    async findCommonAvailability(userId, tenantId, dto) {
        const userAvailabilities = await this.getFreeBusy(userId, tenantId, dto);
        if (userAvailabilities.length === 0)
            return [];
        let commonSlots = userAvailabilities[0].slots.filter(s => s.available);
        for (let i = 1; i < userAvailabilities.length; i++) {
            const userSlots = userAvailabilities[i].slots.filter(s => s.available);
            commonSlots = commonSlots.filter(common => userSlots.some(slot => slot.start === common.start && slot.end === common.end));
        }
        return commonSlots;
    }
    generateIcs(event) {
        return this.googleCalendar.generateIcs(event);
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        google_calendar_service_1.GoogleCalendarService,
        outlook_calendar_service_1.OutlookCalendarService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map