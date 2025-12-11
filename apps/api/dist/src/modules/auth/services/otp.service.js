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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../../prisma/prisma.service");
const email_service_1 = require("../../../common/services/email.service");
const otp_dto_1 = require("../dto/otp.dto");
let OtpService = class OtpService {
    constructor(prisma, configService, jwtService, emailService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.OTP_EXPIRY_MINUTES = 10;
        this.MAX_OTP_ATTEMPTS = 5;
        this.OTP_LENGTH = 6;
    }
    async requestOtp(dto) {
        const type = dto.type || otp_dto_1.OtpType.LOGIN;
        let tenantId = dto.tenantId;
        if (!tenantId) {
            const user = await this.prisma.user.findFirst({
                where: { email: dto.email },
            });
            if (user) {
                tenantId = user.tenantId;
            }
            else {
                throw new common_1.BadRequestException('User not found');
            }
        }
        const code = this.generateOtp();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);
        await this.prisma.otpCode.updateMany({
            where: {
                email: dto.email,
                tenantId,
                type,
                usedAt: null,
            },
            data: { usedAt: new Date() },
        });
        await this.prisma.otpCode.create({
            data: {
                code,
                email: dto.email,
                tenantId,
                type,
                expiresAt,
            },
        });
        this.emailService
            .sendOtpEmail(dto.email, code)
            .catch((err) => {
            console.error('Failed to send OTP email', err);
        });
        const isDev = this.configService.get('NODE_ENV') !== 'production';
        return {
            message: 'OTP sent to your email',
            ...(isDev && { code }),
        };
    }
    async verifyOtp(dto) {
        const type = dto.type || otp_dto_1.OtpType.LOGIN;
        let tenantId = dto.tenantId;
        let otpRecord;
        if (tenantId) {
            otpRecord = await this.prisma.otpCode.findFirst({
                where: {
                    email: dto.email,
                    tenantId,
                    type,
                    usedAt: null,
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            otpRecord = await this.prisma.otpCode.findFirst({
                where: {
                    email: dto.email,
                    code: dto.code,
                    type,
                    usedAt: null,
                },
                orderBy: { createdAt: 'desc' },
            });
            if (otpRecord) {
                tenantId = otpRecord.tenantId;
            }
        }
        if (!otpRecord) {
            throw new common_1.BadRequestException('No valid OTP found. Please request a new one.');
        }
        if (otpRecord.expiresAt < new Date()) {
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        }
        if (otpRecord.attempts >= this.MAX_OTP_ATTEMPTS) {
            await this.prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: { usedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('Too many failed attempts. Please request a new OTP.');
        }
        if (otpRecord.code !== dto.code) {
            await this.prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: { attempts: otpRecord.attempts + 1 },
            });
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        await this.prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { usedAt: new Date() },
        });
        if (type === otp_dto_1.OtpType.LOGIN) {
            let user = await this.prisma.user.findFirst({
                where: { email: dto.email, tenantId },
            });
            if (!user) {
                if (!tenantId)
                    throw new common_1.BadRequestException('Tenant ID missing');
                const tenantExists = await this.prisma.tenant.findUnique({
                    where: { id: tenantId },
                });
                if (!tenantExists) {
                    let domain = dto.email.split('@')[1].toLowerCase();
                    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];
                    if (publicDomains.includes(domain)) {
                        domain = `${domain}-${(0, uuid_1.v4)()}`;
                    }
                    const newTenant = await this.prisma.tenant.create({
                        data: {
                            name: 'New Organization',
                            domain: domain,
                        },
                    });
                    tenantId = newTenant.id;
                }
                user = await this.prisma.user.create({
                    data: {
                        email: dto.email,
                        firstName: dto.email.split('@')[0],
                        lastName: '',
                        role: 'CANDIDATE',
                        status: 'ACTIVE',
                        tenantId,
                    },
                });
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            return this.generateTokens(user);
        }
        if (type === otp_dto_1.OtpType.EMAIL_VERIFY) {
            const user = await this.prisma.user.findFirst({
                where: { email: dto.email, tenantId },
            });
            if (user && user.status !== 'ACTIVE') {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { status: 'ACTIVE' },
                });
            }
        }
        return { verified: true };
    }
    generateOtp() {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < this.OTP_LENGTH; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = (0, uuid_1.v4)();
        const refreshExpiration = new Date();
        refreshExpiration.setDate(refreshExpiration.getDate() + 30);
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: refreshExpiration,
            },
        });
        return { accessToken, refreshToken };
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], OtpService);
//# sourceMappingURL=otp.service.js.map