import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { UpdateStageSlaDto } from './dto/sla.dto';

@ApiTags('sla')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sla')
export class SlaController {
    constructor(private readonly slaService: SlaService) { }

    @Get('application/:id')
    @ApiOperation({ summary: 'Get SLA status for an application' })
    @ApiParam({ name: 'id', description: 'Application ID' })
    @ApiResponse({ status: 200, description: 'Returns SLA status' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async getApplicationSla(@Param('id') id: string) {
        const slaStatus = await this.slaService.calculateSlaStatus(id);
        return { data: slaStatus };
    }

    @Get('at-risk')
    @ApiOperation({ summary: 'Get all at-risk and overdue applications' })
    @ApiResponse({ status: 200, description: 'Returns at-risk and overdue applications' })
    async getAtRiskApplications(@CurrentUser() user: JwtPayload) {
        // In a real implementation, filter by tenant
        const result = await this.slaService.getAtRiskApplications();
        return { data: result };
    }

    @Get('job/:jobId/stats')
    @ApiOperation({ summary: 'Get SLA statistics for a job' })
    @ApiParam({ name: 'jobId', description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'Returns SLA statistics' })
    async getJobSlaStats(@Param('jobId') jobId: string) {
        const stats = await this.slaService.getJobSlaStats(jobId);
        return { data: stats };
    }

    @Get('stage/:stageId/average-time')
    @ApiOperation({ summary: 'Get average time in stage' })
    @ApiParam({ name: 'stageId', description: 'Stage ID' })
    @ApiResponse({ status: 200, description: 'Returns average time in days' })
    async getAverageTimeInStage(@Param('stageId') stageId: string) {
        const avgDays = await this.slaService.getAverageTimeInStage(stageId);
        return { data: { averageDays: avgDays } };
    }

    @Patch('stage/:stageId/sla')
    @ApiOperation({ summary: 'Update SLA days for a stage' })
    @ApiParam({ name: 'stageId', description: 'Stage ID' })
    @ApiResponse({ status: 200, description: 'SLA updated successfully' })
    @ApiResponse({ status: 404, description: 'Stage not found' })
    async updateStageSla(
        @Param('stageId') stageId: string,
        @Body() dto: UpdateStageSlaDto,
    ) {
        const stage = await this.slaService.updateStageSla(stageId, dto.slaDays);
        return { data: stage };
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get SLA dashboard with summary statistics' })
    @ApiResponse({ status: 200, description: 'Returns SLA dashboard data' })
    async getSlaDashboard(@CurrentUser() user: JwtPayload) {
        const dashboard = await this.slaService.getSlaDashboard(user.tenantId);
        return { data: dashboard };
    }

    @Get('trends')
    @ApiOperation({ summary: 'Get SLA trends over time' })
    @ApiResponse({ status: 200, description: 'Returns SLA trends' })
    async getSlaTrends(@CurrentUser() user: JwtPayload) {
        const trends = await this.slaService.getSlaTrends(user.tenantId);
        return { data: trends };
    }
}
