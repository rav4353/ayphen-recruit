import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface AuditLogEntry {
  id: string;
  action: string;
  description?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  applicationId?: string;
  candidateId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AuditLogFilters {
  action?: string;
  userId?: string;
  applicationId?: string;
  candidateId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogStats {
  totalActions: number;
  actionsByType: { action: string; count: number }[];
  actionsByUser: { userId: string; userName: string; count: number }[];
  actionsOverTime: { date: string; count: number }[];
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Get available action types
  getActionTypes(): string[] {
    return [
      "CREATE",
      "UPDATE",
      "DELETE",
      "VIEW",
      "LOGIN",
      "LOGOUT",
      "LOGIN_FAILED",
      "PASSWORD_CHANGE",
      "PASSWORD_RESET",
      "BULK_IMPORT",
      "EXPORT",
      "APPROVE",
      "REJECT",
      "SEND_EMAIL",
      "SCHEDULE_INTERVIEW",
      "SUBMIT_FEEDBACK",
      "MOVE_STAGE",
      "CREATE_OFFER",
      "ACCEPT_OFFER",
      "DECLINE_OFFER",
      "PERMISSION_CHANGE",
      "SETTINGS_CHANGE",
      "INTEGRATION_CONNECT",
      "INTEGRATION_DISCONNECT",
    ];
  }

  // Get available entity types
  getEntityTypes(): string[] {
    return [
      "User",
      "Job",
      "Candidate",
      "Application",
      "Interview",
      "Offer",
      "Pipeline",
      "Department",
      "Location",
      "EmailTemplate",
      "Setting",
      "Role",
      "Integration",
    ];
  }

  // Get audit logs with pagination and filters
  async getLogs(
    tenantId: string,
    filters: AuditLogFilters,
    page = 1,
    limit = 50,
  ): Promise<{
    data: AuditLogEntry[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = {};

    // Build filter conditions
    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.applicationId) {
      where.applicationId = filters.applicationId;
    }

    if (filters.candidateId) {
      where.candidateId = filters.candidateId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Search in metadata or action
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: "insensitive" } },
        { entityType: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    const data: AuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description || undefined,
      userId: log.user?.id,
      userEmail: log.user?.email,
      userName: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : undefined,
      applicationId: log.applicationId || undefined,
      candidateId: log.candidateId || undefined,
      metadata: (log.metadata as Record<string, any>) || undefined,
      createdAt: log.createdAt,
    }));

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get a single audit log entry
  async getLogById(
    tenantId: string,
    logId: string,
  ): Promise<AuditLogEntry | null> {
    const log = await this.prisma.activityLog.findFirst({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!log) return null;

    return {
      id: log.id,
      action: log.action,
      description: log.description || undefined,
      userId: log.user?.id,
      userEmail: log.user?.email,
      userName: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : undefined,
      applicationId: log.applicationId || undefined,
      candidateId: log.candidateId || undefined,
      metadata: (log.metadata as Record<string, any>) || undefined,
      createdAt: log.createdAt,
    };
  }

  // Get audit log statistics
  async getStats(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AuditLogStats> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get total count
    const totalActions = await this.prisma.activityLog.count({ where });

    // Get actions by type
    const actionsByTypeRaw = await this.prisma.activityLog.groupBy({
      by: ["action"],
      where,
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    });

    const actionsByType = actionsByTypeRaw.map((item) => ({
      action: item.action,
      count: item._count.action,
    }));

    // Get actions by user (top 10)
    const actionsByUserRaw = await this.prisma.activityLog.groupBy({
      by: ["userId"],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    });

    // Get user details
    const userIds = actionsByUserRaw
      .map((item) => item.userId)
      .filter(Boolean) as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(
      users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]),
    );

    const actionsByUser = actionsByUserRaw.map((item) => ({
      userId: item.userId || "",
      userName: userMap.get(item.userId || "") || "Unknown",
      count: item._count.userId,
    }));

    // Get actions over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const actionsOverTimeRaw = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const actionsOverTime = actionsOverTimeRaw.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      count: Number(item.count),
    }));

    return {
      totalActions,
      actionsByType,
      actionsByUser,
      actionsOverTime,
    };
  }

  // Export audit logs to CSV
  async exportToCSV(
    tenantId: string,
    filters: AuditLogFilters,
  ): Promise<string> {
    const { data } = await this.getLogs(tenantId, filters, 1, 10000);

    const headers = [
      "Timestamp",
      "Action",
      "Description",
      "User",
      "Email",
      "Application ID",
      "Candidate ID",
    ].join(",");

    const rows = data.map((log) =>
      [
        log.createdAt.toISOString(),
        log.action,
        log.description || "",
        log.userName || "",
        log.userEmail || "",
        log.applicationId || "",
        log.candidateId || "",
      ]
        .map((val) => `"${val}"`)
        .join(","),
    );

    return [headers, ...rows].join("\n");
  }

  // Log an action (utility method for other services)
  async logAction(params: {
    userId?: string;
    action: string;
    description?: string;
    metadata?: Record<string, any>;
    applicationId?: string;
    candidateId?: string;
  }): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          action: params.action,
          description: params.description,
          metadata: params.metadata || {},
          userId: params.userId,
          applicationId: params.applicationId,
          candidateId: params.candidateId,
        },
      });
    } catch (error) {
      this.logger.error("Failed to log action:", error);
    }
  }
}
