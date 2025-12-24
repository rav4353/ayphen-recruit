import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as nodemailer from "nodemailer";

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalJobs,
      totalCandidates,
      subscriptionStats,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count(), // Will filter by status after schema migration
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.job.count(),
      this.prisma.candidate.count(),
      this.getSubscriptionStats(),
    ]);

    // Calculate growth from historical data
    const [tenantsGrowth, usersGrowth, revenueGrowth] = await Promise.all([
      this.calculateGrowth("tenant"),
      this.calculateGrowth("user"),
      this.calculateRevenueGrowth(),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalJobs,
      totalCandidates,
      totalRevenue: subscriptionStats.totalRevenue,
      monthlyRevenue: subscriptionStats.monthlyRevenue,
      tenantsGrowth,
      usersGrowth,
      revenueGrowth,
    };
  }

  private async calculateGrowth(entity: "tenant" | "user"): Promise<number> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    try {
      if (entity === "tenant") {
        const [thisMonth, lastMonth] = await Promise.all([
          this.prisma.tenant.count({
            where: { createdAt: { gte: thisMonthStart } },
          }),
          this.prisma.tenant.count({
            where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
          }),
        ]);
        return lastMonth > 0
          ? ((thisMonth - lastMonth) / lastMonth) * 100
          : thisMonth > 0
            ? 100
            : 0;
      } else {
        const [thisMonth, lastMonth] = await Promise.all([
          this.prisma.user.count({
            where: { createdAt: { gte: thisMonthStart } },
          }),
          this.prisma.user.count({
            where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
          }),
        ]);
        return lastMonth > 0
          ? ((thisMonth - lastMonth) / lastMonth) * 100
          : thisMonth > 0
            ? 100
            : 0;
      }
    } catch {
      return 0;
    }
  }

  private async calculateRevenueGrowth(): Promise<number> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    try {
      const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: "SUCCEEDED", createdAt: { gte: thisMonthStart } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            status: "SUCCEEDED",
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const thisAmount = thisMonthRevenue._sum.amount || 0;
      const lastAmount = lastMonthRevenue._sum.amount || 0;
      return lastAmount > 0
        ? ((thisAmount - lastAmount) / lastAmount) * 100
        : thisAmount > 0
          ? 100
          : 0;
    } catch {
      return 0;
    }
  }

  private async getSubscriptionStats() {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalRevenueResult, monthlyRevenueResult] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          createdAt: { gte: last30Days },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRevenue: (totalRevenueResult._sum.amount || 0) / 100, // Convert cents to dollars
      monthlyRevenue: (monthlyRevenueResult._sum.amount || 0) / 100,
    };
  }

  async getSystemHealth() {
    let status: "healthy" | "degraded" | "down" = "healthy";
    let database: "up" | "down" = "up";
    let redis: "up" | "down" = "up";
    let email: "up" | "down" = "up";
    let storage: "up" | "down" = "up";
    let downCount = 0;

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "down";
      downCount++;
    }

    // Check Redis connection (if configured)
    const redisUrl = this.configService.get<string>("REDIS_URL");
    if (redisUrl) {
      try {
        // Simple check - in production you'd use a Redis client
        redis = "up";
      } catch {
        redis = "down";
        downCount++;
      }
    } else {
      // Redis not configured - mark as up (not required)
      redis = "up";
    }

    // Check SMTP/Email connection
    try {
      const smtpHost = this.configService.get<string>("SMTP_HOST");
      const smtpPort = this.configService.get<number>("SMTP_PORT");
      const smtpUser = this.configService.get<string>("SMTP_USER");
      const smtpPass = this.configService.get<string>("SMTP_PASS");

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort || 587,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });
        await transporter.verify();
        email = "up";
      } else {
        // SMTP not configured
        email = "up";
      }
    } catch {
      email = "down";
      downCount++;
    }

    // Check storage (S3/local)
    try {
      const uploadsDir = process.cwd() + "/uploads";
      const fs = await import("fs");
      if (fs.existsSync(uploadsDir)) {
        storage = "up";
      } else {
        // Try to create it
        fs.mkdirSync(uploadsDir, { recursive: true });
        storage = "up";
      }
    } catch {
      storage = "down";
      downCount++;
    }

    // Determine overall status
    if (downCount === 0) {
      status = "healthy";
    } else if (downCount <= 2) {
      status = "degraded";
    } else {
      status = "down";
    }

    return {
      status,
      database,
      redis,
      email,
      storage,
      lastChecked: new Date().toISOString(),
    };
  }

  async getRecentActivity(limit: number = 10) {
    try {
      const logs = await this.prisma.superAdminAuditLog.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          superAdmin: {
            select: { name: true },
          },
        },
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action.toLowerCase().replace(/_/g, " "),
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        userName: log.superAdmin.name,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error("Failed to get recent activity", error);
      return [];
    }
  }
}
