import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';
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
    linkedinUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    portfolioUrl?: string;

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
    @IsBoolean()
    gdprConsent?: boolean;
}
