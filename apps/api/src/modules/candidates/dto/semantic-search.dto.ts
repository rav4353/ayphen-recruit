import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SemanticSearchDto {
    @ApiProperty({ description: 'Natural language search query', example: 'React developers with 5+ years experience' })
    @IsString()
    query: string;

    @ApiPropertyOptional({ description: 'Maximum number of results', default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ description: 'Minimum match score (0-1)', default: 0.5 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    minScore?: number;

    @ApiPropertyOptional({ description: 'Filter by skills', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @ApiPropertyOptional({ description: 'Filter by location' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Candidate IDs to exclude', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    excludeCandidateIds?: string[];
}

export class MatchCandidatesToJobDto {
    @ApiProperty({ description: 'Job ID to match candidates against' })
    @IsString()
    jobId: string;

    @ApiPropertyOptional({ description: 'Maximum number of results', default: 50 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(200)
    limit?: number;
}

export class TalentRecommendationsDto {
    @ApiPropertyOptional({ description: 'Target role/title' })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ description: 'Required skills', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @ApiPropertyOptional({ description: 'Seniority level', enum: ['junior', 'mid', 'senior', 'lead'] })
    @IsOptional()
    @IsString()
    seniority?: 'junior' | 'mid' | 'senior' | 'lead';

    @ApiPropertyOptional({ description: 'Industry preference' })
    @IsOptional()
    @IsString()
    industry?: string;
}

export class FindSimilarCandidatesDto {
    @ApiProperty({ description: 'Candidate ID to find similar profiles for' })
    @IsString()
    candidateId: string;

    @ApiPropertyOptional({ description: 'Maximum number of results', default: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number;
}
