import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto/workflow.dto";

@ApiTags("workflows")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get("stage/:stageId")
  @ApiOperation({ summary: "Get all workflows for a stage" })
  @ApiResponse({
    status: 200,
    description: "Returns workflows for the specified stage",
  })
  getWorkflowsByStage(@Param("stageId") stageId: string) {
    return this.workflowsService.getWorkflowsByStage(stageId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new workflow" })
  @ApiResponse({ status: 201, description: "Workflow created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  createWorkflow(@Body() data: CreateWorkflowDto) {
    return this.workflowsService.createWorkflow(data);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a workflow" })
  @ApiResponse({ status: 200, description: "Workflow updated successfully" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  updateWorkflow(@Param("id") id: string, @Body() data: UpdateWorkflowDto) {
    return this.workflowsService.updateWorkflow(id, data);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a workflow" })
  @ApiResponse({ status: 200, description: "Workflow deleted successfully" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  deleteWorkflow(@Param("id") id: string) {
    return this.workflowsService.deleteWorkflow(id);
  }

  @Patch(":id/toggle")
  @ApiOperation({ summary: "Toggle workflow active status" })
  @ApiResponse({
    status: 200,
    description: "Workflow status toggled successfully",
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  toggleWorkflow(@Param("id") id: string, @Body("isActive") isActive: boolean) {
    return this.workflowsService.toggleWorkflow(id, isActive);
  }
}
