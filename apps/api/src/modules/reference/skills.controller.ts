import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { SkillsService } from "./skills.service";

@ApiTags("Reference")
@Controller("reference/skills")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: "Get all normalized skills" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.skillsService.findAll(user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new skill definition" })
  create(
    @Body() body: { name: string; synonyms: string[]; category: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.skillsService.create(
      body.name,
      body.synonyms,
      body.category,
      user.tenantId,
    );
  }
}
