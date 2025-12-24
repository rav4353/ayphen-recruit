import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface FeedbackAnalytics {
  overview: {
    totalInterviews: number;
    totalFeedback: number;
    averageRating: number;
    completionRate: number;
  };
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  recommendationBreakdown: {
    recommendation: string;
    count: number;
    percentage: number;
  }[];
  interviewerPerformance: {
    interviewerId: string;
    interviewerName: string;
    totalInterviews: number;
    averageRating: number;
    feedbackCount: number;
  }[];
  timeAnalysis: {
    byDayOfWeek: { day: string; avgRating: number; count: number }[];
    byTimeOfDay: { period: string; avgRating: number; count: number }[];
  };
  skillsAnalysis: {
    topStrengths: { skill: string; count: number }[];
    topWeaknesses: { skill: string; count: number }[];
  };
  trends: {
    period: string;
    averageRating: number;
    interviewCount: number;
  }[];
}

@Injectable()
export class InterviewAnalyticsService {
  private readonly logger = new Logger(InterviewAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive feedback analytics for a tenant
   */
  async getFeedbackAnalytics(
    tenantId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      jobId?: string;
      interviewerId?: string;
      interviewType?: string;
    },
  ): Promise<FeedbackAnalytics> {
    const dateFilter = {
      ...(filters?.startDate && { gte: filters.startDate }),
      ...(filters?.endDate && { lte: filters.endDate }),
    };

    const whereClause: any = {
      interviewer: { tenantId },
      ...(Object.keys(dateFilter).length > 0 && { scheduledAt: dateFilter }),
      ...(filters?.jobId && { application: { jobId: filters.jobId } }),
      ...(filters?.interviewerId && { interviewerId: filters.interviewerId }),
      ...(filters?.interviewType && { type: filters.interviewType }),
    };

    // Get all interviews with feedback
    const interviews = await this.prisma.interview.findMany({
      where: whereClause,
      include: {
        feedbacks: true,
        interviewer: { select: { id: true, firstName: true, lastName: true } },
        application: { include: { job: { select: { title: true } } } },
      },
    });

    const feedbacks = interviews.flatMap((i) => i.feedbacks);

    // Calculate overview metrics
    const overview = this.calculateOverview(interviews, feedbacks);

    // Rating distribution
    const ratingDistribution = this.calculateRatingDistribution(feedbacks);

    // Recommendation breakdown
    const recommendationBreakdown =
      this.calculateRecommendationBreakdown(feedbacks);

    // Interviewer performance
    const interviewerPerformance =
      this.calculateInterviewerPerformance(interviews);

    // Time analysis
    const timeAnalysis = this.calculateTimeAnalysis(interviews, feedbacks);

    // Skills analysis
    const skillsAnalysis = this.extractSkillsAnalysis(feedbacks);

    // Trends over time
    const trends = this.calculateTrends(interviews, feedbacks);

    return {
      overview,
      ratingDistribution,
      recommendationBreakdown,
      interviewerPerformance,
      timeAnalysis,
      skillsAnalysis,
      trends,
    };
  }

  /**
   * Get analytics for a specific job
   */
  async getJobFeedbackAnalytics(tenantId: string, jobId: string) {
    return this.getFeedbackAnalytics(tenantId, { jobId });
  }

  /**
   * Get analytics for a specific interviewer
   */
  async getInterviewerAnalytics(tenantId: string, interviewerId: string) {
    const analytics = await this.getFeedbackAnalytics(tenantId, {
      interviewerId,
    });

    // Add interviewer-specific insights
    const interviewer = await this.prisma.user.findUnique({
      where: { id: interviewerId },
      select: { firstName: true, lastName: true, email: true },
    });

    const interviewerInsights =
      await this.getInterviewerInsights(interviewerId);

    return {
      interviewer,
      analytics,
      insights: interviewerInsights,
    };
  }

