import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class ComplianceService {
    private readonly logger = new Logger(ComplianceService.name);
    private readonly CONSENT_PERIOD_DAYS = 730; // 2 years
    private readonly WARNING_PERIOD_DAYS = 30; // 30 days before expiry

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        this.logger.log('Running GDPR compliance check...');
        await this.checkExpiringConsents();
    }

    async checkExpiringConsents() {
        // Calculate the date range for warning
        // We want to find candidates who gave consent (CONSENT_PERIOD - WARNING_PERIOD) days ago
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() - (this.CONSENT_PERIOD_DAYS - this.WARNING_PERIOD_DAYS));

        // We can look for candidates whose consent date is OLDER than warningDate but NOT YET expired
        // But simpler: Find candidates whose consent expires in exactly 30 days
        // Expiry Date = Consent Date + 730 days
        // Warning Date = Expiry Date - 30 days = Consent Date + 700 days

        // Let's find candidates whose consent date is roughly 700 days ago
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

    async anonymizeCandidate(id: string) {
        const candidate = await this.prisma.candidate.findUnique({ where: { id } });
        if (!candidate) return;

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
}
