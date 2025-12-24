import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AutoRejectionService } from "./auto-rejection.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("auto-rejection")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("auto-rejection")
export class AutoRejectionController {
  constructor(private readonly rejectionService: AutoRejectionService) {}

  @Get("config")
  @ApiOperation({ summary: "Get auto-rejection configuration" })
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.rejectionService.getConfig(user.tenantId);
  }

  @Patch("config")
  @ApiOperation({ summary: "Update auto-rejection configuration" })
  updateConfig(
    @CurrentUser() user: JwtPayload,
    @Body()
    config: Partial<{
      enabled: boolean;
      defaultDelayHours: number;
      excludeStages: string[];
      sendOnWeekends: boolean;
      ccRecruiter: boolean;
    }>,
  ) {
    return this.rejectionService.updateConfig(user.tenantId, config);
  }

  @Post("templates")
  @ApiOperation({ summary: "Create a rejection template" })
  createTemplate(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      stage: string;
      name: string;
      subject: string;
      body: string;
      isDefault?: boolean;
      delayHours?: number;
    },
  ) {
    return this.rejectionService.createTemplate(user.tenantId, dto);
  }

  @Get("templates")
  @ApiOperation({ summary: "Get all rejection templates" })
  getTemplates(
    @CurrentUser() user: JwtPayload,
    @Query("stage") stage?: string,
  ) {
    return this.rejectionService.getTemplates(user.tenantId, stage);
  }

  @Get("templates/:id")
  @ApiOperation({ summary: "Get template by ID" })
  getTemplate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.rejectionService.getTemplate(user.tenantId, id);
  }

  @Patch("templates/:id")
  @ApiOperation({ summary: "Update a template" })
  updateTemplate(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    dto: Partial<{
      name: string;
      subject: string;
      body: string;
      isDefault: boolean;
      delayHours: number;
    }>,
  ) {
    return this.rejectionService.updateTemplate(user.tenantId, id, dto);
  }

  @Delete("templates/:id")
  @ApiOperation({ summary: "Delete a template" })
  deleteTemplate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.rejectionService.deleteTemplate(user.tenantId, id);
  }

  @Post("send/:applicationId")
  @ApiOperation({ summary: "Send rejection email for an application" })
  sendRejection(
    @Param("applicationId") applicationId: string,
    @Body()
    options?: {
      templateId?: string;
      customMessage?: string;
      immediate?: boolean;
    },
  ) {
    return this.rejectionService.sendRejection(applicationId, options);
  }

  @Post("send-bulk")
  @ApiOperation({ summary: "Send bulk rejection emails" })
  sendBulkRejections(
    @Body()
    body: {
      applicationIds: string[];
      templateId?: string;
      customMessage?: string;
    },
  ) {
    return this.rejectionService.sendBulkRejections(body.applicationIds, {
      templateId: body.templateId,
      customMessage: body.customMessage,
    });
  }

  @Post("templates/presets")
  @ApiOperation({ summary: "Create preset rejection templates" })
  createPresets(@CurrentUser() user: JwtPayload) {
    return this.rejectionService.createPresetTemplates(user.tenantId);
  }
}
