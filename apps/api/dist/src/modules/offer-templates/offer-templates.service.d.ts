import { PrismaService } from '../../prisma/prisma.service';
export declare class OfferTemplatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: {
        name: string;
        content: string;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    } | null>;
    update(tenantId: string, id: string, data: {
        name?: string;
        content?: string;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }>;
    remove(tenantId: string, id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }>;
}
