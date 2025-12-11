import { SavedViewsService } from './saved-views.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto';
import { JwtPayload } from '../auth/auth.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
export declare class SavedViewsController {
    private readonly savedViewsService;
    constructor(savedViewsService: SavedViewsService);
    create(dto: CreateSavedViewDto, user: JwtPayload): Promise<ApiResponse<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>>;
    findAll(user: JwtPayload, entity: string): Promise<ApiResponse<({
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
    })[]>>;
    findOne(id: string): Promise<ApiResponse<{
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
    }>>;
    update(id: string, dto: UpdateSavedViewDto, user: JwtPayload): Promise<ApiResponse<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        userId: string;
        entity: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>>;
    remove(id: string, user: JwtPayload): Promise<ApiResponse<null>>;
}
