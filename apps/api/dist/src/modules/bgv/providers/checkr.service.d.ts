export interface CheckrConfig {
    apiKey: string;
    sandboxMode?: boolean;
}
interface CheckrCandidate {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}
interface CheckrInvitation {
    id: string;
    status: string;
    invitation_url: string;
    candidate_id: string;
}
interface CheckrReport {
    id: string;
    status: string;
    result: string;
    completed_at?: string;
    package: string;
    candidate_id: string;
}
export declare class CheckrService {
    private readonly logger;
    private getBaseUrl;
    createCandidate(config: CheckrConfig, data: {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        dob?: string;
        ssn?: string;
    }): Promise<CheckrCandidate>;
    createInvitation(config: CheckrConfig, candidateId: string, packageName?: string): Promise<CheckrInvitation>;
    getReport(config: CheckrConfig, reportId: string): Promise<CheckrReport>;
    getCandidateReports(config: CheckrConfig, candidateId: string): Promise<CheckrReport[]>;
    mapStatus(checkrStatus: string, checkrResult?: string): string;
    getPackages(config: CheckrConfig): Promise<{
        id: string;
        name: string;
        screenings: string[];
    }[]>;
}
export {};
