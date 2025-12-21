import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PipelineStage {
    id: string;
    name: string;
    order: number;
    color: string;
    isDefault: boolean;
    autoAdvance?: boolean;
    autoAdvanceAfterDays?: number;
    requiredActions?: string[];
    notifyOnEntry?: boolean;
}

export interface Pipeline {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    stages: PipelineStage[];
    isDefault: boolean;
    jobCount: number;
    createdAt: string;
    updatedAt: string;
}

const PIPELINE_KEY = 'hiring_pipeline';
const DEFAULT_PIPELINE_KEY = 'default_pipeline';

@Injectable()
export class PipelineStagesService {
    private readonly logger = new Logger(PipelineStagesService.name);

    constructor(private readonly prisma: PrismaService) {}

    private newId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // ==================== DEFAULT STAGES ====================

    getDefaultStages(): PipelineStage[] {
        return [
            { id: 'new', name: 'New', order: 1, color: '#6B7280', isDefault: true },
            { id: 'screening', name: 'Screening', order: 2, color: '#3B82F6', isDefault: true },
            { id: 'phone-interview', name: 'Phone Interview', order: 3, color: '#8B5CF6', isDefault: true },
            { id: 'technical', name: 'Technical Interview', order: 4, color: '#EC4899', isDefault: true },
            { id: 'onsite', name: 'Onsite Interview', order: 5, color: '#F59E0B', isDefault: true },
            { id: 'offer', name: 'Offer', order: 6, color: '#10B981', isDefault: true },
            { id: 'hired', name: 'Hired', order: 7, color: '#059669', isDefault: true },
            { id: 'rejected', name: 'Rejected', order: 8, color: '#EF4444', isDefault: true },
        ];
    }

    // ==================== PIPELINE MANAGEMENT ====================

