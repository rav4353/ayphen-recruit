import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { UpdateInterviewDto } from "./dto/update-interview.dto";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { UpdateFeedbackDto } from "./dto/update-feedback.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { CalendarService } from "../calendar/calendar.service";

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly calendarService: CalendarService,
  ) { }

  async create(
    dto: CreateInterviewDto,
    tenantId: string,
    createdByUserId?: string,
  ) {
    // Verify application exists and belongs to tenant
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: { job: true, candidate: true },
    });

    if (!application || application.job.tenantId !== tenantId) {
      throw new NotFoundException("Application not found");
    }

    // Verify interviewer exists and belongs to tenant
    const interviewer = await this.prisma.user.findUnique({
      where: { id: dto.interviewerId },
    });

    if (!interviewer || interviewer.tenantId !== tenantId) {
      throw new NotFoundException("Interviewer not found");
    }

    // Generate unique confirmation token
    const crypto = require("crypto");
    const confirmationToken = crypto.randomBytes(32).toString("hex");

    // Create interview
    const interview = await this.prisma.interview.create({
      data: {
        ...dto,
        status: "PENDING_CONFIRMATION",
        confirmationToken,
      },
      include: {
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        application: {
          select: {
            id: true,
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
                tenantId: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_SCHEDULED",
        description: `Interview proposed to ${application.candidate?.firstName} ${application.candidate?.lastName} for ${application.job.title}`,
        userId: createdByUserId || dto.interviewerId,
        applicationId: dto.applicationId,
        candidateId: application.candidateId,
        metadata: {
          interviewId: interview.id,
          confirmationToken,
          status: "PENDING_CONFIRMATION",
        },
      },
    });

    // Send notification to interviewer
    try {
      const interviewWithCandidate = {
        ...interview,
        candidate: application.candidate,
      };
      await this.notificationsService.notifyInterviewScheduled(
        interviewWithCandidate,
        [dto.interviewerId],
        tenantId,
      );
    } catch (error) {
      this.logger.error("Failed to send interviewer notification:", error);
    }

    // Send invitation email to candidate with acceptance button
    try {
      await this.notifyCandidateForInterview(interview, tenantId);
    } catch (error) {
      this.logger.error("Failed to send candidate invitation email:", error);
    }

    // Calendar sync is skipped here. It will be triggered once the candidate accepts.
    return interview;
  }

  /**
   * Send interview invitation email to candidate
   */
  private async notifyCandidateForInterview(interview: any, tenantId: string) {
    // This will use the email templates service to send an invitation
    // For now we can use a direct notification or a generic helper
    // We'll need to define how to generate the confirmation link
    const baseUrl = process.env.WEB_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/interviews/confirm/${interview.confirmationToken}`;

    // Note: In a real system, we might want to use a specific email template
    // For this task, we'll implement the notification logic here or in NotificationsService
    return this.notificationsService.notifyCandidateInterviewInvitation(
      interview,
      confirmUrl,
      tenantId,
    );
  }

  /**
   * Sync interview to interviewer's connected calendar
   */
  async syncInterviewToCalendar(
    interview: any,
    interviewer: any,
    application: any,
    tenantId: string,
  ) {
    // Check if interviewer has a connected calendar
    const calendarConnection = await this.prisma.calendarConnection.findFirst({
      where: {
        userId: interviewer.id,
        isActive: true,
      },
    });

    if (!calendarConnection) {
      return null;
    }

    const candidateName =
      `${application.candidate?.firstName || ""} ${application.candidate?.lastName || ""}`.trim();
    const jobTitle = application.job?.title || "Position";

    const eventData = {
      summary: `Interview: ${candidateName} - ${jobTitle}`,
      description: `Interview with ${candidateName} for ${jobTitle}\n\nType: ${interview.type || "Interview"}\nLocation: ${interview.location || "TBD"}\nMeeting Link: ${interview.meetingLink || "N/A"}`,
      start: new Date(interview.scheduledAt),
      end: new Date(
        new Date(interview.scheduledAt).getTime() +
        (interview.duration || 60) * 60000,
      ),
      location: interview.location || interview.meetingLink,
      attendees: application.candidate?.email
        ? [{ email: application.candidate.email }]
        : [],
    };

    const calendarEvent = await this.calendarService.createEvent(
      interviewer.id,
      {
        title: eventData.summary,
        description: eventData.description,
        startTime: eventData.start.toISOString(),
        endTime: eventData.end.toISOString(),
        location: eventData.location,
        attendees: eventData.attendees?.map((a: any) => a.email),
        interviewId: interview.id,
      },
    );

    // Store calendar event ID for future updates/cancellations
    if (calendarEvent?.event?.id) {
      await this.prisma.interview.update({
        where: { id: interview.id },
        data: {
          calendarEvents: {
            connect: { id: calendarEvent.event.id },
          },
        },
      });
    }

    return calendarEvent;
  }

  /**
   * Confirm an interview by candidate using a token
   */
  async confirmInterview(token: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { confirmationToken: token },
      include: {
        interviewer: true,
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException("Invalid or expired confirmation token");
    }

    if (interview.status !== "PENDING_CONFIRMATION") {
      return {
        success: true,
        message: "Interview is already confirmed or processed",
        interview,
      };
    }

    // Update interview status
    const updatedInterview = await this.prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: "CONFIRMED",
        confirmationToken: null, // Clear the token after use
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_CONFIRMED",
        description: `Candidate confirmed the interview for ${new Date(interview.scheduledAt).toLocaleString()}`,
        candidateId: (interview as any).application.candidateId,
        applicationId: interview.applicationId,
        metadata: { interviewId: interview.id },
      },
    });

    // NOW sync to calendar
    try {
      await this.syncInterviewToCalendar(
        interview as any,
        (interview as any).interviewer,
        (interview as any).application,
        (interview as any).application.job.tenantId,
      );
    } catch (error) {
      this.logger.error(
        "Failed to sync confirmed interview to calendar:",
        error,
      );
    }

    // Send confirmation notification to interviewer
    try {
      await this.notificationsService.create({
        type: "INTERVIEW" as any,
        title: "Interview Confirmed",
        message: `${(interview as any).application.candidate.firstName} has confirmed the interview for ${new Date(interview.scheduledAt).toLocaleString()}`,
        link: `/interviews`,
        userId: interview.interviewerId,
        tenantId: (interview as any).application.job.tenantId,
      });
    } catch (error) {
      this.logger.error(
        "Failed to notify interviewer about confirmation:",
        error,
      );
    }

    return {
      success: true,
      message: "Interview confirmed successfully",
      interview: updatedInterview,
    };
  }

  /**
   * Get available time slots for an interviewer
   */
  /**
   * Create a self-scheduling link for candidates
   */
  async createSchedulingLink(
    applicationId: string,
    interviewerIds: string[],
    tenantId: string,
    options: {
      type: string;
      duration: number;
      dateRangeStart: Date;
      dateRangeEnd: Date;
      meetingLink?: string;
      location?: string;
      notes?: string;
    },
  ) {
    // Verify application exists
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { tenantId } },
      include: { candidate: true, job: true },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    // Generate unique token for self-scheduling
    const crypto = require("crypto");
    const token = `sched_${crypto.randomBytes(12).toString("hex")}_${Date.now().toString(36)}`;

    // Store scheduling request
    const schedulingRequest = await this.prisma.activityLog.create({
      data: {
        action: "SELF_SCHEDULING_CREATED",
        description: `Self-scheduling link created for ${application.candidate.firstName} ${application.candidate.lastName}`,
        applicationId,
        candidateId: application.candidateId,
        metadata: {
          token,
          interviewerIds,
          type: options.type,
          duration: options.duration,
          dateRangeStart: options.dateRangeStart.toISOString(),
          dateRangeEnd: options.dateRangeEnd.toISOString(),
          meetingLink: options.meetingLink,
          location: options.location,
          notes: options.notes,
          status: "PENDING",
          expiresAt: options.dateRangeEnd.toISOString(),
        },
      },
    });

    return {
      token,
      schedulingUrl: `/interviews/self-schedule/${token}`,
      expiresAt: options.dateRangeEnd,
      candidate: {
        name: `${application.candidate.firstName} ${application.candidate.lastName}`,
        email: application.candidate.email,
      },
      jobTitle: application.job.title,
    };
  }

  /**
   * Get available slots for self-scheduling (public endpoint)
   */
  async getSelfScheduleSlots(token: string) {
    // Find the scheduling request
    const request = await this.prisma.activityLog.findFirst({
      where: {
        action: "SELF_SCHEDULING_CREATED",
        metadata: { path: ["token"], equals: token },
      },
      include: {
        application: {
          include: { candidate: true, job: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Invalid or expired scheduling link");
    }

    const metadata = request.metadata as any;

    if (metadata.status === "COMPLETED") {
      throw new NotFoundException("This scheduling link has already been used");
    }

    if (new Date(metadata.expiresAt) < new Date()) {
      throw new NotFoundException("This scheduling link has expired");
    }

    const interviewerIds = metadata.interviewerIds || [];
    const duration = metadata.duration || 60;
    const startDate = new Date(metadata.dateRangeStart);
    const endDate = new Date(metadata.dateRangeEnd);

    // Get available slots for each day in the range
    const allSlots: { date: string; slots: { start: Date; end: Date }[] }[] =
      [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Find common availability across all interviewers
        const daySlots = await this.getCommonAvailability(
          interviewerIds,
          currentDate.toISOString().split("T")[0],
          duration,
        );

        if (daySlots.length > 0) {
          allSlots.push({
            date: currentDate.toISOString().split("T")[0],
            slots: daySlots,
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      candidate: {
        firstName: request.application?.candidate?.firstName,
        lastName: request.application?.candidate?.lastName,
      },
      jobTitle: request.application?.job?.title,
      duration: metadata.duration,
      type: metadata.type,
      location: metadata.location,
      availableDays: allSlots,
    };
  }

  /**
   * Book a slot through self-scheduling
   */
  async bookSelfScheduleSlot(
    token: string,
    selectedSlot: { date: string; startTime: string },
  ) {
    // Find the scheduling request
    const request = await this.prisma.activityLog.findFirst({
      where: {
        action: "SELF_SCHEDULING_CREATED",
        metadata: { path: ["token"], equals: token },
      },
      include: {
        application: {
          include: { candidate: true, job: { include: { tenant: true } } },
        },
      },
    });

    if (!request || !request.application) {
      throw new NotFoundException("Invalid scheduling link");
    }

    const metadata = request.metadata as any;

    if (metadata.status === "COMPLETED") {
      throw new NotFoundException("This slot has already been booked");
    }

    const interviewerIds = metadata.interviewerIds || [];
    const primaryInterviewerId = interviewerIds[0];

    if (!primaryInterviewerId) {
      throw new NotFoundException("No interviewer available");
    }

    // Create the interview
    const scheduledAt = new Date(
      `${selectedSlot.date}T${selectedSlot.startTime}`,
    );

    const interview = await this.prisma.interview.create({
      data: {
        applicationId: request.applicationId!,
        interviewerId: primaryInterviewerId,
        type: metadata.type || "VIDEO",
        scheduledAt,
        duration: metadata.duration || 60,
        location: metadata.location,
        meetingLink: metadata.meetingLink,
        notes: metadata.notes,
        status: "SCHEDULED",
      },
      include: {
        interviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Update scheduling request status
    await this.prisma.activityLog.update({
      where: { id: request.id },
      data: {
        metadata: {
          ...metadata,
          status: "COMPLETED",
          bookedSlot: selectedSlot,
          interviewId: interview.id,
        },
      },
    });

    // Log the booking
    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_SELF_SCHEDULED",
        description: `${request.application.candidate.firstName} ${request.application.candidate.lastName} self-scheduled interview for ${scheduledAt.toLocaleString()}`,
        applicationId: request.applicationId!,
        candidateId: request.application.candidateId,
      },
    });

    // Sync to calendar if interviewer has connected calendar
    try {
      const interviewer = await this.prisma.user.findUnique({
        where: { id: primaryInterviewerId },
      });

      if (interviewer) {
        await this.syncInterviewToCalendar(
          interview,
          interviewer,
          request.application,
          request.application.job.tenantId,
        );
      }
    } catch (error) {
      console.error(
        "Failed to sync self-scheduled interview to calendar:",
        error,
      );
    }

    return {
      success: true,
      interview: {
        id: interview.id,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        type: interview.type,
        interviewer: interview.interviewer,
      },
    };
  }

  /**
   * Get common availability across multiple interviewers
   */
  private async getCommonAvailability(
    interviewerIds: string[],
    date: string,
    duration: number,
  ): Promise<{ start: Date; end: Date }[]> {
    if (interviewerIds.length === 0) return [];

    // Get slots for each interviewer
    const allInterviewerSlots: { start: Date; end: Date }[][] = [];

    for (const interviewerId of interviewerIds) {
      const interviewer = await this.prisma.user.findUnique({
        where: { id: interviewerId },
        select: { tenantId: true },
      });

      if (interviewer) {
        const slots = await this.getAvailableSlots(
          interviewerId,
          interviewer.tenantId,
          date,
          duration,
        );
        allInterviewerSlots.push(slots);
      }
    }

    if (allInterviewerSlots.length === 0) return [];
    if (allInterviewerSlots.length === 1) return allInterviewerSlots[0];

    // Find common slots across all interviewers
    let commonSlots = allInterviewerSlots[0];

    for (let i = 1; i < allInterviewerSlots.length; i++) {
      commonSlots = commonSlots.filter((slot1) =>
        allInterviewerSlots[i].some(
          (slot2) => slot1.start.getTime() === slot2.start.getTime(),
        ),
      );
    }

    return commonSlots;
  }

  /**
   * Create an interview panel for a job
   */
  async createInterviewPanel(
    jobId: string,
    tenantId: string,
    userId: string,
    data: {
      name: string;
      interviewerIds: string[];
      stageId?: string;
      interviewType?: string;
      isDefault?: boolean;
    },
  ) {
    // Verify job exists
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Create panel as activity log entry
    const panel = await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_PANEL_CREATED",
        description: `Interview panel "${data.name}" created`,
        userId,
        metadata: {
          panelId: `panel_${Date.now()}_${require("crypto").randomBytes(6).toString("hex")}`,
          jobId,
          name: data.name,
          interviewerIds: data.interviewerIds,
          stageId: data.stageId,
          interviewType: data.interviewType,
          isDefault: data.isDefault || false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return {
      id: (panel.metadata as any).panelId,
      name: data.name,
      interviewerIds: data.interviewerIds,
      stageId: data.stageId,
      interviewType: data.interviewType,
      isDefault: data.isDefault || false,
    };
  }

  /**
   * Get interview panels for a job
   */
  async getInterviewPanels(jobId: string, tenantId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    const panelLogs = await this.prisma.activityLog.findMany({
      where: {
        action: "INTERVIEW_PANEL_CREATED",
        metadata: {
          path: ["jobId"],
          equals: jobId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get latest state of each panel (filter out deleted/updated ones)
    const panelMap = new Map<string, any>();
    for (const log of panelLogs) {
      const metadata = log.metadata as any;
      if (metadata.isActive !== false && !panelMap.has(metadata.panelId)) {
        panelMap.set(metadata.panelId, metadata);
      }
    }

    // Get interviewer details
    const allInterviewerIds = Array.from(panelMap.values()).flatMap(
      (p) => p.interviewerIds || [],
    );

    const interviewers = await this.prisma.user.findMany({
      where: { id: { in: allInterviewerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    const interviewerMap = new Map(interviewers.map((i) => [i.id, i]));

    return Array.from(panelMap.values()).map((panel) => ({
      id: panel.panelId,
      name: panel.name,
      stageId: panel.stageId,
      interviewType: panel.interviewType,
      isDefault: panel.isDefault,
      interviewers: (panel.interviewerIds || [])
        .map((id: string) => interviewerMap.get(id))
        .filter(Boolean),
    }));
  }

  /**
   * Update an interview panel
   */
  async updateInterviewPanel(
    panelId: string,
    tenantId: string,
    userId: string,
    data: {
      name?: string;
      interviewerIds?: string[];
      stageId?: string;
      interviewType?: string;
      isDefault?: boolean;
    },
  ) {
    // Find the panel
    const panelLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "INTERVIEW_PANEL_CREATED",
        metadata: {
          path: ["panelId"],
          equals: panelId,
        },
      },
    });

    if (!panelLog) {
      throw new NotFoundException("Interview panel not found");
    }

    const currentMetadata = panelLog.metadata as any;

    // Update by creating a new log entry with updated metadata
    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_PANEL_CREATED",
        description: `Interview panel "${data.name || currentMetadata.name}" updated`,
        userId,
        metadata: {
          ...currentMetadata,
          ...data,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return {
      id: panelId,
      name: data.name || currentMetadata.name,
      interviewerIds: data.interviewerIds || currentMetadata.interviewerIds,
      stageId: data.stageId ?? currentMetadata.stageId,
      interviewType: data.interviewType ?? currentMetadata.interviewType,
      isDefault: data.isDefault ?? currentMetadata.isDefault,
    };
  }

  /**
   * Delete an interview panel
   */
  async deleteInterviewPanel(
    panelId: string,
    tenantId: string,
    userId: string,
  ) {
    const panelLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "INTERVIEW_PANEL_CREATED",
        metadata: {
          path: ["panelId"],
          equals: panelId,
        },
      },
    });

    if (!panelLog) {
      throw new NotFoundException("Interview panel not found");
    }

    const currentMetadata = panelLog.metadata as any;

    // Mark as inactive
    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_PANEL_CREATED",
        description: `Interview panel "${currentMetadata.name}" deleted`,
        userId,
        metadata: {
          ...currentMetadata,
          isActive: false,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  }

  /**
   * Get suggested interviewers based on skills and availability
   */
  async getSuggestedInterviewers(
    jobId: string,
    tenantId: string,
    date?: string,
    duration: number = 60,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      include: { hiringManager: true, recruiter: true },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Get all active interviewers (non-candidate users)
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        role: { not: "CANDIDATE" },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        title: true,
        departmentId: true,
        _count: {
          select: { interviews: true, feedbacks: true },
        },
      },
    });

    // Score each user based on relevance
    const suggestions = users.map((user) => {
      let score = 0;
      const reasons: string[] = [];

      // Same department bonus
      if (user.departmentId === job.departmentId) {
        score += 30;
        reasons.push("Same department");
      }

      // Hiring manager/recruiter for this job
      if (user.id === job.hiringManagerId) {
        score += 50;
        reasons.push("Hiring manager");
      }
      if (user.id === job.recruiterId) {
        score += 40;
        reasons.push("Recruiter");
      }

      // Experience with interviews
      if (user._count.interviews > 10) {
        score += 20;
        reasons.push("Experienced interviewer");
      } else if (user._count.interviews > 5) {
        score += 10;
        reasons.push("Has interview experience");
      }

      // Provides feedback
      if (user._count.feedbacks > 5) {
        score += 10;
        reasons.push("Provides feedback");
      }

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          title: user.title,
        },
        score,
        reasons,
        interviewCount: user._count.interviews,
      };
    });

    // Sort by score and return top suggestions
    return suggestions
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async getAvailableSlots(
    interviewerId: string,
    tenantId: string,
    date: string,
    duration: number = 60,
  ) {
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM

    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // End at 6 PM

    // Get interviewer's existing interviews for the day
    const existingInterviews = await this.prisma.interview.findMany({
      where: {
        interviewerId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "SCHEDULED",
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
    });

    // Check calendar for busy times
    let calendarBusySlots: { start: Date; end: Date }[] = [];
    try {
      const calendarConnection = await this.prisma.calendarConnection.findFirst(
        {
          where: { userId: interviewerId, isActive: true },
        },
      );

      if (calendarConnection) {
        // Get the interviewer's tenant
        const interviewer = await this.prisma.user.findUnique({
          where: { id: interviewerId },
          select: { tenantId: true },
        });

        if (interviewer) {
          const freeBusy = await this.calendarService.getFreeBusy(
            interviewerId,
            interviewer.tenantId,
            {
              userIds: [interviewerId],
              startTime: startOfDay.toISOString(),
              endTime: endOfDay.toISOString(),
              durationMinutes: duration,
            },
          );
          // Map the response to our expected format
          if (Array.isArray(freeBusy)) {
            calendarBusySlots = freeBusy.flatMap(
              (fb) =>
                fb.slots
                  ?.filter((slot: any) => !slot.available)
                  .map((slot: any) => ({
                    start: new Date(slot.start),
                    end: new Date(slot.end),
                  })) || [],
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch calendar availability:", error);
    }

    // Generate available slots
    const slots: { start: Date; end: Date }[] = [];
    const slotDuration = duration * 60000; // Convert to milliseconds
    let currentTime = startOfDay.getTime();

    while (currentTime + slotDuration <= endOfDay.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime + slotDuration);

      // Check if slot conflicts with existing interviews
      const hasInterviewConflict = existingInterviews.some((interview) => {
        const interviewStart = new Date(interview.scheduledAt).getTime();
        const interviewEnd =
          interviewStart + (interview.duration || 60) * 60000;
        return (
          (currentTime >= interviewStart && currentTime < interviewEnd) ||
          (currentTime + slotDuration > interviewStart &&
            currentTime + slotDuration <= interviewEnd)
        );
      });

      // Check if slot conflicts with calendar events
      const hasCalendarConflict = calendarBusySlots.some((busy) => {
        const busyStart = new Date(busy.start).getTime();
        const busyEnd = new Date(busy.end).getTime();
        return (
          (currentTime >= busyStart && currentTime < busyEnd) ||
          (currentTime + slotDuration > busyStart &&
            currentTime + slotDuration <= busyEnd)
        );
      });

      if (!hasInterviewConflict && !hasCalendarConflict) {
        slots.push({ start: slotStart, end: slotEnd });
      }

      currentTime += 30 * 60000; // Move forward by 30 minutes
    }

    return slots;
  }

  async findAll(
    tenantId: string,
    filters?: {
      applicationId?: string;
      interviewerId?: string;
      candidateId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = {
      application: {
        job: {
          tenantId,
        },
      },
    };

    if (filters?.applicationId) {
      where.applicationId = filters.applicationId;
    }

    if (filters?.interviewerId) {
      where.interviewerId = filters.interviewerId;
    }

    if (filters?.candidateId) {
      where.application.candidateId = filters.candidateId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate && filters?.endDate) {
      where.scheduledAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      where.scheduledAt = {
        gte: new Date(filters.startDate),
      };
    } else if (filters?.endDate) {
      where.scheduledAt = {
        lte: new Date(filters.endDate),
      };
    }

    return this.prisma.interview.findMany({
      where,
      include: {
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        application: {
          select: {
            id: true,
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        feedbacks: {
          select: {
            id: true,
            rating: true,
            recommendation: true,
            submittedAt: true,
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        application: {
          select: {
            id: true,
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
                tenantId: true,
                scorecardTemplateId: true,
                scorecardTemplate: true,
              },
            },
          },
        },
        feedbacks: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (
      !interview ||
      (interview.application as any).job.tenantId !== tenantId
    ) {
      throw new NotFoundException("Interview not found");
    }

    return interview;
  }

  async update(id: string, dto: UpdateInterviewDto, tenantId: string) {
    await this.findOne(id, tenantId); // Ensure existence and ownership

    return this.prisma.interview.update({
      where: { id },
      data: dto,
      include: {
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // Ensure existence and ownership
    return this.prisma.interview.delete({ where: { id } });
  }

  // Feedback methods
  async createFeedback(
    dto: CreateFeedbackDto,
    userId: string,
    tenantId: string,
  ) {
    // Verify interview exists and belongs to tenant
    const interview = await this.findOne(dto.interviewId, tenantId);

    // Check if user already submitted feedback for this interview
    const existingFeedback = await this.prisma.interviewFeedback.findUnique({
      where: {
        interviewId_reviewerId: {
          interviewId: dto.interviewId,
          reviewerId: userId,
        },
      },
    });

    if (existingFeedback) {
      throw new ConflictException(
        "You have already submitted feedback for this interview",
      );
    }

    return this.prisma.interviewFeedback.create({
      data: {
        interviewId: dto.interviewId,
        reviewerId: userId,
        rating: dto.rating,
        strengths: dto.strengths,
        weaknesses: dto.weaknesses,
        notes: dto.notes,
        recommendation: dto.recommendation,
        scores: dto.scores || {},
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateFeedback(
    feedbackId: string,
    dto: UpdateFeedbackDto,
    userId: string,
    tenantId: string,
  ) {
    const feedback = await this.prisma.interviewFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        interview: {
          include: {
            application: {
              include: {
                job: true,
              },
            },
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException("Feedback not found");
    }

    // Verify tenant ownership
    if ((feedback.interview.application as any).job.tenantId !== tenantId) {
      throw new NotFoundException("Feedback not found");
    }

    // Only the reviewer can update their own feedback
    if (feedback.reviewerId !== userId) {
      throw new ForbiddenException("You can only update your own feedback");
    }

    return this.prisma.interviewFeedback.update({
      where: { id: feedbackId },
      data: {
        rating: dto.rating,
        strengths: dto.strengths,
        weaknesses: dto.weaknesses,
        notes: dto.notes,
        recommendation: dto.recommendation,
        scores: dto.scores,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getFeedbackByInterview(interviewId: string, tenantId: string) {
    // Verify interview exists and belongs to tenant
    await this.findOne(interviewId, tenantId);

    return this.prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });
  }

  /**
   * Get aggregated feedback summary for an application
   */
  async getFeedbackSummary(applicationId: string, tenantId: string) {
    // Get all interviews for this application
    const interviews = await this.prisma.interview.findMany({
      where: {
        applicationId,
        application: { job: { tenantId } },
      },
      include: {
        feedbacks: {
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        interviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (interviews.length === 0) {
      return { applicationId, summary: null, message: "No interviews found" };
    }

    // Collect all feedback
    const allFeedback = interviews.flatMap((i) => i.feedbacks);

    if (allFeedback.length === 0) {
      return {
        applicationId,
        interviewCount: interviews.length,
        feedbackCount: 0,
        summary: null,
        message: "No feedback submitted yet",
      };
    }

    // Calculate aggregate scores
    const ratings = allFeedback
      .map((f) => f.rating)
      .filter((r) => r !== null) as number[];
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    // Aggregate recommendations
    const recommendations: Record<string, number> = {};
    allFeedback.forEach((f) => {
      if (f.recommendation) {
        recommendations[f.recommendation] =
          (recommendations[f.recommendation] || 0) + 1;
      }
    });

    // Aggregate scores by category
    const scoreCategories: Record<string, number[]> = {};
    allFeedback.forEach((f) => {
      const scores = f.scores as Record<string, number> | null;
      if (scores) {
        Object.entries(scores).forEach(([category, score]) => {
          if (!scoreCategories[category]) {
            scoreCategories[category] = [];
          }
          scoreCategories[category].push(score);
        });
      }
    });

    const categoryAverages = Object.entries(scoreCategories).map(
      ([category, scores]) => ({
        category,
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }),
    );

    // Collect strengths and weaknesses
    const allStrengths = allFeedback
      .filter((f) => f.strengths)
      .map((f) => ({ text: f.strengths, reviewer: f.reviewer }));

    const allWeaknesses = allFeedback
      .filter((f) => f.weaknesses)
      .map((f) => ({ text: f.weaknesses, reviewer: f.reviewer }));

    // Determine overall recommendation
    let overallRecommendation = "NO_DECISION";
    const recCounts = Object.entries(recommendations);
    if (recCounts.length > 0) {
      const hireCount =
        (recommendations["STRONG_HIRE"] || 0) + (recommendations["HIRE"] || 0);
      const noHireCount =
        (recommendations["STRONG_NO_HIRE"] || 0) +
        (recommendations["NO_HIRE"] || 0);

      if (hireCount > noHireCount && hireCount >= allFeedback.length / 2) {
        overallRecommendation = "HIRE";
      } else if (
        noHireCount > hireCount &&
        noHireCount >= allFeedback.length / 2
      ) {
        overallRecommendation = "NO_HIRE";
      } else {
        overallRecommendation = "MIXED";
      }
    }

    return {
      applicationId,
      interviewCount: interviews.length,
      feedbackCount: allFeedback.length,
      pendingFeedback: interviews.filter(
        (i) => i.status === "COMPLETED" && i.feedbacks.length === 0,
      ).length,
      summary: {
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        overallRecommendation,
        recommendations,
        categoryScores: categoryAverages,
      },
      strengths: allStrengths,
      weaknesses: allWeaknesses,
      feedbackByInterview: interviews.map((i) => ({
        interviewId: i.id,
        type: i.type,
        interviewer: i.interviewer,
        scheduledAt: i.scheduledAt,
        status: i.status,
        feedbackSubmitted: i.feedbacks.length > 0,
        feedbacks: i.feedbacks.map((f) => ({
          id: f.id,
          rating: f.rating,
          recommendation: f.recommendation,
          reviewer: f.reviewer,
          submittedAt: f.submittedAt,
        })),
      })),
    };
  }

  /**
   * Get feedback comparison across multiple candidates for a job
   */
  async getFeedbackComparison(
    jobId: string,
    tenantId: string,
    candidateIds?: string[],
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Get applications for this job
    const whereClause: any = {
      jobId,
      job: { tenantId },
    };

    if (candidateIds && candidateIds.length > 0) {
      whereClause.candidateId = { in: candidateIds };
    }

    const applications = await this.prisma.application.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Get interviews with feedback for these applications
    const applicationIds = applications.map((a) => a.id);
    const interviews = await this.prisma.interview.findMany({
      where: { applicationId: { in: applicationIds } },
      include: { feedbacks: true },
    });

    // Group interviews by applicationId
    const interviewsByApp = new Map<string, typeof interviews>();
    interviews.forEach((i) => {
      const existing = interviewsByApp.get(i.applicationId) || [];
      existing.push(i);
      interviewsByApp.set(i.applicationId, existing);
    });

    const comparison = applications.map((app) => {
      const appInterviews = interviewsByApp.get(app.id) || [];
      const allFeedback = appInterviews.flatMap((i) => i.feedbacks);
      const ratings = allFeedback
        .map((f) => f.rating)
        .filter((r) => r !== null) as number[];
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

      // Count recommendations
      const recommendations: Record<string, number> = {};
      allFeedback.forEach((f) => {
        if (f.recommendation) {
          recommendations[f.recommendation] =
            (recommendations[f.recommendation] || 0) + 1;
        }
      });

      return {
        candidateId: app.candidateId,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        applicationId: app.id,
        interviewCount: appInterviews.length,
        feedbackCount: allFeedback.length,
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        recommendations,
        status: app.status,
      };
    });

    // Sort by average rating (highest first)
    comparison.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

    return {
      jobId,
      jobTitle: job.title,
      candidateCount: comparison.length,
      comparison,
    };
  }

  /**
   * Get pending feedback requests for a user
   */
  async getPendingFeedbackRequests(userId: string, tenantId: string) {
    const interviews = await this.prisma.interview.findMany({
      where: {
        interviewerId: userId,
        status: "COMPLETED",
        application: { job: { tenantId } },
        feedbacks: {
          none: { reviewerId: userId },
        },
      },
      include: {
        application: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true },
            },
            job: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return interviews.map((i) => ({
      interviewId: i.id,
      type: i.type,
      scheduledAt: i.scheduledAt,
      candidate: i.application.candidate,
      job: i.application.job,
      daysSinceInterview: Math.floor(
        (Date.now() - new Date(i.scheduledAt).getTime()) /
        (1000 * 60 * 60 * 24),
      ),
    }));
  }
}
