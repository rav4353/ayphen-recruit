import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { JwtPayload } from '../auth/auth.service';
export declare class InterviewsController {
    private readonly interviewsService;
    constructor(interviewsService: InterviewsService);
    create(user: JwtPayload, createInterviewDto: CreateInterviewDto): Promise<{
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
    findAll(user: JwtPayload, applicationId?: string, interviewerId?: string, candidateId?: string, status?: string, startDate?: string, endDate?: string): Promise<({
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
    findOne(user: JwtPayload, id: string): Promise<{
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
    update(user: JwtPayload, id: string, updateInterviewDto: UpdateInterviewDto): Promise<{
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
    remove(user: JwtPayload, id: string): Promise<{
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
    createFeedback(user: JwtPayload, createFeedbackDto: CreateFeedbackDto): Promise<{
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
    updateFeedback(user: JwtPayload, id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<{
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
    getFeedback(user: JwtPayload, id: string): Promise<({
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
