import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createRoleDto: CreateRoleDto, tenantId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    }>;
    findAll(tenantId: string): Promise<({
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
    update(id: string, updateRoleDto: UpdateRoleDto, tenantId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isSystem: boolean;
        permissions: string[];
    }>;
    remove(id: string, tenantId: string): Promise<{
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
