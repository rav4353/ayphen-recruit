import { PrismaService } from '../../prisma/prisma.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto';
export declare class SavedViewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSavedViewDto, tenantId: string, userId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>;
    findAll(tenantId: string, userId: string, entity: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    })[]>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>;
    update(id: string, dto: UpdateSavedViewDto, userId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>;
    remove(id: string, userId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>;
}