    async createPipeline(
        tenantId: string,
        dto: {
            name: string;
            description?: string;
            stages?: Omit<PipelineStage, 'id'>[];
            isDefault?: boolean;
        },
    ): Promise<Pipeline> {
        const stages: PipelineStage[] = dto.stages?.map((stage, index) => ({
            ...stage,
            id: this.newId('stage'),
            order: stage.order || index + 1,
        })) || this.getDefaultStages();

        const pipeline: Pipeline = {
            id: this.newId('pipe'),
            tenantId,
            name: dto.name,
            description: dto.description,
            stages,
            isDefault: dto.isDefault || false,
            jobCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this.prisma.setting.create({
            data: {
                tenantId,
                key: `${PIPELINE_KEY}_${pipeline.id}`,
                value: pipeline as any,
                category: 'PIPELINE',
                isPublic: false,
            },
        });

        // Set as default if requested or if it's the first pipeline
        if (dto.isDefault) {
            await this.setDefaultPipeline(tenantId, pipeline.id);
        }

        return pipeline;
    }

    async getPipelines(tenantId: string): Promise<Pipeline[]> {
        const settings = await this.prisma.setting.findMany({
            where: {
                tenantId,
                key: { startsWith: `${PIPELINE_KEY}_` },
            },
        });

        const pipelines = settings.map(s => s.value as unknown as Pipeline);

        // Count jobs using each pipeline
        for (const pipeline of pipelines) {
            const jobCount = await this.prisma.job.count({
                where: {
                    tenantId,
                    // Would need a pipelineId field on jobs
                },
            });
            pipeline.jobCount = jobCount;
        }

        return pipelines.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async getPipeline(tenantId: string, pipelineId: string): Promise<Pipeline> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: `${PIPELINE_KEY}_${pipelineId}` } },
        });

        if (!setting) {
            throw new NotFoundException('Pipeline not found');
        }

        return setting.value as unknown as Pipeline;
    }

    async getDefaultPipeline(tenantId: string): Promise<Pipeline> {
        const defaultSetting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: DEFAULT_PIPELINE_KEY } },
        });

        if (defaultSetting) {
            const defaultId = (defaultSetting.value as any).pipelineId;
            try {
                return await this.getPipeline(tenantId, defaultId);
            } catch {
                // Default pipeline not found, create one
            }
        }

        // Create default pipeline if none exists
        const pipelines = await this.getPipelines(tenantId);
        if (pipelines.length > 0) {
            await this.setDefaultPipeline(tenantId, pipelines[0].id);
            return pipelines[0];
        }

        // No pipelines exist, create default
        return this.createPipeline(tenantId, {
            name: 'Default Pipeline',
            description: 'Standard hiring pipeline',
            isDefault: true,
        });
    }

    async setDefaultPipeline(tenantId: string, pipelineId: string): Promise<void> {
        await this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: DEFAULT_PIPELINE_KEY } },
            update: { value: { pipelineId } as any },
            create: {
                tenantId,
                key: DEFAULT_PIPELINE_KEY,
                value: { pipelineId } as any,
                category: 'PIPELINE',
                isPublic: false,
            },
        });

        // Update isDefault flag on pipelines
        const pipelines = await this.getPipelines(tenantId);
        for (const pipeline of pipelines) {
            if (pipeline.isDefault !== (pipeline.id === pipelineId)) {
                pipeline.isDefault = pipeline.id === pipelineId;
                await this.prisma.setting.update({
                    where: { tenantId_key: { tenantId, key: `${PIPELINE_KEY}_${pipeline.id}` } },
                    data: { value: pipeline as any },
                });
            }
        }
    }

    async updatePipeline(
        tenantId: string,
        pipelineId: string,
        dto: Partial<{
            name: string;
            description: string;
            stages: PipelineStage[];
        }>,
    ): Promise<Pipeline> {
        const pipeline = await this.getPipeline(tenantId, pipelineId);

        const updated: Pipeline = {
            ...pipeline,
            ...dto,
            updatedAt: new Date().toISOString(),
        };

        await this.prisma.setting.update({
            where: { tenantId_key: { tenantId, key: `${PIPELINE_KEY}_${pipelineId}` } },
            data: { value: updated as any },
        });

        return updated;
    }

    async deletePipeline(tenantId: string, pipelineId: string): Promise<void> {
        const pipeline = await this.getPipeline(tenantId, pipelineId);

        if (pipeline.isDefault) {
            throw new BadRequestException('Cannot delete the default pipeline');
        }

        await this.prisma.setting.delete({
            where: { tenantId_key: { tenantId, key: `${PIPELINE_KEY}_${pipelineId}` } },
        });
    }

    // ==================== STAGE MANAGEMENT ====================

    async addStage(
        tenantId: string,
        pipelineId: string,
        stage: Omit<PipelineStage, 'id'>,
    ): Promise<Pipeline> {
        const pipeline = await this.getPipeline(tenantId, pipelineId);

        const newStage: PipelineStage = {
            ...stage,
            id: this.newId('stage'),
            order: stage.order || pipeline.stages.length + 1,
        };

        pipeline.stages.push(newStage);
        pipeline.stages.sort((a, b) => a.order - b.order);

        return this.updatePipeline(tenantId, pipelineId, { stages: pipeline.stages });
    }

    async updateStage(
        tenantId: string,
        pipelineId: string,
        stageId: string,
        updates: Partial<Omit<PipelineStage, 'id'>>,
    ): Promise<Pipeline> {
        const pipeline = await this.getPipeline(tenantId, pipelineId);

        const stageIndex = pipeline.stages.findIndex(s => s.id === stageId);
        if (stageIndex === -1) {
            throw new NotFoundException('Stage not found');
        }

        pipeline.stages[stageIndex] = {
            ...pipeline.stages[stageIndex],
            ...updates,
        };

        pipeline.stages.sort((a, b) => a.order - b.order);

        return this.updatePipeline(tenantId, pipelineId, { stages: pipeline.stages });
    }

    async removeStage(
        tenantId: string,
        pipelineId: string,
        stageId: string,
    ): Promise<Pipeline> {
        const pipeline = await this.getPipeline(tenantId, pipelineId);

        const stageIndex = pipeline.stages.findIndex(s => s.id === stageId);
        if (stageIndex === -1) {
            throw new NotFoundException('Stage not found');
        }

        if (pipeline.stages[stageIndex].isDefault) {
            throw new BadRequestException('Cannot remove a default stage');
        }

        pipeline.stages.splice(stageIndex, 1);

        // Reorder remaining stages
        pipeline.stages.forEach((stage, index) => {
            stage.order = index + 1;
        });

        return this.updatePipeline(tenantId, pipelineId, { stages: pipeline.stages });
    }

    async reorderStages(
        tenantId: string,
        pipelineId: string,
        stageOrder: string[],
    ): Promise<Pipeline> {
        const pipeline = await this.getPipeline(tenantId, pipelineId);

        const reorderedStages = stageOrder.map((stageId, index) => {
            const stage = pipeline.stages.find(s => s.id === stageId);
            if (!stage) {
                throw new BadRequestException(`Stage ${stageId} not found`);
            }
            return { ...stage, order: index + 1 };
        });

        return this.updatePipeline(tenantId, pipelineId, { stages: reorderedStages });
    }

    // ==================== PRESET PIPELINES ====================

    async createPresetPipelines(tenantId: string): Promise<Pipeline[]> {
        const presets = [
            {
                name: 'Engineering Pipeline',
                description: 'For technical roles',
                stages: [
                    { name: 'Applied', order: 1, color: '#6B7280', isDefault: true },
                    { name: 'Resume Screen', order: 2, color: '#3B82F6', isDefault: false },
                    { name: 'Phone Screen', order: 3, color: '#8B5CF6', isDefault: false },
                    { name: 'Technical Assessment', order: 4, color: '#EC4899', isDefault: false },
                    { name: 'Technical Interview', order: 5, color: '#F59E0B', isDefault: false },
                    { name: 'System Design', order: 6, color: '#EAB308', isDefault: false },
                    { name: 'Team Fit', order: 7, color: '#84CC16', isDefault: false },
                    { name: 'Offer', order: 8, color: '#10B981', isDefault: true },
                    { name: 'Hired', order: 9, color: '#059669', isDefault: true },
                ],
            },
            {
                name: 'Sales Pipeline',
                description: 'For sales and business development roles',
                stages: [
                    { name: 'Applied', order: 1, color: '#6B7280', isDefault: true },
                    { name: 'Resume Review', order: 2, color: '#3B82F6', isDefault: false },
                    { name: 'Recruiter Call', order: 3, color: '#8B5CF6', isDefault: false },
                    { name: 'Sales Role Play', order: 4, color: '#EC4899', isDefault: false },
                    { name: 'Manager Interview', order: 5, color: '#F59E0B', isDefault: false },
                    { name: 'Executive Interview', order: 6, color: '#84CC16', isDefault: false },
                    { name: 'Offer', order: 7, color: '#10B981', isDefault: true },
                    { name: 'Hired', order: 8, color: '#059669', isDefault: true },
                ],
            },
            {
                name: 'Executive Pipeline',
                description: 'For leadership and executive positions',
                stages: [
                    { name: 'Sourced', order: 1, color: '#6B7280', isDefault: true },
                    { name: 'Initial Outreach', order: 2, color: '#3B82F6', isDefault: false },
                    { name: 'Exploratory Call', order: 3, color: '#8B5CF6', isDefault: false },
                    { name: 'Deep Dive', order: 4, color: '#EC4899', isDefault: false },
                    { name: 'Leadership Panel', order: 5, color: '#F59E0B', isDefault: false },
                    { name: 'Board Interview', order: 6, color: '#EAB308', isDefault: false },
                    { name: 'Reference Check', order: 7, color: '#84CC16', isDefault: false },
                    { name: 'Offer Negotiation', order: 8, color: '#10B981', isDefault: false },
                    { name: 'Hired', order: 9, color: '#059669', isDefault: true },
                ],
            },
        ];

        const created: Pipeline[] = [];
        for (const preset of presets) {
            try {
                const pipeline = await this.createPipeline(tenantId, preset as any);
                created.push(pipeline);
            } catch (error) {
                this.logger.warn(`Failed to create preset pipeline ${preset.name}:`, error);
            }
        }

        return created;
    }
}
