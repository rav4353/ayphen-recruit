import { Body, Controller, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { CommunicationEmailsService } from './communication-emails.service';

@Controller('webhooks/email')
export class CommunicationWebhooksController {
    private readonly logger = new Logger(CommunicationWebhooksController.name);

    constructor(private readonly emailsService: CommunicationEmailsService) { }

    @Post('inbound')
    async handleInboundEmail(@Body() payload: any) {
        this.logger.log('Received inbound email webhook', JSON.stringify(payload));

        // Normalize payload - expecting a generic format for MVP
        // In real world, we would have adapters for SendGrid/Mailgun/SES
        const from = payload.from || payload.sender;
        const to = payload.to || payload.recipient;
        const subject = payload.subject;
        const body = payload.body || payload.html || payload.text;
        const tenantId = payload.tenantId; // Optional for simulation

        if (!from || !subject || !body) {
            this.logger.warn('Invalid webhook payload: missing required fields');
            return { success: false, reason: 'Missing required fields' };
        }

        const result = await this.emailsService.processInboundEmail({
            from,
            to,
            subject,
            body,
            tenantId,
        });

        return { success: true, ...result };
    }
}
