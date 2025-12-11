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
}
