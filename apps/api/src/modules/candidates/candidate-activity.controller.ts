import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateActivityService } from './candidate-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('candidate-activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('candidates/:candidateId/activity')
export class CandidateActivityController {
  constructor(private readonly activityService: CandidateActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get candidate activity timeline' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getTimeline(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('types') types?: string,
  ) {
    return this.activityService.getTimeline(candidateId, user.tenantId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      types: types ? types.split(',') : undefined,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get candidate activity summary' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getSummary(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.activityService.getActivitySummary(candidateId, user.tenantId);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get activity types for filtering' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getActivityTypes() {
    return this.activityService.getActivityTypes();
  }
}
