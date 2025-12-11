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
export declare class JobBoardsService {
    private configService;
    private prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    getSettings(tenantId: string): Promise<{
        [key: string]: {
            isConfigured: boolean;
            companyId?: string;
        };
    }>;
    getProviderSettings(tenantId: string, provider: JobBoardProvider): Promise<{
        isConfigured: boolean;
        companyId?: string;
    }>;
    configure(tenantId: string, dto: JobBoardConfig): Promise<{
        provider: JobBoardProvider;
        isConfigured: boolean;
    }>;
    disconnect(tenantId: string, provider: JobBoardProvider): Promise<void>;
    postJob(tenantId: string, jobId: string, providers?: JobBoardProvider[]): Promise<{
        provider: string;
        status: string;
        url?: string;
    }[]>;
    private postToProvider;
    postToLinkedIn(job: Job, config?: JobBoardConfig): Promise<string>;
    postToIndeed(job: Job, config?: JobBoardConfig): Promise<string>;
    postToZipRecruiter(job: Job, config?: JobBoardConfig): Promise<string>;
    postToGlassdoor(job: Job, config?: JobBoardConfig): Promise<string>;
    postToMonster(job: Job, config?: JobBoardConfig): Promise<string>;
    getJobPostings(tenantId: string, jobId: string): Promise<JobPosting[]>;
    removePosting(tenantId: string, postingId: string): Promise<void>;
    getAvailableBoards(): {
        id: string;
        name: string;
        description: string;
        icon: string;
        requiresApiKey: boolean;
        requiresCompanyId: boolean;
    }[];
    generatePublicUrl(job: Job): string;
}
export {};
