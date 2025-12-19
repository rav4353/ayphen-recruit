import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Job } from '@prisma/client';

export type JobBoardProvider = 'LINKEDIN' | 'INDEED' | 'ZIPRECRUITER' | 'GLASSDOOR' | 'MONSTER';

interface JobBoardConfig {
    provider: JobBoardProvider;
    apiKey: string;
    apiSecret?: string;
    companyId?: string;
    sandboxMode?: boolean;
}

export interface JobPosting {
    id: string;
    jobId: string;
    provider: JobBoardProvider;
    externalId?: string;
    externalUrl?: string;
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REMOVED';
    postedAt: Date;
}

const JOB_BOARD_SETTINGS_KEY = 'job_board_settings';

@Injectable()
export class JobBoardsService {
    private readonly logger = new Logger(JobBoardsService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {}

    /**
     * Get all job board configurations for a tenant
     */
    async getSettings(tenantId: string): Promise<{ [key: string]: { isConfigured: boolean; companyId?: string } }> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });

        const configs = (setting?.value as unknown as Record<string, JobBoardConfig>) || {};
        
        // Return sanitized settings (no API keys exposed)
        const result: { [key: string]: { isConfigured: boolean; companyId?: string } } = {};
        for (const provider of ['LINKEDIN', 'INDEED', 'ZIPRECRUITER', 'GLASSDOOR', 'MONSTER'] as JobBoardProvider[]) {
            const config = configs[provider];
            result[provider] = {
                isConfigured: !!config?.apiKey,
                companyId: config?.companyId,
            };
        }
        return result;
    }

    /**
     * Get specific provider settings
     */
    async getProviderSettings(tenantId: string, provider: JobBoardProvider): Promise<{ isConfigured: boolean; companyId?: string }> {
        const allSettings = await this.getSettings(tenantId);
        return allSettings[provider] || { isConfigured: false };
    }

    /**
     * Configure a job board provider
     */
    async configure(tenantId: string, dto: JobBoardConfig) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });

        const configs = (setting?.value as unknown as Record<string, JobBoardConfig>) || {};
        configs[dto.provider] = {
            provider: dto.provider,
            apiKey: dto.apiKey,
            apiSecret: dto.apiSecret,
            companyId: dto.companyId,
            sandboxMode: dto.sandboxMode ?? true,
        };

        await this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
            update: { value: configs as any, category: 'INTEGRATION' },
            create: { tenantId, key: JOB_BOARD_SETTINGS_KEY, value: configs as any, category: 'INTEGRATION', isPublic: false },
        });

        return { provider: dto.provider, isConfigured: true };
    }

    /**
     * Disconnect a job board provider
     */
    async disconnect(tenantId: string, provider: JobBoardProvider) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });

        if (!setting) return;

        const configs = (setting.value as unknown as Record<string, JobBoardConfig>) || {};
        delete configs[provider];

        await this.prisma.setting.update({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
            data: { value: configs as any },
        });
    }

    /**
     * Post a job to job boards
     */
    async postJob(tenantId: string, jobId: string, providers?: JobBoardProvider[]): Promise<{ provider: string; status: string; url?: string }[]> {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, tenantId },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: JOB_BOARD_SETTINGS_KEY } },
        });

        const configs = (setting?.value as unknown as Record<string, JobBoardConfig>) || {};
        const targetProviders = providers || (Object.keys(configs) as JobBoardProvider[]);
        const results: { provider: string; status: string; url?: string }[] = [];

        for (const provider of targetProviders) {
            const config = configs[provider];
            if (!config?.apiKey) {
                results.push({ provider, status: 'NOT_CONFIGURED' });
                continue;
            }

            try {
                const url = await this.postToProvider(provider, job, config);
                results.push({ provider, status: 'SUCCESS', url });
            } catch (error) {
                this.logger.error(`Failed to post job to ${provider}:`, error);
                results.push({ provider, status: 'FAILED' });
            }
        }

        return results;
    }

    /**
     * Post to specific provider
     */
    private async postToProvider(provider: JobBoardProvider, job: Job, config: JobBoardConfig): Promise<string> {
        // In a real implementation, these would make actual API calls
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
                throw new BadRequestException('Unsupported provider');
        }
    }

    async postToLinkedIn(job: Job, config?: JobBoardConfig): Promise<string> {
        this.logger.log(`Posting job ${job.id} to LinkedIn...`);
        
        if (!config?.apiKey || !config?.companyId) {
            throw new BadRequestException('LinkedIn API key and company ID required');
        }

        // LinkedIn Jobs API - POST to job postings endpoint
        const response = await fetch('https://api.linkedin.com/v2/simpleJobPostings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                companyId: config.companyId,
                title: job.title,
                description: job.description,
                location: job.locationId || 'Remote',
                employmentType: this.mapEmploymentType(job.employmentType, 'LINKEDIN'),
                listedAt: Date.now(),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`LinkedIn API error: ${error}`);
            throw new Error(`LinkedIn posting failed: ${response.status}`);
        }

        const result = await response.json() as { id?: string };
        return `https://www.linkedin.com/jobs/view/${result.id || job.id}`;
    }

    async postToIndeed(job: Job, config?: JobBoardConfig): Promise<string> {
        this.logger.log(`Posting job ${job.id} to Indeed...`);
        
        if (!config?.apiKey) {
            throw new BadRequestException('Indeed API key required');
        }

        // Indeed Sponsored Jobs API
        const response = await fetch('https://apis.indeed.com/v2/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobTitle: job.title,
                jobDescription: job.description,
                company: config.companyId || 'Company',
                location: job.locationId || 'Remote',
                jobType: this.mapEmploymentType(job.employmentType, 'INDEED'),
                salary: job.salaryMax ? { max: Number(job.salaryMax), currency: 'USD' } : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`Indeed API error: ${error}`);
            throw new Error(`Indeed posting failed: ${response.status}`);
        }

        const result = await response.json() as { jobKey?: string };
        return `https://www.indeed.com/viewjob?jk=${result.jobKey || job.id}`;
    }

    async postToZipRecruiter(job: Job, config?: JobBoardConfig): Promise<string> {
        this.logger.log(`Posting job ${job.id} to ZipRecruiter...`);
        
        if (!config?.apiKey) {
            throw new BadRequestException('ZipRecruiter API key required');
        }

        const apiUrl = config.sandboxMode 
            ? 'https://api.sandbox.ziprecruiter.com/jobs/v1/jobs'
            : 'https://api.ziprecruiter.com/jobs/v1/jobs';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_title: job.title,
                job_description: job.description,
                company_name: config.companyId || 'Company',
                job_type: this.mapEmploymentType(job.employmentType, 'ZIPRECRUITER'),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`ZipRecruiter API error: ${error}`);
            throw new Error(`ZipRecruiter posting failed: ${response.status}`);
        }

        const result = await response.json() as { id?: string; url?: string };
        return result.url || `https://www.ziprecruiter.com/jobs/${result.id || job.id}`;
    }

    async postToGlassdoor(job: Job, config?: JobBoardConfig): Promise<string> {
        this.logger.log(`Posting job ${job.id} to Glassdoor...`);
        
        if (!config?.apiKey || !config?.companyId) {
            throw new BadRequestException('Glassdoor API key and company ID required');
        }

        // Glassdoor Job Posting API
        const response = await fetch('https://api.glassdoor.com/api/v1/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employerId: config.companyId,
                jobTitle: job.title,
                jobDescription: job.description,
                location: job.locationId || 'Remote',
                jobType: this.mapEmploymentType(job.employmentType, 'GLASSDOOR'),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`Glassdoor API error: ${error}`);
            throw new Error(`Glassdoor posting failed: ${response.status}`);
        }

        const result = await response.json() as { jobId?: string };
        return `https://www.glassdoor.com/job-listing/${result.jobId || job.id}`;
    }

    async postToMonster(job: Job, config?: JobBoardConfig): Promise<string> {
        this.logger.log(`Posting job ${job.id} to Monster...`);
        
        if (!config?.apiKey) {
            throw new BadRequestException('Monster API key required');
        }

        // Monster Job Posting API
        const response = await fetch('https://api.monster.com/v2/job', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobTitle: job.title,
                jobDescription: job.description,
                companyName: config.companyId || 'Company',
                location: job.locationId || 'Remote',
                jobType: this.mapEmploymentType(job.employmentType, 'MONSTER'),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`Monster API error: ${error}`);
            throw new Error(`Monster posting failed: ${response.status}`);
        }

        const result = await response.json() as { jobId?: string };
        return `https://www.monster.com/job-openings/${result.jobId || job.id}`;
    }

    private mapEmploymentType(type: string | null, provider: string): string {
        const typeUpper = (type || 'FULL_TIME').toUpperCase();
        const mappings: Record<string, Record<string, string>> = {
            LINKEDIN: { FULL_TIME: 'FULL_TIME', PART_TIME: 'PART_TIME', CONTRACT: 'CONTRACT', INTERNSHIP: 'INTERNSHIP' },
            INDEED: { FULL_TIME: 'fulltime', PART_TIME: 'parttime', CONTRACT: 'contract', INTERNSHIP: 'internship' },
            ZIPRECRUITER: { FULL_TIME: 'full_time', PART_TIME: 'part_time', CONTRACT: 'contract', INTERNSHIP: 'internship' },
            GLASSDOOR: { FULL_TIME: 'FULLTIME', PART_TIME: 'PARTTIME', CONTRACT: 'CONTRACT', INTERNSHIP: 'INTERN' },
            MONSTER: { FULL_TIME: 'Full-Time', PART_TIME: 'Part-Time', CONTRACT: 'Contract', INTERNSHIP: 'Internship' },
        };
        return mappings[provider]?.[typeUpper] || typeUpper;
    }

    /**
     * Get job postings for a job
     */
    async getJobPostings(tenantId: string, jobId: string): Promise<JobPosting[]> {
        // In real implementation, this would fetch from a JobPosting table
        // For now, return empty array
        return [];
    }

    /**
     * Remove a job posting
     */
    async removePosting(tenantId: string, postingId: string): Promise<void> {
        // In real implementation, this would delete from provider and database
        this.logger.log(`Removing posting ${postingId}`);
    }

    /**
     * Get available job boards with metadata
     */
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

    generatePublicUrl(job: Job): string {
        const baseUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
        return `${baseUrl}/careers/${job.id}`;
    }
}
