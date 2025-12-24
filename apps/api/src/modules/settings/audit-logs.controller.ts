import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuditLogsService } from "./audit-logs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("audit-logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Get audit logs with filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "action", required: false, type: String })
  @ApiQuery({ name: "userId", required: false, type: String })
  @ApiQuery({ name: "entityType", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  async getAuditLogs(
    @CurrentUser() user: JwtPayload,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
    @Query("userId") userId?: string,
    @Query("entityType") entityType?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
  ) {
    const filters = {
      action,
      userId,
      entityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    };

    return this.auditLogsService.getAuditLogs(
      user.tenantId,
      filters,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get("actions")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Get available action types for filtering" })
  async getActionTypes(@CurrentUser() user: JwtPayload) {
    const actions = await this.auditLogsService.getActionTypes(user.tenantId);
    return { data: actions };
  }

  @Get("stats")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Get audit log statistics" })
  @ApiQuery({ name: "days", required: false, type: Number })
  async getStats(
    @CurrentUser() user: JwtPayload,
    @Query("days") days?: string,
  ) {
    const stats = await this.auditLogsService.getAuditStats(
      user.tenantId,
      days ? parseInt(days, 10) : 30,
    );
    return { data: stats };
  }

  @Get("export")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Export audit logs to CSV" })
  async exportLogs(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query("action") action?: string,
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const filters = {
      action,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const csv = await this.auditLogsService.exportAuditLogs(
      user.tenantId,
      filters,
    );

    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", "attachment; filename=audit-logs.csv");
    res.send(csv);
  }
}
