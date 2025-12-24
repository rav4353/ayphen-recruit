import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InterviewSchedulingService } from "./interview-scheduling.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("interview-scheduling")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("interview-scheduling")
export class InterviewSchedulingController {
  constructor(private readonly schedulingService: InterviewSchedulingService) {}

  @Post("links")
  @ApiOperation({ summary: "Create a self-scheduling link" })
  @RequirePermissions(Permission.JOB_EDIT)
  createLink(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      applicationId: string;
      interviewerIds: string[];
      duration: number;
      interviewType: string;
      expiresInDays?: number;
      instructions?: string;
    },
  ) {
    return this.schedulingService.createSchedulingLink(
      body,
      user.sub,
      user.tenantId,
    );
  }

  @Get("links")
  @ApiOperation({ summary: "Get all scheduling links" })
  @RequirePermissions(Permission.JOB_VIEW)
  getLinks(@CurrentUser() user: JwtPayload, @Query("status") status?: string) {
    return this.schedulingService.getSchedulingLinks(user.tenantId, status);
  }

  @Delete("links/:token")
  @ApiOperation({ summary: "Cancel a scheduling link" })
  @RequirePermissions(Permission.JOB_EDIT)
  cancelLink(@Param("token") token: string, @CurrentUser() user: JwtPayload) {
    return this.schedulingService.cancelLink(token, user.sub, user.tenantId);
  }

  @Post("suggest-slots")
  @ApiOperation({ summary: "Get AI-suggested optimal interview slots" })
  @RequirePermissions(Permission.JOB_VIEW)
  getSuggestedSlots(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      interviewerIds: string[];
      duration: number;
      interviewType: string;
      candidateTimezone?: string;
      preferredDates?: string[];
    },
  ) {
    const preferredDates = body.preferredDates?.map((d) => new Date(d));
    return this.schedulingService.getSuggestedSlots(
      user.tenantId,
      body.interviewerIds,
      body.duration,
      body.interviewType,
      body.candidateTimezone,
      preferredDates,
    );
  }

  @Get("recommendations/:jobId")
  @ApiOperation({ summary: "Get scheduling recommendations for a job" })
  @RequirePermissions(Permission.JOB_VIEW)
  getRecommendations(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string,
  ) {
    return this.schedulingService.getSchedulingRecommendations(
      user.tenantId,
      jobId,
    );
  }
}

// Public endpoints for candidates
@ApiTags("public-scheduling")
@Controller("schedule")
export class PublicSchedulingController {
  constructor(private readonly schedulingService: InterviewSchedulingService) {}

  @Get(":token")
  @ApiOperation({ summary: "Get scheduling link details (public)" })
  getLinkDetails(@Param("token") token: string) {
    return this.schedulingService.getSchedulingLink(token);
  }

  @Get(":token/slots")
  @ApiOperation({ summary: "Get available slots (public)" })
  getSlots(
    @Param("token") token: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.schedulingService.getAvailableSlots(
      token,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post(":token/book")
  @ApiOperation({ summary: "Book an interview slot (public)" })
  bookSlot(
    @Param("token") token: string,
    @Body() body: { start: string; interviewerId: string },
  ) {
    return this.schedulingService.bookSlot(token, {
      start: new Date(body.start),
      interviewerId: body.interviewerId,
    });
  }
}
