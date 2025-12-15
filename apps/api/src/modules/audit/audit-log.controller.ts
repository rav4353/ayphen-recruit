import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permission } from '../../common/constants/permissions';
import { AuditLogService, AuditLogFilters } from './audit-log.service';

interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('action-types')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get available action types' })
  getActionTypes() {
    return this.auditLogService.getActionTypes();
  }

  @Get()
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'applicationId', required: false })
  @ApiQuery({ name: 'candidateId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(
    @CurrentUser() user: JwtPayload,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('applicationId') applicationId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: AuditLogFilters = {
      action,
      userId,
      applicationId,
      candidateId,
      startDate,
      endDate,
      search,
    };

    return this.auditLogService.getLogs(
      user.tenantId,
      filters,
      page || 1,
      limit || 50,
    );
  }

  @Get('stats')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getStats(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLogService.getStats(user.tenantId, startDate, endDate);
  }

  @Get('export')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  async exportLogs(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: AuditLogFilters = {
      action,
      startDate,
      endDate,
    };

    const csv = await this.auditLogService.exportToCSV(user.tenantId, filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  }

  @Get(':id')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get a single audit log entry' })
  async getLogById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.auditLogService.getLogById(user.tenantId, id);
  }
}
