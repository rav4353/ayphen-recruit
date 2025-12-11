import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateJdDto {
    @ApiProperty({ example: 'Senior Software Engineer' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Engineering' })
    @IsString()
    @IsOptional()
    department?: string;

    @ApiPropertyOptional({ example: ['React', 'Node.js', 'TypeScript'] })
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    skills?: string[];

    @ApiPropertyOptional({ example: '5+ years of experience' })
    @IsString()
    @IsOptional()
    experience?: string;

    @ApiPropertyOptional({ example: 'professional' })
    @IsString()
    @IsOptional()
    tone?: string;
}
