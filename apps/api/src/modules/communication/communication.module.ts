import { Module } from '@nestjs/common';
import { CommunicationEmailsController } from './communication-emails.controller';
import { CommunicationWebhooksController } from './communication-webhooks.controller';
import { CommunicationEmailsService } from './communication-emails.service';
import { EmailTemplatesController } from './templates/email-templates.controller';
import { EmailTemplatesService } from './templates/email-templates.service';
import { SmsController } from './sms.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [CommunicationEmailsController, EmailTemplatesController, CommunicationWebhooksController, SmsController],
    providers: [CommunicationEmailsService, EmailService, EmailTemplatesService, SmsService],
    exports: [CommunicationEmailsService, EmailTemplatesService, SmsService],
})
export class CommunicationModule { }
// Rebuild trigger
