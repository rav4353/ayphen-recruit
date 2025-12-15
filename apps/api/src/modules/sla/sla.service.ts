import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';

export interface SLAStatus {
    status: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
    daysInStage: number;
    slaLimit: number;
    daysRemaining: number;
}

@Injectable()
export class SlaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Calculate SLA status for an application
     */
    async calculateSlaStatus(applicationId: string): Promise<SLAStatus | null> {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                currentStage: true,
                activities: {
                    where: { action: 'STAGE_CHANGED' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!application || !application.currentStage) {
            return null;
        }

        const slaLimit = application.currentStage.slaDays;
        if (!slaLimit) {
            return null; // No SLA defined for this stage
        }

        // Calculate days in current stage
        const stageEntryDate = application.activities[0]?.createdAt || application.appliedAt;
        const now = new Date();
        const daysInStage = Math.floor(
            (now.getTime() - stageEntryDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const daysRemaining = slaLimit - daysInStage;

        let status: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
        if (daysInStage > slaLimit) {
            status = 'OVERDUE';
        } else if (daysRemaining <= 1) {
            status = 'AT_RISK';
        } else {
            status = 'ON_TRACK';
        }

        return {
            status,
            daysInStage,
            slaLimit,
            daysRemaining,
        };
    }

    /**
     * Get all applications at risk or overdue
     */
    async getAtRiskApplications(tenantId?: string) {
        const where: any = {};
        if (tenantId) {
            where.job = { tenantId };
        }

        const applications = await this.prisma.application.findMany({
            where,
            include: {
                candidate: true,
                job: true,
                currentStage: true,
                activities: {
                    where: { action: 'STAGE_CHANGED' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        const atRisk: any[] = [];
        const overdue: any[] = [];

        for (const app of applications) {
            const slaStatus = await this.calculateSlaStatus(app.id);
            if (slaStatus) {
                const appWithSla = { ...app, slaStatus };
                if (slaStatus.status === 'OVERDUE') {
                    overdue.push(appWithSla);
                } else if (slaStatus.status === 'AT_RISK') {
                    atRisk.push(appWithSla);
                }
            }
        }

        return { atRisk, overdue };
    }

    /**
     * Check SLAs and send notifications (runs daily)
     */
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async checkSlas() {
        console.log('Running daily SLA check...');

        const { atRisk, overdue } = await this.getAtRiskApplications();

        // Send notifications for at-risk applications
        for (const app of atRisk) {
            await this.sendSlaNotification(app, 'AT_RISK');
        }

        // Send notifications for overdue applications
        for (const app of overdue) {
            await this.sendSlaNotification(app, 'OVERDUE');
        }

        console.log(`SLA check complete: ${atRisk.length} at risk, ${overdue.length} overdue`);
    }

    /**
     * Send SLA notification
     */
    private async sendSlaNotification(application: any, type: 'AT_RISK' | 'OVERDUE') {
        // Log the SLA violation
        await this.prisma.activityLog.create({
            data: {
                action: `SLA_${type}`,
                description: `Application is ${type.toLowerCase().replace('_', ' ')} in ${application.currentStage.name} stage`,
                applicationId: application.id,
                metadata: {
                    slaStatus: application.slaStatus,
                    stageName: application.currentStage.name,
                },
            },
        });

        // Send notification to recruiter/hiring manager
        try {
            const recipientIds: string[] = [];
            if (application.job?.recruiterId) recipientIds.push(application.job.recruiterId);
            if (application.job?.hiringManagerId) recipientIds.push(application.job.hiringManagerId);

            if (recipientIds.length > 0 && application.job?.tenantId) {
                await this.notificationsService.notifySlaAlert(
                    application,
                    type,
                    recipientIds,
                    application.job.tenantId,
                );
            }
        } catch (error) {
            console.error(`Failed to send SLA ${type} notification:`, error);
        }
    }

    /**
     * Get SLA statistics for a job
     */
    async getJobSlaStats(jobId: string) {
        const applications = await this.prisma.application.findMany({
            where: { jobId },
            include: {
                currentStage: true,
                activities: {
                    where: { action: 'STAGE_CHANGED' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        let onTrack = 0;
        let atRisk = 0;
        let overdue = 0;

        for (const app of applications) {
            const slaStatus = await this.calculateSlaStatus(app.id);
            if (slaStatus) {
                switch (slaStatus.status) {
                    case 'ON_TRACK':
                        onTrack++;
                        break;
                    case 'AT_RISK':
                        atRisk++;
                        break;
                    case 'OVERDUE':
                        overdue++;
                        break;
                }
            }
        }

        return {
            total: applications.length,
            onTrack,
            atRisk,
            overdue,
            percentage: {
                onTrack: applications.length > 0 ? (onTrack / applications.length) * 100 : 0,
                atRisk: applications.length > 0 ? (atRisk / applications.length) * 100 : 0,
                overdue: applications.length > 0 ? (overdue / applications.length) * 100 : 0,
            },
        };
    }

    /**
     * Update SLA days for a pipeline stage
     */
    async updateStageSla(stageId: string, slaDays: number) {
        return this.prisma.pipelineStage.update({
            where: { id: stageId },
            data: { slaDays },
        });
    }

    /**
     * Get SLA dashboard for a tenant
     */
    async getSlaDashboard(tenantId: string) {
        const { atRisk, overdue } = await this.getAtRiskApplications(tenantId);

        // Get jobs with SLA issues
        const jobsWithIssues = new Map<string, { job: any; atRisk: number; overdue: number }>();

        for (const app of [...atRisk, ...overdue]) {
            const jobId = app.job?.id;
            if (!jobId) continue;

            if (!jobsWithIssues.has(jobId)) {
                jobsWithIssues.set(jobId, { job: app.job, atRisk: 0, overdue: 0 });
            }

            const jobStats = jobsWithIssues.get(jobId)!;
            if (app.slaStatus.status === 'AT_RISK') {
                jobStats.atRisk++;
            } else if (app.slaStatus.status === 'OVERDUE') {
                jobStats.overdue++;
            }
        }

        // Get stage breakdown
        const stageBreakdown = new Map<string, { stage: string; atRisk: number; overdue: number }>();

        for (const app of [...atRisk, ...overdue]) {
            const stageName = app.currentStage?.name || 'Unknown';
            if (!stageBreakdown.has(stageName)) {
                stageBreakdown.set(stageName, { stage: stageName, atRisk: 0, overdue: 0 });
            }

            const stageStats = stageBreakdown.get(stageName)!;
            if (app.slaStatus.status === 'AT_RISK') {
                stageStats.atRisk++;
            } else if (app.slaStatus.status === 'OVERDUE') {
                stageStats.overdue++;
            }
        }

        return {
            summary: {
                totalAtRisk: atRisk.length,
                totalOverdue: overdue.length,
                totalIssues: atRisk.length + overdue.length,
            },
            byJob: Array.from(jobsWithIssues.values()).map(j => ({
                jobId: j.job.id,
                jobTitle: j.job.title,
                atRisk: j.atRisk,
                overdue: j.overdue,
            })),
            byStage: Array.from(stageBreakdown.values()),
            applications: {
                atRisk: atRisk.slice(0, 10).map(a => ({
                    id: a.id,
                    candidateName: `${a.candidate?.firstName || ''} ${a.candidate?.lastName || ''}`,
                    jobTitle: a.job?.title,
                    stageName: a.currentStage?.name,
                    daysInStage: a.slaStatus.daysInStage,
                    slaLimit: a.slaStatus.slaLimit,
                })),
                overdue: overdue.slice(0, 10).map(a => ({
                    id: a.id,
                    candidateName: `${a.candidate?.firstName || ''} ${a.candidate?.lastName || ''}`,
                    jobTitle: a.job?.title,
                    stageName: a.currentStage?.name,
                    daysInStage: a.slaStatus.daysInStage,
                    slaLimit: a.slaStatus.slaLimit,
                    daysOverdue: a.slaStatus.daysInStage - a.slaStatus.slaLimit,
                })),
            },
        };
    }

    /**
     * Get SLA trends over time
     */
    async getSlaTrends(tenantId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const slaActivities = await this.prisma.activityLog.findMany({
            where: {
                action: { in: ['SLA_AT_RISK', 'SLA_OVERDUE'] },
                createdAt: { gte: startDate },
                application: {
                    job: { tenantId },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const byDate = new Map<string, { date: string; atRisk: number; overdue: number }>();

        for (const activity of slaActivities) {
            const dateKey = activity.createdAt.toISOString().split('T')[0];
            if (!byDate.has(dateKey)) {
                byDate.set(dateKey, { date: dateKey, atRisk: 0, overdue: 0 });
            }

            const dayStats = byDate.get(dateKey)!;
            if (activity.action === 'SLA_AT_RISK') {
                dayStats.atRisk++;
            } else {
                dayStats.overdue++;
            }
        }

        return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Get average time in stage
     */
    async getAverageTimeInStage(stageId: string): Promise<number> {
        const activities = await this.prisma.activityLog.findMany({
            where: {
                action: 'STAGE_CHANGED',
                metadata: {
                    path: ['toStageId'],
                    equals: stageId,
                },
            },
            include: {
                application: {
                    include: {
                        activities: {
                            where: { action: 'STAGE_CHANGED' },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                },
            },
        });

        if (activities.length === 0) return 0;

        let totalDays = 0;
        let count = 0;

        for (const activity of activities) {
            const app = activity.application;
            if (!app) continue;

            // Find when they entered this stage
            const entryActivity = app.activities.find(
                (a: any) => a.metadata?.toStageId === stageId
            );

            if (!entryActivity) continue;

            // Find when they left this stage
            const exitActivity = app.activities.find(
                (a: any) => a.metadata?.fromStageId === stageId && a.createdAt > entryActivity.createdAt
            );

            if (entryActivity && exitActivity) {
                const days = Math.floor(
                    (exitActivity.createdAt.getTime() - entryActivity.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                totalDays += days;
                count++;
            }
        }

        return count > 0 ? totalDays / count : 0;
    }
}
