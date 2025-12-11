import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
export declare class SendEmailDto {
    to: string;
    subject: string;
    body: string;
    candidateId: string;
    cc?: string;
    bcc?: string;
}
export declare class CommunicationEmailsService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    sendEmail(userId: string, tenantId: string, dto: SendEmailDto): Promise<{
        from: string;
        to: string;
        cc: string | null;
        bcc: string | null;
        subject: string;
        messageId: string | null;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EmailStatus;
        userId: string | null;
        candidateId: string;
        body: string;
        direction: import("@prisma/client").$Enums.EmailDirection;
        sentAt: Date | null;
        receivedAt: Date | null;
        threadId: string | null;
    }>;
    getEmailsForCandidate(candidateId: string, tenantId: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        } | null;
        attachments: {
            url: string;
            id: string;
            createdAt: Date;
            filename: string;
            size: number | null;
            emailId: string;
            mimeType: string | null;
        }[];
    } & {
        from: string;
        to: string;
        cc: string | null;
        bcc: string | null;
        subject: string;
        messageId: string | null;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EmailStatus;
        userId: string | null;
        candidateId: string;
        body: string;
        direction: import("@prisma/client").$Enums.EmailDirection;
        sentAt: Date | null;
        receivedAt: Date | null;
        threadId: string | null;
    })[]>;
    sendBulkEmail(userId: string, tenantId: string, data: {
        ids: string[];
        subject: string;
        message: string;
    }): Promise<{
        count: number;
        total: number;
    }>;
    processInboundEmail(payload: {
        from: string;
        to: string;
        subject: string;
        body: string;
        tenantId?: string;
    }): Promise<{
        processed: boolean;
        reason: string;
        emailId?: undefined;
    } | {
        processed: boolean;
        emailId: string;
        reason?: undefined;
    }>;
    getThreads(tenantId: string): Promise<{
        candidateId: any;
        candidateName: string;
        candidateEmail: any;
        lastMessage: any;
    }[]>;
}
