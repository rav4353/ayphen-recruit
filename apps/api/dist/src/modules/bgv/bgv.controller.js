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
exports.BGVController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const bgv_service_1 = require("./bgv.service");
const class_validator_1 = require("class-validator");
class ConfigureBGVDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(['CHECKR', 'SPRINGVERIFY', 'AUTHBRIDGE', 'MANUAL']),
    __metadata("design:type", String)
], ConfigureBGVDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureBGVDto.prototype, "apiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureBGVDto.prototype, "apiSecret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureBGVDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigureBGVDto.prototype, "sandboxMode", void 0);
class InitiateBGVDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateBGVDto.prototype, "candidateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateBGVDto.prototype, "applicationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateBGVDto.prototype, "packageType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InitiateBGVDto.prototype, "checkTypes", void 0);
let BGVController = class BGVController {
    constructor(bgvService) {
        this.bgvService = bgvService;
    }
    async getSettings(req) {
        const tenantId = req.user.tenantId;
        const settings = await this.bgvService.getSettings(tenantId);
        return api_response_dto_1.ApiResponse.success(settings, 'BGV settings retrieved');
    }
    async configure(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.bgvService.configure(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'BGV provider configured successfully');
    }
    async initiate(dto, req) {
        const tenantId = req.user.tenantId;
        const userId = req.user.sub || req.user.id;
        const result = await this.bgvService.initiate(tenantId, userId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'Background check initiated');
    }
    async listChecks(req, status, candidateId) {
        const tenantId = req.user.tenantId;
        const checks = await this.bgvService.listChecks(tenantId, { status: status, candidateId });
        return api_response_dto_1.ApiResponse.success(checks, 'BGV checks retrieved');
    }
    async getCheck(id, req) {
        const tenantId = req.user.tenantId;
        const check = await this.bgvService.getCheck(tenantId, id);
        return api_response_dto_1.ApiResponse.success(check, 'BGV check retrieved');
    }
    async syncStatus(id, req) {
        const tenantId = req.user.tenantId;
        const check = await this.bgvService.syncStatus(tenantId, id);
        return api_response_dto_1.ApiResponse.success(check, 'BGV check synced');
    }
    async cancel(id, req) {
        const tenantId = req.user.tenantId;
        const result = await this.bgvService.cancel(tenantId, id);
        return api_response_dto_1.ApiResponse.success(result, 'BGV check cancelled');
    }
    async getPackages(req) {
        const tenantId = req.user.tenantId;
        const packages = await this.bgvService.getPackages(tenantId);
        return api_response_dto_1.ApiResponse.success(packages, 'BGV packages retrieved');
    }
    async getDashboard(req) {
        const tenantId = req.user.tenantId;
        const stats = await this.bgvService.getDashboard(tenantId);
        return api_response_dto_1.ApiResponse.success(stats, 'BGV dashboard stats retrieved');
    }
    async handleWebhook(provider, payload) {
        const result = await this.bgvService.handleWebhook(provider, payload);
        return result;
    }
};
exports.BGVController = BGVController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get BGV provider settings' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('configure'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Configure BGV provider' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConfigureBGVDto, Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "configure", null);
__decorate([
    (0, common_1.Post)('initiate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate a background check' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [InitiateBGVDto, Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "initiate", null);
__decorate([
    (0, common_1.Get)('checks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List all BGV checks' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'candidateId', required: false }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "listChecks", null);
__decorate([
    (0, common_1.Get)('checks/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific BGV check' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "getCheck", null);
__decorate([
    (0, common_1.Post)('checks/:id/sync'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Sync BGV check status with provider' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "syncStatus", null);
__decorate([
    (0, common_1.Post)('checks/:id/cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a BGV check' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('packages'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get available BGV packages' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "getPackages", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get BGV dashboard stats' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('webhook/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle BGV provider webhook' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BGVController.prototype, "handleWebhook", null);
exports.BGVController = BGVController = __decorate([
    (0, swagger_1.ApiTags)('bgv'),
    (0, common_1.Controller)('bgv'),
    __metadata("design:paramtypes", [bgv_service_1.BGVService])
], BGVController);
//# sourceMappingURL=bgv.controller.js.map