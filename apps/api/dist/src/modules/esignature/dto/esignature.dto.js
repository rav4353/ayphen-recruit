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
exports.EmbeddedSigningResponse = exports.ESignatureStatusResponse = exports.WebhookEventDto = exports.SendForSignatureDto = exports.ConnectESignatureDto = exports.ConfigureESignatureDto = exports.SignerDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SignerDto {
}
exports.SignerDto = SignerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignerDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SignerDto.prototype, "order", void 0);
class ConfigureESignatureDto {
}
exports.ConfigureESignatureDto = ConfigureESignatureDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['DOCUSIGN', 'ADOBE_SIGN', 'ZOHO_SIGN'], default: 'DOCUSIGN' }),
    (0, class_validator_1.IsEnum)(['DOCUSIGN', 'ADOBE_SIGN', 'ZOHO_SIGN']),
    __metadata("design:type", String)
], ConfigureESignatureDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OAuth Client ID / Integration Key' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureESignatureDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OAuth Client Secret' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureESignatureDto.prototype, "clientSecret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'DocuSign Account ID (for production)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureESignatureDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base URL (e.g., https://demo.docusign.net for sandbox)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureESignatureDto.prototype, "baseUrl", void 0);
class ConnectESignatureDto {
}
exports.ConnectESignatureDto = ConnectESignatureDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OAuth authorization code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectESignatureDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Redirect URI used in OAuth flow' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectESignatureDto.prototype, "redirectUri", void 0);
class SendForSignatureDto {
}
exports.SendForSignatureDto = SendForSignatureDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Offer ID to send for signature' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendForSignatureDto.prototype, "offerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SignerDto], description: 'List of signers' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SignerDto),
    __metadata("design:type", Array)
], SendForSignatureDto.prototype, "signers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email subject line' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendForSignatureDto.prototype, "emailSubject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email body message' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendForSignatureDto.prototype, "emailMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Days until expiration', default: 7 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SendForSignatureDto.prototype, "expirationDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Send reminder emails', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendForSignatureDto.prototype, "sendReminders", void 0);
class WebhookEventDto {
}
exports.WebhookEventDto = WebhookEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WebhookEventDto.prototype, "event", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], WebhookEventDto.prototype, "envelopeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], WebhookEventDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], WebhookEventDto.prototype, "data", void 0);
class ESignatureStatusResponse {
}
exports.ESignatureStatusResponse = ESignatureStatusResponse;
class EmbeddedSigningResponse {
}
exports.EmbeddedSigningResponse = EmbeddedSigningResponse;
//# sourceMappingURL=esignature.dto.js.map