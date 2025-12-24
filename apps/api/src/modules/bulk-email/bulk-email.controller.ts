import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Permission } from "../../common/constants/permissions";
import { BulkEmailService, BulkEmailRecipientType } from "./bulk-email.service";

@ApiTags("bulk-email")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("bulk-email")
export class BulkEmailController {
  constructor(private readonly bulkEmailService: BulkEmailService) {}

  @Post("campaigns")
  @ApiOperation({ summary: "Create a bulk email campaign" })
  @RequirePermissions(Permission.EMAIL_SEND)
  createCampaign(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      subject: string;
      body: string;
      recipientType: BulkEmailRecipientType;
      recipientIds?: string[];
      talentPoolId?: string;
      filters?: Record<string, unknown>;
      scheduledAt?: string;
    },
  ) {
    return this.bulkEmailService.createCampaign(user.tenantId, user.sub, body);
  }

  @Get("campaigns")
  @ApiOperation({ summary: "List bulk email campaigns" })
  @RequirePermissions(Permission.EMAIL_SEND)
  getAll(@CurrentUser() user: JwtPayload) {
    return this.bulkEmailService.getAllCampaigns(user.tenantId);
  }

  @Get("campaigns/:id")
  @ApiOperation({ summary: "Get campaign by id" })
  @RequirePermissions(Permission.EMAIL_SEND)
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.bulkEmailService.getCampaign(id, user.tenantId);
  }

  @Post("campaigns/:id/send")
  @ApiOperation({ summary: "Send a bulk email campaign" })
  @RequirePermissions(Permission.EMAIL_SEND)
  send(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.bulkEmailService.sendCampaign(id, user.tenantId, user.sub);
  }

  @Post("campaigns/:id/cancel")
  @ApiOperation({ summary: "Cancel a bulk email campaign" })
  @RequirePermissions(Permission.EMAIL_SEND)
  cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.bulkEmailService.cancelCampaign(id, user.tenantId, user.sub);
  }

  @Get("campaigns/:id/stats")
  @ApiOperation({ summary: "Get campaign stats" })
  @RequirePermissions(Permission.EMAIL_SEND)
  stats(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.bulkEmailService.getCampaignStats(id, user.tenantId);
  }

  @Post("preview")
  @ApiOperation({ summary: "Preview bulk email with merge variables" })
  @RequirePermissions(Permission.EMAIL_SEND)
  preview(
    @CurrentUser() user: JwtPayload,
    @Body() body: { subject: string; body: string; sampleCandidateId?: string },
  ) {
    return this.bulkEmailService.preview(body, user.tenantId);
  }
}
