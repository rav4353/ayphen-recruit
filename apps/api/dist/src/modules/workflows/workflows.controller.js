"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workflows_service_1 = require("./workflows.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const workflow_dto_1 = require("./dto/workflow.dto");
let WorkflowsController = class WorkflowsController {
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    getWorkflowsByStage(stageId) {
        return this.workflowsService.getWorkflowsByStage(stageId);
    }
    createWorkflow(data) {
        return this.workflowsService.createWorkflow(data);
    }
    updateWorkflow(id, data) {
        return this.workflowsService.updateWorkflow(id, data);
    }
    deleteWorkflow(id) {
        return this.workflowsService.deleteWorkflow(id);
    }
    toggleWorkflow(id, isActive) {
        return this.workflowsService.toggleWorkflow(id, isActive);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.Get)('stage/:stageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workflows for a stage' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns workflows for the specified stage' }),
    __param(0, (0, common_1.Param)('stageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "getWorkflowsByStage", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new workflow' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workflow created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workflow_dto_1.CreateWorkflowDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "createWorkflow", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a workflow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.UpdateWorkflowDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "updateWorkflow", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a workflow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "deleteWorkflow", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle workflow active status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow status toggled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "toggleWorkflow", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, swagger_1.ApiTags)('workflows'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map