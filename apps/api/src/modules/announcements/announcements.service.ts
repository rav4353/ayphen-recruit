import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async getActiveAnnouncements(userId: string, tenantId: string) {
    const now = new Date();

    // 1. Fetch active announcements targeting this user/tenant
    const announcements = await this.prisma.announcement.findMany({
      where: {
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        // Audience logic
        AND: [
          {
            OR: [
              { audience: "all" },
              {
                audience: "specific_tenants",
                targetTenantIds: { has: tenantId },
              },
            ],
          },
        ],
      },
      orderBy: { priority: "desc" }, // High priority first
    });

    // 2. Filter out dismissed ones
    const readStatuses = await this.prisma.announcementReadStatus.findMany({
      where: {
        userId,
        announcementId: { in: announcements.map((a) => a.id) },
        isDismissed: true,
      },
    });

    const dismissedIds = new Set(readStatuses.map((r) => r.announcementId));

    return announcements.filter((a) => !dismissedIds.has(a.id));
  }

  async markAsRead(
    userId: string,
    announcementId: string,
    isDismissed: boolean = true,
  ) {
    return this.prisma.announcementReadStatus.upsert({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
      update: {
        isDismissed,
        readAt: new Date(),
      },
      create: {
        userId,
        announcementId,
        isDismissed,
        readAt: new Date(),
      },
    });
  }
}
