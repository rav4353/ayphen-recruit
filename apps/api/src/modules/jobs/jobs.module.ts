import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { HiringTeamService } from './hiring-team.service';
import { HiringTeamController, MyHiringTeamsController } from './hiring-team.controller';
import { JobTemplatesService } from './job-templates.service';
import { JobTemplatesController } from './job-templates.controller';
import { JobRequisitionService } from './job-requisition.service';
import { JobRequisitionController } from './job-requisition.controller';
import { PipelineStagesService } from './pipeline-stages.service';
import { PipelineStagesController } from './pipeline-stages.controller';
import { JobPostingAnalyticsService } from './job-posting-analytics.service';
import { JobPostingAnalyticsController } from './job-posting-analytics.controller';

import { IntegrationsModule } from '../integrations/integrations.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [IntegrationsModule, SettingsModule, NotificationsModule],
  controllers: [JobsController, HiringTeamController, MyHiringTeamsController, JobTemplatesController, JobRequisitionController, PipelineStagesController, JobPostingAnalyticsController],
  providers: [JobsService, HiringTeamService, JobTemplatesService, JobRequisitionService, PipelineStagesService, JobPostingAnalyticsService],
  exports: [JobsService, HiringTeamService, JobTemplatesService, JobRequisitionService, PipelineStagesService, JobPostingAnalyticsService],
})
export class JobsModule { }
