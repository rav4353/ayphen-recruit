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
exports.DispositionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DispositionService = class DispositionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.defaultRejectionReasons = [
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
        this.defaultWithdrawalReasons = [
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
    }
    async getReasonsByType(type) {
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
    async getRejectionReasons() {
        return this.getReasonsByType('REJECTION');
    }
    async getWithdrawalReasons() {
        return this.getReasonsByType('WITHDRAWAL');
    }
    async recordDisposition(applicationId, type, reason, notes, userId) {
        const data = {
            status: type === 'REJECTION' ? 'REJECTED' : 'WITHDRAWN',
        };
        if (type === 'REJECTION') {
            data.rejectionReason = reason;
        }
        else {
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
    async getDispositionAnalytics(jobId, startDate, endDate) {
        const where = {
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
            if (startDate)
                where.updatedAt.gte = startDate;
            if (endDate)
                where.updatedAt.lte = endDate;
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
        const rejectionReasons = {};
        const withdrawalReasons = {};
        for (const app of applications) {
            if (app.status === 'REJECTED' && app.rejectionReason) {
                rejectionReasons[app.rejectionReason] = (rejectionReasons[app.rejectionReason] || 0) + 1;
            }
            else if (app.status === 'WITHDRAWN' && app.withdrawalReason) {
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
    async validateReason(type, reason) {
        const validReasons = await this.getReasonsByType(type);
        return validReasons.some(r => r.reason === reason);
    }
};
exports.DispositionService = DispositionService;
exports.DispositionService = DispositionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DispositionService);
//# sourceMappingURL=disposition.service.js.map