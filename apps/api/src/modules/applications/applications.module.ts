import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { BulkActionsService } from './bulk-actions.service';
import { BulkActionsController } from './bulk-actions.controller';
import { AutoRejectionService } from './auto-rejection.service';
import { AutoRejectionController } from './auto-rejection.controller';
import { WorkflowsModule } from '../workflows/workflows.module';
import { SlaModule } from '../sla/sla.module';
import { AiModule } from '../ai/ai.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [WorkflowsModule, SlaModule, AiModule, CommonModule],
  controllers: [ApplicationsController, BulkActionsController, AutoRejectionController],
  providers: [ApplicationsService, BulkActionsService, AutoRejectionService],
  exports: [ApplicationsService, BulkActionsService, AutoRejectionService],
})
export class ApplicationsModule { }
