import { PrismaService } from '../../prisma/prisma.service';
interface ReportFilters {
    startDate?: string;
    endDate?: string;
    jobId?: string;
    recruiterId?: string;
    department?: string;
}
export interface FunnelStage {
    name: string;
    count: number;
    conversionRate: number;
}
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getCustomReport(tenantId: string, filters: ReportFilters): Promise<{
        totalApplications: number;
        hires: number;
        rejected: number;
        conversionRate: number;
        byStatus: Record<string, number>;
        byJob: Record<string, number>;
        bySource: Record<string, number>;
    }>;
    exportReportCsv(tenantId: string, filters: ReportFilters): Promise<string>;
    getHiringFunnel(tenantId: string, filters: ReportFilters): Promise<{
        totalApplicants: number;
        hired: number;
        rejected: number;
        funnel: FunnelStage[];
    }>;
    getTimeToHire(tenantId: string, filters: ReportFilters): Promise<{
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
    getSourceEffectiveness(tenantId: string, filters: ReportFilters): Promise<{
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
    getRecruiterPerformance(tenantId: string, filters: ReportFilters): Promise<{
        recruiterId: string;
        name: string;
        jobsManaged: number;
        applicationsProcessed: number;
        hires: number;
        hireRate: number;
    }[]>;
    getDashboardStats(tenantId: string): Promise<{
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        applicationsLast30Days: number;
        totalHires: number;
        conversionRate: number;
    }>;
}
export {};
