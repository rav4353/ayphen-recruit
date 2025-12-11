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
exports.SlaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let SlaService = class SlaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateSlaStatus(applicationId) {
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
            return null;
        }
        const stageEntryDate = application.activities[0]?.createdAt || application.appliedAt;
        const now = new Date();
        const daysInStage = Math.floor((now.getTime() - stageEntryDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = slaLimit - daysInStage;
        let status;
        if (daysInStage > slaLimit) {
            status = 'OVERDUE';
        }
        else if (daysRemaining <= 1) {
            status = 'AT_RISK';
        }
        else {
            status = 'ON_TRACK';
        }
        return {
            status,
            daysInStage,
            slaLimit,
            daysRemaining,
        };
    }
    async getAtRiskApplications(tenantId) {
        const where = {};
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
        const atRisk = [];
        const overdue = [];
        for (const app of applications) {
            const slaStatus = await this.calculateSlaStatus(app.id);
            if (slaStatus) {
                const appWithSla = { ...app, slaStatus };
                if (slaStatus.status === 'OVERDUE') {
                    overdue.push(appWithSla);
                }
                else if (slaStatus.status === 'AT_RISK') {
                    atRisk.push(appWithSla);
                }
            }
        }
        return { atRisk, overdue };
    }
    async checkSlas() {
        console.log('Running daily SLA check...');
        const { atRisk, overdue } = await this.getAtRiskApplications();
        for (const app of atRisk) {
            await this.sendSlaNotification(app, 'AT_RISK');
        }
        for (const app of overdue) {
            await this.sendSlaNotification(app, 'OVERDUE');
        }
        console.log(`SLA check complete: ${atRisk.length} at risk, ${overdue.length} overdue`);
    }
    async sendSlaNotification(application, type) {
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
        console.log(`SLA ${type} notification for application ${application.id}`);
    }
    async getJobSlaStats(jobId) {
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
    async updateStageSla(stageId, slaDays) {
        return this.prisma.pipelineStage.update({
            where: { id: stageId },
            data: { slaDays },
        });
    }
    async getAverageTimeInStage(stageId) {
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
        if (activities.length === 0)
            return 0;
        let totalDays = 0;
        let count = 0;
        for (const activity of activities) {
            const app = activity.application;
            if (!app)
                continue;
            const entryActivity = app.activities.find((a) => a.metadata?.toStageId === stageId);
            if (!entryActivity)
                continue;
            const exitActivity = app.activities.find((a) => a.metadata?.fromStageId === stageId && a.createdAt > entryActivity.createdAt);
            if (entryActivity && exitActivity) {
                const days = Math.floor((exitActivity.createdAt.getTime() - entryActivity.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24));
                totalDays += days;
                count++;
            }
        }
        return count > 0 ? totalDays / count : 0;
    }
};
exports.SlaService = SlaService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SlaService.prototype, "checkSlas", null);
exports.SlaService = SlaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SlaService);
//# sourceMappingURL=sla.service.js.map