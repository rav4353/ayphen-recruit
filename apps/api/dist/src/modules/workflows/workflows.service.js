"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../common/services/email.service");
let WorkflowsService = WorkflowsService_1 = class WorkflowsService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(WorkflowsService_1.name);
    }
    async executeTimeBasedWorkflows() {
        this.logger.log('Running time-based workflow check...');
        const workflows = await this.prisma.workflowAutomation.findMany({
            where: { trigger: 'TIME_IN_STAGE', isActive: true },
        });
        for (const workflow of workflows) {
            const conditions = workflow.conditions;
            const delayHours = conditions?.delayHours || 24;
            const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);
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
    async executeStageWorkflows(applicationId, newStageId, oldStageId) {
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
        const workflows = await this.prisma.workflowAutomation.findMany({
            where: {
                stageId: newStageId,
                trigger: 'STAGE_ENTER',
                isActive: true,
            },
        });
        for (const workflow of workflows) {
            await this.executeWorkflow(workflow, application);
        }
    }
    async executeWorkflow(workflow, application) {
        const actions = workflow.actions;
        const conditions = workflow.conditions;
        if (conditions && !this.checkConditions(conditions, application)) {
            console.log(`Workflow ${workflow.id} conditions not met, skipping`);
            return;
        }
        for (const action of actions) {
            await this.executeAction(action, application, workflow);
        }
    }
    checkConditions(conditions, application) {
        if (conditions.source && application.candidate.source !== conditions.source) {
            return false;
        }
        return true;
    }
    async executeAction(action, application, workflow) {
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
    async sendEmail(config, application) {
        const { subject, body, to } = config;
        let recipientEmail = '';
        if (to === 'CANDIDATE') {
            recipientEmail = application.candidate.email;
        }
        else if (to === 'HIRING_MANAGER') {
        }
        else {
            recipientEmail = to;
        }
        if (!recipientEmail) {
            console.warn(`No recipient email found for workflow action SEND_EMAIL`);
            return;
        }
        let processedBody = body || '';
        processedBody = processedBody.replace(/{{candidate_name}}/g, `${application.candidate.firstName} ${application.candidate.lastName}`);
        processedBody = processedBody.replace(/{{job_title}}/g, application.job.title);
        processedBody = processedBody.replace(/{{stage_name}}/g, application.currentStage?.name || '');
        await this.emailService.sendEmail({
            to: recipientEmail,
            subject: subject || 'Update on your application',
            html: processedBody,
            tenantId: application.job.tenantId,
        });
        console.log(`Email sent to ${recipientEmail}`);
    }
    async addTag(config, application) {
        const tag = config.tag;
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
    async createTask(config, application) {
        console.log('Creating task:', config);
    }
    async requestFeedback(config, application) {
        console.log('Requesting feedback:', config);
    }
    async getWorkflowsByStage(stageId) {
        return this.prisma.workflowAutomation.findMany({
            where: { stageId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async moveStage(config, application) {
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
    async notifyUser(config, application) {
        const { userId, message } = config;
        let targetUserId = userId;
        if (userId === 'ASSIGNED_TO') {
            targetUserId = application.assignedToId;
        }
        else if (userId === 'RECRUITER') {
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
    async updateStatus(config, application) {
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
    async createWorkflow(data) {
        return this.prisma.workflowAutomation.create({
            data: {
                name: data.name,
                description: data.description,
                stageId: data.stageId,
                trigger: data.trigger,
                conditions: data.conditions || {},
                actions: data.actions,
                delayMinutes: data.delayMinutes || 0,
                isActive: true,
            },
        });
    }
    async updateWorkflow(id, data) {
        return this.prisma.workflowAutomation.update({
            where: { id },
            data: {
                ...data,
                actions: data.actions,
            },
        });
    }
    async deleteWorkflow(id) {
        return this.prisma.workflowAutomation.delete({
            where: { id },
        });
    }
    async toggleWorkflow(id, isActive) {
        return this.prisma.workflowAutomation.update({
            where: { id },
            data: { isActive },
        });
    }
};
exports.WorkflowsService = WorkflowsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkflowsService.prototype, "executeTimeBasedWorkflows", null);
exports.WorkflowsService = WorkflowsService = WorkflowsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map