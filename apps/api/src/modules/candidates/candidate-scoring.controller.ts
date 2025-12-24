import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CandidateScoringService } from "./candidate-scoring.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("candidate-scoring")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("candidate-scoring")
export class CandidateScoringController {
  constructor(private readonly scoringService: CandidateScoringService) {}

  @Get("score/:candidateId/:jobId")
  @ApiOperation({ summary: "Get score for a candidate against a job" })
  getScore(
    @Param("candidateId") candidateId: string,
    @Param("jobId") jobId: string,
  ) {
    return this.scoringService.scoreCandidate(candidateId, jobId);
  }

  @Get("rank/:jobId")
  @ApiOperation({ summary: "Get ranked candidates for a job" })
  rankCandidates(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string,
  ) {
    return this.scoringService.rankCandidatesForJob(jobId, user.tenantId);
  }

  @Get("top-candidates")
  @ApiOperation({ summary: "Get top candidates across all jobs" })
  getTopCandidates(
    @CurrentUser() user: JwtPayload,
    @Query("limit") limit?: string,
  ) {
    return this.scoringService.getTopCandidates(
      user.tenantId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post("batch-score")
  @ApiOperation({ summary: "Batch score multiple candidates for a job" })
  batchScore(@Body() body: { candidateIds: string[]; jobId: string }) {
    return this.scoringService.batchScoreCandidates(
      body.candidateIds,
      body.jobId,
    );
  }
}
