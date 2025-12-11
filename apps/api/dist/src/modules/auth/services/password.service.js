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
exports.PasswordService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../../prisma/prisma.service");
const users_service_1 = require("../../users/users.service");
const email_service_1 = require("../../../common/services/email.service");
let PasswordService = class PasswordService {
    constructor(prisma, usersService, configService, emailService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.configService = configService;
        this.emailService = emailService;
        this.PASSWORD_HISTORY_COUNT = 3;
        this.RESET_TOKEN_EXPIRY_HOURS = 1;
    }
    async requestPasswordReset(dto) {
        let user;
        if (dto.tenantId) {
            user = await this.usersService.findByEmail(dto.email, dto.tenantId);
        }
        else {
            const users = await this.prisma.user.findMany({
                where: { email: dto.email },
            });
            if (users.length > 0) {
                user = users[0];
            }
        }
        if (!user) {
            return { message: 'If an account exists, a password reset link has been sent' };
        }
        await this.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);
        await this.prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });
        const resetLink = `${this.configService.get('WEB_URL') || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
        this.emailService
            .sendPasswordResetEmail(user.email, resetLink)
            .catch((err) => {
            console.error('Failed to send password reset email', err);
        });
        return { message: 'If an account exists, a password reset link has been sent' };
    }
    async resetPassword(dto) {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token: dto.token },
            include: { user: true },
        });
        if (!resetToken) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        if (resetToken.usedAt) {
            throw new common_1.BadRequestException('This reset link has already been used');
        }
        if (resetToken.expiresAt < new Date()) {
            throw new common_1.BadRequestException('This reset link has expired');
        }
        const isReused = await this.isPasswordReused(resetToken.userId, dto.newPassword);
        if (isReused) {
            throw new common_1.BadRequestException(`New password cannot be the same as your last ${this.PASSWORD_HISTORY_COUNT} passwords`);
        }
        const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || 12;
        const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            }),
            this.prisma.passwordHistory.create({
                data: {
                    userId: resetToken.userId,
                    passwordHash,
                },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.refreshToken.deleteMany({
                where: { userId: resetToken.userId },
            }),
            this.prisma.userSession.deleteMany({
                where: { userId: resetToken.userId },
            }),
        ]);
        return { message: 'Password has been reset successfully' };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const isReused = await this.isPasswordReused(userId, dto.newPassword);
        if (isReused) {
            throw new common_1.BadRequestException(`New password cannot be the same as your last ${this.PASSWORD_HISTORY_COUNT} passwords`);
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash,
                    requirePasswordChange: false,
                    tempPasswordExpiresAt: null,
                },
            }),
            this.prisma.passwordHistory.create({
                data: {
                    userId,
                    passwordHash,
                },
            }),
            this.prisma.refreshToken.deleteMany({
                where: { userId },
            }),
        ]);
        return { message: 'Password changed successfully' };
    }
    async isPasswordReused(userId, newPassword) {
        const passwordHistory = await this.prisma.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: this.PASSWORD_HISTORY_COUNT,
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });
        const hashesToCheck = [
            ...(user?.passwordHash ? [user.passwordHash] : []),
            ...passwordHistory.map((ph) => ph.passwordHash),
        ];
        for (const hash of hashesToCheck) {
            if (await bcrypt.compare(newPassword, hash)) {
                return true;
            }
        }
        return false;
    }
    async validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
};
exports.PasswordService = PasswordService;
exports.PasswordService = PasswordService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        config_1.ConfigService,
        email_service_1.EmailService])
], PasswordService);
//# sourceMappingURL=password.service.js.map