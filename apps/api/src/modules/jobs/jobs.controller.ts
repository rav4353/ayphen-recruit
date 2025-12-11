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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';
import { SubmitApprovalDto } from './dto/submit-approval.dto';
import { ApproveJobDto } from './dto/approve-job.dto';
import { RejectJobDto } from './dto/reject-job.dto';
import { PublishJobDto } from './dto/publish-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller(':tenantId/jobs')
@ApiParam({ name: 'tenantId', description: 'Tenant ID', type: 'string' })
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  private validateTenantAccess(userTenantId: string, paramTenantId: string) {
    if (userTenantId !== paramTenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new job' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.create(dto, user.tenantId, user.sub);
    return ApiResponse.created(job, 'Job created successfully');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all jobs' })
  async findAll(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: JobQueryDto,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const result = await this.jobsService.findAll(user.tenantId, query);
    const enrichedJobs = await this.jobsService.enrichJobsWithStatusColors(result.jobs, user.tenantId);
    return ApiResponse.paginated(
      enrichedJobs,
      result.total,
      query.page || 1,
      query.limit || 10,
      'Jobs retrieved successfully',
    );
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Export jobs to CSV' })
  async export(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: JobQueryDto,
    @Res() res: Response,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const csv = await this.jobsService.export(user.tenantId, query);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=jobs.csv');
    res.send(csv);
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get all public jobs for a tenant' })
  async findAllPublic(@Param('tenantId') tenantId: string) {
    const jobs = await this.jobsService.findAllPublic(tenantId);
    return ApiResponse.success(jobs, 'Public jobs retrieved successfully');
  }

  @Public()
  @Get(':id/public')
  @ApiOperation({ summary: 'Get public job details' })
  async findOnePublic(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const job = await this.jobsService.findById(id);
    if (job.tenantId !== tenantId || job.status !== 'OPEN') {
      throw new NotFoundException('Job not found');
    }
    return ApiResponse.success(job, 'Job retrieved successfully');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get job by ID' })
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.findById(id);
    if (job.tenantId !== tenantId) {
      throw new NotFoundException('Job not found');
    }
    const enrichedJob = await this.jobsService.enrichJobsWithStatusColors([job], job.tenantId);
    return ApiResponse.success(enrichedJob[0], 'Job retrieved successfully');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update job' })
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.update(id, dto);
    return ApiResponse.updated(job, 'Job updated successfully');
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update job status' })
  async updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.updateStatus(id, status);
    return ApiResponse.updated(job, `Job status updated to ${status}`);
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clone a job' })
  async clone(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.clone(id, user.tenantId, user.sub);
    return ApiResponse.created(job, 'Job cloned successfully');
  }

  @Post(':id/submit-approval')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit job for approval' })
  async submitApproval(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SubmitApprovalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.submitForApproval(id, dto.approverIds || [], user.sub);
    return ApiResponse.success(job, 'Job submitted for approval');
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve job' })
  async approveJob(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ApproveJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.approve(id, user.sub, dto.comment);
    return ApiResponse.success(job, 'Job approved successfully');
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reject job' })
  async rejectJob(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const job = await this.jobsService.reject(id, user.sub, dto.reason);
    return ApiResponse.success(job, 'Job rejected successfully');
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publish job to channels' })
  async publish(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: PublishJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    const result = await this.jobsService.publish(id, dto.channels);
    return ApiResponse.success(result, 'Job published successfully');
  }

  @Public()
  @Get('feed/xml')
  @ApiOperation({ summary: 'Get XML job feed for external boards' })
  async getXmlFeed(@Param('tenantId') tenantId: string, @Res() res: Response) {
    const xml = await this.jobsService.generateXmlFeed(tenantId);
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete job' })
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.validateTenantAccess(user.tenantId, tenantId);
    await this.jobsService.remove(id);
    return ApiResponse.deleted('Job deleted successfully');
  }
}
