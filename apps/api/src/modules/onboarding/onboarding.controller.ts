import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Post('initialize')
    @ApiOperation({ summary: 'Initialize onboarding workflow for an application' })
    create(@Body() createOnboardingDto: CreateOnboardingDto, @Request() req: any) {
        return this.onboardingService.create(createOnboardingDto, req.user.tenantId);
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
    @ApiOperation({ summary: 'Upload document for a task' })
    uploadDocument(@Param('taskId') taskId: string, @Body() body: { fileUrl: string }) {
        return this.onboardingService.uploadDocument(taskId, body.fileUrl);
    }

    @Patch('tasks/:taskId/review')
    @ApiOperation({ summary: 'Review uploaded document' })
    reviewDocument(@Param('taskId') taskId: string, @Body() body: { status: 'APPROVED' | 'REJECTED' }) {
        return this.onboardingService.reviewDocument(taskId, body.status);
    }
}
