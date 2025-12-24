import { Controller, Get, UseGuards, Request, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  FeatureFlagGuard,
  RequireFeature,
} from "../../common/guards/feature-flag.guard";
import {
  SubscriptionGuard,
  RequirePlanTier,
} from "../../common/guards/subscription.guard";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get("summary")
  async getSummary(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
  ) {
    return this.analyticsService.getSummaryStats(req.user.tenantId, {
      startDate,
      endDate,
      jobId,
    });
  }

  @Get("pipeline")
  async getPipelineHealth(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
  ) {
    return this.analyticsService.getPipelineHealth(req.user.tenantId, {
      startDate,
      endDate,
      jobId,
    });
  }

  @Get("time-to-hire")
  @UseGuards(FeatureFlagGuard)
  @RequireFeature("advanced_analytics")
  async getTimeToHire(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
  ) {
    return this.analyticsService.getTimeToHire(req.user.tenantId, {
      startDate,
      endDate,
      jobId,
    });
  }

  @Get("recent-activity")
  async getRecentActivity(@Request() req: any) {
    return this.analyticsService.getRecentActivity(req.user.tenantId);
  }

  @Get("hiring-funnel")
  @UseGuards(FeatureFlagGuard)
  @RequireFeature("advanced_analytics")
  async getHiringFunnel(
    @Request() req: any,
    @Query("jobId") jobId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.analyticsService.getHiringFunnel(req.user.tenantId, jobId, {
      startDate,
      endDate,
    });
  }

  @Get("source-effectiveness")
  @UseGuards(FeatureFlagGuard, SubscriptionGuard)
  @RequireFeature("advanced_analytics")
  @RequirePlanTier("PROFESSIONAL", "ENTERPRISE")
  async getSourceEffectiveness(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
  ) {
    return this.analyticsService.getSourceEffectiveness(req.user.tenantId, {
      startDate,
      endDate,
      jobId,
    });
  }

  @Get("user-activity")
  @UseGuards(FeatureFlagGuard, SubscriptionGuard)
  @RequireFeature("advanced_analytics")
  @RequirePlanTier("PROFESSIONAL", "ENTERPRISE")
  async getUserActivityStats(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.analyticsService.getUserActivityStats(req.user.tenantId, {
      startDate,
      endDate,
    });
  }
}
