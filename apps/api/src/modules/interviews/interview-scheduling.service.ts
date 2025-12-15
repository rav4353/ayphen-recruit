import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class InterviewSchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: CalendarService,
  ) {}

  private generateToken(): string {
    return `sched-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
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
}
