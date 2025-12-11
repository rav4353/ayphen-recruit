import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateQueryDto } from './dto/candidate-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('candidates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new candidate' })
  @RequirePermissions(Permission.CANDIDATE_CREATE)
  create(@Body() dto: CreateCandidateDto, @CurrentUser() user: JwtPayload) {
    return this.candidatesService.create(dto, user.tenantId, user.sub);
  }

  @Post('referral')
  @ApiOperation({ summary: 'Create a candidate referral' })
  // Referrals might be open to everyone, or requires a specific permission. 
  // For now let's assume basic create permission or open. Let's start without strict check for referrals if employees use it.
  createReferral(@Body() dto: CreateCandidateDto, @CurrentUser() user: JwtPayload) {
    return this.candidatesService.createReferral(dto, user.tenantId, user.sub);
  }

  @Get('referrals/my')
  @ApiOperation({ summary: 'Get my referrals' })
  getMyReferrals(@CurrentUser() user: JwtPayload) {
    return this.candidatesService.getReferrals(user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all candidates' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: CandidateQueryDto,
  ) {
    return this.candidatesService.findAll(user.tenantId, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export candidates to CSV' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  async export(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query() query: CandidateQueryDto,
  ) {
    const csv = await this.candidatesService.export(user.tenantId, query);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=candidates.csv');
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  findOne(@Param('id') id: string) {
    return this.candidatesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidatesService.update(id, dto);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tags to candidate' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  addTags(@Param('id') id: string, @Body('tags') tags: string[]) {
    return this.candidatesService.addTags(id, tags);
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Bulk delete candidates' })
  @RequirePermissions(Permission.CANDIDATE_DELETE)
  bulkDelete(@Body('ids') ids: string[], @CurrentUser() user: JwtPayload) {
    return this.candidatesService.bulkDelete(ids, user.tenantId);
  }

  @Post('bulk-email')
  @ApiOperation({ summary: 'Send bulk email to candidates' })
  @RequirePermissions(Permission.CANDIDATE_EDIT) // Sending email is an edit/action
  async sendBulkEmail(
    @Body() body: { ids: string[]; subject: string; message: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.candidatesService.sendBulkEmail(body.ids, body.subject, body.message, user.tenantId);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge two candidates' })
  @RequirePermissions(Permission.CANDIDATE_EDIT, Permission.CANDIDATE_DELETE) // Merging involves editing and potentially deleting
  async merge(
    @Body() body: { primaryId: string; secondaryId: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.candidatesService.merge(body.primaryId, body.secondaryId, user.tenantId);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get candidate activity timeline' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getActivities(@Param('id') id: string) {
    return this.candidatesService.getActivities(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete candidate' })
  @RequirePermissions(Permission.CANDIDATE_DELETE)
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
