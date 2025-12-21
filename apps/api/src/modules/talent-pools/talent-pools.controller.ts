import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TalentPoolsService } from './talent-pools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';

@ApiTags('talent-pools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('talent-pools')
export class TalentPoolsController {
  constructor(private readonly talentPoolsService: TalentPoolsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a talent pool' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name: string;
      description?: string;
      criteria?: {
        skills?: string[];
        locations?: string[];
        experience?: { min?: number; max?: number };
        sources?: string[];
        titles?: string[];
        companies?: string[];
      };
      isPublic?: boolean;
      isDynamic?: boolean;
      autoRefreshHours?: number;
    },
  ) {
    return this.talentPoolsService.create(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all talent pools' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.findAll(user.tenantId, user.sub);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get talent pool statistics' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getStats(@CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.getPoolStats(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a talent pool by ID' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a talent pool' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name?: string;
      description?: string;
      criteria?: {
        skills?: string[];
        locations?: string[];
        experience?: { min?: number; max?: number };
        sources?: string[];
      };
      isPublic?: boolean;
    },
  ) {
    return this.talentPoolsService.update(id, body, user.tenantId, user.sub);
  }

  @Post(':id/candidates')
  @ApiOperation({ summary: 'Add candidates to a talent pool' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  addCandidates(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateIds: string[] },
  ) {
    return this.talentPoolsService.addCandidates(id, body.candidateIds, user.tenantId, user.sub);
  }

  @Delete(':id/candidates')
  @ApiOperation({ summary: 'Remove candidates from a talent pool' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  removeCandidates(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateIds: string[] },
  ) {
    return this.talentPoolsService.removeCandidates(id, body.candidateIds, user.tenantId, user.sub);
  }

  @Get(':id/search-candidates')
  @ApiOperation({ summary: 'Search candidates to add to pool' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  searchCandidates(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('q') query?: string,
  ) {
    return this.talentPoolsService.searchCandidatesForPool(id, user.tenantId, query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a talent pool' })
  @RequirePermissions(Permission.CANDIDATE_DELETE)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.delete(id, user.tenantId, user.sub);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Manually refresh a dynamic talent pool' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  refreshPool(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.triggerRefresh(id, user.tenantId, user.sub);
  }
}
