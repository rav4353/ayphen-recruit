import { ScorecardsService } from './scorecards.service';
import { CreateScorecardTemplateDto } from './dto/create-scorecard-template.dto';
import { UpdateScorecardTemplateDto } from './dto/update-scorecard-template.dto';
export declare class ScorecardsController {
    private readonly scorecardsService;
    constructor(scorecardsService: ScorecardsService);
    create(dto: CreateScorecardTemplateDto, req: any): Promise<any>;
    findAll(req: any): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateScorecardTemplateDto): Promise<any>;
    remove(id: string): Promise<any>;
}
