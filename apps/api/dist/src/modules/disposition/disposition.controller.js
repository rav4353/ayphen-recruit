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
exports.DispositionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const disposition_service_1 = require("./disposition.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const disposition_dto_1 = require("./dto/disposition.dto");
let DispositionController = class DispositionController {
    constructor(dispositionService) {
        this.dispositionService = dispositionService;
    }
    async getRejectionReasons() {
        const reasons = await this.dispositionService.getRejectionReasons();
        return { data: reasons };
    }
    async getWithdrawalReasons() {
        const reasons = await this.dispositionService.getWithdrawalReasons();
        return { data: reasons };
    }
    async recordDisposition(data, user) {
        const application = await this.dispositionService.recordDisposition(data.applicationId, data.type, data.reason, data.notes, user.sub);
        return { data: application };
    }
    async getAnalytics(jobId, startDate, endDate) {
        const analytics = await this.dispositionService.getDispositionAnalytics(jobId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return { data: analytics };
    }
};
exports.DispositionController = DispositionController;
__decorate([
    (0, common_1.Get)('reasons/rejection'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all rejection reasons' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns list of rejection reasons' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DispositionController.prototype, "getRejectionReasons", null);
__decorate([
    (0, common_1.Get)('reasons/withdrawal'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all withdrawal reasons' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns list of withdrawal reasons' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DispositionController.prototype, "getWithdrawalReasons", null);
__decorate([
    (0, common_1.Post)('record'),
    (0, swagger_1.ApiOperation)({ summary: 'Record disposition (rejection or withdrawal)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Disposition recorded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Application not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [disposition_dto_1.RecordDispositionDto, Object]),
    __metadata("design:returntype", Promise)
], DispositionController.prototype, "recordDisposition", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get disposition analytics' }),
    (0, swagger_1.ApiQuery)({ name: 'jobId', required: false, description: 'Filter by job ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (ISO format)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (ISO format)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns disposition analytics' }),
    __param(0, (0, common_1.Query)('jobId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DispositionController.prototype, "getAnalytics", null);
exports.DispositionController = DispositionController = __decorate([
    (0, swagger_1.ApiTags)('disposition'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('disposition'),
    __metadata("design:paramtypes", [disposition_service_1.DispositionService])
], DispositionController);
//# sourceMappingURL=disposition.controller.js.map