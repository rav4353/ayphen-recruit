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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const reports_service_1 = require("./reports.service");
const swagger_1 = require("@nestjs/swagger");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getCustomReport(req, startDate, endDate, jobId, recruiterId) {
        return this.reportsService.getCustomReport(req.user.tenantId, {
            startDate,
            endDate,
            jobId,
            recruiterId,
        });
    }
    async exportReportCsv(req, res, startDate, endDate, jobId, recruiterId) {
        const csv = await this.reportsService.exportReportCsv(req.user.tenantId, {
            startDate,
            endDate,
            jobId,
            recruiterId,
        });
        res.send(csv);
    }
    async getDashboardStats(req) {
        return this.reportsService.getDashboardStats(req.user.tenantId);
    }
    async getHiringFunnel(req, startDate, endDate, jobId) {
        return this.reportsService.getHiringFunnel(req.user.tenantId, { startDate, endDate, jobId });
    }
    async getTimeToHire(req, startDate, endDate) {
        return this.reportsService.getTimeToHire(req.user.tenantId, { startDate, endDate });
    }
    async getSourceEffectiveness(req, startDate, endDate) {
        return this.reportsService.getSourceEffectiveness(req.user.tenantId, { startDate, endDate });
    }
    async getRecruiterPerformance(req, startDate) {
        return this.reportsService.getRecruiterPerformance(req.user.tenantId, { startDate });
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('custom'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate custom report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'jobId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'recruiterId', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('jobId')),
    __param(4, (0, common_1.Query)('recruiterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCustomReport", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="report.csv"'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('jobId')),
    __param(5, (0, common_1.Query)('recruiterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReportCsv", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard summary statistics' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('funnel'),
    (0, swagger_1.ApiOperation)({ summary: 'Get hiring funnel analytics' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'jobId', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getHiringFunnel", null);
__decorate([
    (0, common_1.Get)('time-to-hire'),
    (0, swagger_1.ApiOperation)({ summary: 'Get time-to-hire metrics' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTimeToHire", null);
__decorate([
    (0, common_1.Get)('source-effectiveness'),
    (0, swagger_1.ApiOperation)({ summary: 'Get source effectiveness report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSourceEffectiveness", null);
__decorate([
    (0, common_1.Get)('recruiter-performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recruiter performance metrics' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getRecruiterPerformance", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map