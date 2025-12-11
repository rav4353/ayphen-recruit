import { PrismaService } from '../../prisma/prisma.service';
import { CreateScorecardTemplateDto } from './dto/create-scorecard-template.dto';
import { UpdateScorecardTemplateDto } from './dto/update-scorecard-template.dto';
export declare class ScorecardsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateScorecardTemplateDto, tenantId: string): Promise<any>;
    findAll(tenantId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateScorecardTemplateDto): Promise<any>;
    remove(id: string): Promise<any>;
}
