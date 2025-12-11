import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';

export interface WorkflowTrigger {
    type: 'STAGE_ENTER' | 'STAGE_EXIT' | 'TIME_IN_STAGE' | 'APPLICATION_CREATED' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED';
    stageId?: string;
    delayHours?: number; // For TIME_IN_STAGE trigger
    conditions?: Record<string, any>;
}

export interface WorkflowAction {
    type: 'SEND_EMAIL' | 'ADD_TAG' | 'CREATE_TASK' | 'REQUEST_FEEDBACK' | 'MOVE_STAGE' | 'SEND_SMS' | 'NOTIFY_USER' | 'UPDATE_STATUS';
    config: Record<string, any>;
}

@Injectable()
export class WorkflowsService {
    private readonly logger = new Logger(WorkflowsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Run time-based workflows every hour
     */
    @Cron(CronExpression.EVERY_HOUR)
    async executeTimeBasedWorkflows() {
        this.logger.log('Running time-based workflow check...');
        
        // Get all active TIME_IN_STAGE workflows
        const workflows = await this.prisma.workflowAutomation.findMany({
            where: { trigger: 'TIME_IN_STAGE', isActive: true },
        });

        for (const workflow of workflows) {
            const conditions = workflow.conditions as Record<string, any>;
            const delayHours = conditions?.delayHours || 24;
            const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);

            // Find applications in this stage for longer than delayHours
            const applications = await this.prisma.application.findMany({
                where: {
                    currentStageId: workflow.stageId,
                    updatedAt: { lte: cutoffTime },
                    status: { notIn: ['HIRED', 'REJECTED', 'WITHDRAWN'] },
                },
                include: {
                    candidate: true,
                    job: true,
                    currentStage: true,
                },
            });

            for (const application of applications) {
                // Check if workflow was already executed for this application
                const alreadyExecuted = await this.prisma.activityLog.findFirst({
                    where: {
                        applicationId: application.id,
                        action: 'WORKFLOW_EXECUTED',
                        metadata: { path: ['workflowId'], equals: workflow.id },
                        createdAt: { gte: cutoffTime },
                    },
                });

                if (!alreadyExecuted) {
                    await this.executeWorkflow(workflow, application);
                }
            }
        }
    }

