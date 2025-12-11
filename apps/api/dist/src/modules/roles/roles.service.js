"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_1 = require("../../common/constants/permissions");
let RolesService = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoleDto, tenantId) {
        return this.prisma.role.create({
            data: {
                ...createRoleDto,
                tenantId,
                isSystem: false,
            },
        });
    }
    async findAll(tenantId) {
        const customRoles = await this.prisma.role.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'asc' }
        });
        const systemRoles = Object.entries(permissions_1.ROLE_PERMISSIONS).map(([name, permissions], index) => ({
            id: `SYS_${name}`,
            name: name.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: 'System Default Role',
            permissions: permissions,
            isSystem: true,
            userCount: 0
        }));
        return [...systemRoles, ...customRoles];
    }
    async findOne(id) {
        if (id.startsWith('SYS_')) {
            const roleKey = id.replace('SYS_', '');
            const permissions = permissions_1.ROLE_PERMISSIONS[roleKey];
            if (!permissions)
                throw new common_1.NotFoundException('System role not found');
            return {
                id,
                name: roleKey,
                permissions,
                isSystem: true,
                description: 'System Default Role'
            };
        }
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async update(id, updateRoleDto, tenantId) {
        if (id.startsWith('SYS_')) {
            throw new common_1.ForbiddenException('Cannot edit system roles');
        }
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role || role.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Role not found');
        }
        return this.prisma.role.update({
            where: { id },
            data: updateRoleDto,
        });
    }
    async remove(id, tenantId) {
        if (id.startsWith('SYS_')) {
            throw new common_1.ForbiddenException('Cannot delete system roles');
        }
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role || role.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Role not found');
        }
        return this.prisma.role.delete({
            where: { id },
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map