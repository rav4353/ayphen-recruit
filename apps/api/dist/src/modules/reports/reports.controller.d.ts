import { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getCustomReport(req: any, startDate?: string, endDate?: string, jobId?: string, recruiterId?: string): Promise<{
        totalApplications: number;
        hires: number;
        rejected: number;
        conversionRate: number;
        byStatus: Record<string, number>;
        byJob: Record<string, number>;
        bySource: Record<string, number>;
    }>;
    exportReportCsv(req: any, res: Response, startDate?: string, endDate?: string, jobId?: string, recruiterId?: string): Promise<void>;
    getDashboardStats(req: any): Promise<{
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        applicationsLast30Days: number;
        totalHires: number;
        conversionRate: number;
    }>;
    getHiringFunnel(req: any, startDate?: string, endDate?: string, jobId?: string): Promise<{
        totalApplicants: number;
        hired: number;
        rejected: number;
        funnel: import("./reports.service").FunnelStage[];
    }>;
    getTimeToHire(req: any, startDate?: string, endDate?: string): Promise<{
        averageDays: number;
        medianDays: number;
        totalHires: number;
        byJob: {
            job: string;
            averageDays: number;
            hires: number;
        }[];
        trend: {
            month: string;
            days: number;
            hires: number;
        }[];
    }>;
    getSourceEffectiveness(req: any, startDate?: string, endDate?: string): Promise<{
        totalApplicants: number;
        totalHired: number;
        sources: {
            source: string;
            applicants: number;
            interviewed: number;
            hired: number;
            interviewRate: number;
            hireRate: number;
        }[];
    }>;
    getRecruiterPerformance(req: any, startDate?: string): Promise<{
        recruiterId: string;
        name: string;
        jobsManaged: number;
        applicationsProcessed: number;
        hires: number;
        hireRate: number;
    }[]>;
}
