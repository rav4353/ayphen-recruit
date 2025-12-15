import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { HiringTeamService } from './hiring-team.service';
import { HiringTeamController, MyHiringTeamsController } from './hiring-team.controller';
import { JobTemplatesService } from './job-templates.service';
import { JobTemplatesController } from './job-templates.controller';

import { IntegrationsModule } from '../integrations/integrations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [IntegrationsModule, SettingsModule],
  controllers: [JobsController, HiringTeamController, MyHiringTeamsController, JobTemplatesController],
  providers: [JobsService, HiringTeamService, JobTemplatesService],
  exports: [JobsService, HiringTeamService, JobTemplatesService],
})
export class JobsModule { }
