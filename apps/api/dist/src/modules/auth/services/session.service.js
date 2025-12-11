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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../../prisma/prisma.service");
let SessionService = class SessionService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.SESSION_TIMEOUTS = {
            SUPER_ADMIN: 30,
            ADMIN: 30,
            RECRUITER: 60,
            HIRING_MANAGER: 60,
            INTERVIEWER: 60,
            CANDIDATE: 10080,
            VENDOR: 30,
        };
        this.DEFAULT_TIMEOUT = 60;
        this.SESSION_WARNING_BEFORE_EXPIRY = 2;
    }
    async createSession(userId, userAgent, ipAddress) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        const timeoutMinutes = user?.role
            ? this.SESSION_TIMEOUTS[user.role] || this.DEFAULT_TIMEOUT
            : this.DEFAULT_TIMEOUT;
        const sessionToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);
        await this.prisma.userSession.create({
            data: {
                sessionToken,
                userId,
                userAgent,
                ipAddress,
                expiresAt,
            },
        });
        return { sessionToken, expiresAt };
    }
    async validateSession(sessionToken) {
        const session = await this.prisma.userSession.findUnique({
            where: { sessionToken },
            include: { user: { select: { id: true, role: true } } },
        });
        if (!session) {
            return { valid: false };
        }
        if (session.expiresAt < new Date()) {
            await this.prisma.userSession.delete({
                where: { id: session.id },
            });
            return { valid: false };
        }
        const warningThreshold = new Date(session.expiresAt);
        warningThreshold.setMinutes(warningThreshold.getMinutes() - this.SESSION_WARNING_BEFORE_EXPIRY);
        return {
            valid: true,
            userId: session.userId,
            expiresAt: session.expiresAt,
            warningThreshold,
        };
    }
    async refreshSession(sessionToken) {
        const session = await this.prisma.userSession.findUnique({
            where: { sessionToken },
            include: { user: { select: { role: true } } },
        });
        if (!session || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Session expired');
        }
        const timeoutMinutes = session.user?.role
            ? this.SESSION_TIMEOUTS[session.user.role] || this.DEFAULT_TIMEOUT
            : this.DEFAULT_TIMEOUT;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);
        await this.prisma.userSession.update({
            where: { id: session.id },
            data: {
                lastActiveAt: new Date(),
                expiresAt,
            },
        });
        return { expiresAt };
    }
    async getUserSessions(userId, currentSessionToken) {
        const sessions = await this.prisma.userSession.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
            orderBy: { lastActiveAt: 'desc' },
        });
        return sessions.map((session) => ({
            id: session.id,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            lastActiveAt: session.lastActiveAt,
            createdAt: session.createdAt,
            isCurrent: session.sessionToken === currentSessionToken,
        }));
    }
    async terminateSession(sessionId, userId) {
        await this.prisma.userSession.deleteMany({
            where: {
                id: sessionId,
                userId,
            },
        });
    }
    async terminateAllSessions(userId, exceptSessionToken) {
        await this.prisma.userSession.deleteMany({
            where: {
                userId,
                ...(exceptSessionToken && {
                    sessionToken: { not: exceptSessionToken },
                }),
            },
        });
    }
    async terminateSessionByToken(sessionToken) {
        await this.prisma.userSession.delete({
            where: { sessionToken },
        }).catch(() => {
        });
    }
    async cleanupExpiredSessions() {
        const result = await this.prisma.userSession.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
    async getSessionTimeout(role) {
        return {
            timeoutMinutes: this.SESSION_TIMEOUTS[role] || this.DEFAULT_TIMEOUT,
            warningMinutes: this.SESSION_WARNING_BEFORE_EXPIRY,
        };
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SessionService);
//# sourceMappingURL=session.service.js.map