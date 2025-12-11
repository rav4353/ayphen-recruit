import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SLAStatus {
    status: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
    daysInStage: number;
    slaLimit: number;
    daysRemaining: number;
}

@Injectable()
export class SlaService {
    constructor(private readonly prisma: PrismaService) { }

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

        // TODO: Send email notification to recruiter/hiring manager
        // This will be implemented when Module 7 (Communication) is available
        console.log(`SLA ${type} notification for application ${application.id}`);
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
