import {
  Controller,
  Get,
  Post,
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiResponse } from "../../common/dto/api-response.dto";
import { BGVService } from "./bgv.service";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
} from "class-validator";
import {
  FeatureFlagGuard,
  RequireFeature,
} from "../../common/guards/feature-flag.guard";

class ConfigureBGVDto {
  @IsEnum(["CHECKR", "SPRINGVERIFY", "AUTHBRIDGE", "MANUAL"])
  provider: "CHECKR" | "SPRINGVERIFY" | "AUTHBRIDGE" | "MANUAL";

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  sandboxMode?: boolean;
}

class InitiateBGVDto {
  @IsString()
  candidateId: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  packageType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checkTypes?: string[];
}

@ApiTags("bgv")
@Controller("bgv")
@RequireFeature("background_checks")
export class BGVController {
  constructor(private readonly bgvService: BGVService) {}

  @Get("settings")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Get BGV provider settings" })
  async getSettings(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const settings = await this.bgvService.getSettings(tenantId);
    return ApiResponse.success(settings, "BGV settings retrieved");
  }

  @Post("configure")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Configure BGV provider" })
  async configure(@Body() dto: ConfigureBGVDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const result = await this.bgvService.configure(tenantId, dto);
    return ApiResponse.success(result, "BGV provider configured successfully");
  }

  @Post("initiate")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Initiate a background check" })
  async initiate(@Body() dto: InitiateBGVDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.sub || req.user.id;
    const result = await this.bgvService.initiate(tenantId, userId, dto);
    return ApiResponse.success(result, "Background check initiated");
  }

  @Get("checks")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "List all BGV checks" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "candidateId", required: false })
  async listChecks(
    @Req() req: any,
    @Query("status") status?: string,
    @Query("candidateId") candidateId?: string,
  ) {
    const tenantId = req.user.tenantId;
    const checks = await this.bgvService.listChecks(tenantId, {
      status: status as any,
      candidateId,
    });
    return ApiResponse.success(checks, "BGV checks retrieved");
  }

  @Get("checks/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Get a specific BGV check" })
  async getCheck(@Param("id") id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const check = await this.bgvService.getCheck(tenantId, id);
    return ApiResponse.success(check, "BGV check retrieved");
  }

  @Post("checks/:id/sync")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Sync BGV check status with provider" })
  async syncStatus(@Param("id") id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const check = await this.bgvService.syncStatus(tenantId, id);
    return ApiResponse.success(check, "BGV check synced");
  }

  @Post("checks/:id/cancel")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Cancel a BGV check" })
  async cancel(@Param("id") id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const result = await this.bgvService.cancel(tenantId, id);
    return ApiResponse.success(result, "BGV check cancelled");
  }

  @Get("packages")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Get available BGV packages" })
  async getPackages(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const packages = await this.bgvService.getPackages(tenantId);
    return ApiResponse.success(packages, "BGV packages retrieved");
  }

  @Post("test-connection")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Test BGV provider connection" })
  async testConnection(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const result = await this.bgvService.testConnection(tenantId);
    return ApiResponse.success(result, "Connection test completed");
  }

  @Get("screening-types")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Get available screening types" })
  async getScreeningTypes(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const types = await this.bgvService.getScreeningTypes(tenantId);
    return ApiResponse.success(types, "Screening types retrieved");
  }

  @Get("dashboard")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FeatureFlagGuard)
  @ApiOperation({ summary: "Get BGV dashboard stats" })
  async getDashboard(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const stats = await this.bgvService.getDashboard(tenantId);
    return ApiResponse.success(stats, "BGV dashboard stats retrieved");
  }

  @Post("webhook/:provider")
  @ApiOperation({ summary: "Handle BGV provider webhook" })
  async handleWebhook(
    @Param("provider") provider: string,
    @Body() payload: any,
  ) {
    const result = await this.bgvService.handleWebhook(provider, payload);
    return result;
  }
}
