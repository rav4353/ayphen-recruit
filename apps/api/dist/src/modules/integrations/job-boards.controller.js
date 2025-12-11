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
exports.JobBoardsController = exports.PostJobDto = exports.ConfigureJobBoardDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const job_boards_service_1 = require("./job-boards.service");
const class_validator_1 = require("class-validator");
class ConfigureJobBoardDto {
}
exports.ConfigureJobBoardDto = ConfigureJobBoardDto;
__decorate([
    (0, class_validator_1.IsEnum)(['LINKEDIN', 'INDEED', 'ZIPRECRUITER', 'GLASSDOOR', 'MONSTER']),
    __metadata("design:type", String)
], ConfigureJobBoardDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureJobBoardDto.prototype, "apiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureJobBoardDto.prototype, "apiSecret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureJobBoardDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfigureJobBoardDto.prototype, "sandboxMode", void 0);
class PostJobDto {
}
exports.PostJobDto = PostJobDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostJobDto.prototype, "jobId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PostJobDto.prototype, "providers", void 0);
let JobBoardsController = class JobBoardsController {
    constructor(jobBoardsService) {
        this.jobBoardsService = jobBoardsService;
    }
    async getSettings(req) {
        const tenantId = req.user.tenantId;
        const settings = await this.jobBoardsService.getSettings(tenantId);
        return api_response_dto_1.ApiResponse.success(settings, 'Job board settings retrieved');
    }
    async getProviderSettings(provider, req) {
        const tenantId = req.user.tenantId;
        const settings = await this.jobBoardsService.getProviderSettings(tenantId, provider);
        return api_response_dto_1.ApiResponse.success(settings, 'Job board settings retrieved');
    }
    async configure(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.jobBoardsService.configure(tenantId, dto);
        return api_response_dto_1.ApiResponse.success(result, 'Job board configured successfully');
    }
    async disconnect(provider, req) {
        const tenantId = req.user.tenantId;
        await this.jobBoardsService.disconnect(tenantId, provider);
        return api_response_dto_1.ApiResponse.success(null, 'Job board disconnected successfully');
    }
    async postJob(dto, req) {
        const tenantId = req.user.tenantId;
        const result = await this.jobBoardsService.postJob(tenantId, dto.jobId, dto.providers);
        return api_response_dto_1.ApiResponse.success(result, 'Job posted to boards');
    }
    async getJobPostings(jobId, req) {
        const tenantId = req.user.tenantId;
        const postings = await this.jobBoardsService.getJobPostings(tenantId, jobId);
        return api_response_dto_1.ApiResponse.success(postings, 'Job postings retrieved');
    }
    async removePosting(postingId, req) {
        const tenantId = req.user.tenantId;
        await this.jobBoardsService.removePosting(tenantId, postingId);
        return api_response_dto_1.ApiResponse.success(null, 'Job posting removed');
    }
    async getAvailableBoards() {
        const boards = this.jobBoardsService.getAvailableBoards();
        return api_response_dto_1.ApiResponse.success(boards, 'Available job boards');
    }
};
exports.JobBoardsController = JobBoardsController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all job board configurations' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Get)('settings/:provider'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific job board configuration' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "getProviderSettings", null);
__decorate([
    (0, common_1.Post)('configure'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Configure a job board provider' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConfigureJobBoardDto, Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "configure", null);
__decorate([
    (0, common_1.Delete)('settings/:provider'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect a job board provider' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Post)('post-job'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Post a job to connected boards' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "postJob", null);
__decorate([
    (0, common_1.Get)('postings/:jobId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get job postings for a specific job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "getJobPostings", null);
__decorate([
    (0, common_1.Delete)('postings/:postingId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a job posting from a board' }),
    __param(0, (0, common_1.Param)('postingId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "removePosting", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of available job boards' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobBoardsController.prototype, "getAvailableBoards", null);
exports.JobBoardsController = JobBoardsController = __decorate([
    (0, swagger_1.ApiTags)('job-boards'),
    (0, common_1.Controller)('job-boards'),
    __metadata("design:paramtypes", [job_boards_service_1.JobBoardsService])
], JobBoardsController);
//# sourceMappingURL=job-boards.controller.js.map