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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const ai_service_1 = require("./ai.service");
const generate_jd_dto_1 = require("./dto/generate-jd.dto");
const check_bias_dto_1 = require("./dto/check-bias.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateJd(dto) {
        const result = await this.aiService.generateJd(dto);
        return api_response_dto_1.ApiResponse.success(result, 'Job description generated successfully');
    }
    async parseResume(file) {
        const result = await this.aiService.parseResume(file);
        return api_response_dto_1.ApiResponse.success(result, 'Resume parsed successfully');
    }
    async checkBias(dto) {
        const result = await this.aiService.checkBias(dto.text);
        return api_response_dto_1.ApiResponse.success(result, 'Bias check completed successfully');
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('generate-jd'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a job description using AI' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_jd_dto_1.GenerateJdDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateJd", null);
__decorate([
    (0, common_1.Post)('parse-resume'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Parse a resume file' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "parseResume", null);
__decorate([
    (0, common_1.Post)('check-bias'),
    (0, swagger_1.ApiOperation)({ summary: 'Check for biased language' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_bias_dto_1.CheckBiasDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "checkBias", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('ai'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map