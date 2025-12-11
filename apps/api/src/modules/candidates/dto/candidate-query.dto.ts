import { IsOptional, IsString, IsInt, IsArray, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    skills?: string[];

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

    @IsOptional()
    @IsString()
    referrerId?: string;
}
