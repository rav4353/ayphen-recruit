import { ApiResponse } from '../../common/dto/api-response.dto';
import { JobBoardsService } from './job-boards.service';
export type JobBoardProvider = 'LINKEDIN' | 'INDEED' | 'ZIPRECRUITER' | 'GLASSDOOR' | 'MONSTER';
export declare class ConfigureJobBoardDto {
    provider: JobBoardProvider;
    apiKey: string;
    apiSecret?: string;
    companyId?: string;
    sandboxMode?: boolean;
}
export declare class PostJobDto {
    jobId: string;
    providers?: JobBoardProvider[];
}
export declare class JobBoardsController {
    private readonly jobBoardsService;
    constructor(jobBoardsService: JobBoardsService);
    getSettings(req: any): Promise<ApiResponse<{
        [key: string]: {
            isConfigured: boolean;
            companyId?: string;
        };
    }>>;
    getProviderSettings(provider: JobBoardProvider, req: any): Promise<ApiResponse<{
        isConfigured: boolean;
        companyId?: string;
    }>>;
    configure(dto: ConfigureJobBoardDto, req: any): Promise<ApiResponse<{
        provider: import("./job-boards.service").JobBoardProvider;
        isConfigured: boolean;
    }>>;
    disconnect(provider: JobBoardProvider, req: any): Promise<ApiResponse<null>>;
    postJob(dto: PostJobDto, req: any): Promise<ApiResponse<{
        provider: string;
        status: string;
        url?: string;
    }[]>>;
    getJobPostings(jobId: string, req: any): Promise<ApiResponse<import("./job-boards.service").JobPosting[]>>;
    removePosting(postingId: string, req: any): Promise<ApiResponse<null>>;
    getAvailableBoards(): Promise<ApiResponse<{
        id: string;
        name: string;
        description: string;
        icon: string;
        requiresApiKey: boolean;
        requiresCompanyId: boolean;
    }[]>>;
}
