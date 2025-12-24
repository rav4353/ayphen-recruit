import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ApplicationStatus, JobStatus, InterviewStatus } from "@prisma/client";

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  jobId?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  async getSummaryStats(tenantId: string, filters: AnalyticsFilters = {}) {
    const { startDate, endDate, jobId } = filters;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const jobFilter: any = { tenantId, status: JobStatus.OPEN };
    if (jobId) jobFilter.id = jobId;

    const applicationFilter: any = {
      job: { tenantId },
      status: {
        notIn: [
          ApplicationStatus.HIRED,
          ApplicationStatus.REJECTED,
          ApplicationStatus.WITHDRAWN,
        ],
      },
    };
    if (jobId) applicationFilter.job.id = jobId;
    if (startDate || endDate) {
      applicationFilter.appliedAt = {};
      if (startDate) applicationFilter.appliedAt.gte = new Date(startDate);
      if (endDate) applicationFilter.appliedAt.lte = new Date(endDate);
    }

    const interviewFilter: any = {
      application: { job: { tenantId } },
      status: InterviewStatus.SCHEDULED,
      scheduledAt: { gte: new Date() },
    };
    if (jobId) interviewFilter.application.job.id = jobId;
    if (startDate || endDate) {
      // For interviews, we might care about when they are scheduled vs when created
      // Using scheduledAt for interviews
      if (startDate) interviewFilter.scheduledAt.gte = new Date(startDate);
      if (endDate) interviewFilter.scheduledAt.lte = new Date(endDate);
    }

    const [
      activeJobs,
      totalCandidates,
      upcomingInterviews,
      activeApplications,
    ] = await Promise.all([
      this.prisma.job.count({ where: jobFilter }),
      this.prisma.candidate.count({
        where: {
          tenantId,
          ...(startDate || endDate ? { createdAt: dateFilter.createdAt } : {}),
        },
      }),
      this.prisma.interview.count({ where: interviewFilter }),
      this.prisma.application.count({ where: applicationFilter }),
    ]);

    return {
      activeJobs,
      totalCandidates,
      upcomingInterviews,
      activeApplications,
    };
  }

  async getPipelineHealth(tenantId: string, filters: AnalyticsFilters = {}) {
    const { startDate, endDate, jobId } = filters;

    const where: any = {
      job: { tenantId },
    };

    if (jobId) where.job.id = jobId;
    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) where.appliedAt.gte = new Date(startDate);
      if (endDate) where.appliedAt.lte = new Date(endDate);
    }

    // Group by Application Status for a high-level view
    const statusDistribution = await this.prisma.application.groupBy({
      by: ["status"],
      where,
      _count: {
        _all: true,
      },
    });

    // Map to a more friendly format
    const formatted = statusDistribution.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));

    // Ensure all key statuses are represented even if 0
    const allStatuses = Object.values(ApplicationStatus);
    const result = allStatuses.map((status) => ({
      status,
      count: formatted.find((f) => f.status === status)?.count || 0,
    }));

    return result;
  }

  async getTimeToHire(tenantId: string, filters: AnalyticsFilters = {}) {
    const { startDate, endDate, jobId } = filters;

    const where: any = {
      job: { tenantId },
      status: ApplicationStatus.HIRED,
    };

    if (jobId) where.job.id = jobId;
    if (startDate || endDate) {
      // For time to hire, filtering by hire date makes most sense
      where.hiredAt = {}; // Or updatedAt if hiredAt is null
      if (startDate) where.updatedAt = { gte: new Date(startDate) };
      if (endDate) where.updatedAt = { ...where.updatedAt, lte: new Date(endDate) };
    }

    const hiredApplications = await this.prisma.application.findMany({
      where,
      include: {
        job: {
          include: {
            department: true,
          },
        },
      },
    });

    if (hiredApplications.length === 0) {
      return {
        averageDays: 0,
        timeToHire: 0,
        timeToFill: 0,
        totalHired: 0,
        companyAverage: 30,
        departments: [],
      };
    }

    // Time to Hire: Application to Hire
    const hireDurations = hiredApplications.map((app) => {
      const hireTime = app.hiredAt || app.updatedAt;
      return Math.max(0, hireTime.getTime() - app.appliedAt.getTime());
    });

    // Time to Fill: Job Creation to Hire
    const fillDurations = hiredApplications.map((app) => {
      const hireTime = app.hiredAt || app.updatedAt;
      return Math.max(0, hireTime.getTime() - app.job.createdAt.getTime());
    });

    const avgTimeToHireMs =
      hireDurations.reduce((a, b) => a + b, 0) / hiredApplications.length;
    const avgTimeToFillMs =
      fillDurations.reduce((a, b) => a + b, 0) / hiredApplications.length;

    const timeToHireDays = Math.round(avgTimeToHireMs / (1000 * 60 * 60 * 24));
    const timeToFillDays = Math.round(avgTimeToFillMs / (1000 * 60 * 60 * 24));

    // Group by department
    const deptMap = new Map<string, { days: number; count: number }>();
    hiredApplications.forEach((app, i) => {
      const deptName = app.job.department?.name || "Unassigned";
      const duration = fillDurations[i];

      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, { days: 0, count: 0 });
      }

      const stats = deptMap.get(deptName)!;
      stats.days += duration;
      stats.count++;
    });

    const departments = Array.from(deptMap.entries())
      .map(([name, stats]) => ({
        name,
        days: Math.round(stats.days / stats.count / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.days - a.days);

    // For now, company average is a realistic baseline of 28 days
    const companyAverage = 28;

    return {
      averageDays: timeToFillDays, // Use Time to Fill as the primary dashboard metric
      timeToHire: timeToHireDays,
      timeToFill: timeToFillDays,
      totalHired: hiredApplications.length,
      companyAverage,
      departments: departments.slice(0, 5), // Top 5 departments
    };
  }

  async getRecentActivity(tenantId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        OR: [{ user: { tenantId } }, { candidate: { tenantId } }],
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        application: {
          select: {
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get hiring funnel analytics - tracks candidates through each stage
   */
  async getHiringFunnel(tenantId: string, jobId?: string, filters: AnalyticsFilters = {}) {
    const { startDate, endDate } = filters;

    // Get all applications with their stage history
    const where: any = {
      job: { tenantId },
      ...(jobId && { jobId }),
    };

    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) where.appliedAt.gte = new Date(startDate);
      if (endDate) where.appliedAt.lte = new Date(endDate);
    }

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        currentStage: true,
        job: {
          include: {
            pipeline: {
              include: {
                stages: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    // Aggregate stage counts across all pipelines
    const stageMap = new Map<
      string,
      { name: string; order: number; count: number }
    >();

    // Common stage names for aggregation
    const stageCategories = [
      {
        key: "applied",
        names: ["applied", "new", "application received"],
        order: 1,
      },
      {
        key: "screening",
        names: ["screening", "phone screen", "initial review"],
        order: 2,
      },
      {
        key: "interview",
        names: ["interview", "technical interview", "first interview"],
        order: 3,
      },
      {
        key: "assessment",
        names: ["assessment", "test", "evaluation", "technical round"],
        order: 4,
      },
      {
        key: "final",
        names: ["final interview", "final round", "onsite"],
        order: 5,
      },
      {
        key: "offer",
        names: ["offer", "offer extended", "offer sent"],
        order: 6,
      },
      { key: "hired", names: ["hired", "accepted", "joined"], order: 7 },
    ];

    // Initialize categories
    const funnelData = stageCategories.map((cat) => ({
      stage: cat.key.charAt(0).toUpperCase() + cat.key.slice(1),
      count: 0,
      percentage: 0,
    }));

    // Count applications by stage category
    for (const app of applications) {
      const stageName = app.currentStage?.name?.toLowerCase() || "";
      const status = app.status;

      // Check status first for hired/rejected
      if (status === "HIRED") {
        funnelData[6].count++;
        continue;
      }

      // Match to category
      let matched = false;
      for (let i = 0; i < stageCategories.length; i++) {
        const cat = stageCategories[i];
        if (cat.names.some((n) => stageName.includes(n))) {
          funnelData[i].count++;
          matched = true;
          break;
        }
      }

      // Default to "Applied" if no match
      if (!matched) {
        funnelData[0].count++;
      }
    }

    // Calculate percentages (relative to first stage)
    const totalApplied = funnelData[0].count || 1;
    for (const stage of funnelData) {
      stage.percentage = Math.round((stage.count / totalApplied) * 100);
    }

    // Calculate conversion rates between stages
    const conversionRates = [];
    for (let i = 0; i < funnelData.length - 1; i++) {
      const current = funnelData[i].count || 1;
      const next = funnelData[i + 1].count;
      conversionRates.push({
        from: funnelData[i].stage,
        to: funnelData[i + 1].stage,
        rate: Math.round((next / current) * 100),
      });
    }

    return {
      funnel: funnelData,
      conversionRates,
      totalApplications: applications.length,
      summary: {
        applicationToScreening: conversionRates[0]?.rate || 0,
        screeningToInterview: conversionRates[1]?.rate || 0,
        interviewToOffer: Math.round(
          ((funnelData[5].count || 0) / (funnelData[2].count || 1)) * 100,
        ),
        offerToHire: Math.round(
          ((funnelData[6].count || 0) / (funnelData[5].count || 1)) * 100,
        ),
      },
    };
  }

  /**
   * Get source effectiveness analytics
   */
  async getSourceEffectiveness(tenantId: string, filters: AnalyticsFilters = {}) {
    const { startDate, endDate, jobId } = filters;

    const where: any = { job: { tenantId } };
    if (jobId) where.job.id = jobId;
    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) where.appliedAt.gte = new Date(startDate);
      if (endDate) where.appliedAt.lte = new Date(endDate);
    }

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        candidate: {
          select: { source: true },
        },
      },
    });

    // Group by source
    const sourceMap = new Map<
      string,
      {
        total: number;
        hired: number;
        avgDaysToHire: number;
        interviews: number;
      }
    >();

    for (const app of applications) {
      const source = app.candidate.source || "Unknown";
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          total: 0,
          hired: 0,
          avgDaysToHire: 0,
          interviews: 0,
        });
      }

      const data = sourceMap.get(source)!;
      data.total++;

      if (app.status === "HIRED") {
        data.hired++;
        const daysToHire = Math.round(
          (app.updatedAt.getTime() - app.appliedAt.getTime()) /
          (1000 * 60 * 60 * 24),
        );
        data.avgDaysToHire =
          (data.avgDaysToHire * (data.hired - 1) + daysToHire) / data.hired;
      }

      if (app.status === "INTERVIEW") {
        data.interviews++;
      }
    }

    // Convert to array and calculate metrics
    const sources = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      applications: data.total,
      hired: data.hired,
      hireRate: Math.round((data.hired / data.total) * 100),
      interviewRate: Math.round((data.interviews / data.total) * 100),
      avgDaysToHire: Math.round(data.avgDaysToHire),
    }));

    return sources.sort((a, b) => b.applications - a.applications);
  }
  async getUserActivityStats(tenantId: string, filters: AnalyticsFilters = {}) {
    const { startDate, endDate } = filters;

    // Use filters for activity querying
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    // Default to strict today for "active users today" metric, or use filter range if provided
    // Actually, "Active Users Today" specifically implies TODAY. Using filters on it changes the meaning.
    // Let's keep "Active Users Today" as strictly today, but use filters for trend/breakdown.

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Active Users Today (based on login or session activity)
    const activeUsersToday = await this.prisma.user.count({
      where: {
        tenantId,
        OR: [
          { lastLoginAt: { gte: today } },
          {
            sessions: {
              some: {
                lastActiveAt: { gte: today },
              },
            },
          },
        ],
      },
    });

    // 2. License Usage (Total Active Users)
    const totalUsers = await this.prisma.user.count({
      where: {
        tenantId,
        status: "ACTIVE",
      },
    });

    // Get license limit from subscription plan
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { select: { limits: true, name: true } } },
    });
    // Extract user limit from plan's limits JSON, with defaults by plan name
    const planLimits: Record<string, number> = {
      STARTER: 10,
      PROFESSIONAL: 50,
      ENTERPRISE: 500,
    };
    const limits = subscription?.plan?.limits as { users?: number } | null;
    const licenseLimit =
      limits?.users || planLimits[subscription?.plan?.name || ""] || 50;

    // 3. Most Active Users (by activity logs in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityCounts = await this.prisma.activityLog.groupBy({
      by: ["userId"],
      where: {
        user: { tenantId },
        ...(startDate || endDate ? { createdAt: dateFilter } : { createdAt: { gte: thirtyDaysAgo } }),
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 3,
    });

    const mostActiveUsers = await Promise.all(
      activityCounts.map(async (item) => {
        if (!item.userId) return null;
        const user = await this.prisma.user.findUnique({
          where: { id: item.userId },
          select: { firstName: true, lastName: true },
        });
        return {
          name: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
          actions: item._count._all,
        };
      }),
    );

    // 4. Activity Trend (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysActivities = await this.prisma.activityLog.findMany({
      where: {
        user: { tenantId },
        ...(startDate || endDate ? { createdAt: dateFilter } : { createdAt: { gte: sevenDaysAgo } }),
      },
      select: { createdAt: true },
    });

    // Group by day
    const activityTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const count = last7DaysActivities.filter(
        (a) => a.createdAt.toISOString().split("T")[0] === dateStr,
      ).length;
      return { date: dateStr, count };
    });

    // 5. Action Breakdown (by type)
    const breakdown = await this.prisma.activityLog.groupBy({
      by: ["action"],
      where: {
        user: { tenantId },
        ...(startDate || endDate ? { createdAt: dateFilter } : { createdAt: { gte: thirtyDaysAgo } }),
      },
      _count: { _all: true },
      orderBy: { _count: { action: "desc" } },
      take: 5,
    });

    const actionBreakdown = breakdown.map((b) => ({
      action: b.action,
      count: b._count._all,
    }));

    return {
      activeUsersToday,
      totalUsers,
      licenseLimit,
      mostActiveUsers: mostActiveUsers.filter((u) => u !== null),
      activityTrend,
      actionBreakdown,
    };
  }
}
