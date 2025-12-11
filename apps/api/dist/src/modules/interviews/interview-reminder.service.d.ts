import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
export declare class InterviewReminderService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    checkUpcomingInterviews(): Promise<void>;
    private sendReminders;
}
