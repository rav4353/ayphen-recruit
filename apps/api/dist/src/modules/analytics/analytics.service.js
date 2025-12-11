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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummaryStats(tenantId) {
        const [activeJobs, totalCandidates, upcomingInterviews, activeApplications] = await Promise.all([
            this.prisma.job.count({
                where: {
                    tenantId,
                    status: client_1.JobStatus.OPEN,
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
                    status: client_1.InterviewStatus.SCHEDULED,
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
                        notIn: [client_1.ApplicationStatus.HIRED, client_1.ApplicationStatus.REJECTED, client_1.ApplicationStatus.WITHDRAWN],
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
    async getPipelineHealth(tenantId) {
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
        const formatted = statusDistribution.map((item) => ({
            status: item.status,
            count: item._count._all,
        }));
        const allStatuses = Object.values(client_1.ApplicationStatus);
        const result = allStatuses.map((status) => ({
            status,
            count: formatted.find((f) => f.status === status)?.count || 0,
        }));
        return result;
    }
    async getTimeToHire(tenantId) {
        const hiredApplications = await this.prisma.application.findMany({
            where: {
                job: {
                    tenantId,
                },
                status: client_1.ApplicationStatus.HIRED,
            },
            select: {
                appliedAt: true,
                updatedAt: true,
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
    async getRecentActivity(tenantId) {
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map