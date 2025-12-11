import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  candidateId: string;

  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Answers to screening questions' })
  @IsOptional()
  answers?: Record<string, unknown>;
}
