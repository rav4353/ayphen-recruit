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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('talent-pools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('talent-pools')
export class TalentPoolsController {
  constructor(private readonly talentPoolsService: TalentPoolsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a talent pool' })
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
      };
      isPublic?: boolean;
    },
  ) {
    return this.talentPoolsService.create(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all talent pools' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.findAll(user.tenantId, user.sub);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get talent pool statistics' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.getPoolStats(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a talent pool by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a talent pool' })
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
  addCandidates(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateIds: string[] },
  ) {
    return this.talentPoolsService.addCandidates(id, body.candidateIds, user.tenantId, user.sub);
  }

  @Delete(':id/candidates')
  @ApiOperation({ summary: 'Remove candidates from a talent pool' })
  removeCandidates(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateIds: string[] },
  ) {
    return this.talentPoolsService.removeCandidates(id, body.candidateIds, user.tenantId, user.sub);
  }

  @Get(':id/search-candidates')
  @ApiOperation({ summary: 'Search candidates to add to pool' })
  searchCandidates(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('q') query?: string,
  ) {
    return this.talentPoolsService.searchCandidatesForPool(id, user.tenantId, query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a talent pool' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.talentPoolsService.delete(id, user.tenantId, user.sub);
  }
}
