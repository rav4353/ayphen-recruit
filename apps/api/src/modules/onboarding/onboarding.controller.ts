import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OnboardingAssigneeRole } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly storageService: StorageService,
    ) { }

    @Post('initialize')
    @ApiOperation({ summary: 'Initialize onboarding workflow for an application' })
    create(@Body() createOnboardingDto: CreateOnboardingDto, @Request() req: any) {
        return this.onboardingService.create(createOnboardingDto, req.user.tenantId);
    }

    @Post('initialize-from-template')
    @ApiOperation({ summary: 'Initialize onboarding workflow from a specific template' })
    createFromTemplate(
        @Body() body: { applicationId: string; templateId: string },
        @Request() req: any,
    ) {
        return this.onboardingService.createFromTemplate(
            body.applicationId,
            body.templateId,
            req.user.tenantId,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all active onboarding workflows' })
    findAll(@Request() req: any) {
        return this.onboardingService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get onboarding workflow details' })
    findOne(@Param('id') id: string) {
        return this.onboardingService.findOne(id);
    }

    @Patch('tasks/:taskId')
    @ApiOperation({ summary: 'Update onboarding task status' })
    updateTask(@Param('taskId') taskId: string, @Body() updateTaskDto: UpdateTaskDto) {
        return this.onboardingService.updateTask(taskId, updateTaskDto);
    }

    @Patch('tasks/:taskId/upload')
    @ApiOperation({ summary: 'Upload document for a task (URL)' })
    uploadDocument(@Param('taskId') taskId: string, @Body() body: { fileUrl: string }) {
        return this.onboardingService.uploadDocument(taskId, body.fileUrl);
    }

    @Post('tasks/:taskId/upload-file')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload document file for a task' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadDocumentFile(
        @Param('taskId') taskId: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        const uploadResult = await this.storageService.uploadFile(file);
        return this.onboardingService.uploadDocument(taskId, uploadResult.url);
    }

    @Patch('tasks/:taskId/review')
    @ApiOperation({ summary: 'Review uploaded document' })
    reviewDocument(@Param('taskId') taskId: string, @Body() body: { status: 'APPROVED' | 'REJECTED' }) {
        return this.onboardingService.reviewDocument(taskId, body.status);
    }

    // ==================== TEMPLATE MANAGEMENT ====================

    @Get('templates/all')
    @ApiOperation({ summary: 'Get all onboarding templates' })
    getTemplates(@Request() req: any) {
        return this.onboardingService.getTemplates(req.user.tenantId);
    }

    @Post('templates')
    @ApiOperation({ summary: 'Create a new onboarding template' })
    createTemplate(
        @Body() body: {
            name: string;
            description?: string;
            tasks: Array<{
                title: string;
                description: string;
                assigneeRole: OnboardingAssigneeRole;
                isRequiredDoc?: boolean;
            }>;
        },
        @Request() req: any,
    ) {
        return this.onboardingService.createTemplate(req.user.tenantId, body);
    }

    @Patch('templates/:templateId')
    @ApiOperation({ summary: 'Update an onboarding template' })
    updateTemplate(
        @Param('templateId') templateId: string,
        @Body() body: {
            name?: string;
            description?: string;
            tasks?: Array<{
                title: string;
                description: string;
                assigneeRole: OnboardingAssigneeRole;
                isRequiredDoc?: boolean;
            }>;
        },
        @Request() req: any,
    ) {
        return this.onboardingService.updateTemplate(req.user.tenantId, templateId, body);
    }

    @Delete('templates/:templateId')
    @ApiOperation({ summary: 'Delete an onboarding template' })
    deleteTemplate(@Param('templateId') templateId: string, @Request() req: any) {
        return this.onboardingService.deleteTemplate(req.user.tenantId, templateId);
    }

    // ==================== WORKFLOW TASK MANAGEMENT ====================

    @Post(':workflowId/tasks')
    @ApiOperation({ summary: 'Add a custom task to a workflow' })
    addTask(
        @Param('workflowId') workflowId: string,
        @Body() body: {
            title: string;
            description: string;
            assigneeRole: OnboardingAssigneeRole;
            isRequiredDoc?: boolean;
        },
    ) {
        return this.onboardingService.addTask(workflowId, body);
    }

    @Delete('tasks/:taskId')
    @ApiOperation({ summary: 'Remove a task from a workflow' })
    removeTask(@Param('taskId') taskId: string) {
        return this.onboardingService.removeTask(taskId);
    }
}
