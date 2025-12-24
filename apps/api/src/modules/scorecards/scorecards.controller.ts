import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ScorecardsService } from "./scorecards.service";
import { CreateScorecardTemplateDto } from "./dto/create-scorecard-template.dto";
import { UpdateScorecardTemplateDto } from "./dto/update-scorecard-template.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("scorecards")
@UseGuards(JwtAuthGuard)
export class ScorecardsController {
  constructor(private readonly scorecardsService: ScorecardsService) {}

  @Post()
  create(@Body() dto: CreateScorecardTemplateDto, @Request() req: any) {
    return this.scorecardsService.create(dto, req.user.tenantId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.scorecardsService.findAll(req.user.tenantId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.scorecardsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateScorecardTemplateDto) {
    return this.scorecardsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.scorecardsService.remove(id);
  }
}
