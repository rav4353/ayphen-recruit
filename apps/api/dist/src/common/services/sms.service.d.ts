import { PrismaService } from '../../prisma/prisma.service';
interface SmsConfig {
    provider: 'TWILIO' | 'MSG91' | 'TEXTLOCAL';
    accountSid: string;
    authToken: string;
    fromNumber: string;
    webhookUrl?: string;
}
interface SendSmsOptions {
    to: string;
    body: string;
    tenantId: string;
    candidateId?: string;
    mediaUrl?: string;
}
interface SendSmsResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export declare class SmsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getConfig;
    saveConfig(tenantId: string, config: SmsConfig): Promise<void>;
    getSettings(tenantId: string): Promise<{
        provider: string;
        fromNumber: string;
        isConfigured: boolean;
    } | null>;
    private sendViaTwilio;
    private sendViaMsg91;
    sendSms(options: SendSmsOptions): Promise<SendSmsResult>;
    sendBulkSms(tenantId: string, recipients: {
        phone: string;
        body: string;
        candidateId?: string;
    }[]): Promise<{
        total: number;
        sent: number;
        failed: number;
        errors: string[];
    }>;
    private normalizePhoneNumber;
    private logSmsAttempt;
    getTemplates(tenantId: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }[]>;
    saveTemplate(tenantId: string, name: string, content: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
}
export {};
