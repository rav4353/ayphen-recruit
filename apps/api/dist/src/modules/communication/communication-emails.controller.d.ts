import { CommunicationEmailsService, SendEmailDto } from './communication-emails.service';
import { User } from '@prisma/client';
export declare class CommunicationEmailsController {
    private readonly emailsService;
    constructor(emailsService: CommunicationEmailsService);
    sendEmail(user: User, dto: SendEmailDto): Promise<{
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
    sendBulkEmail(user: User, body: {
        ids: string[];
        subject: string;
        message: string;
    }): Promise<{
        count: number;
        total: number;
    }>;
    getEmails(user: User, candidateId: string): Promise<({
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
    getThreads(user: User): Promise<{
        candidateId: any;
        candidateName: string;
        candidateEmail: any;
        lastMessage: any;
    }[]>;
}
