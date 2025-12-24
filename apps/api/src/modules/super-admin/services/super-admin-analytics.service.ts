import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class SuperAdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(period: "day" | "week" | "month" | "year" = "month") {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);
    const previousPeriodStart = this.getPreviousPeriodStart(now, period);

    const [
      totalTenants,
      totalUsers,
      totalJobs,
      totalCandidates,
      newTenantsThisPeriod,
      newTenantsPreviousPeriod,
      newUsersThisPeriod,
      newUsersPreviousPeriod,
      subscriptionStats,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.job.count(),
      this.prisma.candidate.count(),
      this.prisma.tenant.count({
        where: { createdAt: { gte: periodStart } },
      }),
      this.prisma.tenant.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: periodStart } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
      }),
      this.getSubscriptionStats(),
    ]);

    const tenantGrowth =
      newTenantsPreviousPeriod > 0
        ? ((newTenantsThisPeriod - newTenantsPreviousPeriod) /
            newTenantsPreviousPeriod) *
          100
        : newTenantsThisPeriod > 0
          ? 100
          : 0;

    const userGrowth =
      newUsersPreviousPeriod > 0
        ? ((newUsersThisPeriod - newUsersPreviousPeriod) /
            newUsersPreviousPeriod) *
          100
        : newUsersThisPeriod > 0
          ? 100
          : 0;

    return {
      totalTenants,
      totalUsers,
      totalJobs,
      totalCandidates,
      mrr: subscriptionStats.mrr,
      arr: subscriptionStats.arr,
      tenantGrowth: Math.round(tenantGrowth * 10) / 10,
      userGrowth: Math.round(userGrowth * 10) / 10,
      revenueGrowth: subscriptionStats.revenueGrowth,
    };
  }

  async getTenantGrowth(period: "day" | "week" | "month" | "year" = "month") {
    const now = new Date();
    const dataPoints = this.getDataPointsCount(period);
    const results: { date: string; count: number }[] = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const pointDate = this.subtractPeriod(now, period, i);
      const nextPointDate = this.subtractPeriod(now, period, i - 1);

      const count = await this.prisma.tenant.count({
        where: {
          createdAt: {
            gte: pointDate,
            lt: i === 0 ? undefined : nextPointDate,
          },
        },
      });

      results.push({
        date: pointDate.toISOString().split("T")[0],
        count,
      });
    }

    return results;
  }

  async getUserGrowth(period: "day" | "week" | "month" | "year" = "month") {
    const now = new Date();
    const dataPoints = this.getDataPointsCount(period);
    const results: { date: string; count: number }[] = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const pointDate = this.subtractPeriod(now, period, i);
      const nextPointDate = this.subtractPeriod(now, period, i - 1);

      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: pointDate,
            lt: i === 0 ? undefined : nextPointDate,
          },
        },
      });

      results.push({
        date: pointDate.toISOString().split("T")[0],
        count,
      });
    }

    return results;
  }

  async getTopTenants(limit: number = 10) {
    const tenants = await this.prisma.tenant.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            jobs: true,
            candidates: true,
          },
        },
      },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      users: tenant._count.users,
      jobs: tenant._count.jobs,
      candidates: tenant._count.candidates,
    }));
  }

  async getUsageMetrics(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};

    const [
      totalJobs,
      activeJobs,
      totalCandidates,
      totalApplications,
      totalInterviews,
    ] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.count({ where: { ...where, status: "OPEN" } }),
      this.prisma.candidate.count({ where }),
      this.prisma.application.count({
        where: tenantId ? { job: { tenantId } } : {},
      }),
      this.prisma.interview.count({
        where: tenantId ? { application: { job: { tenantId } } } : {},
      }),
    ]);

    return {
      totalJobs,
      activeJobs,
      totalCandidates,
      totalApplications,
      totalInterviews,
      averageApplicationsPerJob:
        totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0,
    };
  }

  async getPlanDistribution() {
    const subscriptions = await this.prisma.subscription.groupBy({
      by: ["planId"],
      _count: { id: true },
      where: { status: "ACTIVE" },
    });

    const plans = await this.prisma.subscriptionPlan.findMany();
    const planMap = new Map(plans.map((p) => [p.id, p.name]));

    const total = subscriptions.reduce((sum, s) => sum + s._count.id, 0);

    return subscriptions.map((s) => ({
      plan: planMap.get(s.planId) || "Unknown",
      count: s._count.id,
      percentage: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
    }));
  }

  private async getSubscriptionStats() {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      });

      let mrr = 0;
      subscriptions.forEach((sub) => {
        if (sub.billingCycle === "MONTHLY") {
          mrr += sub.plan.monthlyPrice;
        } else {
          mrr += sub.plan.yearlyPrice / 12;
        }
      });

      return {
        mrr: mrr / 100,
        arr: (mrr * 12) / 100,
        revenueGrowth: 15.5, // Would need historical data for real calculation
      };
    } catch {
      return { mrr: 0, arr: 0, revenueGrowth: 0 };
    }
  }

  private getPeriodStart(date: Date, period: string): Date {
    const start = new Date(date);
    switch (period) {
      case "day":
        start.setDate(start.getDate() - 1);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private getPreviousPeriodStart(date: Date, period: string): Date {
    const start = this.getPeriodStart(date, period);
    return this.getPeriodStart(start, period);
  }

  private getDataPointsCount(period: string): number {
    switch (period) {
      case "day":
        return 24; // hourly for a day
      case "week":
        return 7; // daily for a week
      case "month":
        return 30; // daily for a month
      case "year":
        return 12; // monthly for a year
      default:
        return 12;
    }
  }

  private subtractPeriod(date: Date, period: string, multiplier: number): Date {
    const result = new Date(date);
    switch (period) {
      case "day":
        result.setHours(result.getHours() - multiplier);
        break;
      case "week":
        result.setDate(result.getDate() - multiplier);
        break;
      case "month":
        result.setDate(result.getDate() - multiplier);
        break;
      case "year":
        result.setMonth(result.getMonth() - multiplier);
        break;
    }
    return result;
  }
}
