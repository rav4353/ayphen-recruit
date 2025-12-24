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
import { InterviewQuestionsService } from "./interview-questions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("interview-questions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("interview-questions")
export class InterviewQuestionsController {
  constructor(private readonly questionsService: InterviewQuestionsService) {}

  @Post()
  @ApiOperation({ summary: "Create an interview question" })
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      question: string;
      category: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      expectedAnswer?: string;
      skills?: string[];
      timeMinutes?: number;
    },
  ) {
    return this.questionsService.create(body, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Get all interview questions" })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("category") category?: string,
    @Query("difficulty") difficulty?: string,
    @Query("skills") skills?: string,
  ) {
    return this.questionsService.findAll(user.tenantId, {
      category,
      difficulty,
      skills,
    });
  }

  @Get("categories")
  @ApiOperation({ summary: "Get question categories" })
  getCategories(@CurrentUser() user: JwtPayload) {
    return this.questionsService.getCategories(user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an interview question by ID" })
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.findOne(id, user.tenantId);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an interview question" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      question?: string;
      category?: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      expectedAnswer?: string;
      skills?: string[];
      timeMinutes?: number;
    },
  ) {
    return this.questionsService.update(id, body, user.tenantId, user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an interview question" })
  delete(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.delete(id, user.tenantId, user.sub);
  }

  @Post("generate")
  @ApiOperation({ summary: "Generate interview questions for a job" })
  generateForJob(
    @CurrentUser() user: JwtPayload,
    @Body() body: { jobId: string; count?: number },
  ) {
    return this.questionsService.generateQuestionsForJob(
      body.jobId,
      user.tenantId,
      user.sub,
      body.count || 5,
    );
  }
}
