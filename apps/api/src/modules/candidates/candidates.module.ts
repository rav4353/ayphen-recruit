import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { CandidateSearchService } from './candidate-search.service';
import { CandidateSearchController } from './candidate-search.controller';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { CandidateActivityService } from './candidate-activity.service';
import { CandidateActivityController } from './candidate-activity.controller';
import { CandidateNotesService } from './candidate-notes.service';
import { CandidateNotesController, NotesSearchController } from './candidate-notes.controller';
import { CandidateComparisonService } from './candidate-comparison.service';
import { CandidateComparisonController } from './candidate-comparison.controller';
import { ReferenceModule } from '../reference/reference.module';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [ReferenceModule],
  controllers: [CandidatesController, CandidateSearchController, ReferralsController, CandidateActivityController, CandidateNotesController, NotesSearchController, CandidateComparisonController],
  providers: [CandidatesService, ComplianceService, CandidateSearchService, ReferralsService, CandidateActivityService, CandidateNotesService, CandidateComparisonService],
  exports: [CandidatesService, CandidateSearchService, ReferralsService, CandidateActivityService, CandidateNotesService, CandidateComparisonService],
})
export class CandidatesModule { }
