import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CandidateSearchService } from "./candidate-search.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("candidate-search")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("candidates/search")
export class CandidateSearchController {
  constructor(private readonly searchService: CandidateSearchService) {}

  @Post()
  @ApiOperation({
    summary: "Advanced candidate search with boolean query support",
  })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  search(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      query?: string;
      skills?: string[];
      skillsMatch?: "ALL" | "ANY";
      locations?: string[];
      experience?: { min?: number; max?: number };
      education?: string[];
      companies?: string[];
      titles?: string[];
      sources?: string[];
      tags?: string[];
      createdAfter?: string;
      createdBefore?: string;
      lastActivityAfter?: string;
      hasApplications?: boolean;
      applicationStatus?: string[];
      excludeJobIds?: string[];
      sortBy?: "relevance" | "createdAt" | "updatedAt" | "name" | "matchScore";
      sortOrder?: "asc" | "desc";
      page?: number;
      limit?: number;
    },
  ) {
    return this.searchService.search(user.tenantId, body);
  }

  @Get("suggestions")
  @ApiOperation({ summary: "Get search suggestions for autocomplete" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getSuggestions(
    @CurrentUser() user: JwtPayload,
    @Query("q") query: string,
    @Query("field") field?: string,
  ) {
    return this.searchService.getSuggestions(user.tenantId, query, field);
  }

  @Post("save")
  @ApiOperation({ summary: "Save a search query for later use" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  saveSearch(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      query: Record<string, any>;
    },
  ) {
    return this.searchService.saveSearch(
      user.tenantId,
      user.sub,
      body.name,
      body.query,
    );
  }

  @Get("saved")
  @ApiOperation({ summary: "Get saved searches for current user" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getSavedSearches(@CurrentUser() user: JwtPayload) {
    return this.searchService.getSavedSearches(user.tenantId, user.sub);
  }
}
