import { CommunicationEmailsService } from './communication-emails.service';
export declare class CommunicationWebhooksController {
    private readonly emailsService;
    private readonly logger;
    constructor(emailsService: CommunicationEmailsService);
    handleInboundEmail(payload: any): Promise<{
        success: boolean;
        reason: string;
    } | {
        processed: boolean;
        reason: string;
        emailId?: undefined;
        success: boolean;
    } | {
        processed: boolean;
        emailId: string;
        reason?: undefined;
        success: boolean;
    }>;
}
