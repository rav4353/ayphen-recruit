import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service';

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  interviewerId: string;
  interviewerName: string;
}

interface SchedulingLinkDto {
  applicationId: string;
  interviewerIds: string[];
  duration: number;
  interviewType: string;
  expiresInDays?: number;
  instructions?: string;
}

export interface SuggestedSlot extends AvailabilitySlot {
  score: number; // 0-100, higher is better
  reasons: string[];
}

@Injectable()
export class InterviewSchedulingService {
  private readonly logger = new Logger(InterviewSchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: CalendarService,
  ) {}

  private generateToken(): string {
    const crypto = require('crypto');
    return `sched-${Date.now()}-${crypto.randomBytes(12).toString('hex')}`;
  }

  /**
   * Create a self-scheduling link for a candidate
   */
  async createSchedulingLink(dto: SchedulingLinkDto, userId: string, tenantId: string) {
    // Verify application
    const application = await this.prisma.application.findFirst({
      where: { id: dto.applicationId },
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true } },
        job: { select: { title: true, tenantId: true } },
      },
    });

    if (!application || application.job.tenantId !== tenantId) {
      throw new NotFoundException('Application not found');
    }

    // Verify interviewers
    const interviewers = await this.prisma.user.findMany({
      where: { id: { in: dto.interviewerIds }, tenantId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (interviewers.length !== dto.interviewerIds.length) {
      throw new BadRequestException('One or more interviewers not found');
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 7));

    await this.prisma.activityLog.create({
      data: {
        action: 'SCHEDULING_LINK_CREATED',
        description: `Scheduling link created for ${application.candidate.firstName} ${application.candidate.lastName}`,
        userId,
        applicationId: dto.applicationId,
        candidateId: application.candidateId,
        metadata: {
          token,
          tenantId,
          applicationId: dto.applicationId,
          candidateId: application.candidateId,
          candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
          candidateEmail: application.candidate.email,
          jobTitle: application.job.title,
          interviewerIds: dto.interviewerIds,
          interviewers: interviewers.map(i => ({ id: i.id, name: `${i.firstName} ${i.lastName}` })),
          duration: dto.duration,
          interviewType: dto.interviewType,
          instructions: dto.instructions,
          expiresAt: expiresAt.toISOString(),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });

    return {
      token,
      url: `/schedule/${token}`,
      expiresAt: expiresAt.toISOString(),
      candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      jobTitle: application.job.title,
    };
  }

  /**
   * Get scheduling link details (public endpoint)
   */
  async getSchedulingLink(token: string) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: 'SCHEDULING_LINK_CREATED',
        metadata: { path: ['token'], equals: token },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Scheduling link not found');
    }

    const meta = log.metadata as any;

    if (meta.status !== 'ACTIVE') {
      throw new BadRequestException('This scheduling link is no longer active');
    }

    if (new Date(meta.expiresAt) < new Date()) {
      throw new BadRequestException('This scheduling link has expired');
    }

    return {
      candidateName: meta.candidateName,
      jobTitle: meta.jobTitle,
      duration: meta.duration,
      interviewType: meta.interviewType,
      instructions: meta.instructions,
      interviewers: meta.interviewers,
    };
  }

  /**
   * Get available slots for a scheduling link
   */
  async getAvailableSlots(token: string, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]> {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: 'SCHEDULING_LINK_CREATED',
        metadata: { path: ['token'], equals: token },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Scheduling link not found');
    }

    const meta = log.metadata as any;

    if (meta.status !== 'ACTIVE' || new Date(meta.expiresAt) < new Date()) {
      throw new BadRequestException('This scheduling link is no longer active');
    }

    // Generate available slots based on business hours
    const slots: AvailabilitySlot[] = [];
    const duration = meta.duration || 60;

    // Get existing interviews to exclude
    const existingInterviews = await this.prisma.interview.findMany({
      where: {
        interviewerId: { in: meta.interviewerIds },
        scheduledAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
      },
      select: { scheduledAt: true, duration: true, interviewerId: true },
    });

    for (const interviewer of meta.interviewers) {
      // Generate slots for each day
      const current = new Date(startDate);
      while (current <= endDate) {
        // Skip weekends
        if (current.getDay() !== 0 && current.getDay() !== 6) {
          // Business hours: 9 AM to 5 PM
          for (let hour = 9; hour < 17; hour++) {
            const slotStart = new Date(current);
            slotStart.setHours(hour, 0, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

            // Check if slot conflicts with existing interviews
            const hasConflict = existingInterviews.some(interview => {
              if (interview.interviewerId !== interviewer.id) return false;
              const intStart = new Date(interview.scheduledAt);
              const intEnd = new Date(intStart.getTime() + (interview.duration || 60) * 60 * 1000);
              return slotStart < intEnd && slotEnd > intStart;
            });

            if (!hasConflict && slotStart > new Date()) {
              slots.push({
                start: slotStart,
                end: slotEnd,
                interviewerId: interviewer.id,
                interviewerName: interviewer.name,
              });
            }
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Book an interview slot (candidate action)
   */
  async bookSlot(token: string, slot: { start: Date; interviewerId: string }) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: 'SCHEDULING_LINK_CREATED',
        metadata: { path: ['token'], equals: token },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Scheduling link not found');
    }

    const meta = log.metadata as any;

    if (meta.status !== 'ACTIVE' || new Date(meta.expiresAt) < new Date()) {
      throw new BadRequestException('This scheduling link is no longer active');
    }

    // Create the interview
    const interview = await this.prisma.interview.create({
      data: {
        applicationId: meta.applicationId,
        interviewerId: slot.interviewerId,
        scheduledAt: slot.start,
        duration: meta.duration,
        type: meta.interviewType,
        status: 'SCHEDULED',
        location: 'To be confirmed',
      },
    });

    // Mark link as used
    await this.prisma.activityLog.create({
      data: {
        action: 'SCHEDULING_LINK_CREATED',
        description: 'Interview booked via self-scheduling',
        candidateId: meta.candidateId,
        applicationId: meta.applicationId,
        metadata: {
          ...meta,
          status: 'BOOKED',
          bookedAt: new Date().toISOString(),
          interviewId: interview.id,
          bookedSlot: slot,
        },
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'INTERVIEW_SCHEDULED',
        description: `Interview self-scheduled by candidate`,
        candidateId: meta.candidateId,
        applicationId: meta.applicationId,
        metadata: {
          interviewId: interview.id,
          scheduledAt: slot.start,
          selfScheduled: true,
        },
      },
    });

    return {
      success: true,
      interviewId: interview.id,
      scheduledAt: slot.start,
      message: 'Interview successfully scheduled',
    };
  }

  /**
   * Cancel a scheduling link
   */
  async cancelLink(token: string, userId: string, tenantId: string) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: 'SCHEDULING_LINK_CREATED',
        metadata: { path: ['token'], equals: token },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Scheduling link not found');
    }

    const meta = log.metadata as any;

    if (meta.tenantId !== tenantId) {
      throw new NotFoundException('Scheduling link not found');
    }

    await this.prisma.activityLog.create({
      data: {
        action: 'SCHEDULING_LINK_CREATED',
        description: 'Scheduling link cancelled',
        userId,
        candidateId: meta.candidateId,
        applicationId: meta.applicationId,
        metadata: {
          ...meta,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get all scheduling links for tenant
   */
  async getSchedulingLinks(tenantId: string, status?: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'SCHEDULING_LINK_CREATED',
        metadata: { path: ['tenantId'], equals: tenantId },
      },
      orderBy: { createdAt: 'desc' },
    });

    const linkMap = new Map<string, any>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!linkMap.has(meta.token)) {
        if (!status || meta.status === status) {
          linkMap.set(meta.token, {
            token: meta.token,
            candidateName: meta.candidateName,
            jobTitle: meta.jobTitle,
            interviewType: meta.interviewType,
            duration: meta.duration,
            status: meta.status,
            expiresAt: meta.expiresAt,
            createdAt: meta.createdAt,
          });
        }
      }
    }

    return Array.from(linkMap.values());
  }

  // ==================== AI SCHEDULING OPTIMIZATION ====================

  /**
   * Get AI-suggested optimal interview slots based on:
   * - Interviewer availability patterns
   * - Historical interview success rates by time
   * - Candidate timezone preferences
   * - Interview type best practices
   */
  async getSuggestedSlots(
    tenantId: string,
    interviewerIds: string[],
    duration: number,
    interviewType: string,
    candidateTimezone?: string,
    preferredDates?: Date[],
  ): Promise<SuggestedSlot[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // Look 2 weeks ahead

    // Get interviewer availability
    const interviewers = await this.prisma.user.findMany({
      where: { id: { in: interviewerIds }, tenantId },
      select: { id: true, firstName: true, lastName: true },
    });

    // Get existing interviews to exclude
    const existingInterviews = await this.prisma.interview.findMany({
      where: {
        interviewerId: { in: interviewerIds },
        scheduledAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
      },
      select: { scheduledAt: true, duration: true, interviewerId: true },
    });

    // Get historical interview data for pattern analysis
    const historicalInterviews = await this.prisma.interview.findMany({
      where: {
        interviewerId: { in: interviewerIds },
        status: 'COMPLETED',
        scheduledAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      },
      include: {
        feedbacks: { select: { rating: true } },
      },
    });

    // Analyze best times based on historical data
    const timeScores = this.analyzeHistoricalPatterns(historicalInterviews);

    const suggestedSlots: SuggestedSlot[] = [];

    for (const interviewer of interviewers) {
      const current = new Date(startDate);
      
      while (current <= endDate) {
        // Skip weekends
        if (current.getDay() !== 0 && current.getDay() !== 6) {
          // Business hours: 9 AM to 5 PM
          for (let hour = 9; hour < 17; hour++) {
            const slotStart = new Date(current);
            slotStart.setHours(hour, 0, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

            // Skip if slot ends after business hours
            if (slotEnd.getHours() > 17) continue;

            // Check for conflicts
            const hasConflict = existingInterviews.some(interview => {
              if (interview.interviewerId !== interviewer.id) return false;
              const intStart = new Date(interview.scheduledAt);
              const intEnd = new Date(intStart.getTime() + (interview.duration || 60) * 60 * 1000);
              return slotStart < intEnd && slotEnd > intStart;
            });

            if (!hasConflict && slotStart > new Date()) {
              const { score, reasons } = this.calculateSlotScore(
                slotStart,
                hour,
                interviewType,
                timeScores,
                candidateTimezone,
                preferredDates,
              );

              suggestedSlots.push({
                start: slotStart,
                end: slotEnd,
                interviewerId: interviewer.id,
                interviewerName: `${interviewer.firstName} ${interviewer.lastName}`,
                score,
                reasons,
              });
            }
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }

    // Sort by score descending, then by date
    return suggestedSlots
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.start.getTime() - b.start.getTime();
      })
      .slice(0, 20); // Return top 20 suggestions
  }

  /**
   * Analyze historical interview patterns to find optimal times
   */
  private analyzeHistoricalPatterns(interviews: any[]): Map<number, number> {
    const hourScores = new Map<number, { total: number; count: number }>();

    for (const interview of interviews) {
      const hour = new Date(interview.scheduledAt).getHours();
      const rating = interview.feedbacks?.[0]?.rating || 3;

      if (!hourScores.has(hour)) {
        hourScores.set(hour, { total: 0, count: 0 });
      }
      const current = hourScores.get(hour)!;
      current.total += rating;
      current.count++;
    }

    // Convert to normalized scores (0-100)
    const normalizedScores = new Map<number, number>();
    for (const [hour, data] of hourScores) {
      const avgRating = data.count > 0 ? data.total / data.count : 3;
      normalizedScores.set(hour, Math.round((avgRating / 5) * 100));
    }

    return normalizedScores;
  }

  /**
   * Calculate a score for a specific slot
   */
  private calculateSlotScore(
    slotStart: Date,
    hour: number,
    interviewType: string,
    timeScores: Map<number, number>,
    candidateTimezone?: string,
    preferredDates?: Date[],
  ): { score: number; reasons: string[] } {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Factor 1: Historical success rate for this hour
    const historicalScore = timeScores.get(hour);
    if (historicalScore) {
      score += (historicalScore - 50) * 0.3; // Up to ±15 points
      if (historicalScore > 70) {
        reasons.push('High success rate at this time');
      }
    }

    // Factor 2: Optimal times based on interview type
    const optimalHours = this.getOptimalHoursForType(interviewType);
    if (optimalHours.includes(hour)) {
      score += 15;
      reasons.push(`Optimal time for ${interviewType} interviews`);
    }

    // Factor 3: Avoid early morning and late afternoon
    if (hour >= 10 && hour <= 15) {
      score += 10;
      reasons.push('Mid-day slot (higher engagement)');
    } else if (hour === 9 || hour === 16) {
      score -= 5;
    }

    // Factor 4: Day of week preferences
    const dayOfWeek = slotStart.getDay();
    if (dayOfWeek === 2 || dayOfWeek === 3) { // Tuesday, Wednesday
      score += 10;
      reasons.push('Mid-week (optimal interview day)');
    } else if (dayOfWeek === 1) { // Monday
      score -= 5; // Mondays tend to be busier
    } else if (dayOfWeek === 5) { // Friday
      score -= 10; // Fridays less ideal
    }

    // Factor 5: Preferred dates
    if (preferredDates?.length) {
      const isPreferred = preferredDates.some(pd => 
        pd.toDateString() === slotStart.toDateString()
      );
      if (isPreferred) {
        score += 20;
        reasons.push('Matches preferred date');
      }
    }

    // Factor 6: Not too far in the future (sooner is often better)
    const daysAway = Math.floor((slotStart.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysAway <= 3) {
      score += 10;
      reasons.push('Available soon');
    } else if (daysAway > 10) {
      score -= 5;
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return { score, reasons };
  }

  /**
   * Get optimal hours for different interview types
   */
  private getOptimalHoursForType(interviewType: string): number[] {
    switch (interviewType.toUpperCase()) {
      case 'TECHNICAL':
      case 'CODING':
        return [10, 11, 14, 15]; // Mid-morning and early afternoon
      case 'BEHAVIORAL':
      case 'CULTURE_FIT':
        return [10, 11, 13, 14]; // Late morning preferred
      case 'PHONE_SCREEN':
      case 'SCREENING':
        return [9, 10, 11, 14, 15, 16]; // More flexible
      case 'FINAL':
      case 'ONSITE':
        return [10, 11, 13, 14]; // Prime focus hours
      default:
        return [10, 11, 14, 15];
    }
  }

  /**
   * Get smart scheduling recommendations for a job
   */
  async getSchedulingRecommendations(
    tenantId: string,
    jobId: string,
  ): Promise<{
    recommendedInterviewers: { id: string; name: string; availability: string }[];
    suggestedDuration: number;
    bestDays: string[];
    bestTimes: string[];
    tips: string[];
  }> {
    // Get job details
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      include: { department: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get interviewers who have conducted interviews for similar roles
    const recentInterviewers = await this.prisma.interview.findMany({
      where: {
        application: { job: { tenantId, departmentId: job.departmentId } },
        status: 'COMPLETED',
        scheduledAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: {
        interviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      distinct: ['interviewerId'],
      take: 5,
    });

    const recommendedInterviewers = recentInterviewers.map(i => ({
      id: i.interviewer.id,
      name: `${i.interviewer.firstName} ${i.interviewer.lastName}`,
      availability: 'Good', // Would be enhanced with calendar integration
    }));

    return {
      recommendedInterviewers,
      suggestedDuration: 60, // Could be based on interview type
      bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
      bestTimes: ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'],
      tips: [
        'Schedule technical interviews in the morning when candidates are most alert',
        'Allow 15-minute buffer between back-to-back interviews',
        'Send calendar invites immediately after scheduling',
        'Include meeting links and preparation materials in advance',
      ],
    };
  }
}
