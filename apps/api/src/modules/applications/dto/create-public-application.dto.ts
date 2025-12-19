import { IsEmail, IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublicApplicationDto {
    @ApiProperty()
    @IsString()
    jobId: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentCompany?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    linkedinUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    portfolioUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    summary?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    skills?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    resumeUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    coverLetter?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    experience?: any[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    education?: any[];

    @ApiPropertyOptional({ description: 'Custom field values as key-value pairs' })
    @IsOptional()
    customFields?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    gdprConsent?: boolean;
}
