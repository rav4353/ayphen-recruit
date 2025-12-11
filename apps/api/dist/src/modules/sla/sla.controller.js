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
exports.SlaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sla_service_1 = require("./sla.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const sla_dto_1 = require("./dto/sla.dto");
let SlaController = class SlaController {
    constructor(slaService) {
        this.slaService = slaService;
    }
    async getApplicationSla(id) {
        const slaStatus = await this.slaService.calculateSlaStatus(id);
        return { data: slaStatus };
    }
    async getAtRiskApplications(user) {
        const result = await this.slaService.getAtRiskApplications();
        return { data: result };
    }
    async getJobSlaStats(jobId) {
        const stats = await this.slaService.getJobSlaStats(jobId);
        return { data: stats };
    }
    async getAverageTimeInStage(stageId) {
        const avgDays = await this.slaService.getAverageTimeInStage(stageId);
        return { data: { averageDays: avgDays } };
    }
    async updateStageSla(stageId, dto) {
        const stage = await this.slaService.updateStageSla(stageId, dto.slaDays);
        return { data: stage };
    }
};
exports.SlaController = SlaController;
__decorate([
    (0, common_1.Get)('application/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SLA status for an application' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Application ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns SLA status' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "getApplicationSla", null);
__decorate([
    (0, common_1.Get)('at-risk'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all at-risk and overdue applications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns at-risk and overdue applications' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "getAtRiskApplications", null);
__decorate([
    (0, common_1.Get)('job/:jobId/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SLA statistics for a job' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns SLA statistics' }),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "getJobSlaStats", null);
__decorate([
    (0, common_1.Get)('stage/:stageId/average-time'),
    (0, swagger_1.ApiOperation)({ summary: 'Get average time in stage' }),
    (0, swagger_1.ApiParam)({ name: 'stageId', description: 'Stage ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns average time in days' }),
    __param(0, (0, common_1.Param)('stageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "getAverageTimeInStage", null);
__decorate([
    (0, common_1.Patch)('stage/:stageId/sla'),
    (0, swagger_1.ApiOperation)({ summary: 'Update SLA days for a stage' }),
    (0, swagger_1.ApiParam)({ name: 'stageId', description: 'Stage ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SLA updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Stage not found' }),
    __param(0, (0, common_1.Param)('stageId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sla_dto_1.UpdateStageSlaDto]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "updateStageSla", null);
exports.SlaController = SlaController = __decorate([
    (0, swagger_1.ApiTags)('sla'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('sla'),
    __metadata("design:paramtypes", [sla_service_1.SlaService])
], SlaController);
//# sourceMappingURL=sla.controller.js.map