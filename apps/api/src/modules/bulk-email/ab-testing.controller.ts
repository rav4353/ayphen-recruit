import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ABTestingService, ABVariant, ABTestMetric } from './ab-testing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';

@ApiTags('A/B Testing')
@Controller('ab-tests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ABTestingController {
    constructor(private readonly abTestingService: ABTestingService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new A/B test' })
    @RequirePermissions(Permission.EMAIL_SEND)
    create(
        @Request() req: any,
        @Body() dto: {
            name: string;
            description?: string;
            variants: Omit<ABVariant, 'id'>[];
            recipientType: 'candidates' | 'talent_pool' | 'custom';
            recipientIds?: string[];
            talentPoolId?: string;
            testPercentage?: number;
            winnerMetric?: ABTestMetric;
            testDurationHours?: number;
        },
    ) {
        return this.abTestingService.createTest(req.user.tenantId, req.user.sub, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all A/B tests' })
    @RequirePermissions(Permission.EMAIL_SEND)
    findAll(@Request() req: any) {
        return this.abTestingService.getTests(req.user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get A/B test by ID' })
    @RequirePermissions(Permission.EMAIL_SEND)
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.abTestingService.getTest(req.user.tenantId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an A/B test' })
    @RequirePermissions(Permission.EMAIL_SEND)
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: Partial<{
            name: string;
            description: string;
            variants: Omit<ABVariant, 'id'>[];
            testPercentage: number;
            winnerMetric: ABTestMetric;
            testDurationHours: number;
        }>,
    ) {
        return this.abTestingService.updateTest(req.user.tenantId, id, dto);
    }

    @Post(':id/start')
    @ApiOperation({ summary: 'Start an A/B test' })
    @RequirePermissions(Permission.EMAIL_SEND)
    start(@Request() req: any, @Param('id') id: string) {
        return this.abTestingService.startTest(req.user.tenantId, id, req.user.sub);
    }

    @Post(':id/complete')
    @ApiOperation({ summary: 'Manually complete an A/B test and determine winner' })
    @RequirePermissions(Permission.EMAIL_SEND)
    complete(@Request() req: any, @Param('id') id: string) {
        return this.abTestingService.completeTest(req.user.tenantId, id);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel an A/B test' })
    @RequirePermissions(Permission.EMAIL_SEND)
    cancel(@Request() req: any, @Param('id') id: string) {
        return this.abTestingService.cancelTest(req.user.tenantId, id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an A/B test' })
    @RequirePermissions(Permission.EMAIL_SEND)
    remove(@Request() req: any, @Param('id') id: string) {
        return this.abTestingService.deleteTest(req.user.tenantId, id);
    }

    @Get(':id/results')
    @ApiOperation({ summary: 'Get A/B test results and analytics' })
    @RequirePermissions(Permission.EMAIL_SEND)
    getResults(@Request() req: any, @Param('id') id: string) {
        return this.abTestingService.getTestResults(req.user.tenantId, id);
    }
}
