import { Controller, Get, Query, UseGuards, Request, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('custom')
    @ApiOperation({ summary: 'Generate custom report' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'jobId', required: false })
    @ApiQuery({ name: 'recruiterId', required: false })
    async getCustomReport(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('jobId') jobId?: string,
        @Query('recruiterId') recruiterId?: string,
    ) {
        return this.reportsService.getCustomReport(req.user.tenantId, {
            startDate,
            endDate,
            jobId,
            recruiterId,
        });
    }

    @Get('export/csv')
    @Header('Content-Type', 'text/csv')
    @Header('Content-Disposition', 'attachment; filename="report.csv"')
    async exportReportCsv(
        @Request() req: any,
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('jobId') jobId?: string,
        @Query('recruiterId') recruiterId?: string,
    ) {
        const csv = await this.reportsService.exportReportCsv(req.user.tenantId, {
            startDate,
            endDate,
            jobId,
            recruiterId,
        });

        res.send(csv);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard summary statistics' })
    async getDashboardStats(@Request() req: any) {
        return this.reportsService.getDashboardStats(req.user.tenantId);
    }

    @Get('funnel')
    @ApiOperation({ summary: 'Get hiring funnel analytics' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'jobId', required: false })
    async getHiringFunnel(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('jobId') jobId?: string,
    ) {
        return this.reportsService.getHiringFunnel(req.user.tenantId, { startDate, endDate, jobId });
    }

    @Get('time-to-hire')
    @ApiOperation({ summary: 'Get time-to-hire metrics' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getTimeToHire(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getTimeToHire(req.user.tenantId, { startDate, endDate });
    }

    @Get('source-effectiveness')
    @ApiOperation({ summary: 'Get source effectiveness report' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getSourceEffectiveness(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getSourceEffectiveness(req.user.tenantId, { startDate, endDate });
    }

    @Get('recruiter-performance')
    @ApiOperation({ summary: 'Get recruiter performance metrics' })
    @ApiQuery({ name: 'startDate', required: false })
    async getRecruiterPerformance(
        @Request() req: any,
        @Query('startDate') startDate?: string,
    ) {
        return this.reportsService.getRecruiterPerformance(req.user.tenantId, { startDate });
    }
}
