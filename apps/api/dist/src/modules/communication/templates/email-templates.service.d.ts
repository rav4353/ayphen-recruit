import { PrismaService } from '../../../prisma/prisma.service';
export declare class EmailTemplatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, userId: string, data: {
        name: string;
        subject: string;
        body: string;
        category?: string;
        isGlobal?: boolean;
    }): Promise<{
        subject: string;
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string | null;
        body: string;
        isGlobal: boolean;
    }>;
    findAll(tenantId: string): Promise<({
        user: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        subject: string;
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string | null;
        body: string;
        isGlobal: boolean;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        subject: string;
        name: string;
        id: string;
        category: string | null;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string | null;
        body: string;
        isGlobal: boolean;
    } | null>;
    update(id: string, tenantId: string, data: Partial<{
        name: string;
        subject: string;
        body: string;
        category: string;
        isGlobal: boolean;
    }>): Promise<import("@prisma/client").Prisma.BatchPayload>;
    remove(id: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