  /**
   * Get hiring funnel analytics
   */
  async getHiringFunnelAnalytics(tenantId: string, jobId?: string) {
    const whereClause: any = {
      job: { tenantId },
      ...(jobId && { jobId }),
    };

    const applications = await this.prisma.application.findMany({
      where: whereClause,
      include: {
        interviews: {
          include: { feedbacks: true },
        },
      },
    });

    const stages = {
      applied: applications.length,
      screened: applications.filter((a) => a.interviews.length > 0).length,
      interviewed: applications.filter((a) =>
        a.interviews.some((i) => i.status === "COMPLETED"),
      ).length,
      positiveRecommendation: applications.filter((a) =>
        a.interviews.some((i) =>
          i.feedbacks.some(
            (f) =>
              f.recommendation === "STRONG_HIRE" || f.recommendation === "HIRE",
          ),
        ),
      ).length,
      offered: applications.filter((a) => (a.status as string) === "OFFERED")
        .length,
      hired: applications.filter((a) => (a.status as string) === "HIRED")
        .length,
    };

    const conversionRates = {
      screenToInterview:
        stages.screened > 0
          ? Math.round((stages.interviewed / stages.screened) * 100)
          : 0,
      interviewToPositive:
        stages.interviewed > 0
          ? Math.round(
              (stages.positiveRecommendation / stages.interviewed) * 100,
            )
          : 0,
      positiveToOffer:
        stages.positiveRecommendation > 0
          ? Math.round((stages.offered / stages.positiveRecommendation) * 100)
          : 0,
      offerToHire:
        stages.offered > 0
          ? Math.round((stages.hired / stages.offered) * 100)
          : 0,
      overallConversion:
        stages.applied > 0
          ? Math.round((stages.hired / stages.applied) * 100)
          : 0,
    };

    return { stages, conversionRates };
  }

