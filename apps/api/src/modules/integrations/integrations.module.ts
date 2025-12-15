import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

import { JobBoardsService } from './job-boards.service';
import { LinkedInApplyService } from './linkedin-apply.service';
import { IndeedFeedService } from './indeed-feed.service';
import { ZipRecruiterService } from './ziprecruiter.service';
import { HRISSyncService } from './hris-sync.service';
import { SlackTeamsService } from './slack-teams.service';
import { WebhookManagementService } from './webhook-management.service';

import {
    JobBoardsController,
    LinkedInApplyController,
    IndeedFeedController,
    ZipRecruiterController,
    HRISController,
    MessagingController,
    WebhooksController,
} from './integrations.controller';

@Module({
    imports: [PrismaModule],
    controllers: [
        JobBoardsController,
        LinkedInApplyController,
        IndeedFeedController,
        ZipRecruiterController,
        HRISController,
        MessagingController,
        WebhooksController,
    ],
    providers: [
        JobBoardsService,
        LinkedInApplyService,
        IndeedFeedService,
        ZipRecruiterService,
        HRISSyncService,
        SlackTeamsService,
        WebhookManagementService,
    ],
    exports: [
        JobBoardsService,
        LinkedInApplyService,
        IndeedFeedService,
        ZipRecruiterService,
        HRISSyncService,
        SlackTeamsService,
        WebhookManagementService,
    ],
})
export class IntegrationsModule { }
