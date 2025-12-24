import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InterviewsService } from "./interviews.service";
import { InterviewReminderService } from "./interview-reminder.service";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { UpdateInterviewDto } from "./dto/update-interview.dto";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { UpdateFeedbackDto } from "./dto/update-feedback.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { ApiResponse } from "../../common/dto/api-response.dto";

@ApiTags("interviews")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("interviews")
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly interviewReminderService: InterviewReminderService,
  ) { }

  @Post()
  @ApiOperation({ summary: "Schedule an interview" })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createInterviewDto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(
      createInterviewDto,
      user.tenantId,
      user.sub,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all interviews" })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("applicationId") applicationId?: string,
    @Query("interviewerId") interviewerId?: string,
    @Query("candidateId") candidateId?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.interviewsService.findAll(user.tenantId, {
      applicationId,
      interviewerId,
      candidateId,
      status,
      startDate,
      endDate,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get interview details" })
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.interviewsService.findOne(id, user.tenantId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update interview details" })
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() updateInterviewDto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(id, updateInterviewDto, user.tenantId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancel/Delete interview" })
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.interviewsService.remove(id, user.tenantId);
  }

  @Post(":id/send-sms-reminder")
  @ApiOperation({ summary: "Send SMS reminder for an interview" })
  async sendSmsReminder(@Param("id") id: string) {
    const result =
      await this.interviewReminderService.sendImmediateSmsReminder(id);
    return ApiResponse.success(result, result.message);
  }

  // Feedback endpoints
  @Post("feedback")
  @ApiOperation({ summary: "Submit interview feedback" })
  createFeedback(
    @CurrentUser() user: JwtPayload,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    return this.interviewsService.createFeedback(
      createFeedbackDto,
      user.sub,
      user.tenantId,
    );
  }

  @Patch("feedback/:id")
  @ApiOperation({ summary: "Update interview feedback" })
  updateFeedback(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.interviewsService.updateFeedback(
      id,
      updateFeedbackDto,
      user.sub,
      user.tenantId,
    );
  }

  @Get(":id/feedback")
  @ApiOperation({ summary: "Get feedback for an interview" })
  getFeedback(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.interviewsService.getFeedbackByInterview(id, user.tenantId);
  }

  @Get("availability/:interviewerId")
  @ApiOperation({ summary: "Get available time slots for an interviewer" })
  getAvailableSlots(
    @CurrentUser() user: JwtPayload,
    @Param("interviewerId") interviewerId: string,
    @Query("date") date: string,
    @Query("duration") duration?: string,
  ) {
    return this.interviewsService.getAvailableSlots(
      interviewerId,
      user.tenantId,
      date,
      duration ? parseInt(duration, 10) : 60,
    );
  }

  @Post("self-schedule/create")
  @ApiOperation({ summary: "Create a self-scheduling link for candidate" })
  createSchedulingLink(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      applicationId: string;
      interviewerIds: string[];
      type: string;
      duration: number;
      dateRangeStart: string;
      dateRangeEnd: string;
      meetingLink?: string;
      location?: string;
      notes?: string;
    },
  ) {
    return this.interviewsService.createSchedulingLink(
      body.applicationId,
      body.interviewerIds,
      user.tenantId,
      {
        type: body.type,
        duration: body.duration,
        dateRangeStart: new Date(body.dateRangeStart),
        dateRangeEnd: new Date(body.dateRangeEnd),
        meetingLink: body.meetingLink,
        location: body.location,
        notes: body.notes,
      },
    );
  }
}

@ApiTags("interviews-public")
@Controller("interviews/public")
export class InterviewsPublicController {
  constructor(private readonly interviewsService: InterviewsService) { }

  @Post("confirm/:token")
  @ApiOperation({ summary: "Confirm interview invitation" })
  async confirm(@Param("token") token: string) {
    return this.interviewsService.confirmInterview(token);
  }

  // Also support GET for direct links from email if needed
  @Get("confirm/:token")
  @ApiOperation({ summary: "Confirm interview invitation" })
  async confirmGet(@Param("token") token: string) {
    return this.interviewsService.confirmInterview(token);
  }
}

@Controller("interviews/self-schedule")
export class InterviewSelfScheduleController {
  constructor(private readonly interviewsService: InterviewsService) { }

  @Get(":token")
  @ApiOperation({ summary: "Get available slots for self-scheduling (public)" })
  getSlots(@Param("token") token: string) {
    return this.interviewsService.getSelfScheduleSlots(token);
  }

  @Post(":token/book")
  @ApiOperation({ summary: "Book a slot through self-scheduling (public)" })
  bookSlot(
    @Param("token") token: string,
    @Body() body: { date: string; startTime: string },
  ) {
    return this.interviewsService.bookSelfScheduleSlot(token, body);
  }
}

@ApiTags("interview-panels")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs/:jobId/interview-panels")
export class InterviewPanelsController {
  constructor(private readonly interviewsService: InterviewsService) { }

  @Post()
  @ApiOperation({ summary: "Create an interview panel for a job" })
  createPanel(
    @Param("jobId") jobId: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      interviewerIds: string[];
      stageId?: string;
      interviewType?: string;
      isDefault?: boolean;
    },
  ) {
    return this.interviewsService.createInterviewPanel(
      jobId,
      user.tenantId,
      user.sub,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get interview panels for a job" })
  getPanels(@Param("jobId") jobId: string, @CurrentUser() user: JwtPayload) {
    return this.interviewsService.getInterviewPanels(jobId, user.tenantId);
  }

  @Patch(":panelId")
  @ApiOperation({ summary: "Update an interview panel" })
  updatePanel(
    @Param("panelId") panelId: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name?: string;
      interviewerIds?: string[];
      stageId?: string;
      interviewType?: string;
      isDefault?: boolean;
    },
  ) {
    return this.interviewsService.updateInterviewPanel(
      panelId,
      user.tenantId,
      user.sub,
      body,
    );
  }

  @Delete(":panelId")
  @ApiOperation({ summary: "Delete an interview panel" })
  deletePanel(
    @Param("panelId") panelId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interviewsService.deleteInterviewPanel(
      panelId,
      user.tenantId,
      user.sub,
    );
  }

  @Get("suggested-interviewers")
  @ApiOperation({ summary: "Get suggested interviewers for a job" })
  getSuggestedInterviewers(
    @Param("jobId") jobId: string,
    @CurrentUser() user: JwtPayload,
    @Query("date") date?: string,
  ) {
    return this.interviewsService.getSuggestedInterviewers(
      jobId,
      user.tenantId,
      date,
    );
  }
}

@ApiTags("interview-feedback")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("interviews/feedback")
export class InterviewFeedbackController {
  constructor(private readonly interviewsService: InterviewsService) { }

  @Get("application/:applicationId/summary")
  @ApiOperation({
    summary: "Get aggregated feedback summary for an application",
  })
  getFeedbackSummary(
    @Param("applicationId") applicationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interviewsService.getFeedbackSummary(
      applicationId,
      user.tenantId,
    );
  }

  @Get("job/:jobId/comparison")
  @ApiOperation({
    summary: "Get feedback comparison across candidates for a job",
  })
  getFeedbackComparison(
    @Param("jobId") jobId: string,
    @CurrentUser() user: JwtPayload,
    @Query("candidateIds") candidateIds?: string,
  ) {
    const ids = candidateIds ? candidateIds.split(",") : undefined;
    return this.interviewsService.getFeedbackComparison(
      jobId,
      user.tenantId,
      ids,
    );
  }

  @Get("pending")
  @ApiOperation({ summary: "Get pending feedback requests for current user" })
  getPendingFeedbackRequests(@CurrentUser() user: JwtPayload) {
    return this.interviewsService.getPendingFeedbackRequests(
      user.sub,
      user.tenantId,
    );
  }
}
