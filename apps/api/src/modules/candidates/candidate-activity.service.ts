import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  userId?: string;
  userName?: string;
  createdAt: Date;
}

@Injectable()
export class CandidateActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive activity timeline for a candidate
   */
  async getTimeline(candidateId: string, tenantId: string, options?: {
    limit?: number;
    offset?: number;
    types?: string[];
  }): Promise<{ activities: ActivityItem[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Gather activities from multiple sources
    const activities: ActivityItem[] = [];

    // 1. Activity Logs - primary source
    const activityLogs = await this.prisma.activityLog.findMany({
      where: {
        candidateId,
        ...(options?.types?.length ? { action: { in: options.types } } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const log of activityLogs) {
      activities.push({
        id: log.id,
        type: 'ACTIVITY_LOG',
        action: log.action,
        description: log.description || this.getActionDescription(log.action),
        metadata: log.metadata as Record<string, any>,
        userId: log.userId || undefined,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : undefined,
        createdAt: log.createdAt,
      });
    }

    // 2. Applications - get basic info
    const applications = await this.prisma.application.findMany({
      where: { candidateId },
      select: {
        id: true,
        status: true,
        jobId: true,
        currentStageId: true,
        appliedAt: true,
      },
    });

    // Get job details separately
    const jobIds = applications.map(a => a.jobId);
    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });
    const jobMap = new Map(jobs.map(j => [j.id, j]));

    for (const app of applications) {
      const job = jobMap.get(app.jobId);
      activities.push({
        id: `app-${app.id}`,
        type: 'APPLICATION',
        action: 'APPLICATION_CREATED',
        description: `Applied to ${job?.title || 'job'}`,
        metadata: {
          applicationId: app.id,
          jobId: app.jobId,
          jobTitle: job?.title,
          status: app.status,
        },
        createdAt: app.appliedAt || new Date(),
      });
    }

    // 3. Interviews
    const applicationIds = applications.map(a => a.id);
    const interviews = await this.prisma.interview.findMany({
      where: { applicationId: { in: applicationIds } },
      select: {
        id: true,
        type: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        applicationId: true,
      },
    });

    for (const interview of interviews) {
      const app = applications.find(a => a.id === interview.applicationId);
      const job = app ? jobMap.get(app.jobId) : null;
      
      activities.push({
        id: `int-${interview.id}`,
        type: 'INTERVIEW',
        action: interview.status === 'COMPLETED' ? 'INTERVIEW_COMPLETED' : 'INTERVIEW_SCHEDULED',
        description: interview.status === 'COMPLETED'
          ? `Completed ${interview.type} interview for ${job?.title || 'job'}`
          : `${interview.type} interview scheduled for ${job?.title || 'job'}`,
        metadata: {
          interviewId: interview.id,
          type: interview.type,
          status: interview.status,
          scheduledAt: interview.scheduledAt,
          jobTitle: job?.title,
        },
        createdAt: interview.createdAt,
      });
    }

    // 4. Offers
    const offers = await this.prisma.offer.findMany({
      where: { applicationId: { in: applicationIds } },
      select: {
        id: true,
        status: true,
        salary: true,
        createdAt: true,
        applicationId: true,
      },
    });

    for (const offer of offers) {
      const app = applications.find(a => a.id === offer.applicationId);
      const job = app ? jobMap.get(app.jobId) : null;
      
      activities.push({
        id: `offer-${offer.id}`,
        type: 'OFFER',
        action: `OFFER_${offer.status}`,
        description: `Offer ${offer.status.toLowerCase()} for ${job?.title || 'job'}`,
        metadata: {
          offerId: offer.id,
          status: offer.status,
          salary: offer.salary,
          jobTitle: job?.title,
        },
        createdAt: offer.createdAt,
      });
    }

    // Sort all activities by date
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const total = activities.length;
    const paginated = activities.slice(offset, offset + limit);

    return { activities: paginated, total };
  }

  /**
   * Get activity types for filtering
   */
  getActivityTypes() {
    return [
      { value: 'APPLICATION_CREATED', label: 'Application Submitted', category: 'application' },
      { value: 'APPLICATION_STATUS_CHANGED', label: 'Status Changed', category: 'application' },
      { value: 'STAGE_CHANGED', label: 'Stage Changed', category: 'application' },
      { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', category: 'interview' },
      { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed', category: 'interview' },
      { value: 'FEEDBACK_SUBMITTED', label: 'Feedback Submitted', category: 'interview' },
      { value: 'OFFER_CREATED', label: 'Offer Created', category: 'offer' },
      { value: 'OFFER_ACCEPTED', label: 'Offer Accepted', category: 'offer' },
      { value: 'OFFER_DECLINED', label: 'Offer Declined', category: 'offer' },
      { value: 'NOTE_ADDED', label: 'Note Added', category: 'note' },
      { value: 'TAG_ADDED', label: 'Tag Added', category: 'tag' },
      { value: 'EMAIL_SENT', label: 'Email Sent', category: 'communication' },
      { value: 'EMAIL_OPENED', label: 'Email Opened', category: 'communication' },
    ];
  }

  /**
   * Get activity summary/stats for a candidate
   */
  async getActivitySummary(candidateId: string, tenantId: string) {
    const [
      applicationCount,
      interviewCount,
      offerCount,
      feedbackCount,
    ] = await Promise.all([
      this.prisma.application.count({ where: { candidateId } }),
      this.prisma.interview.count({ where: { application: { candidateId } } }),
      this.prisma.offer.count({ where: { application: { candidateId } } }),
      this.prisma.interviewFeedback.count({ where: { interview: { application: { candidateId } } } }),
    ]);

    // Get latest activity
    const latestActivity = await this.prisma.activityLog.findFirst({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      totalApplications: applicationCount,
      totalInterviews: interviewCount,
      totalOffers: offerCount,
      totalFeedback: feedbackCount,
      lastActivityAt: latestActivity?.createdAt,
    };
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'CANDIDATE_CREATED': 'Candidate profile created',
      'CANDIDATE_UPDATED': 'Candidate profile updated',
      'APPLICATION_CREATED': 'Applied to job',
      'APPLICATION_STATUS_CHANGED': 'Application status changed',
      'STAGE_CHANGED': 'Moved to new stage',
      'INTERVIEW_SCHEDULED': 'Interview scheduled',
      'INTERVIEW_COMPLETED': 'Interview completed',
      'INTERVIEW_CANCELLED': 'Interview cancelled',
      'FEEDBACK_SUBMITTED': 'Interview feedback submitted',
      'OFFER_CREATED': 'Offer extended',
      'OFFER_ACCEPTED': 'Offer accepted',
      'OFFER_DECLINED': 'Offer declined',
      'NOTE_ADDED': 'Note added',
      'TAG_ADDED': 'Tag added',
      'EMAIL_SENT': 'Email sent',
      'EMAIL_OPENED': 'Email opened',
      'REFERRAL_CREATED': 'Referred by employee',
    };

    return descriptions[action] || action.replace(/_/g, ' ').toLowerCase();
  }
}
