import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
export declare class ComplianceService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    private readonly CONSENT_PERIOD_DAYS;
    private readonly WARNING_PERIOD_DAYS;
    constructor(prisma: PrismaService, emailService: EmailService);
    handleCron(): Promise<void>;
    checkExpiringConsents(): Promise<void>;
    anonymizeCandidate(id: string): Promise<void>;
}
