import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    tenantId?: string;
    bcc?: string | string[];
}
export declare class EmailService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private defaultTransporter;
    private readonly fromEmail;
    private readonly fromName;
    private readonly isConfigured;
    private transporters;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getTransporter;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendOtpEmail(to: string, otp: string, tenantId?: string): Promise<boolean>;
    sendPasswordResetEmail(to: string, resetLink: string, tenantId?: string): Promise<boolean>;
    sendInvitationEmail(to: string, name: string, tempPass: string, loginUrl: string, tenantId?: string): Promise<boolean>;
}
