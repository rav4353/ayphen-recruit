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
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const sms_service_1 = require("../../common/services/sms.service");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ConfigureSmsDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(['TWILIO', 'MSG91', 'TEXTLOCAL']),
    __metadata("design:type", String)
], ConfigureSmsDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureSmsDto.prototype, "accountSid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureSmsDto.prototype, "authToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureSmsDto.prototype, "fromNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureSmsDto.prototype, "webhookUrl", void 0);
class SendSmsDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "candidateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "mediaUrl", void 0);
class BulkSmsRecipient {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkSmsRecipient.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkSmsRecipient.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkSmsRecipient.prototype, "candidateId", void 0);
class SendBulkSmsDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkSmsRecipient),
    __metadata("design:type", Array)
], SendBulkSmsDto.prototype, "recipients", void 0);
class SaveTemplateDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveTemplateDto.prototype, "content", void 0);
let SmsController = class SmsController {
    constructor(smsService) {
        this.smsService = smsService;
    }
    async getSettings(req) {
        const tenantId = req.user.tenantId;
        const settings = await this.smsService.getSettings(tenantId);
        return api_response_dto_1.ApiResponse.success(settings, 'SMS settings retrieved');
    }
    async configure(dto, req) {
        const tenantId = req.user.tenantId;
        await this.smsService.saveConfig(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(null, 'SMS provider configured successfully');
    }
    async sendSms(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.smsService.sendSms({
            tenantId,
            to: dto.to,
            body: dto.body,
            candidateId: dto.candidateId,
            mediaUrl: dto.mediaUrl,
        });
        if (result.success) {
            return api_response_dto_1.ApiResponse.success({ messageId: result.messageId }, 'SMS sent successfully');
        }
        else {
            return api_response_dto_1.ApiResponse.error(result.error || 'Failed to send SMS');
        }
    }
    async sendBulkSms(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.smsService.sendBulkSms(tenantId, dto.recipients);
        return api_response_dto_1.ApiResponse.success(result, `Sent ${result.sent}/${result.total} SMS messages`);
    }
    async getTemplates(req) {
        const tenantId = req.user.tenantId;
        const templates = await this.smsService.getTemplates(tenantId);
        return api_response_dto_1.ApiResponse.success(templates, 'SMS templates retrieved');
    }
    async saveTemplate(dto, req) {
        const tenantId = req.user.tenantId;
        await this.smsService.saveTemplate(tenantId, dto.name, dto.content);
        return api_response_dto_1.ApiResponse.success(null, 'SMS template saved');
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SMS provider settings' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('configure'),
    (0, swagger_1.ApiOperation)({ summary: 'Configure SMS provider' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConfigureSmsDto, Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "configure", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send SMS to a single recipient' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendSmsDto, Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "sendSms", null);
__decorate([
    (0, common_1.Post)('send-bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Send SMS to multiple recipients' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendBulkSmsDto, Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "sendBulkSms", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SMS templates' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Save SMS template' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SaveTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "saveTemplate", null);
exports.SmsController = SmsController = __decorate([
    (0, swagger_1.ApiTags)('sms'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('sms'),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
//# sourceMappingURL=sms.controller.js.map