// API Response Types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: string[];
  timestamp: string;
}

// Query Params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Entity Types
export interface User {
  id: string;
  employeeId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone?: string;
  title?: string;
  avatarUrl?: string;
  tenantId: string;
  departmentId?: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  tenantId: string;
}

export interface Location {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country: string;
  tenantId: string;
}

export interface Job {
  id: string;
  jobCode?: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  status: JobStatus;
  statusInfo?: {
    name: string;
    code: string;
    fontColor: string;
    bgColor: string;
    borderColor: string;
  };
  employmentType?: EmploymentType;
  workLocation?: WorkLocation;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  showSalary: boolean;
  openings: number;
  skills: string[];
  experience?: string;
  education?: string;
  tenantId: string;
  departmentId?: string;
  department?: Department;
  locationId?: string;
  location?: Location;
  recruiterId: string;
  recruiter?: User;
  hiringManagerId?: string;
  hiringManager?: User;
  pipelineId?: string;
  publishedAt?: string;
  closesAt?: string;
  createdAt: string;
  updatedAt: string;
  approvals?: JobApproval[];
  _count?: {
    applications: number;
  };
}

export interface JobApproval {
  id: string;
  order: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt?: string;
  approverId: string;
  approver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  candidateId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  currentTitle?: string;
  currentCompany?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  source?: string;
  tags: string[];
  skills?: string[];
  experience?: Record<string, any>[];
  education?: Record<string, any>[];
  location?: string;
  summary?: string;
  gdprConsent?: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
  applications?: Application[];
}

export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  tenantId: string;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  pipelineId: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  candidateId: string;
  candidate?: Candidate;
  jobId: string;
  job?: Job;
  currentStageId?: string;
  currentStage?: PipelineStage;
  coverLetter?: string;
  rating?: number;
  matchScore?: number;
  matchSummary?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export type JobStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'OPEN'
  | 'ON_HOLD'
  | 'CLOSED'
  | 'CANCELLED';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'TEMPORARY';

export type WorkLocation = 'ONSITE' | 'REMOTE' | 'HYBRID';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'PHONE_SCREEN'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'INTERVIEWER'
  | 'CANDIDATE'
  | 'VENDOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export interface Interview {
  id: string;
  type: InterviewType;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  cancelReason?: string;
  applicationId: string;
  application?: Application;
  interviewerId: string;
  interviewer?: User;
  feedbacks?: InterviewFeedback[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewFeedback {
  id: string;
  interviewId: string;
  reviewerId: string;
  reviewer?: User;
  rating: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  recommendation?: 'STRONG_YES' | 'YES' | 'NO' | 'STRONG_NO';
  scores?: Record<string, number>;
  submittedAt: string;
  updatedAt: string;
}

export type InterviewType =
  | 'PHONE_SCREEN'
  | 'VIDEO'
  | 'ONSITE'
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'PANEL';

export interface WorkflowAutomation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions?: Record<string, any>;
  actions: Record<string, any>[];
  delayMinutes: number;
  isActive: boolean;
  stageId: string;
  stage?: PipelineStage;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowTrigger = 'STAGE_ENTER' | 'STAGE_EXIT' | 'TIME_IN_STAGE';

export type WorkflowActionType = 'SEND_EMAIL' | 'CREATE_TASK' | 'SEND_SLACK' | 'MOVE_STAGE';
