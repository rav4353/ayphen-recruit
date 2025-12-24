import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';

const JOB_EDIT_APPROVAL_SETTINGS_KEY = 'job_edit_approval_config';

export interface JobEditApprovalConfig {
  enabled: boolean;
  fieldsRequiringApproval: string[];
  defaultApproverIds: string[];
}

const DEFAULT_CONFIG: JobEditApprovalConfig = {
  enabled: false,
  fieldsRequiringApproval: [
    'title',
    'description',
    'salaryMin',
    'salaryMax',
    'requirements',
    'responsibilities',
  ],
  defaultApproverIds: [],
};

@Injectable()
export class JobEditApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get the job edit approval configuration for a tenant
   */
  async getConfig(tenantId: string): Promise<JobEditApprovalConfig> {
    try {
      const setting = await this.settingsService.getSettingByKey(
        tenantId,
        JOB_EDIT_APPROVAL_SETTINGS_KEY,
      );
      if (setting?.value) {
        return { ...DEFAULT_CONFIG, ...(setting.value as any) };
      }
    } catch (error) {
      console.warn('Failed to fetch job edit approval config:', error);
    }
    return DEFAULT_CONFIG;
  }

  /**
   * Update the job edit approval configuration
   */
  async updateConfig(
    tenantId: string,
    config: Partial<JobEditApprovalConfig>,
    userId: string,
  ): Promise<JobEditApprovalConfig> {
    const currentConfig = await this.getConfig(tenantId);
    const updatedConfig = { ...currentConfig, ...config };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: JOB_EDIT_APPROVAL_SETTINGS_KEY } },
      update: { value: updatedConfig as any },
      create: {
        tenantId,
        key: JOB_EDIT_APPROVAL_SETTINGS_KEY,
        value: updatedConfig as any,
        category: 'WORKFLOW',
        isPublic: false,
      },
    });

    return updatedConfig;
  }

  /**
   * Check if a job edit requires approval based on the changed fields
   */
  async requiresApproval(
    tenantId: string,
    jobId: string,
    changedFields: string[],
  ): Promise<{ required: boolean; fieldsNeedingApproval: string[] }> {
    const config = await this.getConfig(tenantId);
    
    if (!config.enabled) {
      return { required: false, fieldsNeedingApproval: [] };
    }

    // Get the job to check its current status
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    // Only require approval for jobs that are already APPROVED or OPEN
    if (!job || !['APPROVED', 'OPEN', 'PUBLISHED'].includes(job.status)) {
      return { required: false, fieldsNeedingApproval: [] };
    }

    const fieldsNeedingApproval = changedFields.filter(field =>
      config.fieldsRequiringApproval.includes(field),
    );

    return {
      required: fieldsNeedingApproval.length > 0,
      fieldsNeedingApproval,
    };
  }

  /**
   * Create pending edits for a job
   */
  async createPendingEdits(
    jobId: string,
    editorId: string,
    tenantId: string,
    changes: { fieldName: string; oldValue: any; newValue: any }[],
    comment?: string,
  ) {
    const config = await this.getConfig(tenantId);
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { hiringManager: true, recruiter: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Create pending edit records
    const pendingEdits = await this.prisma.$transaction(
      changes.map(change =>
        this.prisma.jobPendingEdit.create({
          data: {
            jobId,
            editorId,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
            comment,
            status: 'PENDING',
          },
        }),
      ),
    );

    // Find who previously approved this job
    const previousApprovers = await this.prisma.jobApproval.findMany({
      where: {
        jobId,
        status: 'APPROVED',
      },
      select: {
        approverId: true,
      },
    });

    // Extract unique approver IDs
    const approverIds = [...new Set(previousApprovers.map(pa => pa.approverId))];

    // If no previous approvers found, fall back to hiring manager or recruiter
    if (approverIds.length === 0) {
      if (job.hiringManagerId) {
        approverIds.push(job.hiringManagerId);
      } else if (job.recruiterId) {
        approverIds.push(job.recruiterId);
      } else {
        console.error(`No approvers found for job ${jobId}`);
        throw new BadRequestException('No approvers found for this job');
      }
    }

    // Notify previous approvers
    for (const approverId of approverIds) {
      if (approverId !== editorId) {
        try {
          await this.notificationsService.create({
            type: 'SYSTEM',
            title: 'Job Edit Pending Approval',
            message: `${changes.length} field(s) have been edited on job "${job.title}" and require your approval.`,
            userId: approverId,
            tenantId,
            metadata: { jobId, pendingEditIds: pendingEdits.map(pe => pe.id) },
          });
        } catch (error) {
          console.error('Failed to notify approver:', error);
        }
      }
    }

    return pendingEdits;
  }

  /**
   * Get all pending edits for a job
   */
  async getPendingEdits(jobId: string, tenantId: string) {
    const pendingEdits = await this.prisma.jobPendingEdit.findMany({
      where: { jobId, status: 'PENDING' },
      include: {
        editor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pendingEdits;
  }

  /**
   * Get all pending edits across all jobs for a tenant (for approvers)
   */
  async getAllPendingEdits(tenantId: string, status?: string) {
    const where: any = {
      job: { tenantId },
    };

    if (status) {
      where.status = status;
    }

    const pendingEdits = await this.prisma.jobPendingEdit.findMany({
      where,
      include: {
        job: {
          select: { id: true, title: true, jobCode: true, status: true },
        },
        editor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by job
    const groupedByJob = pendingEdits.reduce((acc, edit) => {
      const jobId = edit.jobId;
      if (!acc[jobId]) {
        acc[jobId] = {
          job: edit.job,
          edits: [],
        };
      }
      acc[jobId].edits.push(edit);
      return acc;
    }, {} as Record<string, { job: any; edits: any[] }>);

    return Object.values(groupedByJob);
  }

  /**
   * Approve pending edits and apply them to the job
   */
  async approveEdits(
    editIds: string[],
    approverId: string,
    tenantId: string,
    comment?: string,
  ) {
    const edits = await this.prisma.jobPendingEdit.findMany({
      where: { id: { in: editIds }, status: 'PENDING' },
      include: { job: true },
    });

    if (edits.length === 0) {
      throw new BadRequestException('No pending edits found');
    }

    // Verify all edits are for the same job
    const jobId = edits[0].jobId;
    if (!edits.every(e => e.jobId === jobId)) {
      throw new BadRequestException('All edits must be for the same job');
    }

    const job = edits[0].job;
    if (job.tenantId !== tenantId) {
      throw new BadRequestException('Job does not belong to this tenant');
    }

    // Build update data from approved edits
    const updateData: Record<string, any> = {};
    for (const edit of edits) {
      updateData[edit.fieldName] = edit.newValue;
    }

    // Apply changes and update edit statuses in a transaction
    await this.prisma.$transaction([
      // Update the job with new values
      this.prisma.job.update({
        where: { id: jobId },
        data: updateData,
      }),
      // Mark edits as approved
      this.prisma.jobPendingEdit.updateMany({
        where: { id: { in: editIds } },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: approverId,
        },
      }),
    ]);

    // Notify the editor
    const editorId = edits[0].editorId;
    try {
      await this.notificationsService.create({
        type: 'SYSTEM',
        title: 'Job Edit Approved',
        message: `Your edits to job "${job.title}" have been approved and applied.`,
        userId: editorId,
        tenantId,
        metadata: { jobId },
      });
    } catch (error) {
      console.error('Failed to notify editor:', error);
    }

    return { success: true, appliedChanges: updateData };
  }

  /**
   * Reject pending edits
   */
  async rejectEdits(
    editIds: string[],
    approverId: string,
    tenantId: string,
    rejectionReason: string,
  ) {
    if (!rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const edits = await this.prisma.jobPendingEdit.findMany({
      where: { id: { in: editIds }, status: 'PENDING' },
      include: { job: true },
    });

    if (edits.length === 0) {
      throw new BadRequestException('No pending edits found');
    }

    const job = edits[0].job;
    if (job.tenantId !== tenantId) {
      throw new BadRequestException('Job does not belong to this tenant');
    }

    // Mark edits as rejected
    await this.prisma.jobPendingEdit.updateMany({
      where: { id: { in: editIds } },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: approverId,
      },
    });

    // Notify the editor
    const editorId = edits[0].editorId;
    try {
      await this.notificationsService.create({
        type: 'SYSTEM',
        title: 'Job Edit Rejected',
        message: `Your edits to job "${job.title}" have been rejected. Reason: ${rejectionReason}`,
        userId: editorId,
        tenantId,
        metadata: { jobId: job.id, rejectionReason },
      });
    } catch (error) {
      console.error('Failed to notify editor:', error);
    }

    return { success: true };
  }

  /**
   * Get comparison data for a job (current vs pending edits)
   */
  async getJobComparison(jobId: string, tenantId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        department: true,
        locations: true,
        hiringManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        recruiter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!job || job.tenantId !== tenantId) {
      throw new NotFoundException('Job not found');
    }

    const pendingEdits = await this.prisma.jobPendingEdit.findMany({
      where: { jobId, status: 'PENDING' },
      include: {
        editor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build comparison object
    const comparison: {
      fieldName: string;
      currentValue: any;
      proposedValue: any;
      editId: string;
      editedBy: any;
      editedAt: Date;
      comment?: string;
    }[] = [];

    for (const edit of pendingEdits) {
      comparison.push({
        fieldName: edit.fieldName,
        currentValue: (job as any)[edit.fieldName],
        proposedValue: edit.newValue,
        editId: edit.id,
        editedBy: edit.editor,
        editedAt: edit.createdAt,
        comment: edit.comment || undefined,
      });
    }

    return {
      job,
      pendingEdits: comparison,
      hasPendingEdits: comparison.length > 0,
    };
  }
}
