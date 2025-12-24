import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "../dto/announcement.dto";
import { SuperAdminGateway } from "../super-admin.gateway";

@Injectable()
export class SuperAdminAnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private gateway: SuperAdminGateway,
  ) {}

  async getAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateAnnouncementDto, authorId: string) {
    // Determine status based on scheduling
    let status = data.status || "draft";
    if (data.scheduledAt && new Date(data.scheduledAt) > new Date()) {
      status = "scheduled";
    }

    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.message,
        type: data.type,
        priority: data.priority,
        audience: data.audience || "all",
        targetTenantIds: data.targetTenantIds || [],
        dismissible: data.dismissible ?? true,
        showBanner: data.showBanner ?? false,
        scheduledAt: data.scheduledAt,
        expiresAt: data.expiresAt,
        status,
        authorId,
      },
    });
  }

  async update(id: string, data: UpdateAnnouncementDto) {
    const updateData: any = {
      ...data,
    };

    // Map message -> content if present
    if (data.message) {
      updateData.content = data.message;
      delete updateData.message;
    }

    return this.prisma.announcement.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  async publish(id: string) {
    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        status: "active",
        publishedAt: new Date().toISOString(),
        scheduledAt: null,
      },
    });

    this.gateway.broadcast("announcement_published", announcement);
    return announcement;
  }
}
