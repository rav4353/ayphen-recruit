import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OfferTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: { name: string; content: string }) {
    return this.prisma.offerTemplate.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.offerTemplate.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.offerTemplate.findFirst({
      where: { id, tenantId },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; content?: string },
  ) {
    const template = await this.prisma.offerTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) {
      throw new Error("Template not found or access denied");
    }
    return this.prisma.offerTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    // Verify ownership
    const template = await this.prisma.offerTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) {
      throw new Error("Template not found or access denied");
    }
    return this.prisma.offerTemplate.delete({
      where: { id },
    });
  }
}
