import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class InterviewsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateInterviewDto, tenantId: string, createdByUserId?: string) {
        // Verify application exists and belongs to tenant
        const application = await this.prisma.application.findUnique({
            where: { id: dto.applicationId },
            include: { job: true, candidate: true },
        });

        if (!application || application.job.tenantId !== tenantId) {
            throw new NotFoundException('Application not found');
        }

        // Verify interviewer exists and belongs to tenant
        const interviewer = await this.prisma.user.findUnique({
            where: { id: dto.interviewerId },
        });

        if (!interviewer || interviewer.tenantId !== tenantId) {
            throw new NotFoundException('Interviewer not found');
        }

        // Create interview
        const interview = await this.prisma.interview.create({
            data: {
                ...dto,
                status: 'SCHEDULED',
            },
            include: {
                interviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                application: {
                    select: {
                        id: true,
                        candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });

        // Log activity
        await this.prisma.activityLog.create({
            data: {
                action: 'INTERVIEW_SCHEDULED',
                description: `Interview scheduled with ${application.candidate?.firstName} ${application.candidate?.lastName} for ${application.job.title}`,
                userId: createdByUserId || dto.interviewerId,
                applicationId: dto.applicationId,
                candidateId: application.candidateId,
            }
        });

        return interview;
    }

    async findAll(
        tenantId: string,
        filters?: {
            applicationId?: string;
            interviewerId?: string;
            candidateId?: string;
            status?: string;
            startDate?: string;
            endDate?: string;
        },
    ) {
        const where: any = {
            application: {
                job: {
                    tenantId,
                },
            },
        };

        if (filters?.applicationId) {
            where.applicationId = filters.applicationId;
        }

        if (filters?.interviewerId) {
            where.interviewerId = filters.interviewerId;
        }

        if (filters?.candidateId) {
            where.application.candidateId = filters.candidateId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.startDate && filters?.endDate) {
            where.scheduledAt = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
            };
        } else if (filters?.startDate) {
            where.scheduledAt = {
                gte: new Date(filters.startDate),
            };
        } else if (filters?.endDate) {
            where.scheduledAt = {
                lte: new Date(filters.endDate),
            };
        }

        return this.prisma.interview.findMany({
            where,
            include: {
                interviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                application: {
                    select: {
                        id: true,
                        candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                feedbacks: {
                    select: {
                        id: true,
                        rating: true,
                        recommendation: true,
                        submittedAt: true,
                        reviewer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                scheduledAt: 'asc',
            },
        });
    }

    async findOne(id: string, tenantId: string) {
        const interview = await this.prisma.interview.findUnique({
            where: { id },
            include: {
                interviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                application: {
                    select: {
                        id: true,
                        candidate: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                                tenantId: true,
                                scorecardTemplateId: true,
                                scorecardTemplate: true,
                            },
                        },
                    },
                },
                feedbacks: {
                    include: {
                        reviewer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!interview || (interview.application as any).job.tenantId !== tenantId) {
            throw new NotFoundException('Interview not found');
        }

        return interview;
    }

    async update(id: string, dto: UpdateInterviewDto, tenantId: string) {
        await this.findOne(id, tenantId); // Ensure existence and ownership

        return this.prisma.interview.update({
            where: { id },
            data: dto,
            include: {
                interviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId); // Ensure existence and ownership
        return this.prisma.interview.delete({ where: { id } });
    }

    // Feedback methods
    async createFeedback(dto: CreateFeedbackDto, userId: string, tenantId: string) {
        // Verify interview exists and belongs to tenant
        const interview = await this.findOne(dto.interviewId, tenantId);

        // Check if user already submitted feedback for this interview
        const existingFeedback = await this.prisma.interviewFeedback.findUnique({
            where: {
                interviewId_reviewerId: {
                    interviewId: dto.interviewId,
                    reviewerId: userId,
                },
            },
        });

        if (existingFeedback) {
            throw new ConflictException('You have already submitted feedback for this interview');
        }

        return this.prisma.interviewFeedback.create({
            data: {
                interviewId: dto.interviewId,
                reviewerId: userId,
                rating: dto.rating,
                strengths: dto.strengths,
                weaknesses: dto.weaknesses,
                notes: dto.notes,
                recommendation: dto.recommendation,
                scores: dto.scores || {},
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async updateFeedback(feedbackId: string, dto: UpdateFeedbackDto, userId: string, tenantId: string) {
        const feedback = await this.prisma.interviewFeedback.findUnique({
            where: { id: feedbackId },
            include: {
                interview: {
                    include: {
                        application: {
                            include: {
                                job: true,
                            },
                        },
                    },
                },
            },
        });

        if (!feedback) {
            throw new NotFoundException('Feedback not found');
        }

        // Verify tenant ownership
        if ((feedback.interview.application as any).job.tenantId !== tenantId) {
            throw new NotFoundException('Feedback not found');
        }

        // Only the reviewer can update their own feedback
        if (feedback.reviewerId !== userId) {
            throw new ForbiddenException('You can only update your own feedback');
        }

        return this.prisma.interviewFeedback.update({
            where: { id: feedbackId },
            data: {
                rating: dto.rating,
                strengths: dto.strengths,
                weaknesses: dto.weaknesses,
                notes: dto.notes,
                recommendation: dto.recommendation,
                scores: dto.scores,
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async getFeedbackByInterview(interviewId: string, tenantId: string) {
        // Verify interview exists and belongs to tenant
        await this.findOne(interviewId, tenantId);

        return this.prisma.interviewFeedback.findMany({
            where: { interviewId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        });
    }
}
