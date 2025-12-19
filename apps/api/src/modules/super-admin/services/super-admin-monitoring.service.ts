import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as os from 'os';
import { Interval } from '@nestjs/schedule';
import { SuperAdminGateway } from '../super-admin.gateway';

@Injectable()
export class SuperAdminMonitoringService {
    constructor(
        private prisma: PrismaService,
        private gateway: SuperAdminGateway,
    ) { }

    async getLogs(params: { level?: string; limit?: number; page?: number }) {
        const { level, limit = 50, page = 1 } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (level && level !== 'all') {
            where.level = level;
        }

        const [logs, total] = await Promise.all([
            this.prisma.systemLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            this.prisma.systemLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getResourceUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsage = (usedMem / totalMem) * 100;

        const cpus = os.cpus();
        const loadAvg = os.loadavg();

        return {
            memory: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                usagePercentage: memUsage,
            },
            cpu: {
                count: cpus.length,
                model: cpus[0].model,
                loadAvg: loadAvg, // [1min, 5min, 15min]
            },
            uptime: os.uptime(),
            platform: os.platform(),
            release: os.release(),
            timestamp: new Date().toISOString(),
        };
    }

    // Get real job/task statistics from the database
    async getJobStats() {
        try {
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

            // Count active applications in processing stages
            const [
                activeApplications,
                pendingInterviews,
                completedToday,
                failedEmails,
                scheduledInterviews,
            ] = await Promise.all([
                // Active: Applications currently being processed (not in terminal state)
                this.prisma.application.count({
                    where: {
                        status: { in: ['SCREENING', 'PHONE_SCREEN', 'INTERVIEW'] },
                        updatedAt: { gte: lastHour },
                    },
                }),
                // Waiting: Pending interviews
                this.prisma.interview.count({
                    where: { status: 'SCHEDULED', scheduledAt: { gte: now } },
                }),
                // Completed: Applications that moved to terminal state today
                this.prisma.application.count({
                    where: {
                        status: { in: ['HIRED', 'REJECTED', 'WITHDRAWN'] },
                        updatedAt: { gte: last24Hours },
                    },
                }),
                // Failed: Failed email sends in last 24 hours
                this.prisma.email.count({
                    where: {
                        status: 'FAILED',
                        createdAt: { gte: last24Hours },
                    },
                }),
                // Delayed: Interviews scheduled for future
                this.prisma.interview.count({
                    where: {
                        status: 'SCHEDULED',
                        scheduledAt: { gt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
                    },
                }),
            ]);

            return {
                active: activeApplications,
                waiting: pendingInterviews,
                completed: completedToday,
                failed: failedEmails,
                delayed: scheduledInterviews,
            };
        } catch (error) {
            console.error('Failed to get job stats:', error);
            return {
                active: 0,
                waiting: 0,
                completed: 0,
                failed: 0,
                delayed: 0,
            };
        }
    }

    @Interval(5000)
    async collectAndBroadcastMetrics() {
        const usage = await this.getResourceUsage();
        const jobStats = await this.getJobStats();

        const metrics = {
            ...usage,
            jobs: jobStats,
        };

        // Broadcast to monitoring subscribers
        this.gateway.broadcastMonitoring(metrics);

        // Save a snapshot
        try {
            await this.prisma.systemMetric.createMany({
                data: [
                    { type: 'CPU', value: usage.cpu.loadAvg?.[0] || 0, unit: 'LOAD_AVG' },
                    { type: 'MEMORY', value: usage.memory.usagePercentage, unit: 'PERCENT' },
                ],
            });
        } catch (error) {
            // Silently fail
        }
    }
}
