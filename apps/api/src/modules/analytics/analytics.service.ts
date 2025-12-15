import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStatus, JobStatus, InterviewStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getSummaryStats(tenantId: string) {
        const [activeJobs, totalCandidates, upcomingInterviews, activeApplications] = await Promise.all([
            this.prisma.job.count({
                where: {
                    tenantId,
                    status: JobStatus.OPEN,
                },
            }),
            this.prisma.candidate.count({
                where: {
                    tenantId,
                },
            }),
            this.prisma.interview.count({
                where: {
                    application: {
                        job: {
                            tenantId,
                        },
                    },
                    status: InterviewStatus.SCHEDULED,
                    scheduledAt: {
                        gte: new Date(),
                    },
                },
            }),
            this.prisma.application.count({
                where: {
                    job: {
                        tenantId,
                    },
                    status: {
                        notIn: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
                    },
                },
            }),
        ]);

        return {
            activeJobs,
            totalCandidates,
            upcomingInterviews,
            activeApplications,
        };
    }

    async getPipelineHealth(tenantId: string) {
        // Group by Application Status for a high-level view
        const statusDistribution = await this.prisma.application.groupBy({
            by: ['status'],
            where: {
                job: {
                    tenantId,
                },
            },
            _count: {
                _all: true,
            },
        });

        // Map to a more friendly format
        const formatted = statusDistribution.map((item) => ({
            status: item.status,
            count: item._count._all,
        }));

        // Ensure all key statuses are represented even if 0
        const allStatuses = Object.values(ApplicationStatus);
        const result = allStatuses.map((status) => ({
            status,
            count: formatted.find((f) => f.status === status)?.count || 0,
        }));

        return result;
    }

    async getTimeToHire(tenantId: string) {
        const hiredApplications = await this.prisma.application.findMany({
            where: {
                job: {
                    tenantId,
                },
                status: ApplicationStatus.HIRED,
            },
            select: {
                appliedAt: true,
                updatedAt: true, // Assuming updatedAt is when they were hired
            },
        });

        if (hiredApplications.length === 0) {
            return { averageDays: 0, totalHired: 0 };
        }

        const totalDurationMs = hiredApplications.reduce((acc, app) => {
            const duration = app.updatedAt.getTime() - app.appliedAt.getTime();
            return acc + duration;
        }, 0);

        const averageDurationMs = totalDurationMs / hiredApplications.length;
        const averageDays = Math.round(averageDurationMs / (1000 * 60 * 60 * 24));

        return {
            averageDays,
            totalHired: hiredApplications.length,
        };
    }

    async getRecentActivity(tenantId: string) {
        return this.prisma.activityLog.findMany({
            where: {
                OR: [
                    { user: { tenantId } },
                    { candidate: { tenantId } }
                ]
            },
            take: 10,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                candidate: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                },
                application: {
                    select: {
                        job: {
                            select: {
                                title: true
                            }
                        }
                    }
                }
            },
        });
    }

    /**
     * Get hiring funnel analytics - tracks candidates through each stage
     */
    async getHiringFunnel(tenantId: string, jobId?: string) {
        // Get all pipelines for the tenant
        const pipelineFilter = jobId ? { jobId } : { job: { tenantId } };

        // Get all applications with their stage history
        const applications = await this.prisma.application.findMany({
            where: {
                job: { tenantId },
                ...(jobId && { jobId }),
            },
            include: {
                currentStage: true,
                job: {
                    include: {
                        pipeline: {
                            include: {
                                stages: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Aggregate stage counts across all pipelines
        const stageMap = new Map<string, { name: string; order: number; count: number }>();

        // Common stage names for aggregation
        const stageCategories = [
            { key: 'applied', names: ['applied', 'new', 'application received'], order: 1 },
            { key: 'screening', names: ['screening', 'phone screen', 'initial review'], order: 2 },
            { key: 'interview', names: ['interview', 'technical interview', 'first interview'], order: 3 },
            { key: 'assessment', names: ['assessment', 'test', 'evaluation', 'technical round'], order: 4 },
            { key: 'final', names: ['final interview', 'final round', 'onsite'], order: 5 },
            { key: 'offer', names: ['offer', 'offer extended', 'offer sent'], order: 6 },
            { key: 'hired', names: ['hired', 'accepted', 'joined'], order: 7 },
        ];

        // Initialize categories
        const funnelData = stageCategories.map(cat => ({
            stage: cat.key.charAt(0).toUpperCase() + cat.key.slice(1),
            count: 0,
            percentage: 0,
        }));

        // Count applications by stage category
        for (const app of applications) {
            const stageName = app.currentStage?.name?.toLowerCase() || '';
            const status = app.status;

            // Check status first for hired/rejected
            if (status === 'HIRED') {
                funnelData[6].count++;
                continue;
            }

            // Match to category
            let matched = false;
            for (let i = 0; i < stageCategories.length; i++) {
                const cat = stageCategories[i];
                if (cat.names.some(n => stageName.includes(n))) {
                    funnelData[i].count++;
                    matched = true;
                    break;
                }
            }

            // Default to "Applied" if no match
            if (!matched) {
                funnelData[0].count++;
            }
        }

        // Calculate percentages (relative to first stage)
        const totalApplied = funnelData[0].count || 1;
        for (const stage of funnelData) {
            stage.percentage = Math.round((stage.count / totalApplied) * 100);
        }

        // Calculate conversion rates between stages
        const conversionRates = [];
        for (let i = 0; i < funnelData.length - 1; i++) {
            const current = funnelData[i].count || 1;
            const next = funnelData[i + 1].count;
            conversionRates.push({
                from: funnelData[i].stage,
                to: funnelData[i + 1].stage,
                rate: Math.round((next / current) * 100),
            });
        }

        return {
            funnel: funnelData,
            conversionRates,
            totalApplications: applications.length,
            summary: {
                applicationToScreening: conversionRates[0]?.rate || 0,
                screeningToInterview: conversionRates[1]?.rate || 0,
                interviewToOffer: Math.round(
                    ((funnelData[5].count || 0) / (funnelData[2].count || 1)) * 100
                ),
                offerToHire: Math.round(
                    ((funnelData[6].count || 0) / (funnelData[5].count || 1)) * 100
                ),
            },
        };
    }

    /**
     * Get source effectiveness analytics
     */
    async getSourceEffectiveness(tenantId: string) {
        const applications = await this.prisma.application.findMany({
            where: { job: { tenantId } },
            include: {
                candidate: {
                    select: { source: true },
                },
            },
        });

        // Group by source
        const sourceMap = new Map<string, { total: number; hired: number; avgDaysToHire: number; interviews: number }>();

        for (const app of applications) {
            const source = app.candidate.source || 'Unknown';
            if (!sourceMap.has(source)) {
                sourceMap.set(source, { total: 0, hired: 0, avgDaysToHire: 0, interviews: 0 });
            }

            const data = sourceMap.get(source)!;
            data.total++;

            if (app.status === 'HIRED') {
                data.hired++;
                const daysToHire = Math.round(
                    (app.updatedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)
                );
                data.avgDaysToHire = (data.avgDaysToHire * (data.hired - 1) + daysToHire) / data.hired;
            }

            if (app.status === 'INTERVIEW') {
                data.interviews++;
            }
        }

        // Convert to array and calculate metrics
        const sources = Array.from(sourceMap.entries()).map(([source, data]) => ({
            source,
            applications: data.total,
            hired: data.hired,
            hireRate: Math.round((data.hired / data.total) * 100),
            interviewRate: Math.round((data.interviews / data.total) * 100),
            avgDaysToHire: Math.round(data.avgDaysToHire),
        }));

        return sources.sort((a, b) => b.applications - a.applications);
    }
}
