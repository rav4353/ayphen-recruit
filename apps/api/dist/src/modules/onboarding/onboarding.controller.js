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
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const onboarding_service_1 = require("./onboarding.service");
const create_onboarding_dto_1 = require("./dto/create-onboarding.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let OnboardingController = class OnboardingController {
    constructor(onboardingService) {
        this.onboardingService = onboardingService;
    }
    create(createOnboardingDto, req) {
        return this.onboardingService.create(createOnboardingDto, req.user.tenantId);
    }
    findAll(req) {
        return this.onboardingService.findAll(req.user.tenantId);
    }
    findOne(id) {
        return this.onboardingService.findOne(id);
    }
    updateTask(taskId, updateTaskDto) {
        return this.onboardingService.updateTask(taskId, updateTaskDto);
    }
    uploadDocument(taskId, body) {
        return this.onboardingService.uploadDocument(taskId, body.fileUrl);
    }
    reviewDocument(taskId, body) {
        return this.onboardingService.reviewDocument(taskId, body.status);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Post)('initialize'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize onboarding workflow for an application' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_onboarding_dto_1.CreateOnboardingDto, Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active onboarding workflows' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get onboarding workflow details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update onboarding task status' }),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId/upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload document for a task' }),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Review uploaded document' }),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "reviewDocument", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, swagger_1.ApiTags)('Onboarding'),
    (0, common_1.Controller)('onboarding'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map