import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PipelineStagesService, PipelineStage } from './pipeline-stages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('pipeline-stages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pipelines')
export class PipelineStagesController {
    constructor(private readonly pipelineService: PipelineStagesService) {}

    @Get('default-stages')
    @ApiOperation({ summary: 'Get default pipeline stages' })
    getDefaultStages() {
        return this.pipelineService.getDefaultStages();
    }

    @Post()
    @ApiOperation({ summary: 'Create a new pipeline' })
    create(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            name: string;
            description?: string;
            stages?: Omit<PipelineStage, 'id'>[];
            isDefault?: boolean;
        },
    ) {
        return this.pipelineService.createPipeline(user.tenantId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all pipelines' })
    getAll(@CurrentUser() user: JwtPayload) {
        return this.pipelineService.getPipelines(user.tenantId);
    }

    @Get('default')
    @ApiOperation({ summary: 'Get default pipeline' })
    getDefault(@CurrentUser() user: JwtPayload) {
        return this.pipelineService.getDefaultPipeline(user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get pipeline by ID' })
    getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.pipelineService.getPipeline(user.tenantId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a pipeline' })
    update(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: Partial<{
            name: string;
            description: string;
            stages: PipelineStage[];
        }>,
    ) {
        return this.pipelineService.updatePipeline(user.tenantId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a pipeline' })
    remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.pipelineService.deletePipeline(user.tenantId, id);
    }

    @Post(':id/set-default')
    @ApiOperation({ summary: 'Set pipeline as default' })
    setDefault(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.pipelineService.setDefaultPipeline(user.tenantId, id);
    }

    @Post(':id/stages')
    @ApiOperation({ summary: 'Add a stage to pipeline' })
    addStage(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() stage: Omit<PipelineStage, 'id'>,
    ) {
        return this.pipelineService.addStage(user.tenantId, id, stage);
    }

    @Patch(':id/stages/:stageId')
    @ApiOperation({ summary: 'Update a stage' })
    updateStage(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('stageId') stageId: string,
        @Body() updates: Partial<Omit<PipelineStage, 'id'>>,
    ) {
        return this.pipelineService.updateStage(user.tenantId, id, stageId, updates);
    }

    @Delete(':id/stages/:stageId')
    @ApiOperation({ summary: 'Remove a stage' })
    removeStage(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('stageId') stageId: string,
    ) {
        return this.pipelineService.removeStage(user.tenantId, id, stageId);
    }

    @Post(':id/reorder')
    @ApiOperation({ summary: 'Reorder stages' })
    reorderStages(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() body: { stageOrder: string[] },
    ) {
        return this.pipelineService.reorderStages(user.tenantId, id, body.stageOrder);
    }

    @Post('presets')
    @ApiOperation({ summary: 'Create preset pipelines' })
    createPresets(@CurrentUser() user: JwtPayload) {
        return this.pipelineService.createPresetPipelines(user.tenantId);
    }
}
