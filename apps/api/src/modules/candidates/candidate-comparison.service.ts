import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CandidateComparisonData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentTitle?: string;
  skills: string[];
  applications: {
    jobTitle: string;
    stage: string;
    status: string;
    appliedAt: string;
  }[];
  interviews: {
    type: string;
    status: string;
    scheduledAt: string;
    avgRating?: number;
  }[];
  assessments: {
    name: string;
    score: number;
    maxScore: number;
    completedAt: string;
  }[];
  overallScore: number;
  averageInterviewRating: number;
}

@Injectable()
export class CandidateComparisonService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compare multiple candidates side-by-side
   */
  async compareCandidates(candidateIds: string[], tenantId: string): Promise<CandidateComparisonData[]> {
    if (candidateIds.length < 2 || candidateIds.length > 5) {
      throw new BadRequestException('Please select between 2 and 5 candidates to compare');
    }

    const candidates = await this.prisma.candidate.findMany({
      where: {
        id: { in: candidateIds },
        tenantId,
      },
    });

    if (candidates.length !== candidateIds.length) {
      throw new NotFoundException('One or more candidates not found');
    }

    const comparisonData: CandidateComparisonData[] = [];

    for (const candidate of candidates) {
      // Get applications for this candidate
      const applications = await this.prisma.application.findMany({
        where: { candidateId: candidate.id },
        include: {
          job: { select: { title: true } },
          currentStage: { select: { name: true } },
          interviews: {
            include: {
              feedbacks: true,
            },
          },
        },
      });

      // Calculate metrics
      const allInterviews = applications.flatMap(app => app.interviews);
      const allFeedbacks = allInterviews.flatMap(i => i.feedbacks || []);
      const feedbackWithRatings = allFeedbacks.filter(f => f.rating);
      
      const avgRating = feedbackWithRatings.length > 0
        ? feedbackWithRatings.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackWithRatings.length
        : 0;

      // Get assessments from activity logs
      const assessmentLogs = await this.prisma.activityLog.findMany({
        where: {
          candidateId: candidate.id,
          action: 'ASSESSMENT_COMPLETED',
        },
      });

      const assessments = assessmentLogs.map(log => {
        const meta = log.metadata as any;
        return {
          name: meta?.assessmentName || 'Assessment',
          score: meta?.score || 0,
          maxScore: meta?.maxScore || 100,
          completedAt: log.createdAt.toISOString(),
        };
      });

      // Calculate overall score (weighted average)
      const assessmentScore = assessments.length > 0
        ? assessments.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / assessments.length
        : 0;
      
      const overallScore = Math.round(
        (avgRating * 20) * 0.6 + // Interview ratings (60% weight)
        assessmentScore * 0.4    // Assessment scores (40% weight)
      );

      comparisonData.push({
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        phone: candidate.phone || undefined,
        location: candidate.location || undefined,
        currentTitle: candidate.currentTitle || undefined,
        skills: candidate.skills || [],
        applications: applications.map(app => ({
          jobTitle: app.job.title,
          stage: app.currentStage?.name || 'Unknown',
          status: app.status,
          appliedAt: app.appliedAt.toISOString(),
        })),
        interviews: allInterviews.map(i => {
          const intFeedbacks = i.feedbacks || [];
          const intAvgRating = intFeedbacks.length > 0
            ? intFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / intFeedbacks.length
            : undefined;
          return {
            type: i.type,
            status: i.status,
            scheduledAt: i.scheduledAt.toISOString(),
            avgRating: intAvgRating,
          };
        }),
        assessments,
        overallScore,
        averageInterviewRating: Math.round(avgRating * 10) / 10,
      });
    }

    // Sort by overall score descending
    return comparisonData.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get comparison for candidates in a specific job
   */
  async compareJobCandidates(jobId: string, tenantId: string, limit = 5): Promise<CandidateComparisonData[]> {
    const applications = await this.prisma.application.findMany({
      where: {
        jobId,
        job: { tenantId },
        status: { in: ['APPLIED', 'SCREENING', 'INTERVIEW'] },
      },
      select: { candidateId: true },
      take: limit,
    });

    if (applications.length < 2) {
      throw new NotFoundException('Not enough candidates to compare');
    }

    const candidateIds = applications.map(a => a.candidateId);
    return this.compareCandidates(candidateIds, tenantId);
  }

  /**
   * Get comparison metrics summary
   */
  async getComparisonSummary(candidateIds: string[], tenantId: string) {
    const comparison = await this.compareCandidates(candidateIds, tenantId);

    return {
      candidates: comparison.map(c => ({
        id: c.id,
        name: c.name,
        overallScore: c.overallScore,
        averageInterviewRating: c.averageInterviewRating,
      })),
      topCandidate: comparison[0],
      metrics: {
        avgInterviewRating: comparison.reduce((sum, c) => sum + c.averageInterviewRating, 0) / comparison.length,
        avgOverallScore: comparison.reduce((sum, c) => sum + c.overallScore, 0) / comparison.length,
      },
    };
  }
}
