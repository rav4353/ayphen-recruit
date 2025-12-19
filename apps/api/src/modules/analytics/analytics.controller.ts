import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureFlagGuard, RequireFeature } from '../../common/guards/feature-flag.guard';
import { SubscriptionGuard, RequirePlanTier } from '../../common/guards/subscription.guard';

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
    @UseGuards(FeatureFlagGuard)
    @RequireFeature('advanced_analytics')
    async getTimeToHire(@Request() req: any) {
        return this.analyticsService.getTimeToHire(req.user.tenantId);
    }

    @Get('recent-activity')
    async getRecentActivity(@Request() req: any) {
        return this.analyticsService.getRecentActivity(req.user.tenantId);
    }

    @Get('hiring-funnel')
    @UseGuards(FeatureFlagGuard)
    @RequireFeature('advanced_analytics')
    async getHiringFunnel(@Request() req: any) {
        const jobId = req.query.jobId;
        return this.analyticsService.getHiringFunnel(req.user.tenantId, jobId);
    }

    @Get('source-effectiveness')
    @UseGuards(FeatureFlagGuard, SubscriptionGuard)
    @RequireFeature('advanced_analytics')
    @RequirePlanTier('PROFESSIONAL', 'ENTERPRISE')
    async getSourceEffectiveness(@Request() req: any) {
        return this.analyticsService.getSourceEffectiveness(req.user.tenantId);
    }

    @Get('user-activity')
    @UseGuards(FeatureFlagGuard, SubscriptionGuard)
    @RequireFeature('advanced_analytics')
    @RequirePlanTier('PROFESSIONAL', 'ENTERPRISE')
    async getUserActivityStats(@Request() req: any) {
        return this.analyticsService.getUserActivityStats(req.user.tenantId);
    }
}
