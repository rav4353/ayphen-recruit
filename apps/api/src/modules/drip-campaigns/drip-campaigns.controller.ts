import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DripCampaignsService, DripStep } from "./drip-campaigns.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Drip Campaigns")
@Controller("drip-campaigns")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DripCampaignsController {
  constructor(private readonly dripCampaignsService: DripCampaignsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new drip campaign" })
  create(
    @Request() req: any,
    @Body()
    dto: {
      name: string;
      description?: string;
      steps: Omit<DripStep, "id">[];
      recipientType: "candidates" | "talent_pool" | "job_applicants";
      recipientIds?: string[];
      talentPoolId?: string;
      jobId?: string;
    },
  ) {
    return this.dripCampaignsService.createCampaign(
      req.user.tenantId,
      req.user.sub,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all drip campaigns" })
  findAll(@Request() req: any) {
    return this.dripCampaignsService.getCampaigns(req.user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a drip campaign by ID" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.dripCampaignsService.getCampaign(req.user.tenantId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a drip campaign" })
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body()
    dto: Partial<{
      name: string;
      description: string;
      steps: Omit<DripStep, "id">[];
    }>,
  ) {
    return this.dripCampaignsService.updateCampaign(req.user.tenantId, id, dto);
  }

  @Post(":id/activate")
  @ApiOperation({ summary: "Activate a drip campaign" })
  activate(@Request() req: any, @Param("id") id: string) {
    return this.dripCampaignsService.activateCampaign(req.user.tenantId, id);
  }

  @Post(":id/pause")
  @ApiOperation({ summary: "Pause a drip campaign" })
  pause(@Request() req: any, @Param("id") id: string) {
    return this.dripCampaignsService.pauseCampaign(req.user.tenantId, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a drip campaign" })
  remove(@Request() req: any, @Param("id") id: string) {
    return this.dripCampaignsService.deleteCampaign(req.user.tenantId, id);
  }

  @Get(":id/enrollments")
  @ApiOperation({ summary: "Get enrollments for a campaign" })
  getEnrollments(@Request() req: any, @Param("id") id: string) {
    return this.dripCampaignsService.getEnrollments(req.user.tenantId, id);
  }

  @Post(":id/unsubscribe/:candidateId")
  @ApiOperation({ summary: "Unsubscribe a candidate from a campaign" })
  unsubscribe(
    @Request() req: any,
    @Param("id") id: string,
    @Param("candidateId") candidateId: string,
  ) {
    return this.dripCampaignsService.unsubscribeCandidate(
      req.user.tenantId,
      id,
      candidateId,
    );
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Get campaign statistics" })
  getStats(@Request() req: any, @Param("id") id: string) {
    return this.dripCampaignsService.getCampaignStats(req.user.tenantId, id);
  }
}