    /**
     * Execute workflows when an application moves to a new stage
     */
    async executeStageWorkflows(
        applicationId: string,
        newStageId: string,
        oldStageId?: string,
    ) {
        // Get the application with related data
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                candidate: true,
                job: true,
                currentStage: true,
            },
        });

        if (!application) {
            return;
        }

        // Find workflows for the new stage (STAGE_ENTER)
        const workflows = await this.prisma.workflowAutomation.findMany({
            where: {
                stageId: newStageId,
                trigger: 'STAGE_ENTER',
                isActive: true,
            },
        });

        // Execute each workflow
        for (const workflow of workflows) {
            await this.executeWorkflow(workflow, application);
        }
    }

    /**
     * Execute a single workflow
     */
    private async executeWorkflow(workflow: any, application: any) {
        const actions = workflow.actions as WorkflowAction[];
        const conditions = workflow.conditions as Record<string, any>;

        // Check conditions
        if (conditions && !this.checkConditions(conditions, application)) {
            console.log(`Workflow ${workflow.id} conditions not met, skipping`);
            return;
        }

        // Execute actions
        for (const action of actions) {
            await this.executeAction(action, application, workflow);
        }
    }

    /**
     * Check if workflow conditions are met
     */
    private checkConditions(
        conditions: Record<string, any>,
        application: any,
    ): boolean {
        // Example: Check if source matches
        if (conditions.source && application.candidate.source !== conditions.source) {
            return false;
        }

        // Add more condition checks as needed
        return true;
    }

    /**
     * Execute a workflow action
     */
    private async executeAction(
        action: WorkflowAction,
        application: any,
        workflow: any,
    ) {
        console.log(`Executing action: ${action.type} for application ${application.id}`);

        switch (action.type) {
            case 'SEND_EMAIL':
                await this.sendEmail(action.config, application);
                break;
            case 'ADD_TAG':
                await this.addTag(action.config, application);
                break;
            case 'CREATE_TASK':
                await this.createTask(action.config, application);
                break;
            case 'REQUEST_FEEDBACK':
                await this.requestFeedback(action.config, application);
                break;
            case 'MOVE_STAGE':
                await this.moveStage(action.config, application);
                break;
            case 'NOTIFY_USER':
                await this.notifyUser(action.config, application);
                break;
            case 'UPDATE_STATUS':
                await this.updateStatus(action.config, application);
                break;
        }

        // Log the action execution
        await this.prisma.activityLog.create({
            data: {
                action: 'WORKFLOW_EXECUTED',
                description: `Workflow "${workflow.name}" executed action: ${action.type}`,
                applicationId: application.id,
                metadata: {
                    workflowId: workflow.id,
                    actionType: action.type,
                },
            },
        });
    }

    /**
     * Send email action
     */
    private async sendEmail(config: Record<string, any>, application: any) {
        const { subject, body, to } = config;

        // Resolve recipient
        let recipientEmail = '';
        if (to === 'CANDIDATE') {
            recipientEmail = application.candidate.email;
        } else if (to === 'HIRING_MANAGER') {
            // Assuming job has hiring manager
            // We need to fetch job with hiring manager if not already included
            // application.job is included, but maybe not hiringManager relation
            // For now, let's assume we might need to fetch it or it's just an email string
            // If 'to' is a specific email, use it.
        } else {
            recipientEmail = to;
        }

        if (!recipientEmail) {
            console.warn(`No recipient email found for workflow action SEND_EMAIL`);
            return;
        }

        // Replace variables in body
        let processedBody = body || '';
        processedBody = processedBody.replace(/{{candidate_name}}/g, `${application.candidate.firstName} ${application.candidate.lastName}`);
        processedBody = processedBody.replace(/{{job_title}}/g, application.job.title);
        processedBody = processedBody.replace(/{{stage_name}}/g, application.currentStage?.name || '');

        await this.emailService.sendEmail({
            to: recipientEmail,
            subject: subject || 'Update on your application',
            html: processedBody,
            tenantId: application.job.tenantId, // Assuming job has tenantId
        });

        console.log(`Email sent to ${recipientEmail}`);
    }

    /**
     * Add tag action
     */
    private async addTag(config: Record<string, any>, application: any) {
        const tag = config.tag as string;
        const currentTags = application.candidate.tags || [];

        if (!currentTags.includes(tag)) {
            await this.prisma.candidate.update({
                where: { id: application.candidateId },
                data: {
                    tags: [...currentTags, tag],
                },
            });
        }
    }

    /**
     * Create task action
     */
    private async createTask(config: Record<string, any>, application: any) {
        // TODO: Implement task creation
        console.log('Creating task:', config);
        // This would create a task/reminder for the recruiter
    }

    /**
     * Request feedback action
     */
    private async requestFeedback(config: Record<string, any>, application: any) {
        // TODO: Implement feedback request
        console.log('Requesting feedback:', config);
        // This would send a notification to interviewers to submit feedback
    }

    /**
     * Get all workflows for a stage
     */
    async getWorkflowsByStage(stageId: string) {
        return this.prisma.workflowAutomation.findMany({
            where: { stageId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Move stage action
     */
    private async moveStage(config: Record<string, any>, application: any) {
        const { targetStageId } = config;
        if (!targetStageId) {
            this.logger.warn('No target stage specified for MOVE_STAGE action');
            return;
        }

        await this.prisma.application.update({
            where: { id: application.id },
            data: { currentStageId: targetStageId },
        });

        this.logger.log(`Moved application ${application.id} to stage ${targetStageId}`);
    }

    /**
     * Notify user action
     */
    private async notifyUser(config: Record<string, any>, application: any) {
        const { userId, message } = config;
        
        // Get the user to notify
        let targetUserId = userId;
        if (userId === 'ASSIGNED_TO') {
            targetUserId = application.assignedToId;
        } else if (userId === 'RECRUITER') {
            targetUserId = application.job?.recruiterId;
        }

        if (!targetUserId) {
            this.logger.warn('No target user for NOTIFY_USER action');
            return;
        }

        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { email: true, firstName: true },
        });

        if (user?.email) {
            const processedMessage = (message || '')
                .replace(/{{candidate_name}}/g, `${application.candidate.firstName} ${application.candidate.lastName}`)
                .replace(/{{job_title}}/g, application.job.title);

            await this.emailService.sendEmail({
                to: user.email,
                subject: `Action Required: ${application.job.title}`,
                html: processedMessage,
                tenantId: application.job.tenantId,
            });
        }
    }

    /**
     * Update status action
     */
    private async updateStatus(config: Record<string, any>, application: any) {
        const { status } = config;
        if (!status) {
            this.logger.warn('No status specified for UPDATE_STATUS action');
            return;
        }

        await this.prisma.application.update({
            where: { id: application.id },
            data: { status },
        });

        this.logger.log(`Updated application ${application.id} status to ${status}`);
    }

    /**
     * Create a new workflow
     */
    async createWorkflow(data: {
        name: string;
        description?: string;
        stageId: string;
        trigger: string;
        conditions?: Record<string, any>;
        actions: WorkflowAction[];
        delayMinutes?: number;
    }) {
        return this.prisma.workflowAutomation.create({
            data: {
                name: data.name,
                description: data.description,
                stageId: data.stageId,
                trigger: data.trigger,
                conditions: data.conditions || {},
                actions: data.actions as any,
                delayMinutes: data.delayMinutes || 0,
                isActive: true,
            },
        });
    }

    /**
     * Update a workflow
     */
    async updateWorkflow(
        id: string,
        data: {
            name?: string;
            description?: string;
            trigger?: string;
            conditions?: Record<string, any>;
            actions?: WorkflowAction[];
            delayMinutes?: number;
            isActive?: boolean;
        },
    ) {
        return this.prisma.workflowAutomation.update({
            where: { id },
            data: {
                ...data,
                actions: data.actions as any,
            },
        });
    }

    /**
     * Delete a workflow
     */
    async deleteWorkflow(id: string) {
        return this.prisma.workflowAutomation.delete({
            where: { id },
        });
    }

    /**
     * Toggle workflow active status
     */
    async toggleWorkflow(id: string, isActive: boolean) {
        return this.prisma.workflowAutomation.update({
            where: { id },
            data: { isActive },
        });
    }
}
