import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';

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
        private readonly settingsService: SettingsService,
    ) { }

    /**
     * Calculate SLA status for an application
     */
    async calculateSlaStatus(applicationId: string): Promise<SLAStatus | null> {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                currentStage: true,
                job: true,
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

        let slaLimit = application.currentStage.slaDays;

        // If stage specific SLA is not set, try to use global SLA settings
        if (!slaLimit && application.job?.tenantId) {
            try {
                const setting = await this.settingsService.getSettingByKey(application.job.tenantId, 'sla_settings');
                if (setting && setting.value) {
                    const stageKey = this.getSlaKeyForStage(application.currentStage.name);
                    if (stageKey && setting.value[stageKey]) {
                        slaLimit = setting.value[stageKey].days;
                    }
                }
            } catch (error) {
                // Ignore if setting not found
            }
        }

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


    private getSlaKeyForStage(stageName: string): string | null {
        const name = stageName.toLowerCase();
        if (name.includes('phone')) return 'phoneScreen';
        if (name.includes('resume') || name.includes('screen')) return 'screening';
        if (name.includes('interview')) return 'interview';
        if (name.includes('assessment') || name.includes('test')) return 'assessment';
        if (name.includes('background') || name.includes('bgv')) return 'backgroundCheck';
        if (name.includes('offer') && name.includes('acceptance')) return 'offerAcceptance';
        if (name.includes('offer')) return 'offer';
        if (name.includes('onboard')) return 'onboarding';
        return null;
    }
}
