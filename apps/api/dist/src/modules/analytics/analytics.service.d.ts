import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummaryStats(tenantId: string): Promise<{
        activeJobs: number;
        totalCandidates: number;
        upcomingInterviews: number;
        activeApplications: number;
    }>;
    getPipelineHealth(tenantId: string): Promise<{
        status: "APPLIED" | "SCREENING" | "PHONE_SCREEN" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN";
        count: number;
    }[]>;
    getTimeToHire(tenantId: string): Promise<{
        averageDays: number;
        totalHired: number;
    }>;
    getRecentActivity(tenantId: string): Promise<({
        user: {
            firstName: string;
            lastName: string;
            avatar: string | null;
        } | null;
        candidate: {
            firstName: string;
            lastName: string;
        } | null;
        application: {
            job: {
                title: string;
            };
        } | null;
    } & {
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        description: string | null;
        createdAt: Date;
        userId: string | null;
        candidateId: string | null;
        action: string;
        applicationId: string | null;
    })[]>;
}
