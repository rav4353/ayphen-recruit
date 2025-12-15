import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new referral' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      candidateId: string;
      jobId?: string;
      notes?: string;
    },
  ) {
    return this.referralsService.create(body, user.sub, user.tenantId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my referrals' })
  getMyReferrals(@CurrentUser() user: JwtPayload) {
    return this.referralsService.getMyReferrals(user.sub, user.tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get referral statistics' })
  getStats(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
  ) {
    return this.referralsService.getStats(user.tenantId, userId);
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'Get my referral statistics' })
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.referralsService.getStats(user.tenantId, user.sub);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get referral leaderboard' })
  getLeaderboard(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    return this.referralsService.getLeaderboard(user.tenantId, limit ? parseInt(limit) : 10);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get referral bonus configuration' })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getBonusConfig(@CurrentUser() user: JwtPayload) {
    return this.referralsService.getBonusConfig(user.tenantId);
  }

  @Post('config')
  @ApiOperation({ summary: 'Set referral bonus configuration' })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  setBonusConfig(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      hiredBonus: number;
      interviewBonus?: number;
      currency: string;
    },
  ) {
    return this.referralsService.setBonusConfig(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all referrals (admin)' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getAllReferrals(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('referrerId') referrerId?: string,
  ) {
    return this.referralsService.getAllReferrals(user.tenantId, { status, referrerId });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update referral status' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { status: 'PENDING' | 'INTERVIEWED' | 'HIRED' | 'REJECTED' },
  ) {
    return this.referralsService.updateStatus(id, body.status, user.tenantId, user.sub);
  }

  @Post(':id/pay-bonus')
  @ApiOperation({ summary: 'Mark referral bonus as paid' })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  markBonusPaid(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.referralsService.markBonusPaid(id, user.tenantId, user.sub);
  }
}
