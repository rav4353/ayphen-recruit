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
var BGVService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BGVService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const checkr_service_1 = require("./providers/checkr.service");
let BGVService = BGVService_1 = class BGVService {
    constructor(prisma, checkr) {
        this.prisma = prisma;
        this.checkr = checkr;
        this.logger = new common_1.Logger(BGVService_1.name);
    }
    async getSettings(tenantId) {
        const settings = await this.prisma.bGVSettings.findUnique({
            where: { tenantId },
            select: { id: true, provider: true, isConfigured: true, sandboxMode: true },
        });
        return settings;
    }
    async configure(tenantId, dto) {
        const settings = await this.prisma.bGVSettings.upsert({
            where: { tenantId },
            update: {
                provider: dto.provider,
                apiKey: dto.apiKey,
                apiSecret: dto.apiSecret,
                webhookUrl: dto.webhookUrl,
                sandboxMode: dto.sandboxMode ?? true,
                isConfigured: true,
            },
            create: {
                tenantId,
                provider: dto.provider,
                apiKey: dto.apiKey,
                apiSecret: dto.apiSecret,
                webhookUrl: dto.webhookUrl,
                sandboxMode: dto.sandboxMode ?? true,
                isConfigured: true,
            },
        });
        return { id: settings.id, provider: settings.provider, isConfigured: true };
    }
    async initiate(tenantId, userId, dto) {
        const settings = await this.prisma.bGVSettings.findUnique({ where: { tenantId } });
        if (!settings?.apiKey) {
            throw new common_1.BadRequestException('BGV provider not configured');
        }
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: dto.candidateId },
        });
        if (!candidate || candidate.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        const existing = await this.prisma.bGVCheck.findFirst({
            where: {
                candidateId: dto.candidateId,
                status: { in: ['PENDING', 'INITIATED', 'IN_PROGRESS'] },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('A background check is already in progress for this candidate');
        }
        let externalId = null;
        let status = 'PENDING';
        if (settings.provider === 'CHECKR') {
            try {
                const config = { apiKey: settings.apiKey, sandboxMode: settings.sandboxMode };
                const checkrCandidate = await this.checkr.createCandidate(config, {
                    email: candidate.email,
                    firstName: candidate.firstName,
                    lastName: candidate.lastName,
                    phone: candidate.phone || undefined,
                });
                const invitation = await this.checkr.createInvitation(config, checkrCandidate.id, dto.packageType || 'driver_pro');
                externalId = invitation.id;
                status = 'INITIATED';
            }
            catch (error) {
                this.logger.error('Failed to initiate Checkr BGV:', error);
                throw new common_1.BadRequestException(`Failed to initiate background check: ${error.message}`);
            }
        }
        else if (settings.provider === 'MANUAL') {
            status = 'INITIATED';
        }
        const bgvCheck = await this.prisma.bGVCheck.create({
            data: {
                provider: settings.provider,
                externalId,
                status,
                packageType: dto.packageType || 'standard',
                checkTypes: dto.checkTypes || ['IDENTITY', 'CRIMINAL', 'EMPLOYMENT'],
                candidateId: dto.candidateId,
                applicationId: dto.applicationId,
                initiatedById: userId,
                initiatedAt: new Date(),
            },
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        return bgvCheck;
    }
    async getCheck(tenantId, checkId) {
        const check = await this.prisma.bGVCheck.findUnique({
            where: { id: checkId },
            include: {
                candidate: {
                    select: { firstName: true, lastName: true, email: true, tenantId: true },
                },
                application: {
                    select: { id: true, job: { select: { title: true } } },
                },
                initiatedBy: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
        if (!check || check.candidate.tenantId !== tenantId) {
            throw new common_1.NotFoundException('BGV check not found');
        }
        return check;
    }
    async listChecks(tenantId, filters) {
        const where = {
            candidate: { tenantId },
        };
        if (filters?.status)
            where.status = filters.status;
        if (filters?.candidateId)
            where.candidateId = filters.candidateId;
        return this.prisma.bGVCheck.findMany({
            where,
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
                application: { select: { job: { select: { title: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async syncStatus(tenantId, checkId) {
        const check = await this.getCheck(tenantId, checkId);
        const settings = await this.prisma.bGVSettings.findUnique({ where: { tenantId } });
        if (!settings?.apiKey || !check.externalId) {
            return check;
        }
        if (settings.provider === 'CHECKR') {
            try {
                const config = { apiKey: settings.apiKey, sandboxMode: settings.sandboxMode };
                const reports = await this.checkr.getCandidateReports(config, check.externalId);
                if (reports.length > 0) {
                    const latestReport = reports[0];
                    const newStatus = this.checkr.mapStatus(latestReport.status, latestReport.result);
                    await this.prisma.bGVCheck.update({
                        where: { id: checkId },
                        data: {
                            status: newStatus,
                            result: latestReport,
                            reportUrl: `https://dashboard.checkr.com/reports/${latestReport.id}`,
                            completedAt: latestReport.completed_at ? new Date(latestReport.completed_at) : null,
                        },
                    });
                }
            }
            catch (error) {
                this.logger.error('Failed to sync Checkr status:', error);
            }
        }
        return this.getCheck(tenantId, checkId);
    }
    async handleWebhook(provider, payload) {
        this.logger.log(`Received ${provider} webhook:`, payload);
        if (provider === 'checkr') {
            const { type, data } = payload;
            if (type === 'report.completed' || type === 'report.updated') {
                const reportId = data.object.id;
                const check = await this.prisma.bGVCheck.findFirst({
                    where: { externalId: reportId },
                });
                if (check) {
                    const newStatus = this.checkr.mapStatus(data.object.status, data.object.result);
                    await this.prisma.bGVCheck.update({
                        where: { id: check.id },
                        data: {
                            status: newStatus,
                            result: data.object,
                            completedAt: data.object.completed_at ? new Date(data.object.completed_at) : null,
                        },
                    });
                }
            }
        }
        return { received: true };
    }
    async cancel(tenantId, checkId) {
        const check = await this.getCheck(tenantId, checkId);
        if (!['PENDING', 'INITIATED'].includes(check.status)) {
            throw new common_1.BadRequestException('Cannot cancel a check that is already in progress or completed');
        }
        await this.prisma.bGVCheck.update({
            where: { id: checkId },
            data: { status: 'CANCELLED' },
        });
        return { success: true };
    }
    async getPackages(tenantId) {
        const settings = await this.prisma.bGVSettings.findUnique({ where: { tenantId } });
        if (!settings?.apiKey) {
            return [
                { id: 'basic', name: 'Basic', description: 'Identity + National Criminal', checks: ['IDENTITY', 'CRIMINAL'] },
                { id: 'standard', name: 'Standard', description: 'Basic + Employment Verification', checks: ['IDENTITY', 'CRIMINAL', 'EMPLOYMENT'] },
                { id: 'comprehensive', name: 'Comprehensive', description: 'Standard + Education + Reference', checks: ['IDENTITY', 'CRIMINAL', 'EMPLOYMENT', 'EDUCATION', 'REFERENCE'] },
            ];
        }
        if (settings.provider === 'CHECKR') {
            const config = { apiKey: settings.apiKey, sandboxMode: settings.sandboxMode };
            return this.checkr.getPackages(config);
        }
        return [];
    }
    async getDashboard(tenantId) {
        const [total, pending, inProgress, clear, consider] = await Promise.all([
            this.prisma.bGVCheck.count({ where: { candidate: { tenantId } } }),
            this.prisma.bGVCheck.count({ where: { candidate: { tenantId }, status: 'PENDING' } }),
            this.prisma.bGVCheck.count({ where: { candidate: { tenantId }, status: 'IN_PROGRESS' } }),
            this.prisma.bGVCheck.count({ where: { candidate: { tenantId }, status: 'CLEAR' } }),
            this.prisma.bGVCheck.count({ where: { candidate: { tenantId }, status: 'CONSIDER' } }),
        ]);
        return {
            total,
            pending,
            inProgress,
            clear,
            consider,
            clearRate: total > 0 ? Math.round((clear / total) * 100) : 0,
        };
    }
};
exports.BGVService = BGVService;
exports.BGVService = BGVService = BGVService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        checkr_service_1.CheckrService])
], BGVService);
//# sourceMappingURL=bgv.service.js.map