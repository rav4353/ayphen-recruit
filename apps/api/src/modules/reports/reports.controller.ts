import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Header,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ReportsService } from "./reports.service";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";

@ApiTags("reports")
@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("custom")
  @ApiOperation({ summary: "Generate custom report" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "jobId", required: false })
  @ApiQuery({ name: "recruiterId", required: false })
  async getCustomReport(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
    @Query("recruiterId") recruiterId?: string,
  ) {
    return this.reportsService.getCustomReport(req.user.tenantId, {
      startDate,
      endDate,
      jobId,
      recruiterId,
    });
  }

  @Get("export/csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="report.csv"')
  async exportReportCsv(
    @Request() req: any,
    @Res() res: Response,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("jobId") jobId?: string,
    @Query("recruiterId") recruiterId?: string,
  ) {
    const csv = await this.reportsService.exportReportCsv(req.user.tenantId, {
      startDate,
      endDate,
      jobId,
      recruiterId,
    });

    res.send(csv);
  }
}
