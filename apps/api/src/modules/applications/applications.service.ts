import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreatePublicApplicationDto } from './dto/create-public-application.dto';
import { WorkflowsService } from '../workflows/workflows.service';
import { SlaService } from '../sla/sla.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowsService: WorkflowsService,
    private readonly slaService: SlaService,
    private readonly aiService: AiService,
  ) { }

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

    return this.prisma.application.create({
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
      candidate = await this.prisma.candidate.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          linkedinUrl: dto.linkedinUrl,
          portfolioUrl: dto.portfolioUrl,
          resumeUrl: dto.resumeUrl,
          gdprConsent: dto.gdprConsent || false,
          tenantId: job.tenantId,
          source: 'Career Page',
        },
      });
    } else {
      // Update resume if provided
      if (dto.resumeUrl) {
        await this.prisma.candidate.update({
          where: { id: candidate.id },
          data: { resumeUrl: dto.resumeUrl },
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
            location: true
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

    return updated;
  }

  async updateStatus(id: string, status: string, reason?: string) {
    const data: Record<string, unknown> = { status };

    if (status === 'REJECTED') {
      data.rejectionReason = reason;
    } else if (status === 'WITHDRAWN') {
      data.withdrawalReason = reason;
    }

    return this.prisma.application.update({
      where: { id },
      data,
    });
  }

  async assignTo(id: string, userId: string) {
    return this.prisma.application.update({
      where: { id },
      data: { assignedToId: userId },
    });
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
}
