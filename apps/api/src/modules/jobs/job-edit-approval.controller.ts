import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { JobEditApprovalService, JobEditApprovalConfig } from './job-edit-approval.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('job-edit-approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(':tenantId/jobs')
export class JobEditApprovalController {
  constructor(private readonly jobEditApprovalService: JobEditApprovalService) {}

  /**
   * Get job edit approval configuration
   */
  @Get('edit-approval/config')
  @ApiOperation({ summary: 'Get job edit approval configuration' })
  async getConfig(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const config = await this.jobEditApprovalService.getConfig(tenantId);
    return ApiResponse.success(config, 'Configuration retrieved');
  }

  /**
   * Update job edit approval configuration
   */
  @Put('edit-approval/config')
  @ApiOperation({ summary: 'Update job edit approval configuration' })
  async updateConfig(
    @Param('tenantId') tenantId: string,
    @Body() config: Partial<JobEditApprovalConfig>,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const updatedConfig = await this.jobEditApprovalService.updateConfig(
      tenantId,
      config,
      user.sub,
    );
    return ApiResponse.success(updatedConfig, 'Configuration updated');
  }

  /**
   * Get all pending edits for approval (for approvers dashboard)
   */
  @Get('edit-approval/pending')
  @ApiOperation({ summary: 'Get all pending job edits for approval' })
  async getAllPendingEdits(
    @Param('tenantId') tenantId: string,
    @Query('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const pendingEdits = await this.jobEditApprovalService.getAllPendingEdits(
      tenantId,
      status,
    );
    return ApiResponse.success(pendingEdits, 'Pending edits retrieved');
  }

  /**
   * Get pending edits for a specific job
   */
  @Get(':jobId/pending-edits')
  @ApiOperation({ summary: 'Get pending edits for a job' })
  async getJobPendingEdits(
    @Param('tenantId') tenantId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const pendingEdits = await this.jobEditApprovalService.getPendingEdits(
      jobId,
      tenantId,
    );
    return ApiResponse.success(pendingEdits, 'Pending edits retrieved');
  }

  /**
   * Get comparison view for a job (current values vs pending edits)
   */
  @Get(':jobId/comparison')
  @ApiOperation({ summary: 'Get job comparison (current vs pending edits)' })
  async getJobComparison(
    @Param('tenantId') tenantId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const comparison = await this.jobEditApprovalService.getJobComparison(
      jobId,
      tenantId,
    );
    return ApiResponse.success(comparison, 'Comparison retrieved');
  }

  /**
   * Approve pending edits
   */
  @Post('edit-approval/approve')
  @ApiOperation({ summary: 'Approve pending job edits' })
  async approveEdits(
    @Param('tenantId') tenantId: string,
    @Body() body: { editIds: string[]; comment?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const result = await this.jobEditApprovalService.approveEdits(
      body.editIds,
      user.sub,
      tenantId,
      body.comment,
    );
    return ApiResponse.success(result, 'Edits approved and applied');
  }

  /**
   * Reject pending edits
   */
  @Post('edit-approval/reject')
  @ApiOperation({ summary: 'Reject pending job edits' })
  async rejectEdits(
    @Param('tenantId') tenantId: string,
    @Body() body: { editIds: string[]; rejectionReason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }
    const result = await this.jobEditApprovalService.rejectEdits(
      body.editIds,
      user.sub,
      tenantId,
      body.rejectionReason,
    );
    return ApiResponse.success(result, 'Edits rejected');
  }
}
