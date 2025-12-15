import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { BulkActionsService } from './bulk-actions.service';
import { BulkActionsController } from './bulk-actions.controller';
import { WorkflowsModule } from '../workflows/workflows.module';
import { SlaModule } from '../sla/sla.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [WorkflowsModule, SlaModule, AiModule],
  controllers: [ApplicationsController, BulkActionsController],
  providers: [ApplicationsService, BulkActionsService],
  exports: [ApplicationsService, BulkActionsService],
})
export class ApplicationsModule { }
