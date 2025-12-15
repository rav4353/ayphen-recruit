import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogFilters {
    action?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
}

@Injectable()
export class AuditLogsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get audit logs with filtering and pagination
     */
    async getAuditLogs(
        tenantId: string,
        filters: AuditLogFilters,
        page: number = 1,
        limit: number = 50,
    ) {
        const skip = (page - 1) * limit;

        const where: any = {};

        // Filter by action type
        if (filters.action) {
            where.action = filters.action;
        }

        // Filter by user
        if (filters.userId) {
            where.userId = filters.userId;
        }

        // Filter by date range
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        // Filter by entity
        if (filters.entityType) {
            if (filters.entityType === 'application') {
                where.applicationId = { not: null };
            } else if (filters.entityType === 'candidate') {
                where.candidateId = { not: null };
            } else if (filters.entityType === 'job') {
                // Jobs are linked through applications or directly in metadata
                where.OR = [
                    { application: { jobId: { not: null } } },
                    { metadata: { path: ['entityType'], equals: 'job' } },
                ];
            }
        }

        if (filters.entityId) {
            where.OR = [
                { applicationId: filters.entityId },
                { candidateId: filters.entityId },
                { metadata: { path: ['entityId'], equals: filters.entityId } },
            ];
        }

        // Search in description
        if (filters.search) {
            where.description = { contains: filters.search, mode: 'insensitive' };
        }

        // Ensure we only get logs from the tenant's data
        where.OR = where.OR || [];
        where.OR.push(
            { application: { job: { tenantId } } },
            { candidate: { tenantId } },
            { user: { tenantId } },
        );

        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    application: {
                        select: {
                            id: true,
                            job: { select: { id: true, title: true } },
                        },
                    },
                    candidate: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.activityLog.count({ where }),
        ]);

        return {
            logs: logs.map(log => ({
                id: log.id,
                action: log.action,
                description: log.description,
                createdAt: log.createdAt,
                user: log.user,
                application: log.application,
                candidate: log.candidate,
                metadata: log.metadata,
                category: this.categorizeAction(log.action),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get available action types for filtering
     */
    async getActionTypes(tenantId: string) {
        const actions = await this.prisma.activityLog.findMany({
            where: {
                OR: [
                    { application: { job: { tenantId } } },
                    { candidate: { tenantId } },
                    { user: { tenantId } },
                ],
            },
            select: { action: true },
            distinct: ['action'],
        });

        return actions.map(a => a.action).sort();
    }

    /**
     * Get audit log statistics
     */
    async getAuditStats(tenantId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await this.prisma.activityLog.findMany({
            where: {
                createdAt: { gte: startDate },
                OR: [
                    { application: { job: { tenantId } } },
                    { candidate: { tenantId } },
                    { user: { tenantId } },
                ],
            },
            select: { action: true, createdAt: true, userId: true },
        });

        // Group by action type
        const byAction: Record<string, number> = {};
        logs.forEach(log => {
            byAction[log.action] = (byAction[log.action] || 0) + 1;
        });

        // Group by day
        const byDay: Record<string, number> = {};
        logs.forEach(log => {
            const day = log.createdAt.toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + 1;
        });

        // Group by user
        const byUser: Record<string, number> = {};
        logs.forEach(log => {
            if (log.userId) {
                byUser[log.userId] = (byUser[log.userId] || 0) + 1;
            }
        });

        // Top users by activity
        const topUserIds = Object.entries(byUser)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id]) => id);

        const topUsers = await this.prisma.user.findMany({
            where: { id: { in: topUserIds } },
            select: { id: true, firstName: true, lastName: true },
        });

        return {
            totalLogs: logs.length,
            byAction: Object.entries(byAction)
                .map(([action, count]) => ({ action, count }))
                .sort((a, b) => b.count - a.count),
            byDay: Object.entries(byDay)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date)),
            topUsers: topUserIds.map(id => {
                const user = topUsers.find(u => u.id === id);
                return {
                    userId: id,
                    name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                    activityCount: byUser[id],
                };
            }),
        };
    }

    /**
     * Export audit logs to CSV
     */
    async exportAuditLogs(
        tenantId: string,
        filters: AuditLogFilters,
    ): Promise<string> {
        const result = await this.getAuditLogs(tenantId, filters, 1, 10000);

        const rows = result.logs.map(log => ({
            'Date': new Date(log.createdAt).toISOString(),
            'Action': log.action,
            'Description': log.description,
            'User': log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
            'User Email': log.user?.email || '',
            'Candidate': log.candidate ? `${log.candidate.firstName} ${log.candidate.lastName}` : '',
            'Job': log.application?.job?.title || '',
            'Category': log.category,
        }));

        if (rows.length === 0) {
            return 'No audit logs found';
        }

        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(','),
            ...rows.map(row =>
                headers.map(h => `"${String(row[h as keyof typeof row] || '').replace(/"/g, '""')}"`).join(',')
            ),
        ].join('\n');

        return csv;
    }

    /**
     * Log a security event
     */
    async logSecurityEvent(
        userId: string,
        action: string,
        details: Record<string, any>,
        ipAddress?: string,
        userAgent?: string,
    ) {
        return this.prisma.activityLog.create({
            data: {
                action: `SECURITY_${action}`,
                description: `Security event: ${action}`,
                userId,
                metadata: {
                    ...details,
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                },
            },
        });
    }

    /**
     * Categorize action into a category
     */
    private categorizeAction(action: string): string {
        if (action.startsWith('SECURITY_')) return 'security';
        if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('AUTH')) return 'authentication';
        if (action.includes('CANDIDATE')) return 'candidate';
        if (action.includes('APPLICATION')) return 'application';
        if (action.includes('JOB')) return 'job';
        if (action.includes('INTERVIEW')) return 'interview';
        if (action.includes('OFFER')) return 'offer';
        if (action.includes('USER')) return 'user';
        if (action.includes('STAGE')) return 'pipeline';
        if (action.includes('EMAIL') || action.includes('SMS')) return 'communication';
        return 'other';
    }
}
