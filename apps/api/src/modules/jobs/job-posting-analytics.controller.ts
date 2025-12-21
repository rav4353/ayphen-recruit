import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobPostingAnalyticsService } from './job-posting-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('job-posting-analytics')
@ApiBearerAuth()
@Controller('job-posting-analytics')
export class JobPostingAnalyticsController {
    constructor(private readonly analyticsService: JobPostingAnalyticsService) {}

    @Post('track-view/:jobId')
    @ApiOperation({ summary: 'Track a job view event (public)' })
    trackView(
        @Param('jobId') jobId: string,
        @Body() data: {
            source?: string;
            referrer?: string;
            sessionId?: string;
            userAgent?: string;
        },
    ) {
        return this.analyticsService.trackJobView(jobId, data);
    }

    @Get('job/:jobId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get analytics for a specific job' })
    getJobAnalytics(
        @CurrentUser() user: JwtPayload,
        @Param('jobId') jobId: string,
    ) {
        return this.analyticsService.getJobAnalytics(user.tenantId, jobId);
    }

    @Get('overview')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get analytics overview for all jobs' })
    getAllJobsAnalytics(@CurrentUser() user: JwtPayload) {
        return this.analyticsService.getAllJobsAnalytics(user.tenantId);
    }

    @Get('job-boards')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get job board performance comparison' })
    getJobBoardPerformance(@CurrentUser() user: JwtPayload) {
        return this.analyticsService.getJobBoardPerformance(user.tenantId);
    }

    @Get('source-attribution')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get source attribution report' })
    getSourceAttribution(
        @CurrentUser() user: JwtPayload,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dateRange = startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate),
        } : undefined;
        return this.analyticsService.getSourceAttributionReport(user.tenantId, dateRange);
    }
}
