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
import { CandidateScoringService } from './candidate-scoring.service';
import { CandidateScoringController } from './candidate-scoring.controller';
import { CandidateTaggingService } from './candidate-tagging.service';
import { CandidateTaggingController } from './candidate-tagging.controller';
import { CandidateDedupService } from './candidate-dedup.service';
import { CandidateDedupController } from './candidate-dedup.controller';
import { SemanticSearchService } from './semantic-search.service';
import { SemanticSearchController } from './semantic-search.controller';
import { ReferenceModule } from '../reference/reference.module';
import { SettingsModule } from '../settings/settings.module';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [ReferenceModule, SettingsModule],
  controllers: [CandidatesController, CandidateSearchController, ReferralsController, CandidateActivityController, CandidateNotesController, NotesSearchController, CandidateComparisonController, CandidateScoringController, CandidateTaggingController, CandidateDedupController, SemanticSearchController],
  providers: [CandidatesService, ComplianceService, CandidateSearchService, ReferralsService, CandidateActivityService, CandidateNotesService, CandidateComparisonService, CandidateScoringService, CandidateTaggingService, CandidateDedupService, SemanticSearchService],
  exports: [CandidatesService, CandidateSearchService, ReferralsService, CandidateActivityService, CandidateNotesService, CandidateComparisonService, CandidateScoringService, CandidateTaggingService, CandidateDedupService, SemanticSearchService],
})
export class CandidatesModule { }
