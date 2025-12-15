import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'RECRUITER', enum: ['SUPER_ADMIN', 'ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'CANDIDATE', 'VENDOR'] })
  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'CANDIDATE', 'VENDOR'])
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'CANDIDATE' | 'VENDOR';

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  employeeId: string;

  @ApiPropertyOptional({ example: 'Senior Recruiter' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: ['candidate.view', 'job.create'] })
  @IsOptional()
  @IsString({ each: true })
  customPermissions?: string[];

  @ApiPropertyOptional({ example: 'uuid-role-id' })
  @IsOptional()
  @IsString()
  roleId?: string;
}
