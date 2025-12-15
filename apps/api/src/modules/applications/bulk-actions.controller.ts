import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BulkActionsService } from './bulk-actions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('bulk-actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('applications/bulk')
export class BulkActionsController {
  constructor(private readonly bulkActionsService: BulkActionsService) {}

  @Post('move-stage')
  @ApiOperation({ summary: 'Move multiple applications to a stage' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  bulkMoveStage(
    @CurrentUser() user: JwtPayload,
    @Body() body: { applicationIds: string[]; targetStageId: string },
  ) {
    return this.bulkActionsService.bulkMoveStage(body, user.sub, user.tenantId);
  }

  @Post('update-status')
  @ApiOperation({ summary: 'Update status of multiple applications' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  bulkUpdateStatus(
    @CurrentUser() user: JwtPayload,
    @Body() body: { applicationIds: string[]; status: 'REJECTED' | 'WITHDRAWN'; reason?: string },
  ) {
    return this.bulkActionsService.bulkUpdateStatus(body, user.sub, user.tenantId);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign multiple applications to a user' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  bulkAssign(
    @CurrentUser() user: JwtPayload,
    @Body() body: { applicationIds: string[]; assigneeId: string },
  ) {
    return this.bulkActionsService.bulkAssign(body, user.sub, user.tenantId);
  }

  @Post('add-tags')
  @ApiOperation({ summary: 'Add tags to multiple applications' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  bulkAddTags(
    @CurrentUser() user: JwtPayload,
    @Body() body: { applicationIds: string[]; tags: string[] },
  ) {
    return this.bulkActionsService.bulkAddTags(body.applicationIds, body.tags, user.sub, user.tenantId);
  }

  @Post('send-email')
  @ApiOperation({ summary: 'Send email to multiple candidates' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  bulkSendEmail(
    @CurrentUser() user: JwtPayload,
    @Body() body: { applicationIds: string[]; subject: string; body: string },
  ) {
    return this.bulkActionsService.bulkSendEmail(body.applicationIds, body.subject, body.body, user.sub, user.tenantId);
  }
}
