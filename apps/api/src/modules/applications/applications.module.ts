import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { BulkActionsService } from './bulk-actions.service';
import { BulkActionsController } from './bulk-actions.controller';
import { AutoRejectionService } from './auto-rejection.service';
import { AutoRejectionController } from './auto-rejection.controller';
import { ApplicationDocumentsService } from './application-documents.service';
import { ApplicationDocumentsController } from './application-documents.controller';
import { WorkflowsModule } from '../workflows/workflows.module';
import { SlaModule } from '../sla/sla.module';
import { AiModule } from '../ai/ai.module';
import { CommonModule } from '../../common/common.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [WorkflowsModule, SlaModule, AiModule, CommonModule, StorageModule],
  controllers: [ApplicationsController, BulkActionsController, AutoRejectionController, ApplicationDocumentsController],
  providers: [ApplicationsService, BulkActionsService, AutoRejectionService, ApplicationDocumentsService],
  exports: [ApplicationsService, BulkActionsService, AutoRejectionService, ApplicationDocumentsService],
})
export class ApplicationsModule { }
