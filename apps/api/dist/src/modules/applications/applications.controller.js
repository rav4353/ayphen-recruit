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
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const applications_service_1 = require("./applications.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const create_public_application_dto_1 = require("./dto/create-public-application.dto");
let ApplicationsController = class ApplicationsController {
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    create(dto) {
        return this.applicationsService.create(dto);
    }
    applyPublic(dto) {
        return this.applicationsService.createPublic(dto);
    }
    findAll(user) {
        return this.applicationsService.findAll(user.tenantId);
    }
    findByJob(jobId, status, stageId) {
        return this.applicationsService.findByJob(jobId, { status, stageId });
    }
    findOne(id) {
        return this.applicationsService.findById(id);
    }
    moveToStage(id, stageId, user) {
        return this.applicationsService.moveToStage(id, stageId, user.sub);
    }
    updateStatus(id, status, reason) {
        return this.applicationsService.updateStatus(id, status, reason);
    }
    assignTo(id, userId) {
        return this.applicationsService.assignTo(id, userId);
    }
    async calculateMatch(id) {
        await this.applicationsService.calculateMatch(id);
        return { success: true, message: 'Match calculation triggered' };
    }
    copyToJob(applicationIds, targetJobId, user) {
        return this.applicationsService.copyToJob(applicationIds, targetJobId, user.sub);
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new application' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_application_dto_1.CreateApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('public/apply'),
    (0, swagger_1.ApiOperation)({ summary: 'Public application submission' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_public_application_dto_1.CreatePublicApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "applyPublic", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all applications for tenant' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('job/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get applications for a job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('stageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findByJob", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    (0, swagger_1.ApiOperation)({ summary: 'Move application to a different stage' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('stageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "moveToStage", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update application status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign application to a user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "assignTo", null);
__decorate([
    (0, common_1.Post)(':id/match'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate AI Match Score' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "calculateMatch", null);
__decorate([
    (0, common_1.Post)('copy'),
    (0, swagger_1.ApiOperation)({ summary: 'Copy applications to another job' }),
    __param(0, (0, common_1.Body)('applicationIds')),
    __param(1, (0, common_1.Body)('targetJobId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "copyToJob", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('applications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map