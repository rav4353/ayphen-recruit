import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePublicApplicationDto } from './dto/create-public-application.dto';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Public()
  @Post('public/apply')
  @ApiOperation({ summary: 'Public application submission' })
  applyPublic(@Body() dto: CreatePublicApplicationDto) {
    return this.applicationsService.createPublic(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all applications for tenant' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.findAll(user.tenantId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get applications for a job' })
  findByJob(
    @Param('jobId') jobId: string,
    @Query('status') status?: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.applicationsService.findByJob(jobId, { status, stageId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findById(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move application to a different stage' })
  moveToStage(
    @Param('id') id: string,
    @Body('stageId') stageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.moveToStage(id, stageId, user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update application status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.applicationsService.updateStatus(id, status, reason, user?.sub);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign application to a user' })
  assignTo(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.applicationsService.assignTo(id, userId, user?.sub);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Calculate AI Match Score' })
  async calculateMatch(@Param('id') id: string) {
    await this.applicationsService.calculateMatch(id);
    return { success: true, message: 'Match calculation triggered' };
  }
  @Post('copy')
  @ApiOperation({ summary: 'Copy applications to another job' })
  copyToJob(
    @Body('applicationIds') applicationIds: string[],
    @Body('targetJobId') targetJobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.copyToJob(applicationIds, targetJobId, user.sub);
  }

  @Post('bulk/move-stage')
  @ApiOperation({ summary: 'Bulk move applications to a stage' })
  bulkMoveStage(
    @Body('applicationIds') applicationIds: string[],
    @Body('targetStageId') targetStageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.bulkMoveStage(applicationIds, targetStageId, user.sub, user.tenantId);
  }

  @Post('bulk/reject')
  @ApiOperation({ summary: 'Bulk reject applications' })
  bulkReject(
    @Body('applicationIds') applicationIds: string[],
    @Body('reason') reason: string,
    @Body('sendEmail') sendEmail?: boolean,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.applicationsService.bulkReject(applicationIds, reason, user.sub, user.tenantId, sendEmail);
  }

  @Post('bulk/assign')
  @ApiOperation({ summary: 'Bulk assign applications to a user' })
  bulkAssign(
    @Body('applicationIds') applicationIds: string[],
    @Body('assigneeId') assigneeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.bulkAssign(applicationIds, assigneeId, user.sub, user.tenantId);
  }

  @Post('bulk/add-tags')
  @ApiOperation({ summary: 'Bulk add tags to applications' })
  bulkAddTags(
    @Body('applicationIds') applicationIds: string[],
    @Body('tags') tags: string[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.bulkAddTags(applicationIds, tags, user.sub, user.tenantId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to an application' })
  addNote(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { content: string; isPrivate?: boolean; mentionedUserIds?: string[] },
  ) {
    return this.applicationsService.addNote(id, user.sub, user.tenantId, body);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes for an application' })
  getNotes(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.getNotes(id, user.sub, user.tenantId);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Update a note' })
  updateNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { content: string },
  ) {
    return this.applicationsService.updateNote(noteId, user.sub, user.tenantId, body);
  }

  @Patch('notes/:noteId/pin')
  @ApiOperation({ summary: 'Pin or unpin a note' })
  pinNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: JwtPayload,
    @Body('pinned') pinned: boolean,
  ) {
    return this.applicationsService.pinNote(noteId, user.sub, user.tenantId, pinned);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get complete status history for an application' })
  getStatusHistory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.getStatusHistory(id, user.tenantId);
  }

  @Get(':id/stage-transitions')
  @ApiOperation({ summary: 'Get stage transition history' })
  getStageTransitions(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.getStageTransitions(id, user.tenantId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get application timeline with filters' })
  getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('categories') categories?: string,
    @Query('limit') limit?: string,
  ) {
    return this.applicationsService.getTimeline(id, user.tenantId, {
      categories: categories ? categories.split(',') : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple candidates side-by-side' })
  compareCandidates(
    @CurrentUser() user: JwtPayload,
    @Body() body: { jobId: string; applicationIds: string[] },
  ) {
    return this.applicationsService.compareCandidates(
      body.jobId,
      user.tenantId,
      body.applicationIds,
    );
  }

  @Get('job/:jobId/comparison-stats')
  @ApiOperation({ summary: 'Get quick comparison stats for applications in a job' })
  getComparisonStats(
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.getComparisonStats(jobId, user.tenantId);
  }

  @Get('job/:jobId/leaderboard')
  @ApiOperation({ summary: 'Get candidate leaderboard for a job' })
  getCandidateLeaderboard(
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: string,
    @Query('includeRejected') includeRejected?: string,
  ) {
    return this.applicationsService.getCandidateLeaderboard(jobId, user.tenantId, {
      sortBy: sortBy as any,
      limit: limit ? parseInt(limit, 10) : undefined,
      includeRejected: includeRejected === 'true',
    });
  }

  @Get('top-candidates')
  @ApiOperation({ summary: 'Get top candidates across all active jobs' })
  getTopCandidates(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    return this.applicationsService.getTopCandidatesAcrossJobs(
      user.tenantId,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
