import { PartialType } from '@nestjs/mapped-types';
import { CreateScorecardTemplateDto } from './create-scorecard-template.dto';

export class UpdateScorecardTemplateDto extends PartialType(CreateScorecardTemplateDto) { }
