import { PrismaService } from '../../prisma/prisma.service';
export declare class SkillsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    normalizeSkills(skills: string[], tenantId: string): Promise<string[]>;
    create(name: string, synonyms: string[], category: string, tenantId: string): Promise<{
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        synonyms: string[];
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        synonyms: string[];
    }[]>;
}
