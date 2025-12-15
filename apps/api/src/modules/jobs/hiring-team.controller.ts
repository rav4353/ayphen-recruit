import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HiringTeamService, HiringTeamRole } from './hiring-team.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('hiring-team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('jobs/:jobId/team')
export class HiringTeamController {
  constructor(private readonly hiringTeamService: HiringTeamService) {}

  @Post()
  @ApiOperation({ summary: 'Add team member to job' })
  @RequirePermissions(Permission.JOB_EDIT)
  addTeamMember(
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      userId: string;
      role: HiringTeamRole;
      permissions?: {
        canViewCandidates?: boolean;
        canEditCandidates?: boolean;
        canScheduleInterviews?: boolean;
        canProvideFeedback?: boolean;
        canMakeOffers?: boolean;
        canApprove?: boolean;
      };
    },
  ) {
    return this.hiringTeamService.addTeamMember(jobId, body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all team members for a job' })
  @RequirePermissions(Permission.JOB_VIEW)
  getTeamMembers(
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringTeamService.getTeamMembers(jobId, user.tenantId);
  }

  @Put(':memberId')
  @ApiOperation({ summary: 'Update team member role or permissions' })
  @RequirePermissions(Permission.JOB_EDIT)
  updateTeamMember(
    @Param('jobId') jobId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      role?: HiringTeamRole;
      permissions?: Record<string, boolean>;
    },
  ) {
    return this.hiringTeamService.updateTeamMember(jobId, memberId, body, user.tenantId, user.sub);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Remove team member from job' })
  @RequirePermissions(Permission.JOB_EDIT)
  removeTeamMember(
    @Param('jobId') jobId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringTeamService.removeTeamMember(jobId, memberId, user.tenantId, user.sub);
  }
}

@ApiTags('hiring-team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users/me/hiring-teams')
export class MyHiringTeamsController {
  constructor(private readonly hiringTeamService: HiringTeamService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs where current user is a team member' })
  getMyJobs(@CurrentUser() user: JwtPayload) {
    return this.hiringTeamService.getJobsForUser(user.sub, user.tenantId);
  }
}
