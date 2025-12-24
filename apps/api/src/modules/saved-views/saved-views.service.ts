import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSavedViewDto } from "./dto/create-saved-view.dto";
import { UpdateSavedViewDto } from "./dto/update-saved-view.dto";

@Injectable()
export class SavedViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSavedViewDto, tenantId: string, userId: string) {
    return this.prisma.savedView.create({
      data: {
        ...dto,
        tenantId,
        userId,
      },
    });
  }

  async findAll(tenantId: string, userId: string, entity: string) {
    return this.prisma.savedView.findMany({
      where: {
        tenantId,
        entity,
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const view = await this.prisma.savedView.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!view) {
      throw new NotFoundException("Saved view not found");
    }

    return view;
  }

  async update(id: string, dto: UpdateSavedViewDto, userId: string) {
    const view = await this.findOne(id);

    if (view.userId !== userId) {
      throw new ForbiddenException("You can only update your own saved views");
    }

    return this.prisma.savedView.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const view = await this.findOne(id);

    if (view.userId !== userId) {
      throw new ForbiddenException("You can only delete your own saved views");
    }

    return this.prisma.savedView.delete({
      where: { id },
    });
  }
}
