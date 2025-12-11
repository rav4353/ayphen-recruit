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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const calendar_service_1 = require("./calendar.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const calendar_dto_1 = require("./dto/calendar.dto");
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async getSettings(req) {
        const tenantId = req.user.tenantId;
        const settings = await this.calendarService.getCalendarSettings(tenantId);
        return api_response_dto_1.ApiResponse.success(settings, 'Calendar settings retrieved');
    }
    async saveGoogleConfig(dto, req) {
        const tenantId = req.user.tenantId;
        await this.calendarService.saveGoogleConfig(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(null, 'Google Calendar credentials saved');
    }
    async saveOutlookConfig(dto, req) {
        const tenantId = req.user.tenantId;
        await this.calendarService.saveOutlookConfig(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(null, 'Outlook Calendar credentials saved');
    }
    async getAuthUrl(provider, req) {
        const userId = req.user.sub || req.user.id;
        const tenantId = req.user.tenantId;
        const url = await this.calendarService.getAuthUrl(provider, userId, tenantId);
        return api_response_dto_1.ApiResponse.success({ url }, 'Authorization URL generated');
    }
    async connectCalendar(dto, req) {
        const userId = req.user.sub || req.user.id;
        const tenantId = req.user.tenantId;
        const result = await this.calendarService.connectCalendar(userId, tenantId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'Calendar connected successfully');
    }
    async getConnections(req) {
        const userId = req.user.sub || req.user.id;
        const connections = await this.calendarService.getConnections(userId);
        return api_response_dto_1.ApiResponse.success(connections, 'Calendar connections retrieved');
    }
    async disconnectCalendar(connectionId, req) {
        const userId = req.user.sub || req.user.id;
        await this.calendarService.disconnectCalendar(userId, connectionId);
        return api_response_dto_1.ApiResponse.success(null, 'Calendar disconnected successfully');
    }
    async createEvent(dto, req) {
        const userId = req.user.sub || req.user.id;
        const result = await this.calendarService.createEvent(userId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'Calendar event created');
    }
    async updateEvent(eventId, dto, req) {
        const userId = req.user.sub || req.user.id;
        const event = await this.calendarService.updateEvent(userId, eventId, dto);
        return api_response_dto_1.ApiResponse.success(event, 'Calendar event updated');
    }
    async deleteEvent(eventId, req) {
        const userId = req.user.sub || req.user.id;
        await this.calendarService.deleteEvent(userId, eventId);
        return api_response_dto_1.ApiResponse.success(null, 'Calendar event deleted');
    }
    async getFreeBusy(dto, req) {
        const userId = req.user.sub || req.user.id;
        const tenantId = req.user.tenantId;
        const availability = await this.calendarService.getFreeBusy(userId, tenantId, dto);
        return api_response_dto_1.ApiResponse.success(availability, 'Free/busy information retrieved');
    }
    async findCommonAvailability(dto, req) {
        const userId = req.user.sub || req.user.id;
        const tenantId = req.user.tenantId;
        const slots = await this.calendarService.findCommonAvailability(userId, tenantId, dto);
        return api_response_dto_1.ApiResponse.success(slots, 'Common availability slots found');
    }
    async generateIcs(dto) {
        const icsContent = this.calendarService.generateIcs({
            title: dto.title,
            description: dto.description,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            location: dto.location,
            attendees: dto.attendees,
        });
        return api_response_dto_1.ApiResponse.success({ icsContent }, 'ICS content generated');
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar provider settings for tenant' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings/google'),
    (0, swagger_1.ApiOperation)({ summary: 'Save Google Calendar OAuth credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "saveGoogleConfig", null);
__decorate([
    (0, common_1.Post)('settings/outlook'),
    (0, swagger_1.ApiOperation)({ summary: 'Save Outlook Calendar OAuth credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "saveOutlookConfig", null);
__decorate([
    (0, common_1.Get)('auth-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get OAuth authorization URL for a calendar provider' }),
    (0, swagger_1.ApiQuery)({ name: 'provider', enum: ['GOOGLE', 'OUTLOOK'] }),
    __param(0, (0, common_1.Query)('provider')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Post)('connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Connect a calendar using OAuth code' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calendar_dto_1.ConnectCalendarDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "connectCalendar", null);
__decorate([
    (0, common_1.Get)('connections'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user\'s calendar connections' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Delete)('connections/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect a calendar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "disconnectCalendar", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a calendar event' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calendar_dto_1.CreateCalendarEventDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Put)('events/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a calendar event' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, calendar_dto_1.UpdateCalendarEventDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Delete)('events/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a calendar event' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.Post)('free-busy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get free/busy availability for users' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calendar_dto_1.FreeBusyQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getFreeBusy", null);
__decorate([
    (0, common_1.Post)('common-availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Find common available slots across multiple users' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calendar_dto_1.FreeBusyQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "findCommonAvailability", null);
__decorate([
    (0, common_1.Post)('generate-ics'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate ICS file content for an event' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calendar_dto_1.CreateCalendarEventDto]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "generateIcs", null);
exports.CalendarController = CalendarController = __decorate([
    (0, swagger_1.ApiTags)('calendar'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('calendar'),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map