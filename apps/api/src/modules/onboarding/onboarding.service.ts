import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { OnboardingStatus, OnboardingTaskStatus, OnboardingAssigneeRole, OnboardingDocumentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../../common/services/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OnboardingService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
        private configService: ConfigService,
    ) { }

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

        const workflow = await this.prisma.onboardingWorkflow.create({
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
                application: {
                    include: {
                        candidate: true,
                        job: {
                            include: {
                                tenant: true,
                            },
                        },
                    },
                },
            },
        });

        // Send welcome email to candidate with portal link
        try {
            const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
            const portalLink = `${webUrl}/portal/onboarding/${workflow.id}`;
            const candidate = workflow.application.candidate;
            const job = workflow.application.job;
            const candidateTasks = workflow.tasks.filter(t => t.assigneeRole === OnboardingAssigneeRole.CANDIDATE);

            await this.emailService.sendEmail({
                to: candidate.email,
                subject: `Welcome to ${job.tenant.name}! Complete Your Onboarding`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to the Team!</h1>
                        </div>
                        <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 8px 8px;">
                            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                                Hi ${candidate.firstName},
                            </p>
                            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                                Congratulations on joining <strong>${job.tenant.name}</strong> as a <strong>${job.title}</strong>! 
                                We're excited to have you on board.
                            </p>
                            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
                                To help you get started, we've prepared an onboarding checklist with <strong>${candidateTasks.length} tasks</strong> 
                                for you to complete before your start date.
                            </p>
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="${portalLink}" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          padding: 16px 32px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          font-weight: bold; 
                                          font-size: 16px;
                                          display: inline-block;
                                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    Access Your Onboarding Portal
                                </a>
                            </div>
                            <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
                                <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">📋 What's Next?</h3>
                                <ul style="color: #6b7280; margin: 10px 0; padding-left: 20px;">
                                    <li style="margin-bottom: 8px;">Complete your personal information</li>
                                    <li style="margin-bottom: 8px;">Upload required documents</li>
                                    <li style="margin-bottom: 8px;">Review company policies</li>
                                    <li style="margin-bottom: 8px;">Set up your workspace</li>
                                </ul>
                            </div>
                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                If you have any questions, feel free to reach out to HR at any time.
                            </p>
                            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                                Best regards,<br>
                                <strong>The ${job.tenant.name} Team</strong>
                            </p>
                        </div>
                        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                            <p style="margin: 0;">This is an automated message from ${job.tenant.name}</p>
                        </div>
                    </div>
                `,
                text: `Welcome to ${job.tenant.name}!\n\nHi ${candidate.firstName},\n\nCongratulations on joining us as a ${job.title}! We're excited to have you on board.\n\nTo help you get started, we've prepared an onboarding checklist with ${candidateTasks.length} tasks for you to complete before your start date.\n\nAccess your onboarding portal here: ${portalLink}\n\nIf you have any questions, feel free to reach out to HR.\n\nBest regards,\nThe ${job.tenant.name} Team`,
                tenantId,
                purpose: 'onboarding',
            });
        } catch (error) {
            console.error('Failed to send onboarding welcome email:', error);
        }

        return workflow;
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
            include: {
                workflow: {
                    include: {
                        application: {
                            include: {
                                candidate: { select: { firstName: true, lastName: true } },
                                job: { select: { title: true, recruiterId: true, hiringManagerId: true, tenantId: true } },
                            },
                        },
                    },
                },
            },
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

        // Notify HR and hiring team about task completion
        if (updateTaskDto.status === OnboardingTaskStatus.COMPLETED) {
            try {
                const recipientIds = Array.from(new Set([
                    task.workflow?.application?.job?.recruiterId,
                    task.workflow?.application?.job?.hiringManagerId,
                ].filter(Boolean) as string[]));

                if (recipientIds.length > 0) {
                    await this.notificationsService.createMany(
                        recipientIds.map((rid) => ({
                            type: 'ONBOARDING',
                            title: 'Onboarding Task Completed',
                            message: `${task.title} completed for ${task.workflow?.application?.candidate?.firstName || 'candidate'}`,
                            link: `/onboarding/${task.workflowId}`,
                            metadata: { taskId, workflowId: task.workflowId },
                            userId: rid,
                            tenantId: task.workflow?.application?.job?.tenantId,
                        })) as any,
                    );
                }
            } catch (error) {
                console.error('Failed to notify onboarding task completion:', error);
            }
        }

        return updatedTask;
    }

    // New method for uploading document
    async uploadDocument(taskId: string, fileUrl: string) {
        const task = await this.prisma.onboardingTask.findUnique({
            where: { id: taskId },
            include: {
                workflow: {
                    include: {
                        application: {
                            include: {
                                candidate: { select: { firstName: true, lastName: true } },
                                job: { select: { title: true, recruiterId: true, hiringManagerId: true, tenantId: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!task) throw new NotFoundException('Task not found');

        const updated = await this.prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                documentUrl: fileUrl,
                documentStatus: 'PENDING_REVIEW', // Assuming Enum import in real code
            }
        });

        // Notify HR about document upload
        try {
            const recipientIds = Array.from(new Set([
                task.workflow?.application?.job?.recruiterId,
                task.workflow?.application?.job?.hiringManagerId,
            ].filter(Boolean) as string[]));

            if (recipientIds.length > 0) {
                await this.notificationsService.createMany(
                    recipientIds.map((rid) => ({
                        type: 'ONBOARDING',
                        title: 'Document Uploaded',
                        message: `${task.workflow?.application?.candidate?.firstName || 'Candidate'} uploaded document for ${task.title}`,
                        link: `/onboarding/${task.workflowId}`,
                        metadata: { taskId, workflowId: task.workflowId, documentUrl: fileUrl },
                        userId: rid,
                        tenantId: task.workflow?.application?.job?.tenantId,
                    })) as any,
                );
            }
        } catch (error) {
            console.error('Failed to notify document upload:', error);
        }

        return updated;
    }

    // New method for reviewing document
    async reviewDocument(taskId: string, status: 'APPROVED' | 'REJECTED') {
        const task = await this.prisma.onboardingTask.findUnique({
            where: { id: taskId },
            include: {
                workflow: {
                    include: {
                        application: {
                            include: {
                                candidate: { select: { firstName: true, lastName: true } },
                                job: { select: { title: true, recruiterId: true, hiringManagerId: true, tenantId: true } },
                            },
                        },
                    },
                },
            },
        });
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

        // Notify recruiter and hiring manager about document review
        try {
            const recipientIds = Array.from(new Set([
                task.workflow?.application?.job?.recruiterId,
                task.workflow?.application?.job?.hiringManagerId,
            ].filter(Boolean) as string[]));

            if (recipientIds.length > 0) {
                await this.notificationsService.createMany(
                    recipientIds.map((rid) => ({
                        type: 'ONBOARDING',
                        title: `Document ${status}`,
                        message: `${task.title} document ${status.toLowerCase()} for ${task.workflow?.application?.candidate?.firstName || 'candidate'}`,
                        link: `/onboarding/${task.workflowId}`,
                        metadata: { taskId, workflowId: task.workflowId, documentStatus: status },
                        userId: rid,
                        tenantId: task.workflow?.application?.job?.tenantId,
                    })) as any,
                );
            }
        } catch (error) {
            console.error('Failed to notify document review:', error);
        }

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
