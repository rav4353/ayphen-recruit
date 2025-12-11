export declare class CandidateQueryDto {
    skip?: number;
    take?: number;
    page?: number;
    search?: string;
    skills?: string[];
    location?: string;
    source?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    referrerId?: string;
}
