import { PrismaService } from '../../prisma/prisma.service';
export interface DispositionReason {
    id: string;
    type: 'REJECTION' | 'WITHDRAWAL';
    reason: string;
    category?: string;
    isActive: boolean;
    order: number;
}
export declare class DispositionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly defaultRejectionReasons;
    private readonly defaultWithdrawalReasons;
    getReasonsByType(type: 'REJECTION' | 'WITHDRAWAL'): Promise<{
        id: string;
        type: "REJECTION" | "WITHDRAWAL";
        reason: string;
        category: string;
        isActive: boolean;
        order: number;
    }[]>;
    getRejectionReasons(): Promise<{
        id: string;
        type: "REJECTION" | "WITHDRAWAL";
        reason: string;
        category: string;
        isActive: boolean;
        order: number;
    }[]>;
    getWithdrawalReasons(): Promise<{
        id: string;
        type: "REJECTION" | "WITHDRAWAL";
        reason: string;
        category: string;
        isActive: boolean;
        order: number;
    }[]>;
    recordDisposition(applicationId: string, type: 'REJECTION' | 'WITHDRAWAL', reason: string, notes?: string, userId?: string): Promise<{
        job: {
            id: string;
            updatedAt: Date;
            tenantId: string;
            description: string;
            title: string;
            departmentId: string | null;
            createdAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            jobCode: string | null;
            requirements: string | null;
            responsibilities: string | null;
            benefits: string | null;
            employmentType: import("@prisma/client").$Enums.EmploymentType;
            duration: string | null;
            durationUnit: string | null;
            workLocation: import("@prisma/client").$Enums.WorkLocation;
            salaryMin: import("@prisma/client/runtime/library").Decimal | null;
            salaryMax: import("@prisma/client/runtime/library").Decimal | null;
            salaryCurrency: string;
            showSalary: boolean;
            openings: number;
            skills: string[];
            experience: string | null;
            education: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue | null;
            internalOnly: boolean;
            publishedAt: Date | null;
            closesAt: Date | null;
            locationId: string | null;
            hiringManagerId: string | null;
            recruiterId: string | null;
            pipelineId: string | null;
            scorecardTemplateId: string | null;
        };
        candidate: {
            location: string | null;
            email: string;
            id: string;
            updatedAt: Date;
            tenantId: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            createdAt: Date;
            skills: string[];
            experience: import("@prisma/client/runtime/library").JsonValue | null;
            education: import("@prisma/client/runtime/library").JsonValue | null;
            tags: string[];
            summary: string | null;
            linkedinUrl: string | null;
            portfolioUrl: string | null;
            currentTitle: string | null;
            currentCompany: string | null;
            source: string | null;
            gdprConsent: boolean;
            resumeUrl: string | null;
            referrerId: string | null;
            candidateId: string | null;
            resumeText: string | null;
            sourceDetails: string | null;
            gdprConsentAt: Date | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        jobId: string;
        candidateId: string;
        matchScore: number | null;
        matchSummary: string | null;
        coverLetter: string | null;
        answers: import("@prisma/client/runtime/library").JsonValue | null;
        rejectionReason: string | null;
        withdrawalReason: string | null;
        notes: string | null;
        appliedAt: Date;
        currentStageId: string | null;
        assignedToId: string | null;
    }>;
    getDispositionAnalytics(jobId?: string, startDate?: Date, endDate?: Date): Promise<{
        total: number;
        rejected: number;
        withdrawn: number;
        rejectionReasons: Record<string, number>;
        withdrawalReasons: Record<string, number>;
        topRejectionReasons: {
            reason: string;
            count: number;
        }[];
        topWithdrawalReasons: {
            reason: string;
            count: number;
        }[];
    }>;
    validateReason(type: 'REJECTION' | 'WITHDRAWAL', reason: string): Promise<boolean>;
}
