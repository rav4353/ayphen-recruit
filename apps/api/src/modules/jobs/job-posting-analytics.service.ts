import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ApplicationStatus, Prisma } from "@prisma/client";

// Type definitions for metadata
interface JobViewMetadata {
  type: string;
  jobId: string;
  source: string;
  referrer?: string;
  sessionId?: string;
  userAgent?: string;
  ipHash?: string;
  timestamp: string;
}

// Application with source from candidate
interface ApplicationWithSource {
  id: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  candidateId: string;
  source: string;
  candidate?: { source: string | null } | null;
}

// Activity log with typed metadata
interface ActivityLogWithMetadata {
  id: string;
  action: string;
  description: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  userId: string | null;
  applicationId: string | null;
  candidateId: string | null;
}

export interface JobPostingMetrics {
  jobId: string;
  jobTitle: string;
  totalViews: number;
  uniqueViews: number;
  totalApplications: number;
  viewToApplyRate: number;
  averageTimeToApply: number; // hours
  sourceBreakdown: SourceMetrics[];
  dailyMetrics: DailyMetrics[];
}

export interface SourceMetrics {
  source: string;
  views: number;
  applications: number;
  conversionRate: number;
  qualityScore: number; // Based on how far candidates progress
}

export interface DailyMetrics {
  date: string;
  views: number;
  applications: number;
}

export interface JobBoardPerformance {
  board: string;
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  avgConversionRate: number;
  avgCostPerApplication: number;
  avgTimeToFirstApplication: number;
  topPerformingJobs: { jobId: string; title: string; applications: number }[];
}

const JOB_VIEW_KEY = "job_view_event";

