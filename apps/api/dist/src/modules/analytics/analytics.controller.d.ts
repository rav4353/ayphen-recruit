import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(req: any): Promise<{
        activeJobs: number;
        totalCandidates: number;
        upcomingInterviews: number;
        activeApplications: number;
    }>;
    getPipelineHealth(req: any): Promise<{
        status: "APPLIED" | "SCREENING" | "PHONE_SCREEN" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN";
        count: number;
    }[]>;
    getTimeToHire(req: any): Promise<{
        averageDays: number;
        totalHired: number;
    }>;
    getRecentActivity(req: any): Promise<({
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
