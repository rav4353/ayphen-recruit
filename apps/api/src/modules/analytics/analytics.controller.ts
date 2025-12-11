import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('summary')
    async getSummary(@Request() req: any) {
        return this.analyticsService.getSummaryStats(req.user.tenantId);
    }

    @Get('pipeline')
    async getPipelineHealth(@Request() req: any) {
        return this.analyticsService.getPipelineHealth(req.user.tenantId);
    }

    @Get('time-to-hire')
    async getTimeToHire(@Request() req: any) {
        return this.analyticsService.getTimeToHire(req.user.tenantId);
    }

    @Get('recent-activity')
    async getRecentActivity(@Request() req: any) {
        return this.analyticsService.getRecentActivity(req.user.tenantId);
    }
}
