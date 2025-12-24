import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SemanticSearchService } from "./semantic-search.service";
import {
  SemanticSearchDto,
  MatchCandidatesToJobDto,
  TalentRecommendationsDto,
  FindSimilarCandidatesDto,
} from "./dto/semantic-search.dto";

interface AuthenticatedRequest {
  user: {
    tenantId: string;
    userId: string;
  };
}

@ApiTags("Candidate Semantic Search")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("candidates/search")
export class SemanticSearchController {
  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  @Post("semantic")
  @ApiOperation({
    summary: "Semantic search for candidates",
    description:
      'Search candidates using natural language queries like "React developers with 5+ years experience in fintech"',
  })
  @ApiResponse({
    status: 200,
    description: "List of matching candidates with scores",
  })
  async semanticSearch(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SemanticSearchDto,
  ) {
    return this.semanticSearchService.searchCandidates({
      query: dto.query,
      tenantId: req.user.tenantId,
      limit: dto.limit,
      minScore: dto.minScore,
      filters: {
        skills: dto.skills,
        location: dto.location,
        excludeCandidateIds: dto.excludeCandidateIds,
      },
    });
  }

  @Post("match-to-job")
  @ApiOperation({
    summary: "Match candidates to a job",
    description: "Find best matching candidates for a specific job posting",
  })
  @ApiResponse({
    status: 200,
    description: "List of candidates ranked by match score",
  })
  async matchCandidatesToJob(
    @Req() req: AuthenticatedRequest,
    @Body() dto: MatchCandidatesToJobDto,
  ) {
    return this.semanticSearchService.matchCandidatesToJob(
      dto.jobId,
      req.user.tenantId,
      dto.limit,
    );
  }

  @Post("recommendations")
  @ApiOperation({
    summary: "Get AI-powered talent recommendations",
    description:
      "Get candidate recommendations based on role, skills, seniority, and industry",
  })
  @ApiResponse({ status: 200, description: "List of recommended candidates" })
  async getTalentRecommendations(
    @Req() req: AuthenticatedRequest,
    @Body() dto: TalentRecommendationsDto,
  ) {
    return this.semanticSearchService.getTalentRecommendations(
      req.user.tenantId,
      {
        role: dto.role,
        skills: dto.skills,
        seniority: dto.seniority,
        industry: dto.industry,
      },
    );
  }

  @Post("similar")
  @ApiOperation({
    summary: "Find similar candidates",
    description: "Find candidates with similar profiles to a given candidate",
  })
  @ApiResponse({ status: 200, description: "List of similar candidates" })
  async findSimilarCandidates(
    @Req() req: AuthenticatedRequest,
    @Body() dto: FindSimilarCandidatesDto,
  ) {
    return this.semanticSearchService.findSimilarCandidates(
      dto.candidateId,
      req.user.tenantId,
      dto.limit,
    );
  }

  @Get("similar/:candidateId")
  @ApiOperation({ summary: "Find similar candidates by ID" })
  @ApiResponse({ status: 200, description: "List of similar candidates" })
  async findSimilarCandidatesById(
    @Req() req: AuthenticatedRequest,
    @Param("candidateId") candidateId: string,
  ) {
    return this.semanticSearchService.findSimilarCandidates(
      candidateId,
      req.user.tenantId,
      10,
    );
  }
}
