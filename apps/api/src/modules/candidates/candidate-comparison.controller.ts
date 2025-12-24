import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CandidateComparisonService } from "./candidate-comparison.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("candidate-comparison")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("candidates/compare")
export class CandidateComparisonController {
  constructor(private readonly comparisonService: CandidateComparisonService) {}

  @Post()
  @ApiOperation({ summary: "Compare multiple candidates side-by-side" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  compareCandidates(
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateIds: string[] },
  ) {
    return this.comparisonService.compareCandidates(
      body.candidateIds,
      user.tenantId,
    );
  }

  @Get("job/:jobId")
  @ApiOperation({ summary: "Compare top candidates for a job" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  compareJobCandidates(
    @Param("jobId") jobId: string,
    @CurrentUser() user: JwtPayload,
    @Query("limit") limit?: string,
  ) {
    return this.comparisonService.compareJobCandidates(
      jobId,
      user.tenantId,
      limit ? parseInt(limit) : 5,
    );
  }

  @Post("summary")
  @ApiOperation({ summary: "Get comparison summary metrics" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getComparisonSummary(
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateIds: string[] },
  ) {
    return this.comparisonService.getComparisonSummary(
      body.candidateIds,
      user.tenantId,
    );
  }
}
