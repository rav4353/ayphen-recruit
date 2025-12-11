import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { OnboardingStatus, OnboardingTaskStatus, OnboardingAssigneeRole, OnboardingDocumentStatus } from '@prisma/client';

@Injectable()
export class OnboardingService {
    constructor(private prisma: PrismaService) { }

    async create(createOnboardingDto: CreateOnboardingDto, tenantId: string) {
        const { applicationId } = createOnboardingDto;

        // Check if workflow already exists
        const existing = await this.prisma.onboardingWorkflow.findUnique({
            where: { applicationId },
        });

        if (existing) {
            throw new BadRequestException('Onboarding workflow already exists for this application');
        }

        // Default tasks template
        const defaultTasks = [
            {
                title: 'Upload Profile Photo',
                description: 'Please upload a professional photo for your ID badge.',
                assigneeRole: OnboardingAssigneeRole.CANDIDATE,
                order: 1,
                isRequiredDoc: true,
            },
            {
                title: 'Complete Personal Information',
                description: 'Verify your contact details and emergency contacts.',
                assigneeRole: OnboardingAssigneeRole.CANDIDATE,
                order: 2,
            },
            {
                title: 'Provision Laptop',
                description: 'Prepare and ship laptop to new hire.',
                assigneeRole: OnboardingAssigneeRole.IT,
                order: 3,
            },
            {
                title: 'Schedule Welcome Lunch',
                description: 'Organize a team lunch for the first day.',
                assigneeRole: OnboardingAssigneeRole.MANAGER,
                order: 4,
            },
            {
                title: 'Verify Documents',
                description: 'Check ID and tax forms.',
                assigneeRole: OnboardingAssigneeRole.HR,
                order: 5,
                isRequiredDoc: true,
            },
        ];

        return this.prisma.onboardingWorkflow.create({
            data: {
                tenantId,
                applicationId,
                status: OnboardingStatus.IN_PROGRESS,
                startDate: new Date(), // Should ideally come from DTO or Offer
                tasks: {
                    create: defaultTasks,
                },
            },
            include: {
                tasks: true,
            },
        });
    }

    async findAll(tenantId: string) {
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

    async findOne(id: string) {
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
            throw new NotFoundException(`Onboarding workflow with ID ${id} not found`);
        }

        return workflow;
    }

    async updateTask(taskId: string, updateTaskDto: UpdateTaskDto) {
        const task = await this.prisma.onboardingTask.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${taskId} not found`);
        }

        const updatedTask = await this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                status: updateTaskDto.status,
                completedAt: updateTaskDto.status === OnboardingTaskStatus.COMPLETED ? new Date() : null,
                // documentStatus: updateTaskDto.documentStatus, // Add DTO field if needed
            },
        });

        // Update workflow progress
        await this.updateWorkflowProgress(task.workflowId);

        return updatedTask;
    }

    // New method for uploading document
    async uploadDocument(taskId: string, fileUrl: string) {
        const task = await this.prisma.onboardingTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');

        return this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                documentUrl: fileUrl,
                documentStatus: 'PENDING_REVIEW', // Assuming Enum import in real code
            }
        });
    }

    // New method for reviewing document
    async reviewDocument(taskId: string, status: 'APPROVED' | 'REJECTED') {
        const task = await this.prisma.onboardingTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');

        const taskStatus = status === 'APPROVED' ? 'COMPLETED' : 'PENDING';

        const updated = await this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                documentStatus: status,
                status: taskStatus as OnboardingTaskStatus, // Auto-complete task if approved
                completedAt: status === 'APPROVED' ? new Date() : null
            }
        });

        await this.updateWorkflowProgress(task.workflowId);
        return updated;
    }

    private async updateWorkflowProgress(workflowId: string) {
        const tasks = await this.prisma.onboardingTask.findMany({
            where: { workflowId },
        });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === OnboardingTaskStatus.COMPLETED).length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        let status: OnboardingStatus = OnboardingStatus.IN_PROGRESS;
        if (progress === 100) {
            status = OnboardingStatus.COMPLETED;
        } else if (progress === 0) {
            status = OnboardingStatus.NOT_STARTED;
        }

        await this.prisma.onboardingWorkflow.update({
            where: { id: workflowId },
            data: {
                progress,
                status,
            },
        });
    }
}
