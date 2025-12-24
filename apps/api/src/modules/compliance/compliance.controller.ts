import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ComplianceService } from "./compliance.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Compliance")
@Controller("compliance")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get("alerts")
  @ApiOperation({ summary: "Get all compliance alerts for the tenant" })
  async getAlerts(@Request() req: any) {
    return this.complianceService.getAlerts(req.user.tenantId);
  }

  @Post("alerts/:alertId/resolve")
  @ApiOperation({ summary: "Mark a compliance alert as resolved" })
  async resolveAlert(
    @Request() req: any,
    @Param("alertId") alertId: string,
    @Body() body: { resolution?: string },
  ) {
    return this.complianceService.resolveAlert(
      req.user.tenantId,
      alertId,
      body.resolution || "Resolved by user",
    );
  }
}