  /**
   * Get feedback quality metrics
   */
  async getFeedbackQualityMetrics(tenantId: string) {
    const feedbacks = await this.prisma.interviewFeedback.findMany({
      where: { interview: { interviewer: { tenantId } } },
      include: {
        interview: {
          include: {
            interviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const qualityMetrics = feedbacks.map((f) => {
      let score = 0;

      // Has rating
      if (f.rating) score += 20;
      // Has recommendation
      if (f.recommendation) score += 20;
      // Has strengths
      if (f.strengths && f.strengths.length > 10) score += 20;
      // Has weaknesses
      if (f.weaknesses && f.weaknesses.length > 10) score += 20;
      // Has detailed notes
      if (f.notes && f.notes.length > 50) score += 20;

      return {
        feedbackId: f.id,
        interviewerId: f.interview.interviewerId,
        interviewerName: `${f.interview.interviewer.firstName} ${f.interview.interviewer.lastName}`,
        qualityScore: score,
      };
    });

    // Aggregate by interviewer
    const byInterviewer = new Map<string, { name: string; scores: number[] }>();
    for (const m of qualityMetrics) {
      if (!byInterviewer.has(m.interviewerId)) {
        byInterviewer.set(m.interviewerId, {
          name: m.interviewerName,
          scores: [],
        });
      }
      byInterviewer.get(m.interviewerId)!.scores.push(m.qualityScore);
    }

    const interviewerQuality = Array.from(byInterviewer.entries())
      .map(([id, data]) => ({
        interviewerId: id,
        interviewerName: data.name,
        averageQuality: Math.round(
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        ),
        feedbackCount: data.scores.length,
      }))
      .sort((a, b) => b.averageQuality - a.averageQuality);

    return {
      overallAverageQuality:
        qualityMetrics.length > 0
          ? Math.round(
              qualityMetrics.reduce((a, b) => a + b.qualityScore, 0) /
                qualityMetrics.length,
            )
          : 0,
      totalFeedback: qualityMetrics.length,
      interviewerQuality,
    };
  }

  // ==================== HELPER METHODS ====================

  private calculateOverview(interviews: any[], feedbacks: any[]) {
    const completedInterviews = interviews.filter(
      (i) => i.status === "COMPLETED",
    );
    const interviewsWithFeedback = interviews.filter(
      (i) => i.feedbacks.length > 0,
    );

    const totalRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    const ratedFeedbacks = feedbacks.filter((f) => f.rating);

    return {
      totalInterviews: interviews.length,
      totalFeedback: feedbacks.length,
      averageRating:
        ratedFeedbacks.length > 0
          ? Math.round((totalRating / ratedFeedbacks.length) * 10) / 10
          : 0,
      completionRate:
        completedInterviews.length > 0
          ? Math.round(
              (interviewsWithFeedback.length / completedInterviews.length) *
                100,
            )
          : 0,
    };
  }

  private calculateRatingDistribution(feedbacks: any[]) {
    const distribution = new Map<number, number>();
    for (let i = 1; i <= 5; i++) distribution.set(i, 0);

    const ratedFeedbacks = feedbacks.filter((f) => f.rating);
    for (const f of ratedFeedbacks) {
      const rating = Math.round(f.rating);
      distribution.set(rating, (distribution.get(rating) || 0) + 1);
    }

    const total = ratedFeedbacks.length || 1;
    return Array.from(distribution.entries()).map(([rating, count]) => ({
      rating,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }

  private calculateRecommendationBreakdown(feedbacks: any[]) {
    const recommendations = new Map<string, number>();
    const recommendationLabels = [
      "STRONG_HIRE",
      "HIRE",
      "NO_DECISION",
      "NO_HIRE",
      "STRONG_NO_HIRE",
    ];

    for (const label of recommendationLabels) {
      recommendations.set(label, 0);
    }

    const feedbacksWithRec = feedbacks.filter((f) => f.recommendation);
    for (const f of feedbacksWithRec) {
      recommendations.set(
        f.recommendation,
        (recommendations.get(f.recommendation) || 0) + 1,
      );
    }

    const total = feedbacksWithRec.length || 1;
    return Array.from(recommendations.entries()).map(
      ([recommendation, count]) => ({
        recommendation,
        count,
        percentage: Math.round((count / total) * 100),
      }),
    );
  }

  private calculateInterviewerPerformance(interviews: any[]) {
    const byInterviewer = new Map<
      string,
      {
        name: string;
        interviews: number;
        feedbacks: any[];
      }
    >();

    for (const interview of interviews) {
      const id = interview.interviewerId;
      const name = `${interview.interviewer.firstName} ${interview.interviewer.lastName}`;

      if (!byInterviewer.has(id)) {
        byInterviewer.set(id, { name, interviews: 0, feedbacks: [] });
      }

      const data = byInterviewer.get(id)!;
      data.interviews++;
      data.feedbacks.push(...interview.feedbacks);
    }

    return Array.from(byInterviewer.entries())
      .map(([id, data]) => {
        const ratedFeedbacks = data.feedbacks.filter((f) => f.rating);
        const avgRating =
          ratedFeedbacks.length > 0
            ? ratedFeedbacks.reduce((sum, f) => sum + f.rating, 0) /
              ratedFeedbacks.length
            : 0;

        return {
          interviewerId: id,
          interviewerName: data.name,
          totalInterviews: data.interviews,
          averageRating: Math.round(avgRating * 10) / 10,
          feedbackCount: data.feedbacks.length,
        };
      })
      .sort((a, b) => b.totalInterviews - a.totalInterviews);
  }

  private calculateTimeAnalysis(interviews: any[], feedbacks: any[]) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const periods = ["Morning (9-12)", "Afternoon (12-17)", "Evening (17+)"];

    const byDay = new Map<string, { ratings: number[]; count: number }>();
    const byPeriod = new Map<string, { ratings: number[]; count: number }>();

    for (const day of days) byDay.set(day, { ratings: [], count: 0 });
    for (const period of periods)
      byPeriod.set(period, { ratings: [], count: 0 });

    for (const interview of interviews) {
      const date = new Date(interview.scheduledAt);
      const dayName = days[date.getDay()];
      const hour = date.getHours();

      const dayData = byDay.get(dayName)!;
      dayData.count++;

      let periodName: string;
      if (hour < 12) periodName = periods[0];
      else if (hour < 17) periodName = periods[1];
      else periodName = periods[2];

      const periodData = byPeriod.get(periodName)!;
      periodData.count++;

      for (const feedback of interview.feedbacks) {
        if (feedback.rating) {
          dayData.ratings.push(feedback.rating);
          periodData.ratings.push(feedback.rating);
        }
      }
    }

    const avgRating = (ratings: number[]) =>
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10,
          ) / 10
        : 0;

    return {
      byDayOfWeek: Array.from(byDay.entries()).map(([day, data]) => ({
        day,
        avgRating: avgRating(data.ratings),
        count: data.count,
      })),
      byTimeOfDay: Array.from(byPeriod.entries()).map(([period, data]) => ({
        period,
        avgRating: avgRating(data.ratings),
        count: data.count,
      })),
    };
  }

  private extractSkillsAnalysis(feedbacks: any[]) {
    const strengthsCount = new Map<string, number>();
    const weaknessesCount = new Map<string, number>();

    const commonSkills = [
      "communication",
      "problem solving",
      "technical skills",
      "teamwork",
      "leadership",
      "adaptability",
      "creativity",
      "attention to detail",
      "time management",
      "critical thinking",
      "coding",
      "system design",
      "algorithms",
      "data structures",
      "debugging",
      "testing",
    ];

    for (const feedback of feedbacks) {
      const strengthsText = (feedback.strengths || "").toLowerCase();
      const weaknessesText = (feedback.weaknesses || "").toLowerCase();

      for (const skill of commonSkills) {
        if (strengthsText.includes(skill)) {
          strengthsCount.set(skill, (strengthsCount.get(skill) || 0) + 1);
        }
        if (weaknessesText.includes(skill)) {
          weaknessesCount.set(skill, (weaknessesCount.get(skill) || 0) + 1);
        }
      }
    }

    const topStrengths = Array.from(strengthsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const topWeaknesses = Array.from(weaknessesCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    return { topStrengths, topWeaknesses };
  }

  private calculateTrends(interviews: any[], feedbacks: any[]) {
    const byMonth = new Map<string, { ratings: number[]; count: number }>();

    for (const interview of interviews) {
      const date = new Date(interview.scheduledAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { ratings: [], count: 0 });
      }

      const data = byMonth.get(monthKey)!;
      data.count++;

      for (const feedback of interview.feedbacks) {
        if (feedback.rating) {
          data.ratings.push(feedback.rating);
        }
      }
    }

    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12) // Last 12 months
      .map(([period, data]) => ({
        period,
        averageRating:
          data.ratings.length > 0
            ? Math.round(
                (data.ratings.reduce((a, b) => a + b, 0) /
                  data.ratings.length) *
                  10,
              ) / 10
            : 0,
        interviewCount: data.count,
      }));
  }

  private async getInterviewerInsights(interviewerId: string) {
    const recentFeedbacks = await this.prisma.interviewFeedback.findMany({
      where: { interview: { interviewerId } },
      orderBy: { interview: { scheduledAt: "desc" } },
      take: 20,
      include: {
        interview: {
          include: { application: { include: { job: true } } },
        },
      },
    });

    const insights: string[] = [];

    // Calculate average feedback submission time
    const avgRating =
      recentFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
      (recentFeedbacks.length || 1);

    if (avgRating > 4) {
      insights.push(
        "Consistently provides high ratings - may want to calibrate expectations",
      );
    } else if (avgRating < 2.5) {
      insights.push(
        "Tends to provide lower ratings - consider calibration session",
      );
    }

    // Check feedback completeness
    const incompleteFeedbacks = recentFeedbacks.filter(
      (f) => !f.strengths || !f.weaknesses || !f.recommendation,
    ).length;

    if (incompleteFeedbacks > recentFeedbacks.length * 0.3) {
      insights.push(
        "Often submits incomplete feedback - encourage detailed notes",
      );
    }

    return insights;
  }
}
