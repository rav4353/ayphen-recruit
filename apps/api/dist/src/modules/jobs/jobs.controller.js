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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jobs_service_1 = require("./jobs.service");
const create_job_dto_1 = require("./dto/create-job.dto");
const update_job_dto_1 = require("./dto/update-job.dto");
const job_query_dto_1 = require("./dto/job-query.dto");
const submit_approval_dto_1 = require("./dto/submit-approval.dto");
const approve_job_dto_1 = require("./dto/approve-job.dto");
const reject_job_dto_1 = require("./dto/reject-job.dto");
const publish_job_dto_1 = require("./dto/publish-job.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let JobsController = class JobsController {
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    validateTenantAccess(userTenantId, paramTenantId) {
        if (userTenantId !== paramTenantId) {
            throw new common_1.BadRequestException('Tenant ID mismatch');
        }
    }
    async create(tenantId, dto, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.create(dto, user.tenantId, user.sub);
        return api_response_dto_1.ApiResponse.created(job, 'Job created successfully');
    }
    async findAll(tenantId, user, query) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const result = await this.jobsService.findAll(user.tenantId, query);
        const enrichedJobs = await this.jobsService.enrichJobsWithStatusColors(result.jobs, user.tenantId);
        return api_response_dto_1.ApiResponse.paginated(enrichedJobs, result.total, query.page || 1, query.limit || 10, 'Jobs retrieved successfully');
    }
    async export(tenantId, user, query, res) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const csv = await this.jobsService.export(user.tenantId, query);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=jobs.csv');
        res.send(csv);
    }
    async findAllPublic(tenantId) {
        const jobs = await this.jobsService.findAllPublic(tenantId);
        return api_response_dto_1.ApiResponse.success(jobs, 'Public jobs retrieved successfully');
    }
    async findOnePublic(tenantId, id) {
        const job = await this.jobsService.findById(id);
        if (job.tenantId !== tenantId || job.status !== 'OPEN') {
            throw new common_1.NotFoundException('Job not found');
        }
        return api_response_dto_1.ApiResponse.success(job, 'Job retrieved successfully');
    }
    async findOne(tenantId, id, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.findById(id);
        if (job.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Job not found');
        }
        const enrichedJob = await this.jobsService.enrichJobsWithStatusColors([job], job.tenantId);
        return api_response_dto_1.ApiResponse.success(enrichedJob[0], 'Job retrieved successfully');
    }
    async update(tenantId, id, dto, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.update(id, dto);
        return api_response_dto_1.ApiResponse.updated(job, 'Job updated successfully');
    }
    async updateStatus(tenantId, id, status, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.updateStatus(id, status);
        return api_response_dto_1.ApiResponse.updated(job, `Job status updated to ${status}`);
    }
    async clone(tenantId, id, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.clone(id, user.tenantId, user.sub);
        return api_response_dto_1.ApiResponse.created(job, 'Job cloned successfully');
    }
    async submitApproval(tenantId, id, dto, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.submitForApproval(id, dto.approverIds || [], user.sub);
        return api_response_dto_1.ApiResponse.success(job, 'Job submitted for approval');
    }
    async approveJob(tenantId, id, dto, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.approve(id, user.sub, dto.comment);
        return api_response_dto_1.ApiResponse.success(job, 'Job approved successfully');
    }
    async rejectJob(tenantId, id, dto, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const job = await this.jobsService.reject(id, user.sub, dto.reason);
        return api_response_dto_1.ApiResponse.success(job, 'Job rejected successfully');
    }
    async publish(tenantId, id, dto, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        const result = await this.jobsService.publish(id, dto.channels);
        return api_response_dto_1.ApiResponse.success(result, 'Job published successfully');
    }
    async getXmlFeed(tenantId, res) {
        const xml = await this.jobsService.generateXmlFeed(tenantId);
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    }
    async remove(tenantId, id, user) {
        this.validateTenantAccess(user.tenantId, tenantId);
        await this.jobsService.remove(id);
        return api_response_dto_1.ApiResponse.deleted('Job deleted successfully');
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new job' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_job_dto_1.CreateJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all jobs' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, job_query_dto_1.JobQueryDto]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Export jobs to CSV' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, job_query_dto_1.JobQueryDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "export", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all public jobs for a tenant' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "findAllPublic", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public job details' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "findOnePublic", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get job by ID' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update job' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_job_dto_1.UpdateJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update job status' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/clone'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Clone a job' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "clone", null);
__decorate([
    (0, common_1.Post)(':id/submit-approval'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Submit job for approval' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, submit_approval_dto_1.SubmitApprovalDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "submitApproval", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Approve job' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, approve_job_dto_1.ApproveJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "approveJob", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Reject job' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, reject_job_dto_1.RejectJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "rejectJob", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Publish job to channels' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, publish_job_dto_1.PublishJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "publish", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('feed/xml'),
    (0, swagger_1.ApiOperation)({ summary: 'Get XML job feed for external boards' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getXmlFeed", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Delete job' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "remove", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(':tenantId/jobs'),
    (0, swagger_1.ApiParam)({ name: 'tenantId', description: 'Tenant ID', type: 'string' }),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map