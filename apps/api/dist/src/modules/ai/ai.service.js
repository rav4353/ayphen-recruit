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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let AiService = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://127.0.0.1:8000');
    }
    async generateJd(dto) {
        try {
            const response = await axios_1.default.post(`${this.aiServiceUrl}/generate-jd`, dto);
            return response.data;
        }
        catch (error) {
            console.error('AI Service Error:', error);
            throw new common_1.HttpException('Failed to generate job description', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async checkBias(text) {
        try {
            const response = await axios_1.default.post(`${this.aiServiceUrl}/check-bias`, {
                text,
            });
            return response.data;
        }
        catch (error) {
            console.error('AI Service Error:', error);
            throw new common_1.HttpException('Failed to check bias', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async parseResume(file) {
        try {
            const formData = new FormData();
            const blob = new Blob([file.buffer], { type: file.mimetype });
            formData.append('file', blob, file.originalname);
            const response = await axios_1.default.post(`${this.aiServiceUrl}/parse-resume`, formData);
            return response.data;
        }
        catch (error) {
            console.error('AI Service Error:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                throw new common_1.HttpException(error.response.data?.detail || 'AI Service Error', error.response.status);
            }
            throw new common_1.HttpException('Failed to parse resume. AI service might be unavailable.', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async matchCandidate(resumeText, jobDescription) {
        try {
            const response = await axios_1.default.post(`${this.aiServiceUrl}/match`, {
                resumeText,
                jobDescription,
            });
            return response.data;
        }
        catch (error) {
            console.error('AI Service Error (Match):', error);
            return {
                score: 0,
                matchedSkills: [],
                missingSkills: [],
                summary: 'AI matching unavailable'
            };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map