import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { ROLE_PERMISSIONS } from "../../common/constants/permissions";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, tenantId: string) {
    return this.prisma.role.create({
      data: {
        ...createRoleDto,
        tenantId,
        isSystem: false,
      },
    });
  }

  async findAll(tenantId: string) {
    // 1. Fetch custom roles from DB
    const customRoles = await this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });

    // 2. Format System Roles
    const systemRoles = Object.entries(ROLE_PERMISSIONS).map(
      ([name, permissions], index) => ({
        id: `SYS_${name}`, // Virtual ID
        name: name
          .replace("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()), // "HIRING_MANAGER" -> "Hiring Manager"
        description: "System Default Role",
        permissions: permissions,
        isSystem: true,
        userCount: 0, // To be populated if needed
      }),
    );

    return [...systemRoles, ...customRoles];
  }

  async findOne(id: string) {
    // If it starts with SYS_, return the static definition
    if (id.startsWith("SYS_")) {
      const roleKey = id.replace("SYS_", "");
      const permissions = ROLE_PERMISSIONS[roleKey];
      if (!permissions) throw new NotFoundException("System role not found");

      return {
        id,
        name: roleKey,
        permissions,
        isSystem: true,
        description: "System Default Role",
      };
    }

    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantId: string) {
    if (id.startsWith("SYS_")) {
      throw new ForbiddenException("Cannot edit system roles");
    }

    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role || role.tenantId !== tenantId) {
      throw new NotFoundException("Role not found");
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: string, tenantId: string) {
    if (id.startsWith("SYS_")) {
      throw new ForbiddenException("Cannot delete system roles");
    }

    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role || role.tenantId !== tenantId) {
      throw new NotFoundException("Role not found");
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
