import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  EmailTemplatesService,
  EmailTemplate,
} from "./email-templates.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("email-templates")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("email-templates")
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  @Get("variables")
  @ApiOperation({ summary: "Get available template variables" })
  getVariables() {
    return this.templatesService.getAvailableVariables();
  }

  @Post()
  @ApiOperation({ summary: "Create a new email template" })
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      name: string;
      category: EmailTemplate["category"];
      subject: string;
      body: string;
      isDefault?: boolean;
    },
  ) {
    return this.templatesService.createTemplate(user.tenantId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all email templates" })
  getAll(
    @CurrentUser() user: JwtPayload,
    @Query("category") category?: EmailTemplate["category"],
  ) {
    return this.templatesService.getTemplates(user.tenantId, category);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get template by ID" })
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.templatesService.getTemplate(user.tenantId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a template" })
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    dto: Partial<{
      name: string;
      category: EmailTemplate["category"];
      subject: string;
      body: string;
      isDefault: boolean;
    }>,
  ) {
    return this.templatesService.updateTemplate(user.tenantId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a template" })
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.templatesService.deleteTemplate(user.tenantId, id);
  }

  @Post(":id/duplicate")
  @ApiOperation({ summary: "Duplicate a template" })
  duplicate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.templatesService.duplicateTemplate(user.tenantId, id, user.sub);
  }

  @Post(":id/preview")
  @ApiOperation({ summary: "Preview a template with sample data" })
  preview(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() sampleData?: Record<string, any>,
  ) {
    return this.templatesService.previewTemplate(user.tenantId, id, sampleData);
  }

  @Post(":id/render")
  @ApiOperation({ summary: "Render a template with actual data" })
  render(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    data: {
      candidate?: any;
      job?: any;
      company?: any;
      interview?: any;
      user?: any;
    },
  ) {
    return this.templatesService.renderTemplateWithData(
      user.tenantId,
      id,
      data,
    );
  }

  @Post("seed-defaults")
  @ApiOperation({ summary: "Create default email templates" })
  seedDefaults(@CurrentUser() user: JwtPayload) {
    return this.templatesService.seedDefaultTemplates(user.tenantId, user.sub);
  }
}
