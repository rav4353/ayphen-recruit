import { InterviewType } from '@prisma/client';
export declare class CreateInterviewDto {
    applicationId: string;
    interviewerId: string;
    type: InterviewType;
    scheduledAt: string;
    duration: number;
    location?: string;
    meetingLink?: string;
    notes?: string;
}
