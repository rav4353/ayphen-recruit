import { IsString, Length, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetupMfaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}

export class DisableMfaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;

  @ApiProperty({ example: 'CurrentPass123!' })
  @IsString()
  password: string;
}

export class MfaSetupResponse {
  @ApiProperty({ example: 'otpauth://totp/TalentX:user@example.com?secret=...' })
  otpauthUrl: string;

  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP' })
  secret: string;

  @ApiProperty({ example: 'data:image/png;base64,...' })
  qrCode: string;
}
