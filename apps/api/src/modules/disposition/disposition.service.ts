import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DispositionReason {
    id: string;
    type: 'REJECTION' | 'WITHDRAWAL';
    reason: string;
    category?: string;
    isActive: boolean;
    order: number;
}

@Injectable()
export class DispositionService {
    constructor(private readonly prisma: PrismaService) { }

    // Default rejection reasons
    private readonly defaultRejectionReasons = [
        { reason: 'Not a skill fit', category: 'Skills', order: 1 },
        { reason: 'Insufficient experience', category: 'Experience', order: 2 },
        { reason: 'Cultural fit concerns', category: 'Culture', order: 3 },
        { reason: 'Salary expectations too high', category: 'Compensation', order: 4 },
        { reason: 'Failed technical assessment', category: 'Assessment', order: 5 },
        { reason: 'Poor communication skills', category: 'Skills', order: 6 },
        { reason: 'Location mismatch', category: 'Logistics', order: 7 },
        { reason: 'Overqualified', category: 'Experience', order: 8 },
        { reason: 'Position filled', category: 'Other', order: 9 },
        { reason: 'Other', category: 'Other', order: 10 },
    ];

    // Default withdrawal reasons
    private readonly defaultWithdrawalReasons = [
        { reason: 'Accepted another offer', category: 'Competing Offer', order: 1 },
        { reason: 'Salary not competitive', category: 'Compensation', order: 2 },
        { reason: 'Location concerns', category: 'Logistics', order: 3 },
        { reason: 'Company culture concerns', category: 'Culture', order: 4 },
        { reason: 'Role not aligned with career goals', category: 'Career', order: 5 },
        { reason: 'Personal reasons', category: 'Personal', order: 6 },
        { reason: 'Process took too long', category: 'Process', order: 7 },
        { reason: 'No longer interested', category: 'Other', order: 8 },
        { reason: 'Other', category: 'Other', order: 9 },
    ];

    /**
     * Get all disposition reasons by type
     */
    async getReasonsByType(type: 'REJECTION' | 'WITHDRAWAL') {
        // For now, return default reasons
        // In a real implementation, these would be stored in the database
        const reasons = type === 'REJECTION'
            ? this.defaultRejectionReasons
            : this.defaultWithdrawalReasons;

        return reasons.map((r, index) => ({
            id: `${type.toLowerCase()}-${index}`,
            type,
            reason: r.reason,
            category: r.category,
            isActive: true,
            order: r.order,
        }));
    }

    /**
     * Get rejection reasons
     */
    async getRejectionReasons() {
        return this.getReasonsByType('REJECTION');
    }

    /**
     * Get withdrawal reasons
     */
    async getWithdrawalReasons() {
        return this.getReasonsByType('WITHDRAWAL');
    }

    /**
     * Record disposition (rejection or withdrawal) with reason
     */
    async recordDisposition(
        applicationId: string,
        type: 'REJECTION' | 'WITHDRAWAL',
        reason: string,
        notes?: string,
        userId?: string,
    ) {
        // Update application status and reason
        const data: Record<string, any> = {
            status: type === 'REJECTION' ? 'REJECTED' : 'WITHDRAWN',
        };

        if (type === 'REJECTION') {
            data.rejectionReason = reason;
        } else {
            data.withdrawalReason = reason;
        }

        if (notes) {
            data.notes = notes;
        }

        const application = await this.prisma.application.update({
            where: { id: applicationId },
            data,
            include: {
                candidate: true,
                job: true,
            },
        });

        // Log the disposition
        await this.prisma.activityLog.create({
            data: {
                action: type === 'REJECTION' ? 'APPLICATION_REJECTED' : 'APPLICATION_WITHDRAWN',
                description: `${type === 'REJECTION' ? 'Rejected' : 'Withdrawn'}: ${reason}`,
                applicationId,
                userId,
                metadata: {
                    type,
                    reason,
                    notes,
                },
            },
        });

        return application;
    }

    /**
     * Get disposition analytics
     */
    async getDispositionAnalytics(jobId?: string, startDate?: Date, endDate?: Date) {
        const where: any = {
            OR: [
                { status: 'REJECTED' },
                { status: 'WITHDRAWN' },
            ],
        };

        if (jobId) {
            where.jobId = jobId;
        }

        if (startDate || endDate) {
            where.updatedAt = {};
            if (startDate) where.updatedAt.gte = startDate;
            if (endDate) where.updatedAt.lte = endDate;
        }

        const applications = await this.prisma.application.findMany({
            where,
            select: {
                status: true,
                rejectionReason: true,
                withdrawalReason: true,
                updatedAt: true,
            },
        });

        // Aggregate by reason
        const rejectionReasons: Record<string, number> = {};
        const withdrawalReasons: Record<string, number> = {};

        for (const app of applications) {
            if (app.status === 'REJECTED' && app.rejectionReason) {
                rejectionReasons[app.rejectionReason] = (rejectionReasons[app.rejectionReason] || 0) + 1;
            } else if (app.status === 'WITHDRAWN' && app.withdrawalReason) {
                withdrawalReasons[app.withdrawalReason] = (withdrawalReasons[app.withdrawalReason] || 0) + 1;
            }
        }

        return {
            total: applications.length,
            rejected: applications.filter(a => a.status === 'REJECTED').length,
            withdrawn: applications.filter(a => a.status === 'WITHDRAWN').length,
            rejectionReasons,
            withdrawalReasons,
            topRejectionReasons: Object.entries(rejectionReasons)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([reason, count]) => ({ reason, count })),
            topWithdrawalReasons: Object.entries(withdrawalReasons)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([reason, count]) => ({ reason, count })),
        };
    }

    /**
     * Validate disposition reason
     */
    async validateReason(type: 'REJECTION' | 'WITHDRAWAL', reason: string): Promise<boolean> {
        const validReasons = await this.getReasonsByType(type);
        return validReasons.some(r => r.reason === reason);
    }
}
