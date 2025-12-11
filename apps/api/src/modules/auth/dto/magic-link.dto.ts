import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestMagicLinkDto {
  @ApiProperty({ example: 'candidate@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'tenant-uuid' })
  @IsString()
  tenantId: string;
}

export class VerifyMagicLinkDto {
  @ApiProperty({ example: 'magic-link-token-uuid' })
  @IsString()
  token: string;
}
