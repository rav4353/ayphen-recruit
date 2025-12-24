import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SuperAdminAuditService } from "./super-admin-audit.service";
import { SuperAdminGateway } from "../super-admin.gateway";

@Injectable()
export class SuperAdminTenantsService {
  constructor(
    private prisma: PrismaService,
    private auditService: SuperAdminAuditService,
    private gateway: SuperAdminGateway,
  ) {}

  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              jobs: true,
            },
          },
          users: {
            where: { role: "ADMIN" },
            take: 1,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: (tenant as any).slug || tenant.id.slice(0, 8),
        status: (tenant as any).status || "ACTIVE",
        plan: "PROFESSIONAL", // Would come from subscription
        owner: tenant.users[0] || null,
        _count: tenant._count,
        createdAt: tenant.createdAt,
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
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            jobs: true,
            candidates: true,
          },
        },
        users: {
          where: { role: "ADMIN" },
          take: 1,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return {
      ...tenant,
      slug: (tenant as any).slug || tenant.id.slice(0, 8),
      status: (tenant as any).status || "ACTIVE",
      owner: tenant.users[0] || null,
    };
  }

  async create(
    data: {
      name: string;
      slug: string;
      ownerEmail: string;
      ownerFirstName: string;
      ownerLastName: string;
      plan?: string;
    },
    superAdminId: string,
  ) {
    // Create tenant with owner user
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: "ACTIVE",
        users: {
          create: {
            email: data.ownerEmail,
            firstName: data.ownerFirstName,
            lastName: data.ownerLastName,
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
      } as any,
      include: {
        users: true,
      },
    });

    // Log audit
    await this.auditService.log({
      superAdminId,
      action: "CREATE_TENANT",
      entityType: "TENANT",
      entityId: tenant.id,
      details: { name: data.name, ownerEmail: data.ownerEmail },
    });

    this.gateway.broadcast("tenantCreated", tenant);
    return tenant;
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    superAdminId: string,
  ) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name as string | undefined,
        settings: data.settings as any,
      },
    });

    await this.auditService.log({
      superAdminId,
      action: "UPDATE_TENANT",
      entityType: "TENANT",
      entityId: id,
      details: data,
    });

    return tenant;
  }

  async suspend(id: string, reason: string, superAdminId: string) {
    // Update tenant status using raw SQL since status field may not be in Prisma yet
    await this.prisma.$executeRaw`
      UPDATE tenants SET status = 'SUSPENDED' WHERE id = ${id}
    `;

    await this.auditService.log({
      superAdminId,
      action: "SUSPEND_TENANT",
      entityType: "TENANT",
      entityId: id,
      details: { reason },
    });

    this.gateway.broadcast("tenantSuspended", { id });
    return { success: true };
  }

  async activate(id: string, superAdminId: string) {
    await this.prisma.$executeRaw`
      UPDATE tenants SET status = 'ACTIVE' WHERE id = ${id}
    `;

    await this.auditService.log({
      superAdminId,
      action: "ACTIVATE_TENANT",
      entityType: "TENANT",
      entityId: id,
    });

    this.gateway.broadcast("tenantActivated", { id });
    return { success: true };
  }

  async delete(id: string, superAdminId: string) {
    // Get tenant info for audit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { name: true },
    });

    // Delete tenant (cascade will handle related data)
    await this.prisma.tenant.delete({ where: { id } });

    await this.auditService.log({
      superAdminId,
      action: "DELETE_TENANT",
      entityType: "TENANT",
      entityId: id,
      details: { name: tenant?.name },
    });

    this.gateway.broadcast("tenantDeleted", { id });
    return { success: true };
  }

  async getUsers(tenantId: string, params: { page?: number; search?: string }) {
    const page = params.page || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

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
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(tenantId: string) {
    const [usersCount, jobsCount, candidatesCount, applicationsCount] =
      await Promise.all([
        this.prisma.user.count({ where: { tenantId } }),
        this.prisma.job.count({ where: { tenantId } }),
        this.prisma.candidate.count({ where: { tenantId } }),
        this.prisma.application.count({
          where: { job: { tenantId } },
        }),
      ]);

    return {
      users: usersCount,
      jobs: jobsCount,
      candidates: candidatesCount,
      applications: applicationsCount,
    };
  }

  async impersonate(userId: string, superAdminId: string, authService: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate tokens for this user
    const tokens = await authService.generateTokensForUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    });

    await this.auditService.log({
      superAdminId,
      action: "IMPERSONATE_USER",
      entityType: "USER",
      entityId: userId,
      details: {
        targetUserEmail: user.email,
        targetTenantName: user.tenant?.name,
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
