import { IsString, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetLogsDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
