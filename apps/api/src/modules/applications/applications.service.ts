import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreatePublicApplicationDto } from './dto/create-public-application.dto';
import { WorkflowsService } from '../workflows/workflows.service';
import { SlaService } from '../sla/sla.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowsService: WorkflowsService,
    private readonly slaService: SlaService,
    private readonly aiService: AiService,
    private readonly notificationsService: NotificationsService,
  ) { }

  private uniqueIds(ids: Array<string | null | undefined>) {
    return Array.from(new Set(ids.filter(Boolean) as string[]));
  }

  async create(dto: CreateApplicationDto) {
    // Check for duplicate application
    const existing = await this.prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: dto.candidateId,
          jobId: dto.jobId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Candidate has already applied to this job');
    }

    // Get the first stage of the job's pipeline
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        pipeline: {
          include: {
            stages: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
    });

    const firstStageId = job?.pipeline?.stages[0]?.id;

    // Calculate AI Match Score if candidate has resume text
    let matchScore = null;
    let matchSummary = null;

    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: dto.candidateId },
        select: {
          resumeText: true,
          skills: true,
          summary: true,
          experience: true,
          education: true,
          firstName: true,
          lastName: true
        }
      });

      let textToMatch = candidate?.resumeText;
      if (!textToMatch && candidate) {
        // Construct text from profile if resume unavailable
        textToMatch = `Candidate: ${candidate.firstName} ${candidate.lastName}\n`;
        if (candidate.summary) textToMatch += `Summary: ${candidate.summary}\n`;
        if (candidate.skills?.length) textToMatch += `Skills: ${candidate.skills.join(', ')}\n`;
        // Use JSON stringify for complex objects, or simple extraction could be better but this is sufficient for LLM
        if (candidate.experience) textToMatch += `Experience: ${JSON.stringify(candidate.experience)}\n`;
        if (candidate.education) textToMatch += `Education: ${JSON.stringify(candidate.education)}\n`;
      }

      if (textToMatch && job?.description) {
        const matchResult = await this.aiService.matchCandidate(textToMatch, job.description);
        matchScore = matchResult.score;
        matchSummary = matchResult.summary;
      }
    } catch (error) {
      console.error('Failed to calculate match score:', error);
      // Continue application creation without score
    }

    const application = await this.prisma.application.create({
      data: {
        candidateId: dto.candidateId,
        jobId: dto.jobId,
        coverLetter: dto.coverLetter,
        answers: dto.answers as object,
        currentStageId: firstStageId,
        status: 'APPLIED',
        matchScore,
        matchSummary,
      },
      include: {
        candidate: true,
        job: true,
        currentStage: true,
      },
    });

    // Send notification for new application
    await this.sendNewApplicationNotification(application);

    return application;
  }

  private async sendNewApplicationNotification(application: any) {
    try {
      const job = application.job;
      const recipientIds: string[] = [];

      // Notify recruiter and hiring manager
      if (job.recruiterId) recipientIds.push(job.recruiterId);
      if (job.hiringManagerId) recipientIds.push(job.hiringManagerId);

      if (recipientIds.length > 0) {
        await this.notificationsService.notifyNewApplication(
          application,
          recipientIds,
          job.tenantId,
        );
      }
    } catch (error) {
      console.error('Failed to send new application notification:', error);
    }
  }

  async createPublic(dto: CreatePublicApplicationDto) {
    // 1. Find job to get tenantId
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        pipeline: {
          include: {
            stages: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // 2. Find or create candidate
    let candidate = await this.prisma.candidate.findUnique({
      where: {
        email_tenantId: {
          email: dto.email,
          tenantId: job.tenantId,
        },
      },
    });

    if (!candidate) {
      // Parse skills if provided as comma-separated string
      const skillsArray = dto.skills ? dto.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

      candidate = await this.prisma.candidate.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          currentTitle: dto.currentTitle,
          currentCompany: dto.currentCompany,
          location: dto.location,
          linkedinUrl: dto.linkedinUrl,
          portfolioUrl: dto.portfolioUrl,
          summary: dto.summary,
          skills: skillsArray,
          resumeUrl: dto.resumeUrl,
          experience: dto.experience as any,
          education: dto.education as any,
          customFieldValues: dto.customFields as any,
          gdprConsent: dto.gdprConsent || false,
          tenantId: job.tenantId,
          source: 'Career Page',
        },
      });
    } else {
      // Update candidate with new information if provided
      const skillsArray = dto.skills ? dto.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined;

      const updateData: any = {};
      if (dto.resumeUrl) updateData.resumeUrl = dto.resumeUrl;
      if (dto.currentTitle) updateData.currentTitle = dto.currentTitle;
      if (dto.currentCompany) updateData.currentCompany = dto.currentCompany;
      if (dto.location) updateData.location = dto.location;
      if (dto.summary) updateData.summary = dto.summary;
      if (skillsArray) updateData.skills = skillsArray;
      if (dto.experience) updateData.experience = dto.experience;
      if (dto.education) updateData.education = dto.education;
      if (dto.customFields) updateData.customFieldValues = dto.customFields;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.candidate.update({
          where: { id: candidate.id },
          data: updateData,
        });
      }
    }

    // 3. Create Application
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: dto.jobId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied to this position.');
    }

    const firstStageId = job.pipeline?.stages[0]?.id;

    // Calculate AI Match Score if candidate has resume text
    let matchScore = null;
    let matchSummary = null;

    try {
      // Re-fetch full candidate details to ensure we have latest data
      const candidateFull = await this.prisma.candidate.findUnique({
        where: { id: candidate.id }
      });

      let textToMatch = candidateFull?.resumeText;
      if (!textToMatch && candidateFull) {
        textToMatch = `Candidate: ${candidateFull.firstName} ${candidateFull.lastName}\n`;
        if (candidateFull.summary) textToMatch += `Summary: ${candidateFull.summary}\n`;
        if (candidateFull.skills?.length) textToMatch += `Skills: ${candidateFull.skills.join(', ')}\n`;
        if (candidateFull.experience) textToMatch += `Experience: ${JSON.stringify(candidateFull.experience)}\n`;
        if (candidateFull.education) textToMatch += `Education: ${JSON.stringify(candidateFull.education)}\n`;
      }

      if (textToMatch && job.description) {
        const matchResult = await this.aiService.matchCandidate(textToMatch, job.description);
        matchScore = matchResult.score;
        matchSummary = matchResult.summary;
      }
    } catch (error) {
      console.error('Failed to calculate match score for public app:', error);
    }

    const application = await this.prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: dto.jobId,
        coverLetter: dto.coverLetter,
        currentStageId: firstStageId,
        status: 'APPLIED',
        matchScore,
        matchSummary,
      },
      include: {
        candidate: true,
        job: true,
        currentStage: true,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'APPLICATION_CREATED',
        description: `Applied to ${job.title}`,
        candidateId: candidate.id,
        applicationId: application.id,
        metadata: { source: 'Career Page' },
      },
    });

    // Send notification for new application
    await this.sendNewApplicationNotification(application);

    // Trigger AI Matching asynchronously
    this.calculateMatch(application.id).catch(err => console.error('AI Match failed', err));

    return application;
  }

  async findAll(tenantId: string) {
    return this.prisma.application.findMany({
      where: { job: { tenantId } },
      include: {
        candidate: true,
        job: {
          include: {
            hiringManager: { select: { firstName: true, lastName: true } },
            department: true,
            locations: true
          }
        },
        currentStage: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findByJob(jobId: string, options?: { status?: string; stageId?: string }) {
    const where: Record<string, unknown> = { jobId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.stageId) {
      where.currentStageId = options.stageId;
    }

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        candidate: true,
        currentStage: true,
        job: { select: { title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        activities: {
          where: { action: 'STAGE_CHANGED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    // Calculate SLA status for each application
    const applicationsWithSla = await Promise.all(
      applications.map(async (app) => {
        const slaStatus = await this.slaService.calculateSlaStatus(app.id);
        return { ...app, slaStatus };
      })
    );

    return applicationsWithSla;
  }

  async findById(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        job: {
          include: {
            pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
          },
        },
        currentStage: true,
        interviews: {
          include: {
            interviewer: { select: { id: true, firstName: true, lastName: true } },
            feedbacks: true,
          },
        },
        offers: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async moveToStage(id: string, stageId: string, userId?: string) {
    const application = await this.findById(id);
    const oldStageId = application.currentStageId;

    const fromStageName = application.currentStage?.name;

    const updated = await this.prisma.application.update({
      where: { id },
      data: { currentStageId: stageId },
      include: { currentStage: true },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'STAGE_CHANGED',
        description: `Moved to ${updated.currentStage?.name}`,
        applicationId: id,
        userId,
        metadata: {
          fromStageId: oldStageId,
          toStageId: stageId,
        },
      },
    });

    // Trigger workflow automations
    try {
      await this.workflowsService.executeStageWorkflows(id, stageId, oldStageId || undefined);
    } catch (error) {
      console.error('Failed to execute workflows:', error);
      // Don't fail the stage move if workflows fail
    }

    try {
      const toStageName = updated.currentStage?.name;
      const recipientIds = this.uniqueIds([
        application.job?.recruiterId,
        application.job?.hiringManagerId,
        application.assignedToId,
      ]).filter((rid) => (userId ? rid !== userId : true));

      if (recipientIds.length > 0) {
        await this.notificationsService.createMany(
          recipientIds.map((rid) => ({
            type: 'APPLICATION',
            title: 'Stage Changed',
            message: `${application.candidate?.firstName || 'Candidate'} moved from ${fromStageName || 'a stage'} to ${toStageName || 'a stage'} for ${application.job?.title || 'a job'}`,
            link: `/candidates/${application.candidateId}`,
            metadata: { applicationId: id, fromStageId: oldStageId, toStageId: stageId },
            userId: rid,
            tenantId: application.job?.tenantId,
          })) as any,
        );
      }
    } catch (error) {
      console.error('Failed to send stage change notification:', error);
    }

    return updated;
  }

  async updateStatus(id: string, status: string, reason?: string, userId?: string) {
    const application = await this.findById(id);
    const previousStatus = application.status;

    const data: Record<string, unknown> = { status };

    if (status === 'REJECTED') {
      data.rejectionReason = reason;
    } else if (status === 'WITHDRAWN') {
      data.withdrawalReason = reason;
    } else if (status === 'HIRED') {
      data.hiredAt = new Date();
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data,
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'APPLICATION_STATUS_CHANGED',
          description: `Status changed to ${status}${reason ? `: ${reason}` : ''}`,
          applicationId: id,
          candidateId: application.candidateId,
          userId,
          metadata: {
            previousStatus,
            newStatus: status,
            reason,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log application status change:', error);
    }

    try {
      const recipientIds = this.uniqueIds([
        application.job?.recruiterId,
        application.job?.hiringManagerId,
        application.assignedToId,
      ]).filter((rid) => (userId ? rid !== userId : true));

      if (recipientIds.length > 0) {
        await this.notificationsService.createMany(
          recipientIds.map((rid) => ({
            type: 'APPLICATION',
            title: 'Application Status Updated',
            message: `${application.candidate?.firstName || 'Candidate'} status changed from ${previousStatus} to ${status} for ${application.job?.title || 'a job'}`,
            link: `/candidates/${application.candidateId}`,
            metadata: { applicationId: id, previousStatus, newStatus: status, reason },
            userId: rid,
            tenantId: application.job?.tenantId,
          })) as any,
        );
      }
    } catch (error) {
      console.error('Failed to send application status notification:', error);
    }

    return updated;
  }

  async assignTo(id: string, assigneeId: string, userId?: string) {
    const application = await this.findById(id);
    const previousAssigneeId = application.assignedToId;

    const updated = await this.prisma.application.update({
      where: { id },
      data: { assignedToId: assigneeId },
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'APPLICATION_ASSIGNED',
          description: `Assigned to user ${assigneeId}`,
          applicationId: id,
          candidateId: application.candidateId,
          userId,
          metadata: {
            previousAssigneeId,
            newAssigneeId: assigneeId,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log application assignment:', error);
    }

    try {
      const notifyAssigneeIds = this.uniqueIds([
        assigneeId,
        previousAssigneeId && previousAssigneeId !== assigneeId ? previousAssigneeId : undefined,
        application.job?.recruiterId,
        application.job?.hiringManagerId,
      ]).filter((rid) => (userId ? rid !== userId : true));

      if (notifyAssigneeIds.length > 0) {
        await this.notificationsService.createMany(
          notifyAssigneeIds.map((rid) => ({
            type: 'APPLICATION',
            title: 'Assignment Updated',
            message: `${application.candidate?.firstName || 'Candidate'} assignment updated for ${application.job?.title || 'a job'}`,
            link: `/candidates/${application.candidateId}`,
            metadata: { applicationId: id, previousAssigneeId, newAssigneeId: assigneeId },
            userId: rid,
            tenantId: application.job?.tenantId,
          })) as any,
        );
      }
    } catch (error) {
      console.error('Failed to send assignment notification:', error);
    }

    return updated;
  }

  async calculateMatch(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: true,
      }
    });

    if (!app || !app.candidate.resumeText || !app.job.description) {
      return;
    }

    try {
      const result = await this.aiService.matchCandidate(
        app.candidate.resumeText,
        app.job.description
      );

      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          matchScore: result.score,
          matchSummary: result.summary,
        }
      });
    } catch (error) {
      console.error(`Match calculation failed for ${applicationId}`, error);
    }
  }
  async copyToJob(applicationIds: string[], targetJobId: string, userId: string) {
    const results = [];

    // Get target job first
    const targetJob = await this.prisma.job.findUnique({
      where: { id: targetJobId },
      include: {
        pipeline: {
          include: {
            stages: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
    });

    if (!targetJob) {
      throw new NotFoundException('Target job not found');
    }

    const firstStageId = targetJob.pipeline?.stages[0]?.id;

    for (const appId of applicationIds) {
      try {
        const sourceApp = await this.prisma.application.findUnique({
          where: { id: appId },
        });

        if (!sourceApp) continue;

        // Check if already applied to target job
        const existing = await this.prisma.application.findUnique({
          where: {
            candidateId_jobId: {
              candidateId: sourceApp.candidateId,
              jobId: targetJobId,
            },
          },
        });

        if (existing) {
          results.push({ id: appId, status: 'SKIPPED', message: 'Candidate already applied to target job' });
          continue;
        }

        // Create new application
        const newApp = await this.prisma.application.create({
          data: {
            candidateId: sourceApp.candidateId,
            jobId: targetJobId,
            currentStageId: firstStageId,
            status: 'APPLIED',
            // source: 'Internal Transfer' - Application model doesn't have source
          },
        });

        // Log activity
        await this.prisma.activityLog.create({
          data: {
            action: 'APPLICATION_COPIED',
            description: `Copied from job ${sourceApp.jobId} to ${targetJob.title}`,
            applicationId: newApp.id,
            userId,
            candidateId: sourceApp.candidateId,
          },
        });

        results.push({ id: appId, status: 'SUCCESS', newApplicationId: newApp.id });

        // Trigger match calc asynchronously
        this.calculateMatch(newApp.id).catch(console.error);

      } catch (error) {
        console.error(`Failed to copy application ${appId}`, error);
        results.push({ id: appId, status: 'ERROR', message: error.message });
      }
    }

    return results;
  }

  /**
   * Bulk move applications to a new stage
   */
  async bulkMoveStage(
    applicationIds: string[],
    targetStageId: string,
    userId: string,
    tenantId: string,
  ) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    // Verify stage exists
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: targetStageId },
      include: { pipeline: true },
    });

    if (!stage) {
      throw new NotFoundException('Target stage not found');
    }

    for (const appId of applicationIds) {
      try {
        const application = await this.prisma.application.findFirst({
          where: { id: appId, job: { tenantId } },
          include: { currentStage: true, candidate: true, job: true },
        });

        if (!application) {
          results.push({ id: appId, success: false, error: 'Application not found' });
          continue;
        }

        const oldStageId = application.currentStageId;

        // Update application
        await this.prisma.application.update({
          where: { id: appId },
          data: { currentStageId: targetStageId },
        });

        // Log activity
        await this.prisma.activityLog.create({
          data: {
            action: 'STAGE_CHANGED',
            description: `Moved from ${application.currentStage?.name || 'Unknown'} to ${stage.name} (bulk action)`,
            applicationId: appId,
            candidateId: application.candidateId,
            userId,
            metadata: {
              fromStageId: oldStageId,
              toStageId: targetStageId,
              bulkAction: true,
            },
          },
        });

        // Trigger stage workflows
        if (oldStageId) {
          this.workflowsService.executeStageWorkflows(appId, targetStageId, oldStageId).catch(console.error);
        }

        results.push({ id: appId, success: true });
      } catch (error: any) {
        results.push({ id: appId, success: false, error: error.message });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Bulk reject applications
   */
  async bulkReject(
    applicationIds: string[],
    reason: string,
    userId: string,
    tenantId: string,
    sendEmail: boolean = false,
  ) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const appId of applicationIds) {
      try {
        const application = await this.prisma.application.findFirst({
          where: { id: appId, job: { tenantId } },
          include: { candidate: true, job: true },
        });

        if (!application) {
          results.push({ id: appId, success: false, error: 'Application not found' });
          continue;
        }

        if (application.status === 'REJECTED') {
          results.push({ id: appId, success: false, error: 'Already rejected' });
          continue;
        }

        // Update application status
        await this.prisma.application.update({
          where: { id: appId },
          data: {
            status: 'REJECTED',
          },
        });

        // Log activity
        await this.prisma.activityLog.create({
          data: {
            action: 'APPLICATION_REJECTED',
            description: `Application rejected: ${reason} (bulk action)`,
            applicationId: appId,
            candidateId: application.candidateId,
            userId,
            metadata: { reason, bulkAction: true },
          },
        });

        results.push({ id: appId, success: true });
      } catch (error: any) {
        results.push({ id: appId, success: false, error: error.message });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Bulk assign applications to a user
   */
  async bulkAssign(
    applicationIds: string[],
    assigneeId: string,
    userId: string,
    tenantId: string,
  ) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    // Verify assignee exists
    const assignee = await this.prisma.user.findFirst({
      where: { id: assigneeId, tenantId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    for (const appId of applicationIds) {
      try {
        const application = await this.prisma.application.findFirst({
          where: { id: appId, job: { tenantId } },
        });

        if (!application) {
          results.push({ id: appId, success: false, error: 'Application not found' });
          continue;
        }

        await this.prisma.application.update({
          where: { id: appId },
          data: { assignedToId: assigneeId },
        });

        // Log activity
        await this.prisma.activityLog.create({
          data: {
            action: 'APPLICATION_ASSIGNED',
            description: `Assigned to ${assignee.firstName} ${assignee.lastName} (bulk action)`,
            applicationId: appId,
            candidateId: application.candidateId,
            userId,
            metadata: { assigneeId, bulkAction: true },
          },
        });

        results.push({ id: appId, success: true });
      } catch (error: any) {
        results.push({ id: appId, success: false, error: error.message });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Bulk add tags to applications' candidates
   */
  async bulkAddTags(
    applicationIds: string[],
    tags: string[],
    userId: string,
    tenantId: string,
  ) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const appId of applicationIds) {
      try {
        const application = await this.prisma.application.findFirst({
          where: { id: appId, job: { tenantId } },
          include: { candidate: true },
        });

        if (!application) {
          results.push({ id: appId, success: false, error: 'Application not found' });
          continue;
        }

        const currentTags = application.candidate.tags || [];
        const newTags = [...new Set([...currentTags, ...tags])];

        await this.prisma.candidate.update({
          where: { id: application.candidateId },
          data: { tags: newTags },
        });

        results.push({ id: appId, success: true });
      } catch (error: any) {
        results.push({ id: appId, success: false, error: error.message });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Add a note/comment to an application
   */
  async addNote(
    applicationId: string,
    userId: string,
    tenantId: string,
    data: {
      content: string;
      isPrivate?: boolean;
      mentionedUserIds?: string[];
    },
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { tenantId } },
      include: { candidate: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Create the note as an activity log entry
    const note = await this.prisma.activityLog.create({
      data: {
        action: 'NOTE_ADDED',
        description: data.content,
        applicationId,
        candidateId: application.candidateId,
        userId,
        metadata: {
          noteType: 'COMMENT',
          isPrivate: data.isPrivate || false,
          mentionedUserIds: data.mentionedUserIds || [],
          createdAt: new Date().toISOString(),
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Notify mentioned users
    if (data.mentionedUserIds && data.mentionedUserIds.length > 0) {
      try {
        for (const mentionedUserId of data.mentionedUserIds) {
          await this.notificationsService.create({
            userId: mentionedUserId,
            tenantId,
            type: 'APPLICATION',
            title: 'You were mentioned in a note',
            message: `You were mentioned in a note on ${application.candidate.firstName} ${application.candidate.lastName}'s application`,
            link: `/applications/${applicationId}`,
          });
        }
      } catch (error) {
        console.error('Failed to send mention notifications:', error);
      }
    }

    return {
      id: note.id,
      content: note.description,
      createdAt: note.createdAt,
      author: note.user,
      isPrivate: (note.metadata as any)?.isPrivate || false,
      mentionedUserIds: (note.metadata as any)?.mentionedUserIds || [],
    };
  }

  /**
   * Get all notes for an application
   */
  async getNotes(
    applicationId: string,
    userId: string,
    tenantId: string,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { tenantId } },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const notes = await this.prisma.activityLog.findMany({
      where: {
        applicationId,
        action: 'NOTE_ADDED',
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter private notes (only show if user is the author)
    return notes
      .filter(note => {
        const metadata = note.metadata as any;
        if (metadata?.isPrivate && note.userId !== userId) {
          return false;
        }
        return true;
      })
      .map(note => ({
        id: note.id,
        content: note.description,
        createdAt: note.createdAt,
        author: note.user,
        isPrivate: (note.metadata as any)?.isPrivate || false,
        mentionedUserIds: (note.metadata as any)?.mentionedUserIds || [],
      }));
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    userId: string,
    tenantId: string,
    data: { content: string },
  ) {
    const note = await this.prisma.activityLog.findFirst({
      where: {
        id: noteId,
        action: 'NOTE_ADDED',
        application: { job: { tenantId } },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Only the author can edit their note
    if (note.userId !== userId) {
      throw new NotFoundException('You can only edit your own notes');
    }

    const updated = await this.prisma.activityLog.update({
      where: { id: noteId },
      data: {
        description: data.content,
        metadata: {
          ...(note.metadata as any),
          updatedAt: new Date().toISOString(),
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return {
      id: updated.id,
      content: updated.description,
      createdAt: updated.createdAt,
      author: updated.user,
      isPrivate: (updated.metadata as any)?.isPrivate || false,
    };
  }

  /**
   * Delete a note
   */
  async deleteNote(
    noteId: string,
    userId: string,
    tenantId: string,
  ) {
    const note = await this.prisma.activityLog.findFirst({
      where: {
        id: noteId,
        action: 'NOTE_ADDED',
        application: { job: { tenantId } },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Only the author can delete their note
    if (note.userId !== userId) {
      throw new NotFoundException('You can only delete your own notes');
    }

    await this.prisma.activityLog.delete({
      where: { id: noteId },
    });

    return { success: true };
  }

  /**
   * Pin a note to the top
   */
  async pinNote(
    noteId: string,
    userId: string,
    tenantId: string,
    pinned: boolean,
  ) {
    const note = await this.prisma.activityLog.findFirst({
      where: {
        id: noteId,
        action: 'NOTE_ADDED',
        application: { job: { tenantId } },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    await this.prisma.activityLog.update({
      where: { id: noteId },
      data: {
        metadata: {
          ...(note.metadata as any),
          isPinned: pinned,
          pinnedAt: pinned ? new Date().toISOString() : null,
          pinnedBy: pinned ? userId : null,
        },
      },
    });

    return { success: true, pinned };
  }

  /**
   * Get complete status history/timeline for an application
   */
  async getStatusHistory(applicationId: string, tenantId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { tenantId } },
      include: { candidate: true, job: true, currentStage: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Get all activities for this application
    const activities = await this.prisma.activityLog.findMany({
      where: { applicationId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group activities by type for summary
    const summary = {
      totalActivities: activities.length,
      stageChanges: activities.filter(a => a.action === 'STAGE_CHANGED').length,
      statusChanges: activities.filter(a => a.action.includes('STATUS')).length,
      interviews: activities.filter(a => a.action.includes('INTERVIEW')).length,
      notes: activities.filter(a => a.action === 'NOTE_ADDED').length,
      emails: activities.filter(a => a.action.includes('EMAIL')).length,
    };

    // Format timeline entries
    const timeline = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt,
      user: activity.user,
      metadata: activity.metadata,
      category: this.categorizeActivity(activity.action),
    }));

    return {
      application: {
        id: application.id,
        status: application.status,
        currentStage: application.currentStage?.name,
        appliedAt: application.appliedAt,
        candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        jobTitle: application.job.title,
      },
      summary,
      timeline,
    };
  }

  /**
   * Get stage transition history
   */
  async getStageTransitions(applicationId: string, tenantId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { tenantId } },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const stageChanges = await this.prisma.activityLog.findMany({
      where: {
        applicationId,
        action: 'STAGE_CHANGED',
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate time in each stage
    const transitions = stageChanges.map((change, index) => {
      const metadata = change.metadata as any;
      const nextChange = stageChanges[index + 1];
      const timeInStage = nextChange
        ? Math.round((new Date(nextChange.createdAt).getTime() - new Date(change.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null; // Still in this stage

      return {
        id: change.id,
        fromStage: metadata?.fromStageName || 'Applied',
        toStage: metadata?.toStageName || 'Unknown',
        changedAt: change.createdAt,
        changedBy: change.user ? `${change.user.firstName} ${change.user.lastName}` : 'System',
        daysInStage: timeInStage,
        metadata: metadata,
      };
    });

    // Add initial application entry
    const fullHistory = [
      {
        id: 'initial',
        fromStage: null,
        toStage: 'Applied',
        changedAt: application.appliedAt,
        changedBy: 'Candidate',
        daysInStage: stageChanges.length > 0
          ? Math.round((new Date(stageChanges[0].createdAt).getTime() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        metadata: null,
      },
      ...transitions,
    ];

    return {
      applicationId,
      totalStages: fullHistory.length,
      currentStage: fullHistory[fullHistory.length - 1]?.toStage,
      history: fullHistory,
    };
  }

  /**
   * Get application timeline with filters
   */
  async getTimeline(
    applicationId: string,
    tenantId: string,
    filters?: {
      categories?: string[];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { tenantId } },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const where: any = { applicationId };

    if (filters?.startDate) {
      where.createdAt = { ...where.createdAt, gte: filters.startDate };
    }
    if (filters?.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }

    const activities = await this.prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });

    let filteredActivities = activities;
    if (filters?.categories && filters.categories.length > 0) {
      filteredActivities = activities.filter(a =>
        filters.categories!.includes(this.categorizeActivity(a.action))
      );
    }

    return filteredActivities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt,
      user: activity.user,
      category: this.categorizeActivity(activity.action),
      metadata: activity.metadata,
    }));
  }

  /**
   * Categorize activity action into a category
   */
  private categorizeActivity(action: string): string {
    if (action.includes('STAGE') || action.includes('STATUS')) return 'status';
    if (action.includes('INTERVIEW')) return 'interview';
    if (action.includes('OFFER')) return 'offer';
    if (action.includes('EMAIL') || action.includes('SMS')) return 'communication';
    if (action.includes('NOTE') || action.includes('COMMENT')) return 'note';
    if (action.includes('FEEDBACK')) return 'feedback';
    if (action.includes('TASK')) return 'task';
    if (action.includes('BGV') || action.includes('BACKGROUND')) return 'verification';
    return 'other';
  }

  /**
   * Compare multiple candidates side-by-side for a job
   */
  async compareCandidates(
    jobId: string,
    tenantId: string,
    applicationIds: string[],
  ) {
    if (applicationIds.length < 2) {
      throw new NotFoundException('At least 2 applications required for comparison');
    }

    if (applicationIds.length > 5) {
      throw new NotFoundException('Maximum 5 applications can be compared at once');
    }

    // Get applications with full details
    const applications = await this.prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobId,
        job: { tenantId },
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            location: true,
            currentTitle: true,
            currentCompany: true,
            skills: true,
            experience: true,
            education: true,
            linkedinUrl: true,
            resumeUrl: true,
          },
        },
        currentStage: true,
        job: {
          select: { id: true, title: true, skills: true },
        },
      },
    });

    if (applications.length !== applicationIds.length) {
      throw new NotFoundException('Some applications not found');
    }

    // Get interviews and feedback for each application
    const interviewData = await this.prisma.interview.findMany({
      where: { applicationId: { in: applicationIds } },
      include: {
        feedbacks: {
          include: {
            reviewer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Group by application
    const interviewsByApp = new Map<string, typeof interviewData>();
    interviewData.forEach(i => {
      const existing = interviewsByApp.get(i.applicationId) || [];
      existing.push(i);
      interviewsByApp.set(i.applicationId, existing);
    });

    // Build comparison data
    const comparison = applications.map(app => {
      const interviews = interviewsByApp.get(app.id) || [];
      const allFeedback = interviews.flatMap(i => i.feedbacks);
      const ratings = allFeedback.map(f => f.rating).filter(r => r !== null) as number[];
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      // Count recommendations
      const recommendations: Record<string, number> = {};
      allFeedback.forEach(f => {
        if (f.recommendation) {
          recommendations[f.recommendation] = (recommendations[f.recommendation] || 0) + 1;
        }
      });

      // Calculate skill match
      const jobSkills = (app.job.skills as string[]) || [];
      const candidateSkills = (app.candidate.skills as string[]) || [];
      const matchedSkills = jobSkills.filter(s =>
        candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
      );
      const skillMatchPercent = jobSkills.length > 0
        ? Math.round((matchedSkills.length / jobSkills.length) * 100)
        : null;

      return {
        applicationId: app.id,
        candidate: app.candidate,
        currentStage: app.currentStage?.name || 'Applied',
        status: app.status,
        appliedAt: app.appliedAt,
        matchScore: app.matchScore,
        metrics: {
          interviewCount: interviews.length,
          feedbackCount: allFeedback.length,
          averageRating: avgRating,
          recommendations,
          skillMatchPercent,
          matchedSkills,
          missingSkills: jobSkills.filter(s => !matchedSkills.includes(s)),
        },
      };
    });

    // Calculate rankings for each metric
    const rankings = {
      byMatchScore: [...comparison].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).map(c => c.applicationId),
      byAverageRating: [...comparison].sort((a, b) => (b.metrics.averageRating || 0) - (a.metrics.averageRating || 0)).map(c => c.applicationId),
      bySkillMatch: [...comparison].sort((a, b) => (b.metrics.skillMatchPercent || 0) - (a.metrics.skillMatchPercent || 0)).map(c => c.applicationId),
    };

    return {
      jobId,
      jobTitle: applications[0].job.title,
      comparedAt: new Date().toISOString(),
      candidates: comparison,
      rankings,
      summary: {
        totalCandidates: comparison.length,
        highestMatchScore: Math.max(...comparison.map(c => c.matchScore || 0)),
        highestRating: Math.max(...comparison.map(c => c.metrics.averageRating || 0)),
        averageSkillMatch: Math.round(
          comparison.reduce((sum, c) => sum + (c.metrics.skillMatchPercent || 0), 0) / comparison.length
        ),
      },
    };
  }

  /**
   * Get quick comparison stats for applications in a job
   */
  async getComparisonStats(jobId: string, tenantId: string) {
    const applications = await this.prisma.application.findMany({
      where: { jobId, job: { tenantId }, status: { notIn: ['REJECTED', 'WITHDRAWN'] } },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, skills: true },
        },
        currentStage: true,
      },
      orderBy: { matchScore: 'desc' },
      take: 20,
    });

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { skills: true },
    });

    const jobSkills = (job?.skills as string[]) || [];

    return applications.map(app => {
      const candidateSkills = (app.candidate.skills as string[]) || [];
      const matchedSkills = jobSkills.filter(s =>
        candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
      );

      return {
        applicationId: app.id,
        candidateId: app.candidate.id,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        currentStage: app.currentStage?.name,
        status: app.status,
        matchScore: app.matchScore,
        skillMatch: {
          matched: matchedSkills.length,
          total: jobSkills.length,
          percent: jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : null,
        },
      };
    });
  }

  /**
   * Get candidate leaderboard/ranking for a job
   */
  async getCandidateLeaderboard(
    jobId: string,
    tenantId: string,
    options?: {
      sortBy?: 'composite' | 'matchScore' | 'rating' | 'skillMatch' | 'stageProgress';
      limit?: number;
      includeRejected?: boolean;
    },
  ) {
    const sortBy = options?.sortBy || 'composite';
    const limit = options?.limit || 25;

    const applications = await this.prisma.application.findMany({
      where: {
        jobId,
        job: { tenantId },
        ...(options?.includeRejected ? {} : { status: { notIn: ['REJECTED', 'WITHDRAWN'] as any } }),
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            skills: true,
            currentTitle: true,
            currentCompany: true,
          },
        },
        currentStage: true,
      },
    });

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      include: {
        pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const jobSkills = (job.skills as string[]) || [];
    const stages = job.pipeline?.stages || [];
    const totalStages = stages.length;

    // Get interviews and feedback
    const applicationIds = applications.map(a => a.id);
    const interviews = await this.prisma.interview.findMany({
      where: { applicationId: { in: applicationIds } },
      include: { feedbacks: true },
    });

    const interviewsByApp = new Map<string, typeof interviews>();
    interviews.forEach(i => {
      const existing = interviewsByApp.get(i.applicationId) || [];
      existing.push(i);
      interviewsByApp.set(i.applicationId, existing);
    });

    // Calculate scores for each candidate
    const rankedCandidates = applications.map(app => {
      const appInterviews = interviewsByApp.get(app.id) || [];
      const allFeedback = appInterviews.flatMap(i => i.feedbacks);
      const ratings = allFeedback.map(f => f.rating).filter(r => r !== null) as number[];

      // Calculate individual scores (normalized to 0-100)
      const matchScore = app.matchScore || 0;

      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20 // Convert 5-star to 100
        : 0;

      const candidateSkills = (app.candidate.skills as string[]) || [];
      const matchedSkills = jobSkills.filter(s =>
        candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
      );
      const skillMatchScore = jobSkills.length > 0
        ? (matchedSkills.length / jobSkills.length) * 100
        : 0;

      // Stage progress score
      const currentStageIndex = stages.findIndex(s => s.id === app.currentStageId);
      const stageProgress = totalStages > 0
        ? ((currentStageIndex + 1) / totalStages) * 100
        : 0;

      // Calculate composite score (weighted average)
      const compositeScore = Math.round(
        (matchScore * 0.3) +
        (avgRating * 0.3) +
        (skillMatchScore * 0.25) +
        (stageProgress * 0.15)
      );

      return {
        rank: 0, // Will be set after sorting
        applicationId: app.id,
        candidate: app.candidate,
        currentStage: app.currentStage?.name || 'Applied',
        status: app.status,
        appliedAt: app.appliedAt,
        scores: {
          composite: compositeScore,
          matchScore: Math.round(matchScore),
          rating: Math.round(avgRating),
          skillMatch: Math.round(skillMatchScore),
          stageProgress: Math.round(stageProgress),
        },
        metrics: {
          interviewCount: appInterviews.length,
          feedbackCount: allFeedback.length,
          avgRating: ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
          matchedSkillsCount: matchedSkills.length,
          totalRequiredSkills: jobSkills.length,
        },
      };
    });

    // Sort based on selected criteria
    const sortKey = sortBy === 'composite' ? 'composite' :
      sortBy === 'matchScore' ? 'matchScore' :
        sortBy === 'rating' ? 'rating' :
          sortBy === 'skillMatch' ? 'skillMatch' : 'stageProgress';

    rankedCandidates.sort((a, b) => b.scores[sortKey] - a.scores[sortKey]);

    // Assign ranks
    rankedCandidates.forEach((c, index) => {
      c.rank = index + 1;
    });

    // Calculate distribution stats
    const scores = rankedCandidates.map(c => c.scores.composite);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      jobId,
      jobTitle: job.title,
      totalCandidates: rankedCandidates.length,
      sortedBy: sortBy,
      stats: {
        averageCompositeScore: avgScore,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        distribution: {
          excellent: rankedCandidates.filter(c => c.scores.composite >= 80).length,
          good: rankedCandidates.filter(c => c.scores.composite >= 60 && c.scores.composite < 80).length,
          average: rankedCandidates.filter(c => c.scores.composite >= 40 && c.scores.composite < 60).length,
          belowAverage: rankedCandidates.filter(c => c.scores.composite < 40).length,
        },
      },
      leaderboard: rankedCandidates.slice(0, limit),
    };
  }

  /**
   * Get top candidates across all active jobs
   */
  async getTopCandidatesAcrossJobs(tenantId: string, limit: number = 10) {
    const applications = await this.prisma.application.findMany({
      where: {
        job: { tenantId, status: 'PUBLISHED' as any },
        status: { notIn: ['REJECTED', 'WITHDRAWN'] as any },
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
        currentStage: true,
      },
      orderBy: { matchScore: 'desc' },
      take: limit * 2,
    });

    // Get interviews and feedback
    const applicationIds = applications.map(a => a.id);
    const interviews = await this.prisma.interview.findMany({
      where: { applicationId: { in: applicationIds } },
      include: { feedbacks: true },
    });

    const interviewsByApp = new Map<string, typeof interviews>();
    interviews.forEach(i => {
      const existing = interviewsByApp.get(i.applicationId) || [];
      existing.push(i);
      interviewsByApp.set(i.applicationId, existing);
    });

    const candidates = applications.map(app => {
      const appInterviews = interviewsByApp.get(app.id) || [];
      const allFeedback = appInterviews.flatMap(i => i.feedbacks);
      const ratings = allFeedback.map(f => f.rating).filter(r => r !== null) as number[];
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      return {
        applicationId: app.id,
        candidate: app.candidate,
        job: app.job,
        currentStage: app.currentStage?.name,
        status: app.status,
        matchScore: app.matchScore,
        avgRating,
        interviewCount: appInterviews.length,
      };
    });

    // Sort by composite of matchScore and rating
    candidates.sort((a, b) => {
      const scoreA = (a.matchScore || 0) + ((a.avgRating || 0) * 20);
      const scoreB = (b.matchScore || 0) + ((b.avgRating || 0) * 20);
      return scoreB - scoreA;
    });

    return candidates.slice(0, limit);
  }
}
