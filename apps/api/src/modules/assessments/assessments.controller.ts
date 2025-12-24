import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AssessmentsService } from "./assessments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("skill-assessments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("skill-assessments")
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new skill assessment" })
  @RequirePermissions(Permission.JOB_CREATE)
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      description?: string;
      skills: string[];
      duration?: number;
      passingScore?: number;
      questions?: {
        question: string;
        type?: "MULTIPLE_CHOICE" | "TEXT" | "CODE" | "RATING";
        options?: string[];
        correctAnswer?: string;
        points?: number;
      }[];
    },
  ) {
    return this.assessmentsService.create(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Get all skill assessments" })
  @RequirePermissions(Permission.JOB_VIEW)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.assessmentsService.findAll(user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get assessment by ID" })
  @RequirePermissions(Permission.JOB_VIEW)
  findById(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.assessmentsService.findById(id, user.tenantId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update assessment" })
  @RequirePermissions(Permission.JOB_EDIT)
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name?: string;
      description?: string;
      skills?: string[];
      duration?: number;
      passingScore?: number;
      questions?: {
        question: string;
        type?: "MULTIPLE_CHOICE" | "TEXT" | "CODE" | "RATING";
        options?: string[];
        correctAnswer?: string;
        points?: number;
      }[];
    },
  ) {
    return this.assessmentsService.update(id, user.tenantId, user.sub, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete assessment" })
  @RequirePermissions(Permission.JOB_DELETE)
  delete(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.assessmentsService.delete(id, user.tenantId, user.sub);
  }

  @Post(":id/send")
  @ApiOperation({ summary: "Send assessment to candidate" })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  sendToCandidate(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateId: string; applicationId?: string },
  ) {
    return this.assessmentsService.sendToCandidate(
      id,
      body.candidateId,
      user.tenantId,
      user.sub,
      body.applicationId,
    );
  }

  @Get(":id/results/:candidateId")
  @ApiOperation({ summary: "Get assessment results for a candidate" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getResults(
    @Param("id") id: string,
    @Param("candidateId") candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessmentsService.getResults(id, candidateId, user.tenantId);
  }

  @Post(":id/submit")
  @ApiOperation({ summary: "Submit assessment answers" })
  submitResults(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      candidateId: string;
      answers: Record<string, string>;
      timeTaken?: number;
    },
  ) {
    return this.assessmentsService.submitResults(id, user.tenantId, body);
  }

  @Get(":id/all-results")
  @ApiOperation({ summary: "Get all results for an assessment" })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getAllResults(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.assessmentsService.getAllResults(id, user.tenantId);
  }
}
