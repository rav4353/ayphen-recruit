import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { EmailSequencesService } from "./email-sequences.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("email-sequences")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("email-sequences")
export class EmailSequencesController {
  constructor(private readonly sequencesService: EmailSequencesService) {}

  @Post()
  @ApiOperation({ summary: "Create email sequence" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      triggerType:
        | "MANUAL"
        | "APPLICATION_CREATED"
        | "STAGE_ENTERED"
        | "OFFER_SENT";
      triggerStageId?: string;
      steps: {
        subject: string;
        body: string;
        delayDays: number;
        delayHours: number;
        order: number;
      }[];
    },
  ) {
    return this.sequencesService.create(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Get all email sequences" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.sequencesService.findAll(user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get email sequence by ID" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  findById(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.sequencesService.findById(id, user.tenantId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update email sequence" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name?: string;
      description?: string;
      triggerType?:
        | "MANUAL"
        | "APPLICATION_CREATED"
        | "STAGE_ENTERED"
        | "OFFER_SENT";
      triggerStageId?: string;
      steps?: {
        subject: string;
        body: string;
        delayDays: number;
        delayHours: number;
        order: number;
      }[];
    },
  ) {
    return this.sequencesService.update(id, body, user.tenantId, user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete email sequence" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  delete(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.sequencesService.delete(id, user.tenantId, user.sub);
  }

  @Post(":id/enroll/:candidateId")
  @ApiOperation({ summary: "Enroll candidate in sequence" })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  enrollCandidate(
    @Param("id") id: string,
    @Param("candidateId") candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sequencesService.enrollCandidate(
      id,
      candidateId,
      user.tenantId,
      user.sub,
    );
  }

  @Delete(":id/enroll/:candidateId")
  @ApiOperation({ summary: "Unenroll candidate from sequence" })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  unenrollCandidate(
    @Param("id") id: string,
    @Param("candidateId") candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sequencesService.unenrollCandidate(
      id,
      candidateId,
      user.tenantId,
      user.sub,
    );
  }

  @Get("candidate/:candidateId/enrollments")
  @ApiOperation({ summary: "Get candidate enrollments" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getCandidateEnrollments(
    @Param("candidateId") candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sequencesService.getCandidateEnrollments(
      candidateId,
      user.tenantId,
    );
  }
}
