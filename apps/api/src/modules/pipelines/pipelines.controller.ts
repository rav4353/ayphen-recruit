import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PipelinesService } from "./pipelines.service";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import { AddStageDto, UpdateStageDto } from "./dto/update-stage.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("pipelines")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("pipelines")
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Create a new pipeline" })
  create(@Body() dto: CreatePipelineDto, @CurrentUser() user: JwtPayload) {
    return this.pipelinesService.create(dto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: "Get all pipelines" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.pipelinesService.findAll(user.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get pipeline by ID" })
  findOne(@Param("id") id: string) {
    return this.pipelinesService.findById(id);
  }

  @Post("default")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Create default pipeline" })
  createDefault(@CurrentUser() user: JwtPayload) {
    return this.pipelinesService.createDefaultPipeline(user.tenantId);
  }

  @Post(":id/stages")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Add a stage to pipeline" })
  addStage(@Param("id") id: string, @Body() stage: AddStageDto) {
    return this.pipelinesService.addStage(id, stage);
  }

  @Patch(":id/stages/reorder")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Reorder pipeline stages" })
  reorderStages(@Param("id") id: string, @Body("stageIds") stageIds: string[]) {
    return this.pipelinesService.reorderStages(id, stageIds);
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Update pipeline" })
  update(
    @Param("id") id: string,
    @Body() data: { name?: string; description?: string; isDefault?: boolean },
  ) {
    return this.pipelinesService.update(id, data);
  }

  @Patch("stages/:stageId")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Update pipeline stage" })
  updateStage(@Param("stageId") stageId: string, @Body() data: UpdateStageDto) {
    return this.pipelinesService.updateStage(stageId, data);
  }

  @Delete("stages/:stageId")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Delete pipeline stage" })
  removeStage(@Param("stageId") stageId: string) {
    return this.pipelinesService.removeStage(stageId);
  }

  @Delete(":id")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Delete pipeline" })
  remove(@Param("id") id: string) {
    return this.pipelinesService.remove(id);
  }
}
