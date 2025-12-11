import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStatus, JobStatus } from '@prisma/client';

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

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getCustomReport(tenantId: string, filters: ReportFilters) {
        const { startDate, endDate, jobId, recruiterId } = filters;

        const where: any = {
            job: { tenantId },
        };

        if (startDate || endDate) {
            where.appliedAt = {};
            if (startDate) where.appliedAt.gte = new Date(startDate);
            if (endDate) where.appliedAt.lte = new Date(endDate);
        }

        if (jobId) {
            where.jobId = jobId;
        }

        // Note: Filtering by recruiterId might need to be on the Job (hiringManager/recruiter) or Application (assignedTo)
        // For now, let's assume filtering by the recruiter assigned to the job
        if (recruiterId) {
            where.job = {
                ...where.job,
                recruiterId,
            };
        }

        const applications = await this.prisma.application.findMany({
            where,
            include: {
                job: {
                    select: {
                        title: true,
                        department: true,
                    },
                },
                candidate: {
                    select: {
                        source: true,
                    },
                },
            },
        });

        // Aggregations
        const totalApplications = applications.length;

        const byStatus = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byJob = applications.reduce((acc, app) => {
            const jobTitle = app.job.title;
            acc[jobTitle] = (acc[jobTitle] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const bySource = applications.reduce((acc, app) => {
            const source = app.candidate.source || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const hires = applications.filter(app => app.status === ApplicationStatus.HIRED).length;
        const rejected = applications.filter(app => app.status === ApplicationStatus.REJECTED).length;

        return {
            totalApplications,
            hires,
            rejected,
            conversionRate: totalApplications > 0 ? (hires / totalApplications) * 100 : 0,
            byStatus,
            byJob,
            bySource,
        };
    }

    async exportReportCsv(tenantId: string, filters: ReportFilters): Promise<string> {
        const { startDate, endDate, jobId, recruiterId } = filters;

        const where: any = {
            job: { tenantId },
        };

        if (startDate || endDate) {
            where.appliedAt = {};
            if (startDate) where.appliedAt.gte = new Date(startDate);
            if (endDate) where.appliedAt.lte = new Date(endDate);
        }

        if (jobId) where.jobId = jobId;
        if (recruiterId) where.job = { ...where.job, recruiterId };

        const applications = await this.prisma.application.findMany({
            where,
            include: {
                job: {
                    select: {
                        title: true,
                        department: true,
                    },
                },
                candidate: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        source: true,
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });

        const flattenedData = applications.map((app: any) => ({
            'Application ID': app.id,
            'Candidate Name': `${app.candidate.firstName} ${app.candidate.lastName}`,
            'Candidate Email': app.candidate.email,
            'Job Title': app.job.title,
            'Department': app.job.department?.name || 'N/A',
            'Status': app.status,
            'Source': app.candidate.source || 'Unknown',
            'Applied Date': app.appliedAt.toISOString().split('T')[0],
        }));

        // Use require to load json2csv
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Parser } = require('json2csv');
        const parser = new Parser();
        return parser.parse(flattenedData);
    }

    /**
     * Get hiring funnel analytics with conversion rates
     */
    async getHiringFunnel(tenantId: string, filters: ReportFilters) {
        const where: any = { job: { tenantId } };
        if (filters.startDate) where.appliedAt = { ...where.appliedAt, gte: new Date(filters.startDate) };
        if (filters.endDate) where.appliedAt = { ...where.appliedAt, lte: new Date(filters.endDate) };
        if (filters.jobId) where.jobId = filters.jobId;

        const applications = await this.prisma.application.findMany({
            where,
            include: { currentStage: true },
        });

        const totalApplicants = applications.length;
        const statusCounts: Record<string, number> = {};
        
        applications.forEach(app => {
            const stage = app.currentStage?.name || app.status;
            statusCounts[stage] = (statusCounts[stage] || 0) + 1;
        });

        const hired = applications.filter(a => a.status === ApplicationStatus.HIRED).length;
        const rejected = applications.filter(a => a.status === ApplicationStatus.REJECTED).length;

        // Build funnel stages
        const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
        const funnel: FunnelStage[] = stages.map(name => {
            const count = name === 'Applied' ? totalApplicants : 
                         name === 'Hired' ? hired : (statusCounts[name] || 0);
            return {
                name,
                count,
                conversionRate: totalApplicants > 0 ? (count / totalApplicants) * 100 : 0,
            };
        });

        return { totalApplicants, hired, rejected, funnel };
    }

    /**
     * Get time-to-hire metrics
     */
    async getTimeToHire(tenantId: string, filters: ReportFilters) {
        const where: any = { job: { tenantId }, status: ApplicationStatus.HIRED };
        if (filters.startDate) where.appliedAt = { gte: new Date(filters.startDate) };
        if (filters.endDate) where.appliedAt = { ...where.appliedAt, lte: new Date(filters.endDate) };

        const hiredApps = await this.prisma.application.findMany({
            where,
            include: { job: { select: { title: true } } },
        });

        if (hiredApps.length === 0) {
            return { averageDays: 0, medianDays: 0, totalHires: 0, byJob: [], trend: [] };
        }

        const times = hiredApps.map(app => 
            Math.ceil((app.updatedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24))
        ).filter(t => t >= 0);

        const sorted = [...times].sort((a, b) => a - b);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;

        // By job
        const jobMap: Record<string, number[]> = {};
        hiredApps.forEach((app, i) => {
            const title = app.job.title;
            if (!jobMap[title]) jobMap[title] = [];
            jobMap[title].push(times[i]);
        });

        const byJob = Object.entries(jobMap).map(([job, t]) => ({
            job,
            averageDays: t.reduce((a, b) => a + b, 0) / t.length,
            hires: t.length,
        }));

        // Monthly trend
        const trend: { month: string; days: number; hires: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toLocaleDateString('en-US', { month: 'short' });
            const monthApps = hiredApps.filter(a => {
                const m = a.updatedAt.getMonth();
                const y = a.updatedAt.getFullYear();
                return m === d.getMonth() && y === d.getFullYear();
            });
            const monthTimes = monthApps.map(a => 
                Math.ceil((a.updatedAt.getTime() - a.appliedAt.getTime()) / (1000 * 60 * 60 * 24))
            );
            trend.push({
                month,
                days: monthTimes.length ? monthTimes.reduce((a, b) => a + b, 0) / monthTimes.length : 0,
                hires: monthTimes.length,
            });
        }

        return {
            averageDays: Math.round(avg),
            medianDays: sorted[Math.floor(sorted.length / 2)] || 0,
            totalHires: hiredApps.length,
            byJob,
            trend,
        };
    }

    /**
     * Get source effectiveness report
     */
    async getSourceEffectiveness(tenantId: string, filters: ReportFilters) {
        const where: any = { job: { tenantId } };
        if (filters.startDate) where.appliedAt = { gte: new Date(filters.startDate) };
        if (filters.endDate) where.appliedAt = { ...where.appliedAt, lte: new Date(filters.endDate) };

        const apps = await this.prisma.application.findMany({
            where,
            include: { candidate: { select: { source: true } } },
        });

        const bySource: Record<string, { total: number; interviewed: number; hired: number }> = {};
        apps.forEach(app => {
            const src = app.candidate.source || 'Direct';
            if (!bySource[src]) bySource[src] = { total: 0, interviewed: 0, hired: 0 };
            bySource[src].total++;
            if (['INTERVIEW', 'OFFER', 'HIRED'].includes(app.status)) bySource[src].interviewed++;
            if (app.status === ApplicationStatus.HIRED) bySource[src].hired++;
        });

        const sources = Object.entries(bySource).map(([source, s]) => ({
            source,
            applicants: s.total,
            interviewed: s.interviewed,
            hired: s.hired,
            interviewRate: s.total ? Math.round((s.interviewed / s.total) * 100) : 0,
            hireRate: s.total ? Math.round((s.hired / s.total) * 100) : 0,
        })).sort((a, b) => b.hireRate - a.hireRate);

        return {
            totalApplicants: apps.length,
            totalHired: apps.filter(a => a.status === ApplicationStatus.HIRED).length,
            sources,
        };
    }

    /**
     * Get recruiter performance metrics
     */
    async getRecruiterPerformance(tenantId: string, filters: ReportFilters) {
        const where: any = { tenantId };
        if (filters.startDate) where.appliedAt = { gte: new Date(filters.startDate) };

        const jobs = await this.prisma.job.findMany({
            where: { tenantId },
            include: {
                recruiter: { select: { id: true, firstName: true, lastName: true } },
                applications: { select: { status: true } },
            },
        });

        const recruiterMap: Record<string, { name: string; jobs: number; apps: number; hires: number }> = {};
        jobs.forEach(job => {
            if (!job.recruiter) return;
            const id = job.recruiter.id;
            if (!recruiterMap[id]) {
                recruiterMap[id] = {
                    name: `${job.recruiter.firstName} ${job.recruiter.lastName}`,
                    jobs: 0, apps: 0, hires: 0,
                };
            }
            recruiterMap[id].jobs++;
            recruiterMap[id].apps += job.applications.length;
            recruiterMap[id].hires += job.applications.filter(a => a.status === ApplicationStatus.HIRED).length;
        });

        return Object.entries(recruiterMap).map(([id, r]) => ({
            recruiterId: id,
            name: r.name,
            jobsManaged: r.jobs,
            applicationsProcessed: r.apps,
            hires: r.hires,
            hireRate: r.apps ? Math.round((r.hires / r.apps) * 100) : 0,
        })).sort((a, b) => b.hires - a.hires);
    }

    /**
     * Get dashboard summary stats
     */
    async getDashboardStats(tenantId: string) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [totalJobs, activeJobs, totalApps, recentApps, hires] = await Promise.all([
            this.prisma.job.count({ where: { tenantId } }),
            this.prisma.job.count({ where: { tenantId, status: JobStatus.OPEN } }),
            this.prisma.application.count({ where: { job: { tenantId } } }),
            this.prisma.application.count({ where: { job: { tenantId }, appliedAt: { gte: thirtyDaysAgo } } }),
            this.prisma.application.count({ where: { job: { tenantId }, status: ApplicationStatus.HIRED } }),
        ]);

        return {
            totalJobs,
            activeJobs,
            totalApplications: totalApps,
            applicationsLast30Days: recentApps,
            totalHires: hires,
            conversionRate: totalApps > 0 ? Math.round((hires / totalApps) * 100) : 0,
        };
    }
}
