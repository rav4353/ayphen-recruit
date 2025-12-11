import { IsString, IsEnum, IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
    @IsString()
    applicationId: string;

    @IsString()
    interviewerId: string;

    @IsEnum(InterviewType)
    type: InterviewType;

    @IsDateString()
    scheduledAt: string;

    @IsInt()
    @Min(15)
    duration: number;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    meetingLink?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
