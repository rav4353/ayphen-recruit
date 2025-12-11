import { PrismaService } from '../../../prisma/prisma.service';
export declare class LoginAttemptService {
    private readonly prisma;
    private readonly MAX_FAILED_ATTEMPTS;
    private readonly LOCKOUT_DURATION_MINUTES;
    private readonly ATTEMPT_WINDOW_MINUTES;
    constructor(prisma: PrismaService);
    recordAttempt(email: string, tenantId: string | undefined, ipAddress: string | undefined, success: boolean): Promise<void>;
    isAccountLocked(email: string, tenantId: string | undefined): Promise<{
        locked: boolean;
        remainingMinutes?: number;
        attemptsRemaining?: number;
    }>;
    clearFailedAttempts(email: string, tenantId: string | undefined): Promise<void>;
    getRecentAttempts(email: string, tenantId: string | undefined, limit?: number): Promise<Array<{
        ipAddress: string | null;
        success: boolean;
        createdAt: Date;
    }>>;
    cleanupOldAttempts(daysToKeep?: number): Promise<number>;
}
