import { JwtPayload } from '../auth/auth.service';
import { SkillsService } from './skills.service';
export declare class SkillsController {
    private readonly skillsService;
    constructor(skillsService: SkillsService);
    findAll(user: JwtPayload): Promise<{
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        synonyms: string[];
    }[]>;
    create(body: {
        name: string;
        synonyms: string[];
        category: string;
    }, user: JwtPayload): Promise<{
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        synonyms: string[];
    }>;
}
