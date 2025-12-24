import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

interface CreateReferralDto {
  candidateId: string;
  jobId?: string;
  notes?: string;
}

export interface ReferralBonusConfig {
  hiredBonus: number;
  interviewBonus?: number;
  currency: string;
}

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateReferralId(): string {
    const crypto = require("crypto");
    return `ref-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  }

  /**
   * Create a new referral
   */
  async create(dto: CreateReferralDto, referrerId: string, tenantId: string) {
    // Verify candidate exists
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: dto.candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException("Candidate not found");
    }

    // Check if already referred by this user
    const existingReferral = await this.prisma.activityLog.findFirst({
      where: {
        action: "REFERRAL_CREATED",
        userId: referrerId,
        candidateId: dto.candidateId,
      },
    });

    if (existingReferral) {
      throw new BadRequestException("You have already referred this candidate");
    }

    const referralId = this.generateReferralId();

    await this.prisma.activityLog.create({
      data: {
        action: "REFERRAL_CREATED",
        description: `Referral created for ${candidate.firstName} ${candidate.lastName}`,
        userId: referrerId,
        candidateId: dto.candidateId,
        metadata: {
          referralId,
          tenantId,
          referrerId,
          candidateId: dto.candidateId,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          jobId: dto.jobId,
          notes: dto.notes,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          bonusStatus: "NOT_ELIGIBLE",
          bonusAmount: 0,
        },
      },
    });

    // Update candidate source if not already set
    if (!candidate.source || candidate.source === "DIRECT") {
      await this.prisma.candidate.update({
        where: { id: dto.candidateId },
        data: {
          source: "REFERRAL",
          sourceDetails: `Referred by employee`,
        },
      });
    }

    return {
      id: referralId,
      candidateId: dto.candidateId,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get all referrals by a user
   */
  async getMyReferrals(userId: string, tenantId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: "REFERRAL_CREATED",
        userId,
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const referralMap = new Map<string, any>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!referralMap.has(meta.referralId)) {
        referralMap.set(meta.referralId, {
          id: meta.referralId,
          candidateId: meta.candidateId,
          candidateName: meta.candidateName,
          jobId: meta.jobId,
          status: meta.status,
          bonusStatus: meta.bonusStatus,
          bonusAmount: meta.bonusAmount,
          notes: meta.notes,
          createdAt: meta.createdAt,
          hiredAt: meta.hiredAt,
        });
      }
    }

    const referrals = Array.from(referralMap.values());

    // Get candidate details
    const candidateIds = referrals.map((r) => r.candidateId);
    const candidates = await this.prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        currentTitle: true,
        applications: {
          select: { status: true, job: { select: { title: true } } },
          take: 1,
        },
      },
    });

    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    return referrals.map((r) => ({
      ...r,
      candidate: candidateMap.get(r.candidateId),
    }));
  }

  /**
   * Get all referrals for tenant (admin view)
   */
  async getAllReferrals(
    tenantId: string,
    filters?: { status?: string; referrerId?: string },
  ) {
    const whereClause: any = {
      action: "REFERRAL_CREATED",
      metadata: {
        path: ["tenantId"],
        equals: tenantId,
      },
    };

    if (filters?.referrerId) {
      whereClause.userId = filters.referrerId;
    }

    const logs = await this.prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const referralMap = new Map<string, any>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!referralMap.has(meta.referralId)) {
        if (!filters?.status || meta.status === filters.status) {
          referralMap.set(meta.referralId, {
            id: meta.referralId,
            candidateId: meta.candidateId,
            candidateName: meta.candidateName,
            referrer: log.user,
            jobId: meta.jobId,
            status: meta.status,
            bonusStatus: meta.bonusStatus,
            bonusAmount: meta.bonusAmount,
            createdAt: meta.createdAt,
            hiredAt: meta.hiredAt,
          });
        }
      }
    }

    return Array.from(referralMap.values());
  }

  /**
   * Update referral status (when candidate is hired)
   */
  async updateStatus(
    referralId: string,
    status: "PENDING" | "INTERVIEWED" | "HIRED" | "REJECTED",
    tenantId: string,
    userId: string,
  ) {
    // Find the referral
    const referralLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "REFERRAL_CREATED",
        metadata: {
          path: ["referralId"],
          equals: referralId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!referralLog) {
      throw new NotFoundException("Referral not found");
    }

    const meta = referralLog.metadata as any;

    if (meta.tenantId !== tenantId) {
      throw new NotFoundException("Referral not found");
    }

    // Get bonus config
    const bonusConfig = await this.getBonusConfig(tenantId);
    let bonusAmount = meta.bonusAmount || 0;
    let bonusStatus = meta.bonusStatus || "NOT_ELIGIBLE";

    if (status === "HIRED") {
      bonusAmount = bonusConfig.hiredBonus;
      bonusStatus = "PENDING_PAYMENT";
    } else if (status === "INTERVIEWED" && bonusConfig.interviewBonus) {
      bonusAmount = bonusConfig.interviewBonus;
      bonusStatus = "PENDING_PAYMENT";
    }

    await this.prisma.activityLog.create({
      data: {
        action: "REFERRAL_CREATED",
        description: `Referral status updated to ${status}`,
        userId,
        candidateId: meta.candidateId,
        metadata: {
          ...meta,
          status,
          bonusStatus,
          bonusAmount,
          ...(status === "HIRED" && { hiredAt: new Date().toISOString() }),
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      },
    });

    // Notify referrer
    if (status === "HIRED") {
      await this.notificationsService.create({
        type: "SYSTEM",
        title: "Referral Hired!",
        message: `Great news! Your referral ${meta.candidateName} has been hired. You are eligible for a bonus of ${bonusConfig.currency}${bonusAmount}.`,
        userId: meta.referrerId,
        tenantId,
        metadata: { referralId, bonusAmount },
      });
    }

    return { success: true, status, bonusStatus, bonusAmount };
  }

  /**
   * Mark bonus as paid
   */
  async markBonusPaid(referralId: string, tenantId: string, userId: string) {
    const referralLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "REFERRAL_CREATED",
        metadata: {
          path: ["referralId"],
          equals: referralId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!referralLog) {
      throw new NotFoundException("Referral not found");
    }

    const meta = referralLog.metadata as any;

    if (meta.tenantId !== tenantId) {
      throw new NotFoundException("Referral not found");
    }

    await this.prisma.activityLog.create({
      data: {
        action: "REFERRAL_CREATED",
        description: `Referral bonus paid`,
        userId,
        candidateId: meta.candidateId,
        metadata: {
          ...meta,
          bonusStatus: "PAID",
          paidAt: new Date().toISOString(),
          paidBy: userId,
        },
      },
    });

    // Notify referrer
    await this.notificationsService.create({
      type: "SYSTEM",
      title: "Referral Bonus Paid",
      message: `Your referral bonus of ${meta.bonusAmount} has been processed.`,
      userId: meta.referrerId,
      tenantId,
      metadata: { referralId },
    });

    return { success: true };
  }

  /**
   * Get referral statistics
   */
  async getStats(tenantId: string, userId?: string) {
    const whereClause: any = {
      action: "REFERRAL_CREATED",
      metadata: {
        path: ["tenantId"],
        equals: tenantId,
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const logs = await this.prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const referralMap = new Map<string, any>();
    for (const log of logs) {
      const meta = log.metadata as any;
      if (!referralMap.has(meta.referralId)) {
        referralMap.set(meta.referralId, meta);
      }
    }

    const referrals = Array.from(referralMap.values());

    const stats = {
      total: referrals.length,
      pending: referrals.filter((r) => r.status === "PENDING").length,
      interviewed: referrals.filter((r) => r.status === "INTERVIEWED").length,
      hired: referrals.filter((r) => r.status === "HIRED").length,
      rejected: referrals.filter((r) => r.status === "REJECTED").length,
      totalBonusEarned: referrals
        .filter((r) => r.bonusStatus === "PAID")
        .reduce((sum, r) => sum + (r.bonusAmount || 0), 0),
      pendingBonus: referrals
        .filter((r) => r.bonusStatus === "PENDING_PAYMENT")
        .reduce((sum, r) => sum + (r.bonusAmount || 0), 0),
    };

    return stats;
  }

  /**
   * Get/set bonus configuration
   */
  async getBonusConfig(tenantId: string): Promise<ReferralBonusConfig> {
    const configLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "REFERRAL_BONUS_CONFIG",
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (configLog) {
      const meta = configLog.metadata as any;
      return {
        hiredBonus: meta.hiredBonus,
        interviewBonus: meta.interviewBonus,
        currency: meta.currency,
      };
    }

    // Default config
    return {
      hiredBonus: 1000,
      interviewBonus: 0,
      currency: "USD",
    };
  }

  async setBonusConfig(
    config: ReferralBonusConfig,
    tenantId: string,
    userId: string,
  ) {
    await this.prisma.activityLog.create({
      data: {
        action: "REFERRAL_BONUS_CONFIG",
        description: "Referral bonus configuration updated",
        userId,
        metadata: {
          tenantId,
          hiredBonus: config.hiredBonus,
          interviewBonus: config.interviewBonus,
          currency: config.currency,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      },
    });

    return config;
  }

  /**
   * Get top referrers (leaderboard)
   */
  async getLeaderboard(tenantId: string, limit = 10) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: "REFERRAL_CREATED",
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const referralMap = new Map<string, any>();
    for (const log of logs) {
      const meta = log.metadata as any;
      if (!referralMap.has(meta.referralId)) {
        referralMap.set(meta.referralId, { ...meta, user: log.user });
      }
    }

    const referrals = Array.from(referralMap.values());

    // Group by referrer
    const referrerStats = new Map<
      string,
      { user: any; total: number; hired: number; bonus: number }
    >();

    for (const ref of referrals) {
      const current = referrerStats.get(ref.referrerId) || {
        user: ref.user,
        total: 0,
        hired: 0,
        bonus: 0,
      };

      current.total++;
      if (ref.status === "HIRED") current.hired++;
      if (ref.bonusStatus === "PAID") current.bonus += ref.bonusAmount || 0;

      referrerStats.set(ref.referrerId, current);
    }

    return Array.from(referrerStats.values())
      .sort((a, b) => b.hired - a.hired || b.total - a.total)
      .slice(0, limit);
  }
}
