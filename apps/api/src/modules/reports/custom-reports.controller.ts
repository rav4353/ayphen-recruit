import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permission } from '../../common/constants/permissions';
import { CustomReportsService, ReportDefinition } from './custom-reports.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
}

@ApiTags('Custom Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('custom-reports')
export class CustomReportsController {
  constructor(private readonly customReportsService: CustomReportsService) {}

  @Get('columns/:entityType')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get available columns for an entity type' })
  getColumns(@Param('entityType') entityType: string) {
    return this.customReportsService.getAvailableColumns(
      entityType as 'candidate' | 'job' | 'application' | 'interview' | 'offer',
    );
  }

  @Get('filter-operators/:fieldType')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get filter operators for a field type' })
  getFilterOperators(@Param('fieldType') fieldType: string) {
    return this.customReportsService.getFilterOperators(fieldType);
  }

  @Get('date-presets')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get date range presets' })
  getDatePresets() {
    return [
      { id: 'today', label: 'Today' },
      { id: 'yesterday', label: 'Yesterday' },
      { id: 'thisWeek', label: 'This Week' },
      { id: 'lastWeek', label: 'Last Week' },
      { id: 'thisMonth', label: 'This Month' },
      { id: 'lastMonth', label: 'Last Month' },
      { id: 'thisQuarter', label: 'This Quarter' },
      { id: 'lastQuarter', label: 'Last Quarter' },
      { id: 'thisYear', label: 'This Year' },
      { id: 'lastYear', label: 'Last Year' },
    ];
  }

  @Post('execute')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Execute a custom report' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async executeReport(
    @CurrentUser() user: JwtPayload,
    @Body() definition: ReportDefinition,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Set limit from query or default
    definition.limit = limit || 50;
    return this.customReportsService.executeReport(user.tenantId, definition);
  }

  @Post('export')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Export report to CSV' })
  async exportReport(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Body() definition: ReportDefinition,
  ) {
    const csv = await this.customReportsService.exportToCSV(user.tenantId, definition);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report_${definition.entityType}_${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csv);
  }

  @Get('saved')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get saved reports' })
  async getSavedReports(@CurrentUser() user: JwtPayload) {
    return this.customReportsService.getSavedReports(user.tenantId, user.sub);
  }

  @Post('saved')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Save a report' })
  async saveReport(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      definition: ReportDefinition;
      isPublic?: boolean;
    },
  ) {
    return this.customReportsService.saveReport(user.tenantId, user.sub, {
      name: body.name,
      description: body.description,
      definition: body.definition,
      isPublic: body.isPublic || false,
    });
  }

  @Delete('saved/:id')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Delete a saved report' })
  async deleteReport(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.customReportsService.deleteReport(user.tenantId, user.sub, id);
    return { success: true };
  }
}
