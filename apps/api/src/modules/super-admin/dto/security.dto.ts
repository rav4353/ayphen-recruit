import { IsString, IsNotEmpty, IsIP, IsOptional } from "class-validator";

export class BlockIpDto {
  @IsIP()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ResolveAlertDto {
  @IsString()
  @IsOptional()
  status?: string;
}
