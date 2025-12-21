import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobRequisitionService, RequisitionStatus } from './job-requisition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('job-requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('job-requisitions')
export class JobRequisitionController {
    constructor(private readonly requisitionService: JobRequisitionService) {}

    @Get('config')
    @ApiOperation({ summary: 'Get approval workflow configuration' })
    getConfig(@CurrentUser() user: JwtPayload) {
        return this.requisitionService.getApprovalWorkflowConfig(user.tenantId);
    }

    @Patch('config')
    @ApiOperation({ summary: 'Update approval workflow configuration' })
    updateConfig(
        @CurrentUser() user: JwtPayload,
        @Body() config: {
            enabled?: boolean;
            defaultApprovers?: string[];
            requireFinanceApproval?: boolean;
            salaryThresholdForFinance?: number;
        },
    ) {
        return this.requisitionService.updateApprovalWorkflowConfig(user.tenantId, config);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new job requisition' })
    create(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            title: string;
            department?: string;
            location?: string;
            employmentType: string;
            headcount?: number;
            salaryMin?: number;
            salaryMax?: number;
            currency?: string;
            justification: string;
            urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            approverIds?: string[];
        },
    ) {
        return this.requisitionService.createRequisition(user.tenantId, user.sub, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all requisitions' })
    getAll(
        @CurrentUser() user: JwtPayload,
        @Query('status') status?: RequisitionStatus,
        @Query('mine') mine?: string,
    ) {
        return this.requisitionService.getRequisitions(user.tenantId, {
            status,
            requestedBy: mine === 'true' ? user.sub : undefined,
        });
    }

    @Get('pending')
    @ApiOperation({ summary: 'Get requisitions pending my approval' })
    getPendingApprovals(@CurrentUser() user: JwtPayload) {
        return this.requisitionService.getPendingApprovals(user.tenantId, user.sub);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get requisition statistics' })
    getStats(@CurrentUser() user: JwtPayload) {
        return this.requisitionService.getRequisitionStats(user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get requisition by ID' })
    getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.requisitionService.getRequisition(user.tenantId, id);
    }

    @Post(':id/submit')
    @ApiOperation({ summary: 'Submit requisition for approval' })
    submit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.requisitionService.submitForApproval(user.tenantId, id);
    }

    @Post(':id/approve')
    @ApiOperation({ summary: 'Approve current step' })
    approve(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() body: { comment?: string },
    ) {
        return this.requisitionService.approveStep(user.tenantId, id, user.sub, body.comment);
    }

    @Post(':id/reject')
    @ApiOperation({ summary: 'Reject requisition' })
    reject(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() body: { reason: string },
    ) {
        return this.requisitionService.rejectStep(user.tenantId, id, user.sub, body.reason);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel requisition' })
    cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.requisitionService.cancelRequisition(user.tenantId, id, user.sub);
    }

    @Post(':id/create-job')
    @ApiOperation({ summary: 'Create job from approved requisition' })
    createJob(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() body: {
            description: string;
            requirements?: string;
            responsibilities?: string;
            skills?: string[];
            recruiterId?: string;
            hiringManagerId?: string;
        },
    ) {
        return this.requisitionService.createJobFromRequisition(user.tenantId, id, body);
    }
}
