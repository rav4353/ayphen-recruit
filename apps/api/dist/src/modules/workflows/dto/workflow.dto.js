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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkflowDto = exports.CreateWorkflowDto = exports.WorkflowActionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class WorkflowActionDto {
}
exports.WorkflowActionDto = WorkflowActionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of action to execute',
        enum: ['SEND_EMAIL', 'ADD_TAG', 'CREATE_TASK', 'REQUEST_FEEDBACK'],
        example: 'SEND_EMAIL',
    }),
    (0, class_validator_1.IsEnum)(['SEND_EMAIL', 'ADD_TAG', 'CREATE_TASK', 'REQUEST_FEEDBACK']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkflowActionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action configuration',
        example: { templateId: 'welcome-email', to: 'candidate' },
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], WorkflowActionDto.prototype, "config", void 0);
class CreateWorkflowDto {
}
exports.CreateWorkflowDto = CreateWorkflowDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Workflow name',
        example: 'Welcome Referrals',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Workflow description',
        example: 'Send welcome email to referred candidates',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pipeline stage ID to trigger on',
        example: 'stage-123',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "stageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Trigger type',
        enum: ['STAGE_ENTER', 'STAGE_EXIT', 'TIME_IN_STAGE'],
        example: 'STAGE_ENTER',
    }),
    (0, class_validator_1.IsEnum)(['STAGE_ENTER', 'STAGE_EXIT', 'TIME_IN_STAGE']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "trigger", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Conditional logic (optional)',
        example: { source: 'REFERRAL' },
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateWorkflowDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Actions to execute',
        type: [WorkflowActionDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateWorkflowDto.prototype, "actions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Delay in minutes before executing (optional)',
        example: 0,
        required: false,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateWorkflowDto.prototype, "delayMinutes", void 0);
class UpdateWorkflowDto {
}
exports.UpdateWorkflowDto = UpdateWorkflowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "trigger", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateWorkflowDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [WorkflowActionDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateWorkflowDto.prototype, "actions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateWorkflowDto.prototype, "delayMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateWorkflowDto.prototype, "isActive", void 0);
//# sourceMappingURL=workflow.dto.js.map