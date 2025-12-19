import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface AuditLogInput {
  superAdminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SuperAdminAuditService {
  constructor(private prisma: PrismaService) { }

  async log(input: AuditLogInput) {
    await this.prisma.superAdminAuditLog.create({
      data: {
        superAdminId: input.superAdminId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details as any,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async getAll(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    superAdminId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.action) {
      where.action = params.action;
    }

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.superAdminId) {
      where.superAdminId = params.superAdminId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: 'insensitive' } },
        { entityType: { contains: params.search, mode: 'insensitive' } },
        { entityId: { contains: params.search, mode: 'insensitive' } },
        { superAdmin: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.superAdminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          superAdmin: {
            select: { name: true, email: true },
          },
        },
      }),
      this.prisma.superAdminAuditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        userName: log.superAdmin.name,
        userEmail: log.superAdmin.email,
        createdAt: log.createdAt,
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
    const log = await this.prisma.superAdminAuditLog.findUnique({
      where: { id },
      include: {
        superAdmin: {
          select: { name: true, email: true },
        },
      },
    });

    if (!log) return null;

    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      userName: log.superAdmin.name,
      userEmail: log.superAdmin.email,
      createdAt: log.createdAt,
    };
  }
}
