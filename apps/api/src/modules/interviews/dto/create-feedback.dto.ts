import { IsString, IsInt, IsOptional, Min, Max, IsEnum } from 'class-validator';

export enum FeedbackRecommendation {
    STRONG_YES = 'STRONG_YES',
    YES = 'YES',
    NO = 'NO',
    STRONG_NO = 'STRONG_NO',
}

export class CreateFeedbackDto {
    @IsString()
    interviewId: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    strengths?: string;

    @IsOptional()
    @IsString()
    weaknesses?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsEnum(FeedbackRecommendation)
    recommendation?: FeedbackRecommendation;

    @IsOptional()
    scores?: Record<string, number>; // Scorecard scores
}
