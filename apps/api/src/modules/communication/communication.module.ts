import { Module } from '@nestjs/common';
import { CommunicationEmailsController } from './communication-emails.controller';
import { CommunicationWebhooksController } from './communication-webhooks.controller';
import { CommunicationEmailsService } from './communication-emails.service';
import { EmailTemplatesController } from './templates/email-templates.controller';
import { EmailTemplatesService } from './templates/email-templates.service';
import { EmailSequencesService } from './email-sequences.service';
import { EmailSequencesController } from './email-sequences.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [CommunicationEmailsController, EmailTemplatesController, CommunicationWebhooksController, EmailSequencesController],
    providers: [CommunicationEmailsService, EmailService, EmailTemplatesService, SmsService, EmailSequencesService],
    exports: [CommunicationEmailsService, EmailTemplatesService, SmsService, EmailSequencesService],
})
export class CommunicationModule { }
// Rebuild trigger
