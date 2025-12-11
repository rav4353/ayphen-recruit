import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
export interface SessionInfo {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    lastActiveAt: Date;
    createdAt: Date;
    isCurrent: boolean;
}
export declare class SessionService {
    private readonly prisma;
    private readonly configService;
    private readonly SESSION_TIMEOUTS;
    private readonly DEFAULT_TIMEOUT;
    private readonly SESSION_WARNING_BEFORE_EXPIRY;
    constructor(prisma: PrismaService, configService: ConfigService);
    createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<{
        sessionToken: string;
        expiresAt: Date;
    }>;
    validateSession(sessionToken: string): Promise<{
        valid: boolean;
        userId?: string;
        expiresAt?: Date;
        warningThreshold?: Date;
    }>;
    refreshSession(sessionToken: string): Promise<{
        expiresAt: Date;
    }>;
    getUserSessions(userId: string, currentSessionToken?: string): Promise<SessionInfo[]>;
    terminateSession(sessionId: string, userId: string): Promise<void>;
    terminateAllSessions(userId: string, exceptSessionToken?: string): Promise<void>;
    terminateSessionByToken(sessionToken: string): Promise<void>;
    cleanupExpiredSessions(): Promise<number>;
    getSessionTimeout(role: string): Promise<{
        timeoutMinutes: number;
        warningMinutes: number;
    }>;
}
