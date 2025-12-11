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
var ComplianceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../common/services/email.service");
let ComplianceService = ComplianceService_1 = class ComplianceService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(ComplianceService_1.name);
        this.CONSENT_PERIOD_DAYS = 730;
        this.WARNING_PERIOD_DAYS = 30;
    }
    async handleCron() {
        this.logger.log('Running GDPR compliance check...');
        await this.checkExpiringConsents();
    }
    async checkExpiringConsents() {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() - (this.CONSENT_PERIOD_DAYS - this.WARNING_PERIOD_DAYS));
        const targetDateStart = new Date(warningDate);
        targetDateStart.setHours(0, 0, 0, 0);
        const targetDateEnd = new Date(warningDate);
        targetDateEnd.setHours(23, 59, 59, 999);
        const candidates = await this.prisma.candidate.findMany({
            where: {
                gdprConsent: true,
                gdprConsentAt: {
                    gte: targetDateStart,
                    lte: targetDateEnd,
                },
            },
        });
        this.logger.log(`Found ${candidates.length} candidates with expiring consent.`);
        for (const candidate of candidates) {
            await this.emailService.sendEmail({
                to: candidate.email,
                subject: 'Action Required: Renew your data consent',
                html: `<p>Hi ${candidate.firstName},</p>
               <p>Your consent for us to store your personal data will expire in 30 days.</p>
               <p>Please click here to renew your consent: <a href="#">Renew Consent</a></p>`,
                tenantId: candidate.tenantId,
            });
        }
    }
    async anonymizeCandidate(id) {
        const candidate = await this.prisma.candidate.findUnique({ where: { id } });
        if (!candidate)
            return;
        await this.prisma.candidate.update({
            where: { id },
            data: {
                firstName: 'Anonymized',
                lastName: 'Candidate',
                email: `anonymized-${candidate.id}@deleted.com`,
                phone: null,
                linkedinUrl: null,
                portfolioUrl: null,
                resumeUrl: null,
                resumeText: null,
                summary: null,
                experience: {},
                education: {},
                gdprConsent: false,
                gdprConsentAt: null,
            },
        });
        this.logger.log(`Candidate ${id} anonymized.`);
    }
};
exports.ComplianceService = ComplianceService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceService.prototype, "handleCron", null);
exports.ComplianceService = ComplianceService = ComplianceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map