import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DispositionService } from './disposition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { RecordDispositionDto } from './dto/disposition.dto';

@ApiTags('disposition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disposition')
export class DispositionController {
    constructor(private readonly dispositionService: DispositionService) { }

    @Get('reasons/rejection')
    @ApiOperation({ summary: 'Get all rejection reasons' })
    @ApiResponse({ status: 200, description: 'Returns list of rejection reasons' })
    async getRejectionReasons() {
        const reasons = await this.dispositionService.getRejectionReasons();
        return { data: reasons };
    }

    @Get('reasons/withdrawal')
    @ApiOperation({ summary: 'Get all withdrawal reasons' })
    @ApiResponse({ status: 200, description: 'Returns list of withdrawal reasons' })
    async getWithdrawalReasons() {
        const reasons = await this.dispositionService.getWithdrawalReasons();
        return { data: reasons };
    }

    @Post('record')
    @ApiOperation({ summary: 'Record disposition (rejection or withdrawal)' })
    @ApiResponse({ status: 201, description: 'Disposition recorded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async recordDisposition(
        @Body() data: RecordDispositionDto,
        @CurrentUser() user: JwtPayload,
    ) {
        const application = await this.dispositionService.recordDisposition(
            data.applicationId,
            data.type,
            data.reason,
            data.notes,
            user.sub,
        );
        return { data: application };
    }

    @Get('analytics')
    @ApiOperation({ summary: 'Get disposition analytics' })
    @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
    @ApiResponse({ status: 200, description: 'Returns disposition analytics' })
    async getAnalytics(
        @Query('jobId') jobId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const analytics = await this.dispositionService.getDispositionAnalytics(
            jobId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
        return { data: analytics };
    }
}
