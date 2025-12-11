import { EmailTemplatesService } from './email-templates.service';
import { User } from '@prisma/client';
export declare class EmailTemplatesController {
    private readonly templatesService;
    constructor(templatesService: EmailTemplatesService);
    create(user: User, body: any): Promise<{
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
    findAll(user: User): Promise<({
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
    findOne(user: User, id: string): Promise<{
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
    update(user: User, id: string, body: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    remove(user: User, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
