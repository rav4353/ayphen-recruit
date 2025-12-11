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
exports.LoginAttemptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let LoginAttemptService = class LoginAttemptService {
    constructor(prisma) {
        this.prisma = prisma;
        this.MAX_FAILED_ATTEMPTS = 5;
        this.LOCKOUT_DURATION_MINUTES = 15;
        this.ATTEMPT_WINDOW_MINUTES = 15;
    }
    async recordAttempt(email, tenantId, ipAddress, success) {
        await this.prisma.loginAttempt.create({
            data: {
                email,
                tenantId: tenantId || 'global',
                ipAddress,
                success,
            },
        });
        if (success) {
            await this.clearFailedAttempts(email, tenantId);
        }
    }
    async isAccountLocked(email, tenantId) {
        const effectiveTenantId = tenantId || 'global';
        const windowStart = new Date();
        windowStart.setMinutes(windowStart.getMinutes() - this.ATTEMPT_WINDOW_MINUTES);
        const failedAttempts = await this.prisma.loginAttempt.count({
            where: {
                email,
                tenantId: effectiveTenantId,
                success: false,
                createdAt: { gte: windowStart },
            },
        });
        if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
            const lastAttempt = await this.prisma.loginAttempt.findFirst({
                where: {
                    email,
                    tenantId: effectiveTenantId,
                    success: false,
                },
                orderBy: { createdAt: 'desc' },
            });
            if (lastAttempt) {
                const lockoutEnd = new Date(lastAttempt.createdAt);
                lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
                if (lockoutEnd > new Date()) {
                    const remainingMs = lockoutEnd.getTime() - Date.now();
                    const remainingMinutes = Math.ceil(remainingMs / 60000);
                    return { locked: true, remainingMinutes };
                }
            }
        }
        return {
            locked: false,
            attemptsRemaining: this.MAX_FAILED_ATTEMPTS - failedAttempts,
        };
    }
    async clearFailedAttempts(email, tenantId) {
        const windowStart = new Date();
        windowStart.setMinutes(windowStart.getMinutes() - this.ATTEMPT_WINDOW_MINUTES);
        await this.prisma.loginAttempt.deleteMany({
            where: {
                email,
                tenantId: tenantId || 'global',
                success: false,
                createdAt: { gte: windowStart },
            },
        });
    }
    async getRecentAttempts(email, tenantId, limit = 10) {
        return this.prisma.loginAttempt.findMany({
            where: { email, tenantId: tenantId || 'global' },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                ipAddress: true,
                success: true,
                createdAt: true,
            },
        });
    }
    async cleanupOldAttempts(daysToKeep = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysToKeep);
        const result = await this.prisma.loginAttempt.deleteMany({
            where: {
                createdAt: { lt: cutoff },
            },
        });
        return result.count;
    }
};
exports.LoginAttemptService = LoginAttemptService;
exports.LoginAttemptService = LoginAttemptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LoginAttemptService);
//# sourceMappingURL=login-attempt.service.js.map