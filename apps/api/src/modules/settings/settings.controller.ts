import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Post,
  Patch,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { UpdateSettingDto } from "./dto/update-setting.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all settings for the tenant" })
  @ApiResponse({ status: 200, description: "Return all settings." })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getSettings(user.tenantId);
  }

  @Get("public/:tenantId")
  @ApiOperation({ summary: "Get public settings for a tenant" })
  @ApiResponse({ status: 200, description: "Return public settings." })
  findPublic(@Param("tenantId") tenantId: string) {
    return this.settingsService.getPublicSettings(tenantId);
  }

  @Get("status-colors")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get status colors for the tenant" })
  @ApiResponse({
    status: 200,
    description: "Return status colors configuration.",
  })
  async getStatusColors(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getStatusColors(user.tenantId);
  }

  @Get("configuration-status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get configuration status for required settings" })
  @ApiResponse({
    status: 200,
    description: "Return configuration status for all required settings.",
  })
  async getConfigurationStatus(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getConfigurationStatus(user.tenantId);
  }

  @Post("status-colors/reset")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reset status colors to default" })
  @ApiResponse({
    status: 200,
    description: "Status colors reset successfully.",
  })
  async resetStatusColors(@CurrentUser() user: JwtPayload) {
    const setting = await this.settingsService.resetStatusColors(user.tenantId);
    return setting.value;
  }

  @Get(":key")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a specific setting by key" })
  @ApiResponse({ status: 200, description: "Return the setting." })
  @ApiResponse({ status: 404, description: "Setting not found." })
  findOne(@Param("key") key: string, @CurrentUser() user: JwtPayload) {
    return this.settingsService.getSettingByKey(user.tenantId, key);
  }

  @Put(":key")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update or create a setting" })
  @ApiResponse({
    status: 200,
    description: "The setting has been successfully updated.",
  })
  update(
    @Param("key") key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateSetting(
      user.tenantId,
      key,
      updateSettingDto.value,
      updateSettingDto.category,
      updateSettingDto.isPublic,
    );
  }

  // Scorecard Template Endpoints
  @Get("scorecards/all") // Use specific path to avoid conflict with :key
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getScorecards(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getScorecards(user.tenantId);
  }

  @Post("scorecards")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createScorecard(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.settingsService.createScorecard(user.tenantId, body);
  }

  @Get("scorecards/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getScorecard(@Param("id") id: string) {
    return this.settingsService.getScorecard(id);
  }

  @Patch("scorecards/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateScorecard(@Param("id") id: string, @Body() body: any) {
    return this.settingsService.updateScorecard(id, body);
  }

  @Delete("scorecards/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteScorecard(@Param("id") id: string) {
    return this.settingsService.deleteScorecard(id);
  }
}
