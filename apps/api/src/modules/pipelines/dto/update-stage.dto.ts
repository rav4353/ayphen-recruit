import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateStageDto {
  @ApiPropertyOptional({ example: "Screening" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "#3B82F6" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  slaDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;
}

export class AddStageDto {
  @ApiPropertyOptional({ example: "Screening" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "#3B82F6" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  slaDays?: number;
}
