import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VideoMeetingService } from "./video-meeting.service";
import {
  CreateMeetingDto,
  SaveZoomConfigDto,
  SaveGoogleMeetConfigDto,
  SaveTeamsConfigDto,
  DeleteMeetingDto,
} from "./dto/video-meeting.dto";

@ApiTags("Video Meetings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("video-meetings")
export class VideoMeetingController {
  constructor(private readonly videoMeetingService: VideoMeetingService) {}

  @Get("providers")
  @ApiOperation({ summary: "Get configured video meeting providers" })
  @ApiResponse({
    status: 200,
    description: "List of providers with configuration status",
  })
  async getProviders(@Req() req: { user: { tenantId: string } }) {
    return this.videoMeetingService.getConfiguredProviders(req.user.tenantId);
  }

  @Post("create")
  @ApiOperation({ summary: "Create a video meeting" })
  @ApiResponse({ status: 201, description: "Meeting created successfully" })
  async createMeeting(
    @Req() req: { user: { tenantId: string } },
    @Body() dto: CreateMeetingDto,
  ) {
    return this.videoMeetingService.createMeeting(req.user.tenantId, {
      provider: dto.provider,
      topic: dto.topic,
      startTime: new Date(dto.startTime),
      durationMinutes: dto.durationMinutes,
      attendees: dto.attendees,
      description: dto.description,
    });
  }

  @Delete("delete")
  @ApiOperation({ summary: "Delete a video meeting" })
  @ApiResponse({ status: 200, description: "Meeting deleted successfully" })
  async deleteMeeting(
    @Req() req: { user: { tenantId: string } },
    @Body() dto: DeleteMeetingDto,
  ) {
    await this.videoMeetingService.deleteMeeting(
      req.user.tenantId,
      dto.provider,
      dto.meetingId,
    );
    return { success: true };
  }

  @Post("config/zoom")
  @ApiOperation({ summary: "Save Zoom configuration" })
  @ApiResponse({ status: 200, description: "Configuration saved" })
  async saveZoomConfig(
    @Req() req: { user: { tenantId: string } },
    @Body() dto: SaveZoomConfigDto,
  ) {
    await this.videoMeetingService.saveZoomConfig(req.user.tenantId, dto);
    return { success: true, message: "Zoom configuration saved" };
  }

  @Post("config/google-meet")
  @ApiOperation({ summary: "Save Google Meet configuration" })
  @ApiResponse({ status: 200, description: "Configuration saved" })
  async saveGoogleMeetConfig(
    @Req() req: { user: { tenantId: string } },
    @Body() dto: SaveGoogleMeetConfigDto,
  ) {
    await this.videoMeetingService.saveGoogleMeetConfig(req.user.tenantId, dto);
    return { success: true, message: "Google Meet configuration saved" };
  }

  @Post("config/teams")
  @ApiOperation({ summary: "Save Microsoft Teams configuration" })
  @ApiResponse({ status: 200, description: "Configuration saved" })
  async saveTeamsConfig(
    @Req() req: { user: { tenantId: string } },
    @Body() dto: SaveTeamsConfigDto,
  ) {
    await this.videoMeetingService.saveTeamsConfig(req.user.tenantId, dto);
    return { success: true, message: "Microsoft Teams configuration saved" };
  }
}
