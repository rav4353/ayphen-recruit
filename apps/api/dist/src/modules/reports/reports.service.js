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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCustomReport(tenantId, filters) {
        const { startDate, endDate, jobId, recruiterId } = filters;
        const where = {
            job: { tenantId },
        };
        if (startDate || endDate) {
            where.appliedAt = {};
            if (startDate)
                where.appliedAt.gte = new Date(startDate);
            if (endDate)
                where.appliedAt.lte = new Date(endDate);
        }
        if (jobId) {
            where.jobId = jobId;
        }
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
        const totalApplications = applications.length;
        const byStatus = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {});
        const byJob = applications.reduce((acc, app) => {
            const jobTitle = app.job.title;
            acc[jobTitle] = (acc[jobTitle] || 0) + 1;
            return acc;
        }, {});
        const bySource = applications.reduce((acc, app) => {
            const source = app.candidate.source || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});
        const hires = applications.filter(app => app.status === client_1.ApplicationStatus.HIRED).length;
        const rejected = applications.filter(app => app.status === client_1.ApplicationStatus.REJECTED).length;
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
    async exportReportCsv(tenantId, filters) {
        const { startDate, endDate, jobId, recruiterId } = filters;
        const where = {
            job: { tenantId },
        };
        if (startDate || endDate) {
            where.appliedAt = {};
            if (startDate)
                where.appliedAt.gte = new Date(startDate);
            if (endDate)
                where.appliedAt.lte = new Date(endDate);
        }
        if (jobId)
            where.jobId = jobId;
        if (recruiterId)
            where.job = { ...where.job, recruiterId };
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
        const flattenedData = applications.map((app) => ({
            'Application ID': app.id,
            'Candidate Name': `${app.candidate.firstName} ${app.candidate.lastName}`,
            'Candidate Email': app.candidate.email,
            'Job Title': app.job.title,
            'Department': app.job.department?.name || 'N/A',
            'Status': app.status,
            'Source': app.candidate.source || 'Unknown',
            'Applied Date': app.appliedAt.toISOString().split('T')[0],
        }));
        const { Parser } = require('json2csv');
        const parser = new Parser();
        return parser.parse(flattenedData);
    }
    async getHiringFunnel(tenantId, filters) {
        const where = { job: { tenantId } };
        if (filters.startDate)
            where.appliedAt = { ...where.appliedAt, gte: new Date(filters.startDate) };
        if (filters.endDate)
            where.appliedAt = { ...where.appliedAt, lte: new Date(filters.endDate) };
        if (filters.jobId)
            where.jobId = filters.jobId;
        const applications = await this.prisma.application.findMany({
            where,
            include: { currentStage: true },
        });
        const totalApplicants = applications.length;
        const statusCounts = {};
        applications.forEach(app => {
            const stage = app.currentStage?.name || app.status;
            statusCounts[stage] = (statusCounts[stage] || 0) + 1;
        });
        const hired = applications.filter(a => a.status === client_1.ApplicationStatus.HIRED).length;
        const rejected = applications.filter(a => a.status === client_1.ApplicationStatus.REJECTED).length;
        const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
        const funnel = stages.map(name => {
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
    async getTimeToHire(tenantId, filters) {
        const where = { job: { tenantId }, status: client_1.ApplicationStatus.HIRED };
        if (filters.startDate)
            where.appliedAt = { gte: new Date(filters.startDate) };
        if (filters.endDate)
            where.appliedAt = { ...where.appliedAt, lte: new Date(filters.endDate) };
        const hiredApps = await this.prisma.application.findMany({
            where,
            include: { job: { select: { title: true } } },
        });
        if (hiredApps.length === 0) {
            return { averageDays: 0, medianDays: 0, totalHires: 0, byJob: [], trend: [] };
        }
        const times = hiredApps.map(app => Math.ceil((app.updatedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24))).filter(t => t >= 0);
        const sorted = [...times].sort((a, b) => a - b);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const jobMap = {};
        hiredApps.forEach((app, i) => {
            const title = app.job.title;
            if (!jobMap[title])
                jobMap[title] = [];
            jobMap[title].push(times[i]);
        });
        const byJob = Object.entries(jobMap).map(([job, t]) => ({
            job,
            averageDays: t.reduce((a, b) => a + b, 0) / t.length,
            hires: t.length,
        }));
        const trend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toLocaleDateString('en-US', { month: 'short' });
            const monthApps = hiredApps.filter(a => {
                const m = a.updatedAt.getMonth();
                const y = a.updatedAt.getFullYear();
                return m === d.getMonth() && y === d.getFullYear();
            });
            const monthTimes = monthApps.map(a => Math.ceil((a.updatedAt.getTime() - a.appliedAt.getTime()) / (1000 * 60 * 60 * 24)));
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
    async getSourceEffectiveness(tenantId, filters) {
        const where = { job: { tenantId } };
        if (filters.startDate)
            where.appliedAt = { gte: new Date(filters.startDate) };
        if (filters.endDate)
            where.appliedAt = { ...where.appliedAt, lte: new Date(filters.endDate) };
        const apps = await this.prisma.application.findMany({
            where,
            include: { candidate: { select: { source: true } } },
        });
        const bySource = {};
        apps.forEach(app => {
            const src = app.candidate.source || 'Direct';
            if (!bySource[src])
                bySource[src] = { total: 0, interviewed: 0, hired: 0 };
            bySource[src].total++;
            if (['INTERVIEW', 'OFFER', 'HIRED'].includes(app.status))
                bySource[src].interviewed++;
            if (app.status === client_1.ApplicationStatus.HIRED)
                bySource[src].hired++;
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
            totalHired: apps.filter(a => a.status === client_1.ApplicationStatus.HIRED).length,
            sources,
        };
    }
    async getRecruiterPerformance(tenantId, filters) {
        const where = { tenantId };
        if (filters.startDate)
            where.appliedAt = { gte: new Date(filters.startDate) };
        const jobs = await this.prisma.job.findMany({
            where: { tenantId },
            include: {
                recruiter: { select: { id: true, firstName: true, lastName: true } },
                applications: { select: { status: true } },
            },
        });
        const recruiterMap = {};
        jobs.forEach(job => {
            if (!job.recruiter)
                return;
            const id = job.recruiter.id;
            if (!recruiterMap[id]) {
                recruiterMap[id] = {
                    name: `${job.recruiter.firstName} ${job.recruiter.lastName}`,
                    jobs: 0, apps: 0, hires: 0,
                };
            }
            recruiterMap[id].jobs++;
            recruiterMap[id].apps += job.applications.length;
            recruiterMap[id].hires += job.applications.filter(a => a.status === client_1.ApplicationStatus.HIRED).length;
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
    async getDashboardStats(tenantId) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalJobs, activeJobs, totalApps, recentApps, hires] = await Promise.all([
            this.prisma.job.count({ where: { tenantId } }),
            this.prisma.job.count({ where: { tenantId, status: client_1.JobStatus.OPEN } }),
            this.prisma.application.count({ where: { job: { tenantId } } }),
            this.prisma.application.count({ where: { job: { tenantId }, appliedAt: { gte: thirtyDaysAgo } } }),
            this.prisma.application.count({ where: { job: { tenantId }, status: client_1.ApplicationStatus.HIRED } }),
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map