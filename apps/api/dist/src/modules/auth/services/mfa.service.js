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
exports.MfaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma_service_1 = require("../../../prisma/prisma.service");
let MfaService = class MfaService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.TOTP_STEP = 30;
        this.TOTP_DIGITS = 6;
        this.TOTP_WINDOW = 1;
    }
    async initiateMfaSetup(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.mfaEnabled) {
            throw new common_1.BadRequestException('MFA is already enabled');
        }
        const secret = this.generateSecret();
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret },
        });
        const issuer = 'TalentX';
        const otpauthUrl = `otpauth://totp/${issuer}:${user.email}?secret=${secret}&issuer=${issuer}&digits=${this.TOTP_DIGITS}&period=${this.TOTP_STEP}`;
        const qrCode = await this.generateQrCode(otpauthUrl);
        return {
            otpauthUrl,
            secret,
            qrCode,
        };
    }
    async confirmMfaSetup(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.mfaSecret) {
            throw new common_1.BadRequestException('MFA setup not initiated');
        }
        if (user.mfaEnabled) {
            throw new common_1.BadRequestException('MFA is already enabled');
        }
        const isValid = this.verifyTotp(user.mfaSecret, dto.code);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        const backupCodes = this.generateBackupCodes();
        const hashedBackupCodes = await Promise.all(backupCodes.map((code) => bcrypt.hash(code, 10)));
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                mfaEnabled: true,
            },
        });
        return {
            message: 'MFA enabled successfully',
            backupCodes,
        };
    }
    async verifyMfa(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            throw new common_1.BadRequestException('MFA is not enabled');
        }
        const isValid = this.verifyTotp(user.mfaSecret, dto.code);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        return true;
    }
    async disableMfa(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (!user.mfaEnabled) {
            throw new common_1.BadRequestException('MFA is not enabled');
        }
        if (!user.passwordHash) {
            throw new common_1.BadRequestException('Password not set');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid password');
        }
        if (!user.mfaSecret) {
            throw new common_1.BadRequestException('MFA secret not found');
        }
        const isCodeValid = this.verifyTotp(user.mfaSecret, dto.code);
        if (!isCodeValid) {
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                mfaEnabled: false,
                mfaSecret: null,
            },
        });
        return { message: 'MFA disabled successfully' };
    }
    async isMfaRequired(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { mfaEnabled: true, role: true },
        });
        if (!user) {
            return false;
        }
        if (user.role === 'VENDOR') {
            return true;
        }
        return user.mfaEnabled;
    }
    generateSecret() {
        const buffer = crypto.randomBytes(20);
        return this.base32Encode(buffer);
    }
    base32Encode(buffer) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';
        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;
            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }
        return output;
    }
    base32Decode(encoded) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const cleanedInput = encoded.replace(/=+$/, '').toUpperCase();
        let bits = 0;
        let value = 0;
        const output = [];
        for (let i = 0; i < cleanedInput.length; i++) {
            const idx = alphabet.indexOf(cleanedInput[i]);
            if (idx === -1)
                continue;
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                output.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        return Buffer.from(output);
    }
    verifyTotp(secret, code) {
        const now = Math.floor(Date.now() / 1000);
        for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
            const counter = Math.floor((now + i * this.TOTP_STEP) / this.TOTP_STEP);
            const expectedCode = this.generateTotp(secret, counter);
            if (expectedCode === code) {
                return true;
            }
        }
        return false;
    }
    generateTotp(secret, counter) {
        const secretBuffer = this.base32Decode(secret);
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigInt64BE(BigInt(counter));
        const hmac = crypto.createHmac('sha1', secretBuffer);
        hmac.update(counterBuffer);
        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0xf;
        const binary = ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);
        const otp = binary % Math.pow(10, this.TOTP_DIGITS);
        return otp.toString().padStart(this.TOTP_DIGITS, '0');
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
        }
        return codes;
    }
    async generateQrCode(data) {
        return `data:text/plain;base64,${Buffer.from(data).toString('base64')}`;
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map