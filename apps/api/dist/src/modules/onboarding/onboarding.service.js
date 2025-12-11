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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OnboardingService = class OnboardingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createOnboardingDto, tenantId) {
        const { applicationId } = createOnboardingDto;
        const existing = await this.prisma.onboardingWorkflow.findUnique({
            where: { applicationId },
        });
        if (existing) {
            throw new common_1.BadRequestException('Onboarding workflow already exists for this application');
        }
        const defaultTasks = [
            {
                title: 'Upload Profile Photo',
                description: 'Please upload a professional photo for your ID badge.',
                assigneeRole: client_1.OnboardingAssigneeRole.CANDIDATE,
                order: 1,
                isRequiredDoc: true,
            },
            {
                title: 'Complete Personal Information',
                description: 'Verify your contact details and emergency contacts.',
                assigneeRole: client_1.OnboardingAssigneeRole.CANDIDATE,
                order: 2,
            },
            {
                title: 'Provision Laptop',
                description: 'Prepare and ship laptop to new hire.',
                assigneeRole: client_1.OnboardingAssigneeRole.IT,
                order: 3,
            },
            {
                title: 'Schedule Welcome Lunch',
                description: 'Organize a team lunch for the first day.',
                assigneeRole: client_1.OnboardingAssigneeRole.MANAGER,
                order: 4,
            },
            {
                title: 'Verify Documents',
                description: 'Check ID and tax forms.',
                assigneeRole: client_1.OnboardingAssigneeRole.HR,
                order: 5,
                isRequiredDoc: true,
            },
        ];
        return this.prisma.onboardingWorkflow.create({
            data: {
                tenantId,
                applicationId,
                status: client_1.OnboardingStatus.IN_PROGRESS,
                startDate: new Date(),
                tasks: {
                    create: defaultTasks,
                },
            },
            include: {
                tasks: true,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.onboardingWorkflow.findMany({
            where: { tenantId },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                tasks: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const workflow = await this.prisma.onboardingWorkflow.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                tasks: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Onboarding workflow with ID ${id} not found`);
        }
        return workflow;
    }
    async updateTask(taskId, updateTaskDto) {
        const task = await this.prisma.onboardingTask.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        const updatedTask = await this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                status: updateTaskDto.status,
                completedAt: updateTaskDto.status === client_1.OnboardingTaskStatus.COMPLETED ? new Date() : null,
            },
        });
        await this.updateWorkflowProgress(task.workflowId);
        return updatedTask;
    }
    async uploadDocument(taskId, fileUrl) {
        const task = await this.prisma.onboardingTask.findUnique({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                documentUrl: fileUrl,
                documentStatus: 'PENDING_REVIEW',
            }
        });
    }
    async reviewDocument(taskId, status) {
        const task = await this.prisma.onboardingTask.findUnique({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const taskStatus = status === 'APPROVED' ? 'COMPLETED' : 'PENDING';
        const updated = await this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                documentStatus: status,
                status: taskStatus,
                completedAt: status === 'APPROVED' ? new Date() : null
            }
        });
        await this.updateWorkflowProgress(task.workflowId);
        return updated;
    }
    async updateWorkflowProgress(workflowId) {
        const tasks = await this.prisma.onboardingTask.findMany({
            where: { workflowId },
        });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === client_1.OnboardingTaskStatus.COMPLETED).length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        let status = client_1.OnboardingStatus.IN_PROGRESS;
        if (progress === 100) {
            status = client_1.OnboardingStatus.COMPLETED;
        }
        else if (progress === 0) {
            status = client_1.OnboardingStatus.NOT_STARTED;
        }
        await this.prisma.onboardingWorkflow.update({
            where: { id: workflowId },
            data: {
                progress,
                status,
            },
        });
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map