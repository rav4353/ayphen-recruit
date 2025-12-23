import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export type RequisitionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApprovalStep {
    order: number;
    approverId: string;
    approverName?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
    comment?: string;
    actionAt?: string;
}

export interface JobRequisition {
    id: string;
    tenantId: string;
    jobId?: string;
    title: string;
    department?: string;
    location?: string;
    employmentType: string;
    headcount: number;
    salaryMin?: number;
    salaryMax?: number;
    currency: string;
    justification: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: RequisitionStatus;
    approvalChain: ApprovalStep[];
    currentStep: number;
    requestedBy: string;
    requestedByName?: string;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
}

const REQUISITION_KEY = 'job_requisition';
const APPROVAL_WORKFLOW_KEY = 'approval_workflow_config';

@Injectable()
export class JobRequisitionService {
    private readonly logger = new Logger(JobRequisitionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private newId(): string {
        return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // ==================== WORKFLOW CONFIGURATION ====================

    async getApprovalWorkflowConfig(tenantId: string): Promise<{
        enabled: boolean;
        defaultApprovers: string[];
        requireFinanceApproval: boolean;
        salaryThresholdForFinance: number;
    }> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: APPROVAL_WORKFLOW_KEY } },
        });

        if (!setting) {
            return {
                enabled: true,
                defaultApprovers: [],
                requireFinanceApproval: false,
                salaryThresholdForFinance: 150000,
            };
        }

        return setting.value as any;
    }

    async updateApprovalWorkflowConfig(
        tenantId: string,
        config: {
            enabled?: boolean;
            defaultApprovers?: string[];
            requireFinanceApproval?: boolean;
            salaryThresholdForFinance?: number;
        },
    ) {
        const current = await this.getApprovalWorkflowConfig(tenantId);
        const updated = { ...current, ...config };

        await this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: APPROVAL_WORKFLOW_KEY } },
            update: { value: updated as any },
            create: {
                tenantId,
                key: APPROVAL_WORKFLOW_KEY,
                value: updated as any,
                category: 'WORKFLOW',
                isPublic: false,
            },
        });

        return updated;
    }

    // ==================== REQUISITION MANAGEMENT ====================

    async createRequisition(
        tenantId: string,
        userId: string,
        dto: {
            title: string;
            department?: string;
            location?: string;
            employmentType: string;
            headcount?: number;
            salaryMin?: number;
            salaryMax?: number;
            currency?: string;
            justification: string;
            urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            approverIds?: string[];
        },
    ): Promise<JobRequisition> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
        });

        const config = await this.getApprovalWorkflowConfig(tenantId);

        // Build approval chain
        let approverIds = dto.approverIds || config.defaultApprovers || [];

        // Add finance approver if salary exceeds threshold
        if (config.requireFinanceApproval && dto.salaryMax && dto.salaryMax > config.salaryThresholdForFinance) {
            // Would look up finance approver - simplified for now
        }

        // Get approver names
        const approvers = await this.prisma.user.findMany({
            where: { id: { in: approverIds } },
            select: { id: true, firstName: true, lastName: true },
        });

        const approvalChain: ApprovalStep[] = approverIds.map((approverId, index) => {
            const approver = approvers.find(a => a.id === approverId);
            return {
                order: index + 1,
                approverId,
                approverName: approver ? `${approver.firstName} ${approver.lastName}` : undefined,
                status: 'PENDING' as const,
            };
        });

        const requisition: JobRequisition = {
            id: this.newId(),
            tenantId,
            title: dto.title,
            department: dto.department,
            location: dto.location,
            employmentType: dto.employmentType,
            headcount: dto.headcount || 1,
            salaryMin: dto.salaryMin,
            salaryMax: dto.salaryMax,
            currency: dto.currency || 'USD',
            justification: dto.justification,
            urgency: dto.urgency || 'MEDIUM',
            status: approvalChain.length > 0 ? 'DRAFT' : 'APPROVED',
            approvalChain,
            currentStep: 0,
            requestedBy: userId,
            requestedByName: user ? `${user.firstName} ${user.lastName}` : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this.prisma.setting.create({
            data: {
                tenantId,
                key: `${REQUISITION_KEY}_${requisition.id}`,
                value: requisition as any,
                category: 'REQUISITION',
                isPublic: false,
            },
        });

        return requisition;
    }

    async getRequisitions(
        tenantId: string,
        filters?: { status?: RequisitionStatus; requestedBy?: string },
    ): Promise<JobRequisition[]> {
        const settings = await this.prisma.setting.findMany({
            where: {
                tenantId,
                key: { startsWith: `${REQUISITION_KEY}_` },
            },
        });

        let requisitions = settings.map(s => s.value as unknown as JobRequisition);

        if (filters?.status) {
            requisitions = requisitions.filter(r => r.status === filters.status);
        }
        if (filters?.requestedBy) {
            requisitions = requisitions.filter(r => r.requestedBy === filters.requestedBy);
        }

        return requisitions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async getRequisition(tenantId: string, requisitionId: string): Promise<JobRequisition> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: `${REQUISITION_KEY}_${requisitionId}` } },
        });

        if (!setting) {
            throw new NotFoundException('Requisition not found');
        }

        return setting.value as unknown as JobRequisition;
    }

    async getPendingApprovals(tenantId: string, approverId: string): Promise<JobRequisition[]> {
        const requisitions = await this.getRequisitions(tenantId, { status: 'PENDING_APPROVAL' });

        return requisitions.filter(r => {
            const currentStep = r.approvalChain[r.currentStep];
            return currentStep?.approverId === approverId && currentStep?.status === 'PENDING';
        });
    }

    // ==================== APPROVAL WORKFLOW ====================

    async submitForApproval(tenantId: string, requisitionId: string): Promise<JobRequisition> {
        const requisition = await this.getRequisition(tenantId, requisitionId);

        if (requisition.status !== 'DRAFT') {
            throw new BadRequestException('Only draft requisitions can be submitted');
        }

        if (requisition.approvalChain.length === 0) {
            // No approvers - auto-approve
            return this.updateRequisitionStatus(tenantId, requisitionId, {
                status: 'APPROVED',
                approvedAt: new Date().toISOString(),
            });
        }

        const updated = await this.updateRequisitionStatus(tenantId, requisitionId, {
            status: 'PENDING_APPROVAL',
            currentStep: 0,
        });

        // Notify first approver
        const firstApprover = requisition.approvalChain[0];
        if (firstApprover) {
            try {
                await this.notificationsService.create({
                    userId: firstApprover.approverId,
                    tenantId,
                    type: 'SYSTEM' as any,
                    title: 'Job Requisition Pending Approval',
                    message: `A new job requisition for "${requisition.title}" requires your approval.`,
                    link: `/requisitions/${requisitionId}`,
                });
            } catch (error) {
                this.logger.warn('Failed to notify approver:', error);
            }
        }

        return updated;
    }

    async approveStep(
        tenantId: string,
        requisitionId: string,
        approverId: string,
        comment?: string,
    ): Promise<JobRequisition> {
        const requisition = await this.getRequisition(tenantId, requisitionId);

        if (requisition.status !== 'PENDING_APPROVAL') {
            throw new BadRequestException('Requisition is not pending approval');
        }

        const currentStep = requisition.approvalChain[requisition.currentStep];
        if (!currentStep || currentStep.approverId !== approverId) {
            throw new BadRequestException('You are not authorized to approve this step');
        }

        // Update current step
        currentStep.status = 'APPROVED';
        currentStep.comment = comment;
        currentStep.actionAt = new Date().toISOString();

        // Check if this was the last step
        const nextStepIndex = requisition.currentStep + 1;
        const isLastStep = nextStepIndex >= requisition.approvalChain.length;

        let updates: Partial<JobRequisition>;

        if (isLastStep) {
            updates = {
                status: 'APPROVED',
                approvedAt: new Date().toISOString(),
                approvalChain: requisition.approvalChain,
            };

            // Notify requester
            try {
                await this.notificationsService.create({
                    userId: requisition.requestedBy,
                    tenantId,
                    type: 'SYSTEM' as any,
                    title: 'Job Requisition Approved',
                    message: `Your job requisition for "${requisition.title}" has been approved.`,
                    link: `/requisitions/${requisitionId}`,
                });
            } catch (error) {
                this.logger.warn('Failed to notify requester:', error);
            }
        } else {
            updates = {
                currentStep: nextStepIndex,
                approvalChain: requisition.approvalChain,
            };

            // Notify next approver
            const nextApprover = requisition.approvalChain[nextStepIndex];
            if (nextApprover) {
                try {
                    await this.notificationsService.create({
                        userId: nextApprover.approverId,
                        tenantId,
                        type: 'SYSTEM' as any,
                        title: 'Job Requisition Pending Approval',
                        message: `A job requisition for "${requisition.title}" requires your approval.`,
                        link: `/requisitions/${requisitionId}`,
                    });
                } catch (error) {
                    this.logger.warn('Failed to notify next approver:', error);
                }
            }
        }

        return this.updateRequisitionStatus(tenantId, requisitionId, updates);
    }

    async rejectStep(
        tenantId: string,
        requisitionId: string,
        approverId: string,
        reason: string,
    ): Promise<JobRequisition> {
        const requisition = await this.getRequisition(tenantId, requisitionId);

        if (requisition.status !== 'PENDING_APPROVAL') {
            throw new BadRequestException('Requisition is not pending approval');
        }

        const currentStep = requisition.approvalChain[requisition.currentStep];
        if (!currentStep || currentStep.approverId !== approverId) {
            throw new BadRequestException('You are not authorized to reject this step');
        }

        currentStep.status = 'REJECTED';
        currentStep.comment = reason;
        currentStep.actionAt = new Date().toISOString();

        const updated = await this.updateRequisitionStatus(tenantId, requisitionId, {
            status: 'REJECTED',
            rejectedAt: new Date().toISOString(),
            approvalChain: requisition.approvalChain,
        });

        // Notify requester
        try {
            await this.notificationsService.create({
                userId: requisition.requestedBy,
                tenantId,
                type: 'SYSTEM' as any,
                title: 'Job Requisition Rejected',
                message: `Your job requisition for "${requisition.title}" was rejected. Reason: ${reason}`,
                link: `/requisitions/${requisitionId}`,
            });
        } catch (error) {
            this.logger.warn('Failed to notify requester:', error);
        }

        return updated;
    }

    async cancelRequisition(tenantId: string, requisitionId: string, userId: string): Promise<JobRequisition> {
        const requisition = await this.getRequisition(tenantId, requisitionId);

        if (requisition.requestedBy !== userId) {
            throw new BadRequestException('Only the requester can cancel this requisition');
        }

        if (requisition.status === 'APPROVED') {
            throw new BadRequestException('Cannot cancel an approved requisition');
        }

        return this.updateRequisitionStatus(tenantId, requisitionId, {
            status: 'CANCELLED',
        });
    }

    // ==================== JOB CREATION ====================

    async createJobFromRequisition(
        tenantId: string,
        requisitionId: string,
        additionalData: {
            description: string;
            requirements?: string;
            responsibilities?: string;
            skills?: string[];
            recruiterId?: string;
            hiringManagerId?: string;
        },
    ): Promise<{ jobId: string; requisition: JobRequisition }> {
        const requisition = await this.getRequisition(tenantId, requisitionId);

        if (requisition.status !== 'APPROVED') {
            throw new BadRequestException('Only approved requisitions can be converted to jobs');
        }

        if (requisition.jobId) {
            throw new BadRequestException('A job has already been created from this requisition');
        }

        // Create the job
        const job = await this.prisma.job.create({
            data: {
                tenantId,
                title: requisition.title,
                description: additionalData.description,
                requirements: additionalData.requirements,
                responsibilities: additionalData.responsibilities,
                skills: additionalData.skills || [],
                locations: undefined, // Will be set separately if needed
                employmentType: requisition.employmentType as any,
                salaryMin: requisition.salaryMin,
                salaryMax: requisition.salaryMax,
                salaryCurrency: requisition.currency,
                openings: requisition.headcount,
                status: 'DRAFT',
                recruiterId: additionalData.recruiterId,
                hiringManagerId: additionalData.hiringManagerId,
            },
        });

        // Update requisition with job reference
        await this.updateRequisitionStatus(tenantId, requisitionId, {
            jobId: job.id,
        });

        return {
            jobId: job.id,
            requisition: { ...requisition, jobId: job.id },
        };
    }

    // ==================== HELPERS ====================

    private async updateRequisitionStatus(
        tenantId: string,
        requisitionId: string,
        updates: Partial<JobRequisition>,
    ): Promise<JobRequisition> {
        const requisition = await this.getRequisition(tenantId, requisitionId);

        const updated: JobRequisition = {
            ...requisition,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        await this.prisma.setting.update({
            where: { tenantId_key: { tenantId, key: `${REQUISITION_KEY}_${requisitionId}` } },
            data: { value: updated as any },
        });

        return updated;
    }

    async getRequisitionStats(tenantId: string): Promise<{
        total: number;
        byStatus: Record<RequisitionStatus, number>;
        pendingApprovals: number;
        avgApprovalTime: number;
    }> {
        const requisitions = await this.getRequisitions(tenantId);

        const byStatus: Record<RequisitionStatus, number> = {
            DRAFT: 0,
            PENDING_APPROVAL: 0,
            APPROVED: 0,
            REJECTED: 0,
            CANCELLED: 0,
        };

        let totalApprovalTime = 0;
        let approvedCount = 0;

        for (const req of requisitions) {
            byStatus[req.status]++;

            if (req.status === 'APPROVED' && req.approvedAt) {
                const created = new Date(req.createdAt).getTime();
                const approved = new Date(req.approvedAt).getTime();
                totalApprovalTime += approved - created;
                approvedCount++;
            }
        }

        return {
            total: requisitions.length,
            byStatus,
            pendingApprovals: byStatus.PENDING_APPROVAL,
            avgApprovalTime: approvedCount > 0
                ? Math.round(totalApprovalTime / approvedCount / (1000 * 60 * 60)) // hours
                : 0,
        };
    }
}
