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

    // In a real app, this would query BullMQ or another queue provider
    async getJobStats() {
        return {
            active: Math.floor(Math.random() * 10),
            waiting: Math.floor(Math.random() * 50),
            completed: Math.floor(Math.random() * 1000),
            failed: Math.floor(Math.random() * 20),
            delayed: Math.floor(Math.random() * 5),
        };
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
