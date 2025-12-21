import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreatePipelineDto, tenantId: string) {
    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault || false,
        tenantId,
        stages: {
          create: dto.stages.map((stage, index) => ({
            name: stage.name,
            description: stage.description,
            order: index,
            color: stage.color,
            slaDays: stage.slaDays,
            isTerminal: stage.isTerminal || false,
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async findAll(tenantId: string) {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId },
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { jobs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pipelines.length === 0) {
      const defaultPipeline = await this.createDefaultPipeline(tenantId);
      return [defaultPipeline];
    }

    return pipelines;
  }

  async findById(id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            automations: true,
          },
        },
      },
    });
    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }
    return pipeline;
  }

  async createDefaultPipeline(tenantId: string) {
    const defaultStages = [
      { name: 'Applied', color: '#6B7280', slaDays: 2 },
      { name: 'Screening', color: '#3B82F6', slaDays: 3 },
      { name: 'Phone Screen', color: '#8B5CF6', slaDays: 5 },
      { name: 'Interview', color: '#F59E0B', slaDays: 7 },
      { name: 'Offer', color: '#10B981', slaDays: 5 },
      { name: 'Hired', color: '#059669', isTerminal: true },
      { name: 'Rejected', color: '#EF4444', isTerminal: true },
    ];

    return this.prisma.pipeline.create({
      data: {
        name: 'Default Pipeline',
        description: 'Standard hiring pipeline',
        isDefault: true,
        tenantId,
        stages: {
          create: defaultStages.map((stage, index) => ({
            name: stage.name,
            order: index,
            color: stage.color,
            slaDays: stage.slaDays,
            isTerminal: stage.isTerminal || false,
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async addStage(pipelineId: string, stage: { name: string; color?: string; slaDays?: number }) {
    const pipeline = await this.findById(pipelineId);
    const maxOrder = Math.max(...pipeline.stages.map((s) => s.order), -1);

    return this.prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: stage.name,
        order: maxOrder + 1,
        color: stage.color,
        slaDays: stage.slaDays,
      },
    });
  }

  async reorderStages(pipelineId: string, stageIds: string[]) {
    // 1. Verify all stages belong to this pipeline
    const stages = await this.prisma.pipelineStage.findMany({
      where: {
        AND: [
          { pipelineId },
          { id: { in: stageIds } }
        ]
      },
      select: { id: true },
    });

    if (stages.length !== stageIds.length) {
      throw new BadRequestException('Invalid stage IDs provided. Some stages do not belong to this pipeline or do not exist.');
    }

    // 2. Perform updates in transaction
    const updates = stageIds.map((id, index) =>
      this.prisma.pipelineStage.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findById(pipelineId);
  }

  async update(id: string, data: { name?: string; description?: string; isDefault?: boolean }) {
    await this.findById(id);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      const pipeline = await this.prisma.pipeline.findUnique({ where: { id } });
      if (pipeline) {
        await this.prisma.pipeline.updateMany({
          where: { tenantId: pipeline.tenantId, id: { not: id } },
          data: { isDefault: false },
        });
      }
    }

    return this.prisma.pipeline.update({
      where: { id },
      data,
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async updateStage(stageId: string, data: { name?: string; color?: string; slaDays?: number; isTerminal?: boolean }) {
    return this.prisma.pipelineStage.update({
      where: { id: stageId },
      data,
    });
  }

  async removeStage(stageId: string) {
    // Check if stage has applications
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: stageId },
      include: { _count: { select: { applications: true } } },
    });

    if (stage && stage._count.applications > 0) {
      throw new Error('Cannot delete stage with active applications');
    }

    return this.prisma.pipelineStage.delete({
      where: { id: stageId },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.pipeline.delete({ where: { id } });
  }
}
