export declare class CreateJobDto {
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY';
    workLocation?: 'ONSITE' | 'REMOTE' | 'HYBRID';
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    showSalary?: boolean;
    openings?: number;
    skills?: string[];
    experience?: string;
    education?: string;
    departmentId?: string;
    locationId?: string;
    hiringManagerId?: string;
    pipelineId?: string;
    scorecardTemplateId?: string;
    closesAt?: string;
    status?: 'DRAFT' | 'OPEN';
    department?: string;
    recruiterId?: string;
}
