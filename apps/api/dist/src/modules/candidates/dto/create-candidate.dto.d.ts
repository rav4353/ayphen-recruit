export declare class CreateCandidateDto {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    summary?: string;
    skills?: string[];
    source?: string;
    gdprConsent?: boolean;
    tags?: string[];
    experience?: Record<string, any>[];
    education?: Record<string, any>[];
    resumeUrl?: string;
    referrerId?: string;
}
