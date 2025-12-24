import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiResponse } from "../../common/dto/api-response.dto";
import { JobBoardsService } from "./job-boards.service";
import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator";

export type JobBoardProvider =
  | "LINKEDIN"
  | "INDEED"
  | "ZIPRECRUITER"
  | "GLASSDOOR"
  | "MONSTER";

export class ConfigureJobBoardDto {
  @IsEnum(["LINKEDIN", "INDEED", "ZIPRECRUITER", "GLASSDOOR", "MONSTER"])
  provider: JobBoardProvider;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsBoolean()
  sandboxMode?: boolean;
}

export class PostJobDto {
  @IsString()
  jobId: string;

  @IsOptional()
  @IsString({ each: true })
  providers?: JobBoardProvider[];
}

@ApiTags("job-boards")
@Controller("job-boards")
export class JobBoardsController {
  constructor(private readonly jobBoardsService: JobBoardsService) {}

  @Get("settings")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get all job board configurations" })
  async getSettings(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const settings = await this.jobBoardsService.getSettings(tenantId);
    return ApiResponse.success(settings, "Job board settings retrieved");
  }

  @Get("settings/:provider")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get specific job board configuration" })
  async getProviderSettings(
    @Param("provider") provider: JobBoardProvider,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const settings = await this.jobBoardsService.getProviderSettings(
      tenantId,
      provider,
    );
    return ApiResponse.success(settings, "Job board settings retrieved");
  }

  @Post("configure")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Configure a job board provider" })
  async configure(@Body() dto: ConfigureJobBoardDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const result = await this.jobBoardsService.configure(tenantId, dto);
    return ApiResponse.success(result, "Job board configured successfully");
  }

  @Delete("settings/:provider")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Disconnect a job board provider" })
  async disconnect(
    @Param("provider") provider: JobBoardProvider,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    await this.jobBoardsService.disconnect(tenantId, provider);
    return ApiResponse.success(null, "Job board disconnected successfully");
  }

  @Post("post-job")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Post a job to connected boards" })
  async postJob(@Body() dto: PostJobDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const result = await this.jobBoardsService.postJob(
      tenantId,
      dto.jobId,
      dto.providers,
    );
    return ApiResponse.success(result, "Job posted to boards");
  }

  @Get("postings/:jobId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get job postings for a specific job" })
  async getJobPostings(@Param("jobId") jobId: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const postings = await this.jobBoardsService.getJobPostings(
      tenantId,
      jobId,
    );
    return ApiResponse.success(postings, "Job postings retrieved");
  }

  @Delete("postings/:postingId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Remove a job posting from a board" })
  async removePosting(@Param("postingId") postingId: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    await this.jobBoardsService.removePosting(tenantId, postingId);
    return ApiResponse.success(null, "Job posting removed");
  }

  @Get("available")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get list of available job boards" })
  async getAvailableBoards() {
    const boards = this.jobBoardsService.getAvailableBoards();
    return ApiResponse.success(boards, "Available job boards");
  }
}
