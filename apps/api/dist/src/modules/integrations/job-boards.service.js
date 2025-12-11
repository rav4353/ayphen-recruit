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
var JobBoardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobBoardsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const JOB_BOARD_SETTINGS_KEY = 'job_board_settings';
let JobBoardsService = JobBoardsService_1 = class JobBoardsService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(JobBoardsService_1.name);
    }
    async getSettings(tenantId) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });
        const configs = setting?.value || {};
        const result = {};
        for (const provider of ['LINKEDIN', 'INDEED', 'ZIPRECRUITER', 'GLASSDOOR', 'MONSTER']) {
            const config = configs[provider];
            result[provider] = {
                isConfigured: !!config?.apiKey,
                companyId: config?.companyId,
            };
        }
        return result;
    }
    async getProviderSettings(tenantId, provider) {
        const allSettings = await this.getSettings(tenantId);
        return allSettings[provider] || { isConfigured: false };
    }
    async configure(tenantId, dto) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });
        const configs = setting?.value || {};
        configs[dto.provider] = {
            provider: dto.provider,
            apiKey: dto.apiKey,
            apiSecret: dto.apiSecret,
            companyId: dto.companyId,
            sandboxMode: dto.sandboxMode ?? true,
        };
        await this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
            update: { value: configs, category: 'INTEGRATION' },
            create: { tenantId, key: JOB_BOARD_SETTINGS_KEY, value: configs, category: 'INTEGRATION', isPublic: false },
        });
        return { provider: dto.provider, isConfigured: true };
    }
    async disconnect(tenantId, provider) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });
        if (!setting)
            return;
        const configs = setting.value || {};
        delete configs[provider];
        await this.prisma.setting.update({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
            data: { value: configs },
        });
    }
    async postJob(tenantId, jobId, providers) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, tenantId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });
        const configs = setting?.value || {};
        const targetProviders = providers || Object.keys(configs);
        const results = [];
        for (const provider of targetProviders) {
            const config = configs[provider];
            if (!config?.apiKey) {
                results.push({ provider, status: 'NOT_CONFIGURED' });
                continue;
            }
            try {
                const url = await this.postToProvider(provider, job, config);
                results.push({ provider, status: 'SUCCESS', url });
            }
            catch (error) {
                this.logger.error(`Failed to post job to ${provider}:`, error);
                results.push({ provider, status: 'FAILED' });
            }
        }
        return results;
    }
    async postToProvider(provider, job, config) {
        switch (provider) {
            case 'LINKEDIN':
                return this.postToLinkedIn(job, config);
            case 'INDEED':
                return this.postToIndeed(job, config);
            case 'ZIPRECRUITER':
                return this.postToZipRecruiter(job, config);
            case 'GLASSDOOR':
                return this.postToGlassdoor(job, config);
            case 'MONSTER':
                return this.postToMonster(job, config);
            default:
                throw new common_1.BadRequestException('Unsupported provider');
        }
    }
    async postToLinkedIn(job, config) {
        this.logger.log(`Posting job ${job.id} to LinkedIn...`);
        return `https://www.linkedin.com/jobs/view/mock-${job.id}`;
    }
    async postToIndeed(job, config) {
        this.logger.log(`Posting job ${job.id} to Indeed...`);
        return `https://www.indeed.com/job/mock-${job.id}`;
    }
    async postToZipRecruiter(job, config) {
        this.logger.log(`Posting job ${job.id} to ZipRecruiter...`);
        return `https://www.ziprecruiter.com/job/mock-${job.id}`;
    }
    async postToGlassdoor(job, config) {
        this.logger.log(`Posting job ${job.id} to Glassdoor...`);
        return `https://www.glassdoor.com/job/mock-${job.id}`;
    }
    async postToMonster(job, config) {
        this.logger.log(`Posting job ${job.id} to Monster...`);
        return `https://www.monster.com/job/mock-${job.id}`;
    }
    async getJobPostings(tenantId, jobId) {
        return [];
    }
    async removePosting(tenantId, postingId) {
        this.logger.log(`Removing posting ${postingId}`);
    }
    getAvailableBoards() {
        return [
            {
                id: 'LINKEDIN',
                name: 'LinkedIn',
                description: 'Professional networking and job board',
                icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
                requiresApiKey: true,
                requiresCompanyId: true,
            },
            {
                id: 'INDEED',
                name: 'Indeed',
                description: 'World\'s #1 job site',
                icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Indeed_logo.png',
                requiresApiKey: true,
                requiresCompanyId: false,
            },
            {
                id: 'ZIPRECRUITER',
                name: 'ZipRecruiter',
                description: 'AI-powered job matching',
                icon: 'https://www1.ziprecruiter.com/favicon.ico',
                requiresApiKey: true,
                requiresCompanyId: false,
            },
            {
                id: 'GLASSDOOR',
                name: 'Glassdoor',
                description: 'Jobs and company reviews',
                icon: 'https://www.glassdoor.com/favicon.ico',
                requiresApiKey: true,
                requiresCompanyId: true,
            },
            {
                id: 'MONSTER',
                name: 'Monster',
                description: 'Global employment website',
                icon: 'https://www.monster.com/favicon.ico',
                requiresApiKey: true,
                requiresCompanyId: false,
            },
        ];
    }
    generatePublicUrl(job) {
        const baseUrl = this.configService.get('WEB_URL') || 'http://localhost:3000';
        return `${baseUrl}/careers/${job.id}`;
    }
};
exports.JobBoardsService = JobBoardsService;
exports.JobBoardsService = JobBoardsService = JobBoardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JobBoardsService);
//# sourceMappingURL=job-boards.service.js.map