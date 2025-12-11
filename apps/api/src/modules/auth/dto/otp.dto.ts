import { IsEmail, IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OtpType {
  LOGIN = 'LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFY = 'EMAIL_VERIFY',
}

export class RequestOtpDto {
  @ApiProperty({ example: 'candidate@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'tenant-uuid' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'LOGIN', enum: OtpType })
  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'candidate@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'tenant-uuid' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code: string;

  @ApiPropertyOptional({ example: 'LOGIN', enum: OtpType })
  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;
}
