import { PrismaService } from '../../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
export declare class InterviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateInterviewDto, tenantId: string, createdByUserId?: string): Promise<{
        application: {
            job: {
                id: string;
                title: string;
            };
            candidate: {
                id: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        };
        interviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        location: string | null;
        id: string;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.InterviewType;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InterviewStatus;
        duration: number;
        applicationId: string;
        notes: string | null;
        interviewerId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        cancelReason: string | null;
        reminderSent: boolean;
    }>;
    findAll(tenantId: string, filters?: {
        applicationId?: string;
        interviewerId?: string;
        candidateId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<({
        application: {
            job: {
                id: string;
                title: string;
            };
            candidate: {
                id: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        };
        feedbacks: {
            id: string;
            rating: number;
            recommendation: string | null;
            submittedAt: Date;
            reviewer: {
                id: string;
                firstName: string;
                lastName: string;
            };
        }[];
        interviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        location: string | null;
        id: string;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.InterviewType;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InterviewStatus;
        duration: number;
        applicationId: string;
        notes: string | null;
        interviewerId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        cancelReason: string | null;
        reminderSent: boolean;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        application: {
            job: {
                scorecardTemplate: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    tenantId: string;
                    createdAt: Date;
                    isActive: boolean;
                    sections: import("@prisma/client/runtime/library").JsonValue;
                } | null;
                id: string;
                tenantId: string;
                title: string;
                scorecardTemplateId: string | null;
            };
            candidate: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
            id: string;
        };
        feedbacks: ({
            reviewer: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            notes: string | null;
            interviewId: string;
            rating: number;
            strengths: string | null;
            weaknesses: string | null;
            recommendation: string | null;
            scores: import("@prisma/client/runtime/library").JsonValue | null;
            submittedAt: Date;
            reviewerId: string;
        })[];
        interviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        location: string | null;
        id: string;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.InterviewType;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InterviewStatus;
        duration: number;
        applicationId: string;
        notes: string | null;
        interviewerId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        cancelReason: string | null;
        reminderSent: boolean;
    }>;
    update(id: string, dto: UpdateInterviewDto, tenantId: string): Promise<{
        interviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        location: string | null;
        id: string;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.InterviewType;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InterviewStatus;
        duration: number;
        applicationId: string;
        notes: string | null;
        interviewerId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        cancelReason: string | null;
        reminderSent: boolean;
    }>;
    remove(id: string, tenantId: string): Promise<{
        location: string | null;
        id: string;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.InterviewType;
        createdAt: Date;
        status: import("@prisma/client").$Enums.InterviewStatus;
        duration: number;
        applicationId: string;
        notes: string | null;
        interviewerId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        cancelReason: string | null;
        reminderSent: boolean;
    }>;
    createFeedback(dto: CreateFeedbackDto, userId: string, tenantId: string): Promise<{
        reviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        notes: string | null;
        interviewId: string;
        rating: number;
        strengths: string | null;
        weaknesses: string | null;
        recommendation: string | null;
        scores: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date;
        reviewerId: string;
    }>;
    updateFeedback(feedbackId: string, dto: UpdateFeedbackDto, userId: string, tenantId: string): Promise<{
        reviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        notes: string | null;
        interviewId: string;
        rating: number;
        strengths: string | null;
        weaknesses: string | null;
        recommendation: string | null;
        scores: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date;
        reviewerId: string;
    }>;
    getFeedbackByInterview(interviewId: string, tenantId: string): Promise<({
        reviewer: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        notes: string | null;
        interviewId: string;
        rating: number;
        strengths: string | null;
        weaknesses: string | null;
        recommendation: string | null;
        scores: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date;
        reviewerId: string;
    })[]>;
}
