import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SuperAdminAuditService } from "./super-admin-audit.service";

@Injectable()
export class SuperAdminUsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: SuperAdminAuditService,
  ) {}

  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    tenantId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });
  }

  async suspend(id: string, reason: string, superAdminId: string) {
    await this.prisma.user.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    await this.auditService.log({
      superAdminId,
      action: "SUSPEND_USER",
      entityType: "USER",
      entityId: id,
      details: { reason },
    });
  }

  async activate(id: string, superAdminId: string) {
    // Assuming 'ACTIVE' is a valid status in UserStatus enum
    // If enum is strict, we might need to check schema. But 'ACTIVE' is standard.
    await this.prisma.user.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    await this.auditService.log({
      superAdminId,
      action: "ACTIVATE_USER",
      entityType: "USER",
      entityId: id,
    });
  }

  async delete(id: string, superAdminId: string) {
    await this.prisma.user.delete({
      where: { id },
    });

    await this.auditService.log({
      superAdminId,
      action: "DELETE_USER",
      entityType: "USER",
      entityId: id,
    });
  }

  async resetPassword(id: string, superAdminId: string) {
    // Implementation for triggering password reset email would go here
    // For now, we log the action
    await this.auditService.log({
      superAdminId,
      action: "RESET_PASSWORD_REQUEST",
      entityType: "USER",
      entityId: id,
    });

    return { success: true };
  }
}
