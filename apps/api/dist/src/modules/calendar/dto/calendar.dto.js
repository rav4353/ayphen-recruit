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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvailability = exports.AvailabilitySlot = exports.FreeBusyQueryDto = exports.UpdateCalendarEventDto = exports.CreateCalendarEventDto = exports.ConnectCalendarDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ConnectCalendarDto {
}
exports.ConnectCalendarDto = ConnectCalendarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['GOOGLE', 'OUTLOOK'] }),
    (0, class_validator_1.IsEnum)(['GOOGLE', 'OUTLOOK']),
    __metadata("design:type", String)
], ConnectCalendarDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OAuth authorization code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectCalendarDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Redirect URI used in OAuth flow' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectCalendarDto.prototype, "redirectUri", void 0);
class CreateCalendarEventDto {
}
exports.CreateCalendarEventDto = CreateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Video meeting link (Zoom, Meet, Teams)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "meetingLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'List of attendee emails' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCalendarEventDto.prototype, "attendees", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Interview ID to link this event to' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "interviewId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['GOOGLE', 'OUTLOOK'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['GOOGLE', 'OUTLOOK']),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Generate ICS file' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCalendarEventDto.prototype, "generateIcs", void 0);
class UpdateCalendarEventDto {
}
exports.UpdateCalendarEventDto = UpdateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCalendarEventDto.prototype, "meetingLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateCalendarEventDto.prototype, "attendees", void 0);
class FreeBusyQueryDto {
}
exports.FreeBusyQueryDto = FreeBusyQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'User IDs to check availability for' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FreeBusyQueryDto.prototype, "userIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FreeBusyQueryDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FreeBusyQueryDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Duration in minutes for each slot' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FreeBusyQueryDto.prototype, "durationMinutes", void 0);
class AvailabilitySlot {
}
exports.AvailabilitySlot = AvailabilitySlot;
class UserAvailability {
}
exports.UserAvailability = UserAvailability;
//# sourceMappingURL=calendar.dto.js.map