@Injectable()
export class JobPostingAnalyticsService {
  private readonly logger = new Logger(JobPostingAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a job view event
   */
  async trackJobView(
    jobId: string,
    data: {
      source?: string;
      referrer?: string;
      sessionId?: string;
      userAgent?: string;
      ipHash?: string;
    },
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        action: "JOB_VIEWED",
        description: `Job viewed from ${data.source || "direct"}`,
        metadata: {
          type: JOB_VIEW_KEY,
          jobId,
          source: data.source || "direct",
          referrer: data.referrer,
          sessionId: data.sessionId,
          userAgent: data.userAgent,
          ipHash: data.ipHash,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get analytics for a specific job
   */
  async getJobAnalytics(
    tenantId: string,
    jobId: string,
  ): Promise<JobPostingMetrics> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { id: true, title: true, createdAt: true },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // Get view events
    const viewEvents = await this.prisma.activityLog.findMany({
      where: {
        action: "JOB_VIEWED",
        metadata: { path: ["jobId"], equals: jobId },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get applications with candidate source
    const applications = await this.prisma.application.findMany({
      where: { jobId },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
        candidateId: true,
        candidate: { select: { source: true } },
      },
    });

    // Calculate metrics
    const totalViews = viewEvents.length;
    const uniqueSessions = new Set(
      viewEvents.map((v) => {
        const metadata = v.metadata as unknown as JobViewMetadata | null;
        return metadata?.sessionId || v.id;
      }),
    );
    const uniqueViews = uniqueSessions.size;
    const totalApplications = applications.length;
    const viewToApplyRate =
      totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

    // Calculate average time to apply
    let totalTimeToApply = 0;
    let applyCount = 0;
    for (const app of applications) {
      const appDate = app.appliedAt;
      const firstView = viewEvents.find((v) => {
        const metadata = v.metadata as unknown as JobViewMetadata | null;
        return metadata?.sessionId && new Date(v.createdAt) < new Date(appDate);
      });
      if (firstView) {
        const timeDiff =
          new Date(appDate).getTime() - new Date(firstView.createdAt).getTime();
        totalTimeToApply += timeDiff / (1000 * 60 * 60); // Convert to hours
        applyCount++;
      }
    }
    const averageTimeToApply =
      applyCount > 0 ? totalTimeToApply / applyCount : 0;

    // Source breakdown - map applications to include source from candidate
    const applicationsWithSource = applications.map((app) => ({
      ...app,
      source: app.candidate?.source || "direct",
    }));
    const sourceBreakdown = this.calculateSourceBreakdown(
      viewEvents,
      applicationsWithSource,
    );

    // Daily metrics (last 30 days)
    const dailyMetrics = this.calculateDailyMetrics(
      viewEvents,
      applicationsWithSource,
    );

    return {
      jobId,
      jobTitle: job.title,
      totalViews,
      uniqueViews,
      totalApplications,
      viewToApplyRate: Math.round(viewToApplyRate * 100) / 100,
      averageTimeToApply: Math.round(averageTimeToApply * 10) / 10,
      sourceBreakdown,
      dailyMetrics,
    };
  }

  /**
   * Get analytics for all jobs (optimized with batch queries)
   */
  async getAllJobsAnalytics(tenantId: string): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalViews: number;
    totalApplications: number;
    avgViewToApplyRate: number;
    topPerformingJobs: JobPostingMetrics[];
    bottomPerformingJobs: JobPostingMetrics[];
  }> {
    // Batch query 1: Get all jobs
    const jobs = await this.prisma.job.findMany({
      where: { tenantId },
      select: { id: true, title: true, status: true, createdAt: true },
    });

    const jobIds = jobs.map((j) => j.id);
    const activeJobsCount = jobs.filter(
      (j) => (j.status as string) === "PUBLISHED",
    ).length;

    // Batch query 2: Get all applications for tenant jobs
    const allApplications = await this.prisma.application.findMany({
      where: { jobId: { in: jobIds } },
      select: {
        id: true,
        jobId: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
        candidateId: true,
        candidate: { select: { source: true } },
      },
    });

    // Batch query 3: Get all view events for tenant jobs
    const allViewEvents = await this.prisma.activityLog.findMany({
      where: {
        action: "JOB_VIEWED",
        metadata: { path: ["type"], equals: JOB_VIEW_KEY },
      },
    });

    // Group data by jobId in memory
    const applicationsByJob = new Map<string, typeof allApplications>();
    const viewsByJob = new Map<string, typeof allViewEvents>();

    for (const app of allApplications) {
      if (!applicationsByJob.has(app.jobId)) {
        applicationsByJob.set(app.jobId, []);
      }
      applicationsByJob.get(app.jobId)!.push(app);
    }

    for (const view of allViewEvents) {
      const metadata = view.metadata as unknown as JobViewMetadata | null;
      const jobId = metadata?.jobId;
      if (jobId && jobIds.includes(jobId)) {
        if (!viewsByJob.has(jobId)) {
          viewsByJob.set(jobId, []);
        }
        viewsByJob.get(jobId)!.push(view);
      }
    }

    // Calculate metrics for each job in memory
    let totalViews = 0;
    let totalApplications = 0;
    const jobMetrics: JobPostingMetrics[] = [];

    for (const job of jobs) {
      const jobApplications = applicationsByJob.get(job.id) || [];
      const jobViews = viewsByJob.get(job.id) || [];

      const viewCount = jobViews.length;
      const uniqueSessions = new Set(
        jobViews.map((v) => {
          const metadata = v.metadata as unknown as JobViewMetadata | null;
          return metadata?.sessionId || v.id;
        }),
      );
      const appCount = jobApplications.length;
      const viewToApplyRate = viewCount > 0 ? (appCount / viewCount) * 100 : 0;

      // Calculate average time to apply
      let totalTimeToApply = 0;
      let applyCount = 0;
      for (const app of jobApplications) {
        const firstView = jobViews.find((v) => {
          const metadata = v.metadata as unknown as JobViewMetadata | null;
          return (
            metadata?.sessionId &&
            new Date(v.createdAt) < new Date(app.appliedAt)
          );
        });
        if (firstView) {
          const timeDiff =
            new Date(app.appliedAt).getTime() -
            new Date(firstView.createdAt).getTime();
          totalTimeToApply += timeDiff / (1000 * 60 * 60);
          applyCount++;
        }
      }
      const averageTimeToApply =
        applyCount > 0 ? totalTimeToApply / applyCount : 0;

      // Source breakdown
      const applicationsWithSource = jobApplications.map((app) => ({
        ...app,
        source: app.candidate?.source || "direct",
      }));
      const sourceBreakdown = this.calculateSourceBreakdown(
        jobViews,
        applicationsWithSource,
      );
      const dailyMetrics = this.calculateDailyMetrics(
        jobViews,
        applicationsWithSource,
      );

      totalViews += viewCount;
      totalApplications += appCount;

      jobMetrics.push({
        jobId: job.id,
        jobTitle: job.title,
        totalViews: viewCount,
        uniqueViews: uniqueSessions.size,
        totalApplications: appCount,
        viewToApplyRate: Math.round(viewToApplyRate * 100) / 100,
        averageTimeToApply: Math.round(averageTimeToApply * 10) / 10,
        sourceBreakdown,
        dailyMetrics,
      });
    }

    const avgViewToApplyRate =
      totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

    // Sort by applications
    const sortedByPerformance = [...jobMetrics].sort(
      (a, b) => b.totalApplications - a.totalApplications,
    );

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobsCount,
      totalViews,
      totalApplications,
      avgViewToApplyRate: Math.round(avgViewToApplyRate * 100) / 100,
      topPerformingJobs: sortedByPerformance.slice(0, 5),
      bottomPerformingJobs: sortedByPerformance.slice(-5).reverse(),
    };
  }

  /**
   * Get job board performance comparison
   */
  async getJobBoardPerformance(
    tenantId: string,
  ): Promise<JobBoardPerformance[]> {
    const applications = await this.prisma.application.findMany({
      where: { job: { tenantId } },
      select: {
        id: true,
        jobId: true,
        status: true,
        appliedAt: true,
        job: { select: { title: true } },
        candidate: { select: { source: true } },
      },
    });

    const viewEvents = await this.prisma.activityLog.findMany({
      where: {
        action: "JOB_VIEWED",
        metadata: { path: ["type"], equals: JOB_VIEW_KEY },
      },
    });

    // Type for board application
    type BoardApplication = (typeof applications)[number];

    // Group by source/board
    const boardStats = new Map<
      string,
      {
        views: number;
        applications: BoardApplication[];
        jobIds: Set<string>;
      }
    >();

    for (const view of viewEvents) {
      const metadata = view.metadata as unknown as JobViewMetadata | null;
      const source = metadata?.source || "direct";
      if (!boardStats.has(source)) {
        boardStats.set(source, {
          views: 0,
          applications: [],
          jobIds: new Set(),
        });
      }
      const stats = boardStats.get(source)!;
      stats.views++;
      const jobId = metadata?.jobId;
      if (jobId) stats.jobIds.add(jobId);
    }

    for (const app of applications) {
      const source = app.candidate?.source || "direct";
      if (!boardStats.has(source)) {
        boardStats.set(source, {
          views: 0,
          applications: [],
          jobIds: new Set(),
        });
      }
      boardStats.get(source)!.applications.push(app);
      boardStats.get(source)!.jobIds.add(app.jobId);
    }

    const performance: JobBoardPerformance[] = [];

    for (const [board, stats] of boardStats.entries()) {
      const conversionRate =
        stats.views > 0 ? (stats.applications.length / stats.views) * 100 : 0;

      // Group applications by job for top performing
      const byJob = new Map<string, { title: string; count: number }>();
      for (const app of stats.applications) {
        if (!byJob.has(app.jobId)) {
          byJob.set(app.jobId, { title: app.job.title, count: 0 });
        }
        byJob.get(app.jobId)!.count++;
      }

      const topPerformingJobs = Array.from(byJob.entries())
        .map(([jobId, data]) => ({
          jobId,
          title: data.title,
          applications: data.count,
        }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 3);

      performance.push({
        board,
        totalJobs: stats.jobIds.size,
        totalViews: stats.views,
        totalApplications: stats.applications.length,
        avgConversionRate: Math.round(conversionRate * 100) / 100,
        avgCostPerApplication: 0, // Would need cost data
        avgTimeToFirstApplication: 0, // Would need more data
        topPerformingJobs,
      });
    }

    return performance.sort(
      (a, b) => b.totalApplications - a.totalApplications,
    );
  }

  /**
   * Get source attribution report
   */
  async getSourceAttributionReport(
    tenantId: string,
    dateRange?: { start: Date; end: Date },
  ): Promise<{
    sources: {
      source: string;
      candidates: number;
      applications: number;
      hires: number;
      hiringRate: number;
      avgDaysToHire: number;
    }[];
    totalCandidates: number;
    totalHires: number;
  }> {
    const dateFilter = dateRange
      ? {
          appliedAt: { gte: dateRange.start, lte: dateRange.end },
        }
      : {};

    const applications = await this.prisma.application.findMany({
      where: {
        job: { tenantId },
        ...dateFilter,
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        hiredAt: true,
        candidateId: true,
        candidate: { select: { source: true } },
      },
    });

    const sourceStats = new Map<
      string,
      {
        candidateIds: Set<string>;
        applications: number;
        hires: number;
        hireDays: number[];
      }
    >();

    for (const app of applications) {
      const source = app.candidate?.source || "direct";
      if (!sourceStats.has(source)) {
        sourceStats.set(source, {
          candidateIds: new Set(),
          applications: 0,
          hires: 0,
          hireDays: [],
        });
      }

      const stats = sourceStats.get(source)!;
      stats.candidateIds.add(app.candidateId);
      stats.applications++;

      if ((app.status as string) === "HIRED") {
        stats.hires++;
        if (app.hiredAt) {
          const daysToHire = Math.round(
            (new Date(app.hiredAt).getTime() -
              new Date(app.appliedAt).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          stats.hireDays.push(daysToHire);
        }
      }
    }

    const sources = Array.from(sourceStats.entries()).map(
      ([source, stats]) => ({
        source,
        candidates: stats.candidateIds.size,
        applications: stats.applications,
        hires: stats.hires,
        hiringRate:
          stats.applications > 0
            ? Math.round((stats.hires / stats.applications) * 10000) / 100
            : 0,
        avgDaysToHire:
          stats.hireDays.length > 0
            ? Math.round(
                stats.hireDays.reduce((a, b) => a + b, 0) /
                  stats.hireDays.length,
              )
            : 0,
      }),
    );

    return {
      sources: sources.sort((a, b) => b.applications - a.applications),
      totalCandidates: new Set(applications.map((a) => a.candidateId)).size,
      totalHires: applications.filter((a) => (a.status as string) === "HIRED")
        .length,
    };
  }

  // ==================== HELPERS ====================

  private calculateSourceBreakdown(
    viewEvents: ActivityLogWithMetadata[],
    applications: ApplicationWithSource[],
  ): SourceMetrics[] {
    const sourceStats = new Map<
      string,
      { views: number; applications: ApplicationWithSource[] }
    >();

    for (const view of viewEvents) {
      const metadata = view.metadata as unknown as JobViewMetadata | null;
      const source = metadata?.source || "direct";
      if (!sourceStats.has(source)) {
        sourceStats.set(source, { views: 0, applications: [] });
      }
      sourceStats.get(source)!.views++;
    }

    for (const app of applications) {
      const source = app.source || "direct";
      if (!sourceStats.has(source)) {
        sourceStats.set(source, { views: 0, applications: [] });
      }
      sourceStats.get(source)!.applications.push(app);
    }

    return Array.from(sourceStats.entries())
      .map(([source, stats]) => {
        const conversionRate =
          stats.views > 0 ? (stats.applications.length / stats.views) * 100 : 0;

        // Quality score based on application progress
        const progressedApps = stats.applications.filter(
          (a) => !["NEW", "REJECTED", "WITHDRAWN"].includes(a.status),
        ).length;
        const qualityScore =
          stats.applications.length > 0
            ? (progressedApps / stats.applications.length) * 100
            : 0;

        return {
          source,
          views: stats.views,
          applications: stats.applications.length,
          conversionRate: Math.round(conversionRate * 100) / 100,
          qualityScore: Math.round(qualityScore),
        };
      })
      .sort((a, b) => b.applications - a.applications);
  }

  private calculateDailyMetrics(
    viewEvents: ActivityLogWithMetadata[],
    applications: ApplicationWithSource[],
  ): DailyMetrics[] {
    const last30Days = new Map<
      string,
      { views: number; applications: number }
    >();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      last30Days.set(dateKey, { views: 0, applications: 0 });
    }

    for (const view of viewEvents) {
      const dateKey = new Date(view.createdAt).toISOString().split("T")[0];
      if (last30Days.has(dateKey)) {
        last30Days.get(dateKey)!.views++;
      }
    }

    for (const app of applications) {
      const dateKey = new Date(app.appliedAt).toISOString().split("T")[0];
      if (last30Days.has(dateKey)) {
        last30Days.get(dateKey)!.applications++;
      }
    }

    return Array.from(last30Days.entries()).map(([date, metrics]) => ({
      date,
      views: metrics.views,
      applications: metrics.applications,
    }));
  }
}
