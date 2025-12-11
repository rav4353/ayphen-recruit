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
exports.MfaSetupResponse = exports.DisableMfaDto = exports.VerifyMfaDto = exports.SetupMfaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SetupMfaDto {
}
exports.SetupMfaDto = SetupMfaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6, { message: 'Code must be exactly 6 digits' }),
    __metadata("design:type", String)
], SetupMfaDto.prototype, "code", void 0);
class VerifyMfaDto {
}
exports.VerifyMfaDto = VerifyMfaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6, { message: 'Code must be exactly 6 digits' }),
    __metadata("design:type", String)
], VerifyMfaDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VerifyMfaDto.prototype, "rememberDevice", void 0);
class DisableMfaDto {
}
exports.DisableMfaDto = DisableMfaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6, { message: 'Code must be exactly 6 digits' }),
    __metadata("design:type", String)
], DisableMfaDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CurrentPass123!' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisableMfaDto.prototype, "password", void 0);
class MfaSetupResponse {
}
exports.MfaSetupResponse = MfaSetupResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'otpauth://totp/TalentX:user@example.com?secret=...' }),
    __metadata("design:type", String)
], MfaSetupResponse.prototype, "otpauthUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'JBSWY3DPEHPK3PXP' }),
    __metadata("design:type", String)
], MfaSetupResponse.prototype, "secret", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'data:image/png;base64,...' }),
    __metadata("design:type", String)
], MfaSetupResponse.prototype, "qrCode", void 0);
//# sourceMappingURL=mfa.dto.js.map