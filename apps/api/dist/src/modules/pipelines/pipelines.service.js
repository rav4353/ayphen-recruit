"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelinesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PipelinesService = class PipelinesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, tenantId) {
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
    async findAll(tenantId) {
        return this.prisma.pipeline.findMany({
            where: { tenantId },
            include: {
                stages: { orderBy: { order: 'asc' } },
                _count: { select: { jobs: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
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
            throw new common_1.NotFoundException('Pipeline not found');
        }
        return pipeline;
    }
    async createDefaultPipeline(tenantId) {
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
    async addStage(pipelineId, stage) {
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
    async reorderStages(pipelineId, stageIds) {
        const updates = stageIds.map((id, index) => this.prisma.pipelineStage.update({
            where: { id },
            data: { order: index },
        }));
        await this.prisma.$transaction(updates);
        return this.findById(pipelineId);
    }
    async update(id, data) {
        await this.findById(id);
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
    async updateStage(stageId, data) {
        return this.prisma.pipelineStage.update({
            where: { id: stageId },
            data,
        });
    }
    async removeStage(stageId) {
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
    async remove(id) {
        await this.findById(id);
        return this.prisma.pipeline.delete({ where: { id } });
    }
};
exports.PipelinesService = PipelinesService;
exports.PipelinesService = PipelinesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PipelinesService);
//# sourceMappingURL=pipelines.service.js.map