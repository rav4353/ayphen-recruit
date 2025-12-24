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
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";

import { JobBoardsService, JobBoardProvider } from "./job-boards.service";
import { LinkedInApplyService } from "./linkedin-apply.service";
import { IndeedFeedService } from "./indeed-feed.service";
import { ZipRecruiterService } from "./ziprecruiter.service";
import { HRISSyncService, HRISProvider } from "./hris-sync.service";
import { SlackTeamsService } from "./slack-teams.service";
import {
  WebhookManagementService,
  WebhookEvent,
} from "./webhook-management.service";

// ==================== JOB BOARDS ====================

@ApiTags("integrations-job-boards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("integrations/job-boards")
export class JobBoardsController {
  constructor(private readonly jobBoardsService: JobBoardsService) {}

  @Get()
  @ApiOperation({ summary: "Get all job board configurations" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.jobBoardsService.getSettings(user.tenantId);
  }

  @Get("available")
  @ApiOperation({ summary: "Get available job boards" })
  getAvailableBoards() {
    return this.jobBoardsService.getAvailableBoards();
  }

  @Post("configure")
  @ApiOperation({ summary: "Configure a job board provider" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  configure(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      provider: JobBoardProvider;
      apiKey: string;
      apiSecret?: string;
      companyId?: string;
    },
  ) {
    return this.jobBoardsService.configure(user.tenantId, body);
  }

  @Delete(":provider")
  @ApiOperation({ summary: "Disconnect a job board provider" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  disconnect(
    @CurrentUser() user: JwtPayload,
    @Param("provider") provider: JobBoardProvider,
  ) {
    return this.jobBoardsService.disconnect(user.tenantId, provider);
  }

  @Post("post/:jobId")
  @ApiOperation({ summary: "Post a job to job boards" })
  @RequirePermissions(Permission.JOB_MANAGE)
  postJob(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string,
    @Body() body: { providers?: JobBoardProvider[] },
  ) {
    return this.jobBoardsService.postJob(user.tenantId, jobId, body.providers);
  }
}

// ==================== LINKEDIN APPLY ====================

@ApiTags("integrations-linkedin")
@Controller("integrations/linkedin")
export class LinkedInApplyController {
  constructor(private readonly linkedInService: LinkedInApplyService) {}

  @Get("config")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get LinkedIn Apply configuration" })
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.linkedInService.getConfig(user.tenantId);
  }

  @Post("configure")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Configure LinkedIn Apply" })
  configure(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { clientId: string; clientSecret: string; redirectUri: string },
  ) {
    return this.linkedInService.configure(user.tenantId, body);
  }

  @Get("oauth-url/:jobId")
  @ApiOperation({ summary: "Get OAuth URL for Apply with LinkedIn button" })
  async getOAuthUrl(
    @Param("jobId") jobId: string,
    @Query("tenantId") tenantId: string,
  ) {
    const url = await this.linkedInService.getOAuthUrl(tenantId, jobId);
    return { url };
  }

  @Post("callback")
  @ApiOperation({ summary: "Handle LinkedIn OAuth callback" })
  async handleCallback(@Body() body: { code: string; state: string }) {
    const [tenantId, jobId] = body.state.split(":");
    return this.linkedInService.processApply(tenantId, jobId, body.code);
  }

  @Get("button-config/:jobId")
  @ApiOperation({ summary: "Get Apply with LinkedIn button configuration" })
  getButtonConfig(
    @Param("jobId") jobId: string,
    @Query("tenantId") tenantId: string,
  ) {
    return this.linkedInService.getApplyButtonConfig(jobId, tenantId);
  }
}

// ==================== INDEED FEED ====================

@ApiTags("integrations-indeed")
@Controller("integrations/indeed")
export class IndeedFeedController {
  constructor(private readonly indeedService: IndeedFeedService) {}

  @Get("config")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get Indeed Feed configuration" })
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.indeedService.getConfig(user.tenantId);
  }

  @Post("configure")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Configure Indeed Feed" })
  configure(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      publisherId: string;
      companyName: string;
      includeDescription?: boolean;
      includeSalary?: boolean;
    },
  ) {
    return this.indeedService.configure(user.tenantId, body);
  }

  @Get("feed/:tenantId")
  @ApiOperation({ summary: "Get Indeed XML feed (public endpoint)" })
  async getFeed(@Param("tenantId") tenantId: string, @Res() res: Response) {
    const xml = await this.indeedService.generateFeed(tenantId);
    res.set("Content-Type", "application/xml");
    res.send(xml);
  }

  @Get("validate")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Validate Indeed feed" })
  validateFeed(@CurrentUser() user: JwtPayload) {
    return this.indeedService.validateFeed(user.tenantId);
  }
}

// ==================== ZIPRECRUITER ====================

@ApiTags("integrations-ziprecruiter")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("integrations/ziprecruiter")
export class ZipRecruiterController {
  constructor(private readonly zipService: ZipRecruiterService) {}

  @Get("config")
  @ApiOperation({ summary: "Get ZipRecruiter configuration" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.zipService.getConfig(user.tenantId);
  }

  @Post("configure")
  @ApiOperation({ summary: "Configure ZipRecruiter" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  configure(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { apiKey: string; publisherId: string; sandboxMode?: boolean },
  ) {
    return this.zipService.configure(user.tenantId, {
      ...body,
      sandboxMode: body.sandboxMode ?? true,
    });
  }

  @Post("post/:jobId")
  @ApiOperation({ summary: "Post a job to ZipRecruiter" })
  @RequirePermissions(Permission.JOB_MANAGE)
  postJob(@CurrentUser() user: JwtPayload, @Param("jobId") jobId: string) {
    return this.zipService.postJob(user.tenantId, jobId);
  }

  @Delete("job/:externalId")
  @ApiOperation({ summary: "Remove a job from ZipRecruiter" })
  @RequirePermissions(Permission.JOB_MANAGE)
  removeJob(
    @CurrentUser() user: JwtPayload,
    @Param("externalId") externalId: string,
  ) {
    return this.zipService.removeJob(user.tenantId, externalId);
  }

  @Get("stats/:externalId")
  @ApiOperation({ summary: "Get job stats from ZipRecruiter" })
  @RequirePermissions(Permission.JOB_VIEW)
  getStats(
    @CurrentUser() user: JwtPayload,
    @Param("externalId") externalId: string,
  ) {
    return this.zipService.getJobStats(user.tenantId, externalId);
  }

  @Post("sync-all")
  @ApiOperation({ summary: "Sync all open jobs to ZipRecruiter" })
  @RequirePermissions(Permission.JOB_MANAGE)
  syncAll(@CurrentUser() user: JwtPayload) {
    return this.zipService.syncAllJobs(user.tenantId);
  }
}

// ==================== HRIS SYNC ====================

@ApiTags("integrations-hris")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("integrations/hris")
export class HRISController {
  constructor(private readonly hrisService: HRISSyncService) {}

  @Get("config")
  @ApiOperation({ summary: "Get HRIS configuration" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.hrisService.getConfig(user.tenantId);
  }

  @Get("providers")
  @ApiOperation({ summary: "Get available HRIS providers" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getProviders() {
    return this.hrisService.getAvailableProviders();
  }

  @Post("configure")
  @ApiOperation({ summary: "Configure HRIS integration" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  configure(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      provider: HRISProvider;
      apiKey?: string;
      apiSecret?: string;
      subdomain?: string;
      syncEnabled?: boolean;
      syncDirection?: "IMPORT" | "EXPORT" | "BIDIRECTIONAL";
      syncFrequency?: "HOURLY" | "DAILY" | "WEEKLY";
    },
  ) {
    return this.hrisService.configure(user.tenantId, body);
  }

  @Delete()
  @ApiOperation({ summary: "Disconnect HRIS integration" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.hrisService.disconnect(user.tenantId);
  }

  @Post("sync")
  @ApiOperation({ summary: "Sync employees from HRIS" })
  @RequirePermissions(Permission.USER_MANAGE)
  syncEmployees(@CurrentUser() user: JwtPayload) {
    return this.hrisService.syncEmployees(user.tenantId);
  }

  @Post("export-hires")
  @ApiOperation({ summary: "Export new hires to HRIS" })
  @RequirePermissions(Permission.USER_MANAGE)
  exportHires(@CurrentUser() user: JwtPayload) {
    return this.hrisService.exportNewHires(user.tenantId);
  }

  @Get("test")
  @ApiOperation({ summary: "Test HRIS connection" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  testConnection(@CurrentUser() user: JwtPayload) {
    return this.hrisService.testConnection(user.tenantId);
  }

  @Get("field-mappings")
  @ApiOperation({ summary: "Get HRIS field mappings" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getFieldMappings(@CurrentUser() user: JwtPayload) {
    return this.hrisService.getFieldMappings(user.tenantId);
  }

  @Put("field-mappings")
  @ApiOperation({ summary: "Update HRIS field mappings" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  updateFieldMappings(
    @CurrentUser() user: JwtPayload,
    @Body() body: { mappings: Record<string, string> },
  ) {
    return this.hrisService.updateFieldMappings(user.tenantId, body.mappings);
  }

  @Get("sync-history")
  @ApiOperation({ summary: "Get HRIS sync history" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getSyncHistory(
    @CurrentUser() user: JwtPayload,
    @Query("limit") limit?: string,
  ) {
    return this.hrisService.getSyncHistory(
      user.tenantId,
      limit ? parseInt(limit) : 10,
    );
  }
}

// ==================== SLACK/TEAMS ====================

@ApiTags("integrations-messaging")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("integrations/messaging")
export class MessagingController {
  constructor(private readonly messagingService: SlackTeamsService) {}

  // Slack
  @Get("slack/config")
  @ApiOperation({ summary: "Get Slack configuration" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getSlackConfig(@CurrentUser() user: JwtPayload) {
    return this.messagingService.getSlackConfig(user.tenantId);
  }

  @Post("slack/configure")
  @ApiOperation({ summary: "Configure Slack integration" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  configureSlack(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      botToken: string;
      signingSecret: string;
      defaultChannelId?: string;
      notificationChannels?: Record<string, string>;
    },
  ) {
    return this.messagingService.configureSlack(user.tenantId, body as any);
  }

  @Get("slack/channels")
  @ApiOperation({ summary: "Get Slack channels" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getSlackChannels(@CurrentUser() user: JwtPayload) {
    return this.messagingService.getSlackChannels(user.tenantId);
  }

  @Get("slack/test")
  @ApiOperation({ summary: "Test Slack connection" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  testSlack(@CurrentUser() user: JwtPayload) {
    return this.messagingService.testSlackConnection(user.tenantId);
  }

  // Teams
  @Get("teams/config")
  @ApiOperation({ summary: "Get Teams configuration" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getTeamsConfig(@CurrentUser() user: JwtPayload) {
    return this.messagingService.getTeamsConfig(user.tenantId);
  }

  @Post("teams/configure")
  @ApiOperation({ summary: "Configure Teams integration" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  configureTeams(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { webhookUrl: string; notificationChannels?: Record<string, string> },
  ) {
    return this.messagingService.configureTeams(user.tenantId, body as any);
  }

  @Get("teams/test")
  @ApiOperation({ summary: "Test Teams connection" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  testTeams(@CurrentUser() user: JwtPayload) {
    return this.messagingService.testTeamsConnection(user.tenantId);
  }

  // Unified
  @Delete()
  @ApiOperation({ summary: "Disconnect all messaging integrations" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  disconnectAll(@CurrentUser() user: JwtPayload) {
    return this.messagingService.disconnectAll(user.tenantId);
  }

  @Post("test-notification")
  @ApiOperation({ summary: "Send a test notification" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  sendTestNotification(@CurrentUser() user: JwtPayload) {
    return this.messagingService.sendNotification(user.tenantId, {
      type: "CUSTOM",
      title: "🧪 Test Notification",
      message: "This is a test notification from the ATS system.",
      color: "#6366F1",
    });
  }
}

// ==================== WEBHOOKS ====================

@ApiTags("integrations-webhooks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("integrations/webhooks")
export class WebhooksController {
  constructor(private readonly webhookService: WebhookManagementService) {}

  @Get()
  @ApiOperation({ summary: "Get all webhooks" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getWebhooks(@CurrentUser() user: JwtPayload) {
    return this.webhookService.getWebhooks(user.tenantId);
  }

  @Get("events")
  @ApiOperation({ summary: "Get available webhook events" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getEvents() {
    return this.webhookService.getAvailableEvents();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific webhook" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getWebhook(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.webhookService.getWebhook(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: "Create a webhook" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  createWebhook(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      url: string;
      events: WebhookEvent[];
      headers?: Record<string, string>;
    },
  ) {
    return this.webhookService.createWebhook(user.tenantId, body);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a webhook" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  updateWebhook(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      url?: string;
      events?: WebhookEvent[];
      isActive?: boolean;
    },
  ) {
    return this.webhookService.updateWebhook(user.tenantId, id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a webhook" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  deleteWebhook(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.webhookService.deleteWebhook(user.tenantId, id);
  }

  @Post(":id/regenerate-secret")
  @ApiOperation({ summary: "Regenerate webhook secret" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  regenerateSecret(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.webhookService.regenerateSecret(user.tenantId, id);
  }

  @Post(":id/test")
  @ApiOperation({ summary: "Test a webhook" })
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  testWebhook(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.webhookService.testWebhook(user.tenantId, id);
  }

  @Get(":id/deliveries")
  @ApiOperation({ summary: "Get webhook delivery history" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getDeliveries(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Query("limit") limit?: string,
  ) {
    return this.webhookService.getDeliveryHistory(
      user.tenantId,
      id,
      limit ? parseInt(limit) : 50,
    );
  }
}
