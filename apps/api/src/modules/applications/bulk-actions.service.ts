import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface BulkMoveDto {
  applicationIds: string[];
  targetStageId: string;
}

interface BulkStatusDto {
  applicationIds: string[];
  status: 'REJECTED' | 'WITHDRAWN';
  reason?: string;
}

interface BulkAssignDto {
  applicationIds: string[];
  assigneeId: string;
}

@Injectable()
export class BulkActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Move multiple applications to a different stage
   */
  async bulkMoveStage(dto: BulkMoveDto, userId: string, tenantId: string) {
    // Verify stage exists
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: dto.targetStageId },
      include: { pipeline: true },
    });

    if (!stage) {
      throw new NotFoundException('Target stage not found');
    }

    // Get applications
    const applications = await this.prisma.application.findMany({
      where: {
        id: { in: dto.applicationIds },
        job: { tenantId },
      },
      include: {
        candidate: { select: { firstName: true, lastName: true } },
        currentStage: { select: { name: true } },
      },
    });

    if (applications.length === 0) {
      throw new BadRequestException('No valid applications found');
    }

    // Update applications
    const results = await Promise.all(
      applications.map(async (app) => {
        try {
          await this.prisma.application.update({
            where: { id: app.id },
            data: { currentStageId: dto.targetStageId },
          });

          // Log activity
          await this.prisma.activityLog.create({
            data: {
              action: 'STAGE_CHANGED',
              description: `Moved from ${app.currentStage?.name || 'unknown'} to ${stage.name}`,
              userId,
              applicationId: app.id,
              candidateId: app.candidateId,
              metadata: {
                previousStageId: app.currentStageId,
                newStageId: dto.targetStageId,
                previousStageName: app.currentStage?.name,
                newStageName: stage.name,
                bulkAction: true,
              },
            },
          });

          return { id: app.id, success: true };
        } catch (error) {
          return { id: app.id, success: false, error: (error as Error).message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      success: true,
      processed: results.length,
      successCount,
      failedCount,
      targetStage: stage.name,
      results,
    };
  }

  /**
   * Update status of multiple applications
   */
  async bulkUpdateStatus(dto: BulkStatusDto, userId: string, tenantId: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        id: { in: dto.applicationIds },
        job: { tenantId },
      },
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true } },
        job: { select: { title: true } },
      },
    });

    if (applications.length === 0) {
      throw new BadRequestException('No valid applications found');
    }

    const results = await Promise.all(
      applications.map(async (app) => {
        try {
          await this.prisma.application.update({
            where: { id: app.id },
            data: { status: dto.status },
          });

          // Log activity
          await this.prisma.activityLog.create({
            data: {
              action: 'APPLICATION_STATUS_CHANGED',
              description: `Status changed to ${dto.status}${dto.reason ? `: ${dto.reason}` : ''}`,
              userId,
              applicationId: app.id,
              candidateId: app.candidateId,
              metadata: {
                previousStatus: app.status,
                newStatus: dto.status,
                reason: dto.reason,
                bulkAction: true,
              },
            },
          });

          return { id: app.id, success: true };
        } catch (error) {
          return { id: app.id, success: false, error: (error as Error).message };
        }
      })
    );

    return {
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      newStatus: dto.status,
      results,
    };
  }

  /**
   * Assign multiple applications to a user
   */
  async bulkAssign(dto: BulkAssignDto, userId: string, tenantId: string) {
    // Verify assignee exists
    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assigneeId, tenantId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    const applications = await this.prisma.application.findMany({
      where: {
        id: { in: dto.applicationIds },
        job: { tenantId },
      },
    });

    if (applications.length === 0) {
      throw new BadRequestException('No valid applications found');
    }

    const results = await Promise.all(
      applications.map(async (app) => {
        try {
          await this.prisma.application.update({
            where: { id: app.id },
            data: { assignedToId: dto.assigneeId },
          });

          await this.prisma.activityLog.create({
            data: {
              action: 'APPLICATION_ASSIGNED',
              description: `Assigned to ${assignee.firstName} ${assignee.lastName}`,
              userId,
              applicationId: app.id,
              candidateId: app.candidateId,
              metadata: {
                assigneeId: dto.assigneeId,
                assigneeName: `${assignee.firstName} ${assignee.lastName}`,
                bulkAction: true,
              },
            },
          });

          return { id: app.id, success: true };
        } catch (error) {
          return { id: app.id, success: false, error: (error as Error).message };
        }
      })
    );

    // Notify assignee
    await this.notificationsService.create({
      type: 'APPLICATION',
      title: 'Applications Assigned',
      message: `${results.filter(r => r.success).length} applications have been assigned to you.`,
      userId: dto.assigneeId,
      tenantId,
    });

    return {
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      assignee: `${assignee.firstName} ${assignee.lastName}`,
      results,
    };
  }

  /**
   * Add tags to multiple applications' candidates
   */
  async bulkAddTags(applicationIds: string[], tags: string[], userId: string, tenantId: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        job: { tenantId },
      },
      include: { candidate: { select: { id: true, tags: true } } },
    });

    if (applications.length === 0) {
      throw new BadRequestException('No valid applications found');
    }

    const results = await Promise.all(
      applications.map(async (app) => {
        try {
          const existingTags = app.candidate.tags || [];
          const newTags = [...new Set([...existingTags, ...tags])];

          await this.prisma.candidate.update({
            where: { id: app.candidateId },
            data: { tags: newTags },
          });

          await this.prisma.activityLog.create({
            data: {
              action: 'TAG_ADDED',
              description: `Tags added: ${tags.join(', ')}`,
              userId,
              candidateId: app.candidateId,
              metadata: { addedTags: tags, bulkAction: true },
            },
          });

          return { id: app.id, success: true };
        } catch (error) {
          return { id: app.id, success: false, error: (error as Error).message };
        }
      })
    );

    return {
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      tags,
      results,
    };
  }

  /**
   * Send bulk email to candidates
   */
  async bulkSendEmail(
    applicationIds: string[],
    subject: string,
    body: string,
    userId: string,
    tenantId: string,
  ) {
    const applications = await this.prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        job: { tenantId },
      },
      include: {
        candidate: { select: { id: true, email: true, firstName: true } },
        job: { select: { title: true } },
      },
    });

    if (applications.length === 0) {
      throw new BadRequestException('No valid applications found');
    }

    const results = await Promise.all(
      applications.map(async (app) => {
        try {
          // Log email send (actual sending would be done by email service)
          await this.prisma.activityLog.create({
            data: {
              action: 'EMAIL_SENT',
              description: `Email sent: ${subject}`,
              userId,
              candidateId: app.candidateId,
              applicationId: app.id,
              metadata: {
                subject,
                recipientEmail: app.candidate.email,
                jobTitle: app.job.title,
                bulkAction: true,
              },
            },
          });

          return { id: app.id, email: app.candidate.email, success: true };
        } catch (error) {
          return { id: app.id, success: false, error: (error as Error).message };
        }
      })
    );

    return {
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
    };
  }
}
