import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SuperAdminGateway } from "../super-admin.gateway";
import {
  SuperAdminNotificationType,
  SuperAdminNotificationPriority,
} from "@prisma/client";

export interface CreateNotificationInput {
  type: SuperAdminNotificationType;
  priority?: SuperAdminNotificationPriority;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  superAdminId?: string; // If not provided, sends to all super admins
}

@Injectable()
export class SuperAdminNotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: SuperAdminGateway,
  ) {}

  async create(input: CreateNotificationInput) {
    const { superAdminId, ...notificationData } = input;

    if (superAdminId) {
      // Create notification for specific super admin
      const notification = await this.prisma.superAdminNotification.create({
        data: {
          ...notificationData,
          priority:
            notificationData.priority || SuperAdminNotificationPriority.MEDIUM,
          metadata: notificationData.metadata as any,
          superAdminId,
        },
      });

      // Emit real-time notification
      this.gateway.broadcast("notification", {
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt,
      });

      return notification;
    } else {
      // Create notification for all super admins
      const superAdmins = await this.prisma.superAdmin.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      const notifications = await Promise.all(
        superAdmins.map((admin) =>
          this.prisma.superAdminNotification.create({
            data: {
              ...notificationData,
              priority:
                notificationData.priority ||
                SuperAdminNotificationPriority.MEDIUM,
              metadata: notificationData.metadata as any,
              superAdminId: admin.id,
            },
          }),
        ),
      );

      // Emit real-time notification to all
      if (notifications.length > 0) {
        this.gateway.broadcast("notification", {
          id: notifications[0].id,
          type: notifications[0].type,
          priority: notifications[0].priority,
          title: notifications[0].title,
          message: notifications[0].message,
          link: notifications[0].link,
          createdAt: notifications[0].createdAt,
        });
      }

      return notifications;
    }
  }

  async getAll(
    superAdminId: string,
    params: {
      page?: number;
      limit?: number;
      type?: SuperAdminNotificationType;
      priority?: SuperAdminNotificationPriority;
      unreadOnly?: boolean;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { superAdminId };

    if (params.type) {
      where.type = params.type;
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    if (params.unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.superAdminNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.superAdminNotification.count({ where }),
      this.prisma.superAdminNotification.count({
        where: { superAdminId, read: false },
      }),
    ]);

    return {
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        message: n.message,
        link: n.link,
        metadata: n.metadata,
        read: n.read,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(superAdminId: string): Promise<number> {
    return this.prisma.superAdminNotification.count({
      where: { superAdminId, read: false },
    });
  }

  async markAsRead(superAdminId: string, notificationIds: string[]) {
    await this.prisma.superAdminNotification.updateMany({
      where: {
        id: { in: notificationIds },
        superAdminId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    const unreadCount = await this.getUnreadCount(superAdminId);

    return { success: true, unreadCount };
  }

  async markAllAsRead(superAdminId: string) {
    await this.prisma.superAdminNotification.updateMany({
      where: { superAdminId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true, unreadCount: 0 };
  }

  async delete(superAdminId: string, notificationId: string) {
    await this.prisma.superAdminNotification.deleteMany({
      where: {
        id: notificationId,
        superAdminId,
      },
    });

    return { success: true };
  }

  async deleteAll(superAdminId: string, readOnly: boolean = false) {
    const where: any = { superAdminId };
    if (readOnly) {
      where.read = true;
    }

    await this.prisma.superAdminNotification.deleteMany({ where });

    return { success: true };
  }

  // Helper methods to create specific notification types
  async notifyNewTenant(tenantName: string, tenantId: string) {
    return this.create({
      type: SuperAdminNotificationType.TENANT,
      priority: SuperAdminNotificationPriority.MEDIUM,
      title: "New Tenant Registered",
      message: `A new tenant "${tenantName}" has registered on the platform.`,
      link: `/super-admin/tenants/${tenantId}`,
      metadata: { tenantId, tenantName },
    });
  }

  async notifySecurityAlert(
    alertType: string,
    message: string,
    alertId?: string,
  ) {
    return this.create({
      type: SuperAdminNotificationType.SECURITY,
      priority: SuperAdminNotificationPriority.HIGH,
      title: `Security Alert: ${alertType}`,
      message,
      link: alertId
        ? `/super-admin/security?alertId=${alertId}`
        : "/super-admin/security",
      metadata: { alertType, alertId },
    });
  }

  async notifyNewSupportTicket(
    ticketId: string,
    subject: string,
    tenantName: string,
  ) {
    return this.create({
      type: SuperAdminNotificationType.SUPPORT,
      priority: SuperAdminNotificationPriority.MEDIUM,
      title: "New Support Ticket",
      message: `New ticket from ${tenantName}: "${subject}"`,
      link: `/super-admin/support/${ticketId}`,
      metadata: { ticketId, subject, tenantName },
    });
  }

  async notifySubscriptionEvent(
    event: "cancelled" | "expired" | "payment_failed",
    tenantName: string,
    tenantId: string,
  ) {
    const titles = {
      cancelled: "Subscription Cancelled",
      expired: "Subscription Expired",
      payment_failed: "Payment Failed",
    };

    const messages = {
      cancelled: `Tenant "${tenantName}" has cancelled their subscription.`,
      expired: `Subscription for tenant "${tenantName}" has expired.`,
      payment_failed: `Payment failed for tenant "${tenantName}".`,
    };

    return this.create({
      type: SuperAdminNotificationType.SUBSCRIPTION,
      priority:
        event === "payment_failed"
          ? SuperAdminNotificationPriority.HIGH
          : SuperAdminNotificationPriority.MEDIUM,
      title: titles[event],
      message: messages[event],
      link: `/super-admin/tenants/${tenantId}`,
      metadata: { event, tenantId, tenantName },
    });
  }

  async notifySystemAlert(
    title: string,
    message: string,
    priority: SuperAdminNotificationPriority = SuperAdminNotificationPriority.HIGH,
  ) {
    return this.create({
      type: SuperAdminNotificationType.SYSTEM,
      priority,
      title,
      message,
      link: "/super-admin/monitoring",
    });
  }
}
