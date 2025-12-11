import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  isCurrent: boolean;
}

@Injectable()
export class SessionService {
  // Session timeout configuration by role (in minutes)
  private readonly SESSION_TIMEOUTS: Record<string, number> = {
    SUPER_ADMIN: 30,
    ADMIN: 30,
    RECRUITER: 60,
    HIRING_MANAGER: 60,
    INTERVIEWER: 60,
    CANDIDATE: 10080, // 7 days
    VENDOR: 30,
  };

  private readonly DEFAULT_TIMEOUT = 60; // 1 hour
  private readonly SESSION_WARNING_BEFORE_EXPIRY = 2; // 2 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ sessionToken: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const timeoutMinutes = user?.role
      ? this.SESSION_TIMEOUTS[user.role] || this.DEFAULT_TIMEOUT
      : this.DEFAULT_TIMEOUT;

    const sessionToken = uuidv4();
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

  async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    userId?: string;
    expiresAt?: Date;
    warningThreshold?: Date;
  }> {
    const session = await this.prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: { select: { id: true, role: true } } },
    });

    if (!session) {
      return { valid: false };
    }

    if (session.expiresAt < new Date()) {
      // Session expired, clean it up
      await this.prisma.userSession.delete({
        where: { id: session.id },
      });
      return { valid: false };
    }

    // Calculate warning threshold
    const warningThreshold = new Date(session.expiresAt);
    warningThreshold.setMinutes(
      warningThreshold.getMinutes() - this.SESSION_WARNING_BEFORE_EXPIRY,
    );

    return {
      valid: true,
      userId: session.userId,
      expiresAt: session.expiresAt,
      warningThreshold,
    };
  }

  async refreshSession(sessionToken: string): Promise<{ expiresAt: Date }> {
    const session = await this.prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: { select: { role: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
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

  async getUserSessions(userId: string, currentSessionToken?: string): Promise<SessionInfo[]> {
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

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.userSession.deleteMany({
      where: {
        id: sessionId,
        userId, // Ensure user can only terminate their own sessions
      },
    });
  }

  async terminateAllSessions(userId: string, exceptSessionToken?: string): Promise<void> {
    await this.prisma.userSession.deleteMany({
      where: {
        userId,
        ...(exceptSessionToken && {
          sessionToken: { not: exceptSessionToken },
        }),
      },
    });
  }

  async terminateSessionByToken(sessionToken: string): Promise<void> {
    await this.prisma.userSession.delete({
      where: { sessionToken },
    }).catch(() => {
      // Session might already be deleted
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  async getSessionTimeout(role: string): Promise<{
    timeoutMinutes: number;
    warningMinutes: number;
  }> {
    return {
      timeoutMinutes: this.SESSION_TIMEOUTS[role] || this.DEFAULT_TIMEOUT,
      warningMinutes: this.SESSION_WARNING_BEFORE_EXPIRY,
    };
  }
}
