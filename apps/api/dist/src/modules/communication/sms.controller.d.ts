import { ApiResponse } from '../../common/dto/api-response.dto';
import { SmsService } from '../../common/services/sms.service';
declare class ConfigureSmsDto {
    provider: 'TWILIO' | 'MSG91' | 'TEXTLOCAL';
    accountSid: string;
    authToken: string;
    fromNumber: string;
    webhookUrl?: string;
}
declare class SendSmsDto {
    to: string;
    body: string;
    candidateId?: string;
    mediaUrl?: string;
}
declare class BulkSmsRecipient {
    phone: string;
    body: string;
    candidateId?: string;
}
declare class SendBulkSmsDto {
    recipients: BulkSmsRecipient[];
}
declare class SaveTemplateDto {
    name: string;
    content: string;
}
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    getSettings(req: any): Promise<ApiResponse<{
        provider: string;
        fromNumber: string;
        isConfigured: boolean;
    } | null>>;
    configure(dto: ConfigureSmsDto, req: any): Promise<ApiResponse<null>>;
    sendSms(dto: SendSmsDto, req: any): Promise<ApiResponse<null> | ApiResponse<{
        messageId: string | undefined;
    }>>;
    sendBulkSms(dto: SendBulkSmsDto, req: any): Promise<ApiResponse<{
        total: number;
        sent: number;
        failed: number;
        errors: string[];
    }>>;
    getTemplates(req: any): Promise<ApiResponse<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }[]>>;
    saveTemplate(dto: SaveTemplateDto, req: any): Promise<ApiResponse<null>>;
}
export {};
