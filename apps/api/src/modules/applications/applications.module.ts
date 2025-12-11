import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { WorkflowsModule } from '../workflows/workflows.module';
import { SlaModule } from '../sla/sla.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [WorkflowsModule, SlaModule, AiModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule { }
