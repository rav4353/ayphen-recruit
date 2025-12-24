import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SuperAdminSecurityService } from "../../super-admin/services/super-admin-security.service";

@Injectable()
export class LoginAttemptService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly ATTEMPT_WINDOW_MINUTES = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SuperAdminSecurityService,
  ) {}

  async recordAttempt(
    email: string,
    tenantId: string | undefined,
    ipAddress: string | undefined,
    success: boolean,
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email,
        tenantId: tenantId || "global",
        ipAddress,
        success,
      },
    });

    // If successful, clear failed attempts
    if (success) {
      await this.clearFailedAttempts(email, tenantId);
    } else {
      // Check for security spikes
      try {
        await this.securityService.checkSecuritySpikes(ipAddress);
      } catch (error) {
        console.error("Failed to check security spikes:", error);
      }
    }
  }

  async isAccountLocked(
    email: string,
    tenantId: string | undefined,
  ): Promise<{
    locked: boolean;
    remainingMinutes?: number;
    attemptsRemaining?: number;
  }> {
    const effectiveTenantId = tenantId || "global";
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - this.ATTEMPT_WINDOW_MINUTES,
    );

    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email,
        tenantId: effectiveTenantId,
        success: false,
        createdAt: { gte: windowStart },
      },
    });

    if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      // Find the most recent failed attempt
      const lastAttempt = await this.prisma.loginAttempt.findFirst({
        where: {
          email,
          tenantId: effectiveTenantId,
          success: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastAttempt) {
        const lockoutEnd = new Date(lastAttempt.createdAt);
        lockoutEnd.setMinutes(
          lockoutEnd.getMinutes() + this.LOCKOUT_DURATION_MINUTES,
        );

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

  async clearFailedAttempts(
    email: string,
    tenantId: string | undefined,
  ): Promise<void> {
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - this.ATTEMPT_WINDOW_MINUTES,
    );

    await this.prisma.loginAttempt.deleteMany({
      where: {
        email,
        tenantId: tenantId || "global",
        success: false,
        createdAt: { gte: windowStart },
      },
    });
  }

  async getRecentAttempts(
    email: string,
    tenantId: string | undefined,
    limit = 10,
  ): Promise<
    Array<{
      ipAddress: string | null;
      success: boolean;
      createdAt: Date;
    }>
  > {
    return this.prisma.loginAttempt.findMany({
      where: { email, tenantId: tenantId || "global" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        ipAddress: true,
        success: true,
        createdAt: true,
      },
    });
  }

  async cleanupOldAttempts(daysToKeep = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const result = await this.prisma.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    return result.count;
  }
}
