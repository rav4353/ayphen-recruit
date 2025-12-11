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
exports.InterviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let InterviewsService = class InterviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, tenantId, createdByUserId) {
        const application = await this.prisma.application.findUnique({
            where: { id: dto.applicationId },
            include: { job: true, candidate: true },
        });
        if (!application || application.job.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Application not found');
        }
        const interviewer = await this.prisma.user.findUnique({
            where: { id: dto.interviewerId },
        });
        if (!interviewer || interviewer.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Interviewer not found');
        }
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
    async findAll(tenantId, filters) {
        const where = {
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
        }
        else if (filters?.startDate) {
            where.scheduledAt = {
                gte: new Date(filters.startDate),
            };
        }
        else if (filters?.endDate) {
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
    async findOne(id, tenantId) {
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
        if (!interview || interview.application.job.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Interview not found');
        }
        return interview;
    }
    async update(id, dto, tenantId) {
        await this.findOne(id, tenantId);
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
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.interview.delete({ where: { id } });
    }
    async createFeedback(dto, userId, tenantId) {
        const interview = await this.findOne(dto.interviewId, tenantId);
        const existingFeedback = await this.prisma.interviewFeedback.findUnique({
            where: {
                interviewId_reviewerId: {
                    interviewId: dto.interviewId,
                    reviewerId: userId,
                },
            },
        });
        if (existingFeedback) {
            throw new common_1.ConflictException('You have already submitted feedback for this interview');
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
    async updateFeedback(feedbackId, dto, userId, tenantId) {
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
            throw new common_1.NotFoundException('Feedback not found');
        }
        if (feedback.interview.application.job.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Feedback not found');
        }
        if (feedback.reviewerId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own feedback');
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
    async getFeedbackByInterview(interviewId, tenantId) {
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
};
exports.InterviewsService = InterviewsService;
exports.InterviewsService = InterviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InterviewsService);
//# sourceMappingURL=interviews.service.js.map