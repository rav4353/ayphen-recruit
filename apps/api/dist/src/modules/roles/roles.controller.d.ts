import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtPayload } from '../auth/auth.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto, user: JwtPayload): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    }>;
    findAll(user: JwtPayload): Promise<({
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    } | {
        id: string;
        name: string;
        description: string;
        permissions: import("../../common/constants/permissions").Permission[];
        isSystem: boolean;
        userCount: number;
    })[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    } | {
        id: string;
        name: string;
        permissions: import("../../common/constants/permissions").Permission[];
        isSystem: boolean;
        description: string;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto, user: JwtPayload): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    }>;
    remove(id: string, user: JwtPayload): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    }>;
}
