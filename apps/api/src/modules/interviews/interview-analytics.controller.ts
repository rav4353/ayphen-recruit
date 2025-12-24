import { Controller, Get, Query, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InterviewAnalyticsService } from "./interview-analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("interview-analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("interview-analytics")
export class InterviewAnalyticsController {
  constructor(private readonly analyticsService: InterviewAnalyticsService) {}

  @Get("feedback")
  @ApiOperation({ summary: "Get comprehensive feedback analytics" })
  getFeedbackAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
    @Query("interviewerId") interviewerId?: string,
    @Query("interviewType") interviewType?: string,
  ) {
    return this.analyticsService.getFeedbackAnalytics(user.tenantId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      jobId,
      interviewerId,
      interviewType,
    });
  }

  @Get("feedback/job/:jobId")
  @ApiOperation({ summary: "Get feedback analytics for a specific job" })
  getJobFeedbackAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string,
  ) {
    return this.analyticsService.getJobFeedbackAnalytics(user.tenantId, jobId);
  }

  @Get("feedback/interviewer/:interviewerId")
  @ApiOperation({ summary: "Get analytics for a specific interviewer" })
  getInterviewerAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param("interviewerId") interviewerId: string,
  ) {
    return this.analyticsService.getInterviewerAnalytics(
      user.tenantId,
      interviewerId,
    );
  }

  @Get("hiring-funnel")
  @ApiOperation({ summary: "Get hiring funnel analytics" })
  getHiringFunnel(
    @CurrentUser() user: JwtPayload,
    @Query("jobId") jobId?: string,
  ) {
    return this.analyticsService.getHiringFunnelAnalytics(user.tenantId, jobId);
  }

  @Get("feedback-quality")
  @ApiOperation({ summary: "Get feedback quality metrics" })
  getFeedbackQuality(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getFeedbackQualityMetrics(user.tenantId);
  }
}
