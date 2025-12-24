import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoleDto {
  @ApiProperty({ example: "Hiring Manager" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "Can view candidates and jobs, but cannot edit them",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ["candidate.view", "job.view"] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
