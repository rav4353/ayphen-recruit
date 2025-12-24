import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InterviewKitsService } from "./interview-kits.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("interview-kits")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("interview-kits")
export class InterviewKitsController {
  constructor(private readonly interviewKitsService: InterviewKitsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new interview kit" })
  @RequirePermissions(Permission.JOB_CREATE)
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      interviewType: string;
      duration?: number;
      questions?: {
        question: string;
        category: string;
        expectedAnswer?: string;
        duration?: number;
        order?: number;
      }[];
      scorecard?: {
        name: string;
        criteria: { name: string; weight: number; description?: string }[];
      };
      tips?: string[];
      resources?: { title: string; url: string }[];
    },
  ) {
    return this.interviewKitsService.create(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Get all interview kits" })
  @RequirePermissions(Permission.JOB_VIEW)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("interviewType") interviewType?: string,
  ) {
    return this.interviewKitsService.findAll(user.tenantId, interviewType);
  }

  @Get("types")
  @ApiOperation({ summary: "Get interview types" })
  @RequirePermissions(Permission.JOB_VIEW)
  getInterviewTypes() {
    return this.interviewKitsService.getInterviewTypes();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get interview kit by ID" })
  @RequirePermissions(Permission.JOB_VIEW)
  findById(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.interviewKitsService.findById(id, user.tenantId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update interview kit" })
  @RequirePermissions(Permission.JOB_EDIT)
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name?: string;
      description?: string;
      interviewType?: string;
      duration?: number;
      questions?: {
        question: string;
        category: string;
        expectedAnswer?: string;
        duration?: number;
        order?: number;
      }[];
      scorecard?: {
        name: string;
        criteria: { name: string; weight: number; description?: string }[];
      } | null;
      tips?: string[];
      resources?: { title: string; url: string }[];
    },
  ) {
    return this.interviewKitsService.update(id, body, user.tenantId, user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete interview kit" })
  @RequirePermissions(Permission.JOB_DELETE)
  delete(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.interviewKitsService.delete(id, user.tenantId, user.sub);
  }

  @Post(":id/duplicate")
  @ApiOperation({ summary: "Duplicate interview kit" })
  @RequirePermissions(Permission.JOB_CREATE)
  duplicate(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string },
  ) {
    return this.interviewKitsService.duplicate(
      id,
      body.name,
      user.tenantId,
      user.sub,
    );
  }

  @Post(":id/assign/:interviewId")
  @ApiOperation({ summary: "Assign kit to interview" })
  @RequirePermissions(Permission.JOB_EDIT)
  assignToInterview(
    @Param("id") id: string,
    @Param("interviewId") interviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interviewKitsService.assignToInterview(
      id,
      interviewId,
      user.tenantId,
      user.sub,
    );
  }
}
