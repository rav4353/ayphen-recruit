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
exports.ESignatureController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const esignature_service_1 = require("./esignature.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const esignature_dto_1 = require("./dto/esignature.dto");
let ESignatureController = class ESignatureController {
    constructor(esignatureService) {
        this.esignatureService = esignatureService;
    }
    async getAuthUrl(req) {
        const tenantId = req.user.tenantId;
        const url = await this.esignatureService.getAuthUrl(tenantId);
        return api_response_dto_1.ApiResponse.success({ url }, 'Authorization URL generated');
    }
    async configure(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.configureSettings(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'E-signature configured');
    }
    async connect(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.connect(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'E-signature connected');
    }
    async getSettings(req) {
        const tenantId = req.user.tenantId;
        const settings = await this.esignatureService.getSettings(tenantId);
        return api_response_dto_1.ApiResponse.success(settings, 'Settings retrieved');
    }
    async sendForSignature(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.sendForSignature(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'Offer sent for signature');
    }
    async getEnvelopeStatus(envelopeId, req) {
        const tenantId = req.user.tenantId;
        const status = await this.esignatureService.getEnvelopeStatus(tenantId, envelopeId);
        return api_response_dto_1.ApiResponse.success(status, 'Envelope status retrieved');
    }
    async getEmbeddedSigningUrl(envelopeId, returnUrl, req) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.getEmbeddedSigningUrl(tenantId, envelopeId, returnUrl);
        return api_response_dto_1.ApiResponse.success(result, 'Embedded signing URL generated');
    }
    async voidEnvelope(envelopeId, reason, req) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.voidEnvelope(tenantId, envelopeId, reason);
        return api_response_dto_1.ApiResponse.success(result, 'Envelope voided');
    }
    async handleWebhook(payload, signature) {
        await this.esignatureService.handleWebhook(payload);
        return { success: true };
    }
};
exports.ESignatureController = ESignatureController;
__decorate([
    (0, common_1.Get)('auth-url'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get OAuth URL for e-signature provider' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Post)('configure'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Configure e-signature provider settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [esignature_dto_1.ConfigureESignatureDto, Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "configure", null);
__decorate([
    (0, common_1.Post)('connect'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Connect to e-signature provider using OAuth code' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [esignature_dto_1.ConnectESignatureDto, Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get e-signature settings' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Send an offer for e-signature' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [esignature_dto_1.SendForSignatureDto, Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "sendForSignature", null);
__decorate([
    (0, common_1.Get)('envelopes/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get envelope status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "getEnvelopeStatus", null);
__decorate([
    (0, common_1.Post)('envelopes/:id/embedded-signing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get embedded signing URL' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('returnUrl')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "getEmbeddedSigningUrl", null);
__decorate([
    (0, common_1.Put)('envelopes/:id/void'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Void an envelope' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "voidEnvelope", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'DocuSign webhook endpoint' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-docusign-signature-1')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ESignatureController.prototype, "handleWebhook", null);
exports.ESignatureController = ESignatureController = __decorate([
    (0, swagger_1.ApiTags)('esignature'),
    (0, common_1.Controller)('esignature'),
    __metadata("design:paramtypes", [esignature_service_1.ESignatureService])
], ESignatureController);
//# sourceMappingURL=esignature.controller.js.map