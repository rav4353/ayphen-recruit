import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { CalendarService } from "./calendar.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiResponse } from "../../common/dto/api-response.dto";
import {
  ConnectCalendarDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  FreeBusyQueryDto,
} from "./dto/calendar.dto";

@ApiTags("calendar")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get("settings")
  @ApiOperation({ summary: "Get calendar provider settings for tenant" })
  async getSettings(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const settings = await this.calendarService.getCalendarSettings(tenantId);
    return ApiResponse.success(settings, "Calendar settings retrieved");
  }

  @Post("settings/google")
  @ApiOperation({ summary: "Save Google Calendar OAuth credentials" })
  async saveGoogleConfig(
    @Body()
    dto: { clientId: string; clientSecret: string; redirectUri?: string },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    await this.calendarService.saveGoogleConfig(tenantId, dto);
    return ApiResponse.success(null, "Google Calendar credentials saved");
  }

  @Post("settings/outlook")
  @ApiOperation({ summary: "Save Outlook Calendar OAuth credentials" })
  async saveOutlookConfig(
    @Body()
    dto: {
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
      tenantId?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    await this.calendarService.saveOutlookConfig(tenantId, dto);
    return ApiResponse.success(null, "Outlook Calendar credentials saved");
  }

  @Get("auth-url")
  @ApiOperation({
    summary: "Get OAuth authorization URL for a calendar provider",
  })
  @ApiQuery({ name: "provider", enum: ["GOOGLE", "OUTLOOK"] })
  async getAuthUrl(
    @Query("provider") provider: "GOOGLE" | "OUTLOOK",
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.id;
    const tenantId = req.user.tenantId;
    const url = await this.calendarService.getAuthUrl(
      provider,
      userId,
      tenantId,
    );
    return ApiResponse.success({ url }, "Authorization URL generated");
  }

  @Post("connect")
  @ApiOperation({ summary: "Connect a calendar using OAuth code" })
  async connectCalendar(@Body() dto: ConnectCalendarDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const tenantId = req.user.tenantId;
    const result = await this.calendarService.connectCalendar(
      userId,
      tenantId,
      dto,
    );
    return ApiResponse.success(result, "Calendar connected successfully");
  }

  @Get("connections")
  @ApiOperation({ summary: "Get user's calendar connections" })
  async getConnections(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const connections = await this.calendarService.getConnections(userId);
    return ApiResponse.success(connections, "Calendar connections retrieved");
  }

  @Delete("connections/:id")
  @ApiOperation({ summary: "Disconnect a calendar" })
  async disconnectCalendar(@Param("id") connectionId: string, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.calendarService.disconnectCalendar(userId, connectionId);
    return ApiResponse.success(null, "Calendar disconnected successfully");
  }

  @Post("events")
  @ApiOperation({ summary: "Create a calendar event" })
  async createEvent(@Body() dto: CreateCalendarEventDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const result = await this.calendarService.createEvent(userId, dto);
    return ApiResponse.success(result, "Calendar event created");
  }

  @Put("events/:id")
  @ApiOperation({ summary: "Update a calendar event" })
  async updateEvent(
    @Param("id") eventId: string,
    @Body() dto: UpdateCalendarEventDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.id;
    const event = await this.calendarService.updateEvent(userId, eventId, dto);
    return ApiResponse.success(event, "Calendar event updated");
  }

  @Delete("events/:id")
  @ApiOperation({ summary: "Delete a calendar event" })
  async deleteEvent(@Param("id") eventId: string, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.calendarService.deleteEvent(userId, eventId);
    return ApiResponse.success(null, "Calendar event deleted");
  }

  @Post("free-busy")
  @ApiOperation({ summary: "Get free/busy availability for users" })
  async getFreeBusy(@Body() dto: FreeBusyQueryDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const tenantId = req.user.tenantId;
    const availability = await this.calendarService.getFreeBusy(
      userId,
      tenantId,
      dto,
    );
    return ApiResponse.success(availability, "Free/busy information retrieved");
  }

  @Post("common-availability")
  @ApiOperation({
    summary: "Find common available slots across multiple users",
  })
  async findCommonAvailability(@Body() dto: FreeBusyQueryDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const tenantId = req.user.tenantId;
    const slots = await this.calendarService.findCommonAvailability(
      userId,
      tenantId,
      dto,
    );
    return ApiResponse.success(slots, "Common availability slots found");
  }

  @Post("generate-ics")
  @ApiOperation({ summary: "Generate ICS file content for an event" })
  async generateIcs(@Body() dto: CreateCalendarEventDto) {
    const icsContent = this.calendarService.generateIcs({
      title: dto.title,
      description: dto.description,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      location: dto.location,
      attendees: dto.attendees,
    });
    return ApiResponse.success({ icsContent }, "ICS content generated");
  }
}
