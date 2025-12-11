import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { ReferenceModule } from '../reference/reference.module';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [ReferenceModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, ComplianceService],
  exports: [CandidatesService],
})
export class CandidatesModule { }
