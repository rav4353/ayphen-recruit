import { IsOptional, IsString, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class JobQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
      "OPEN",
      "ON_HOLD",
      "CLOSED",
      "CANCELLED",
    ],
  })
  @IsOptional()
  @IsIn([
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "OPEN",
    "ON_HOLD",
    "CLOSED",
    "CANCELLED",
  ])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"],
  })
  @IsOptional()
  @IsIn(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"])
  employmentType?: string;

  @ApiPropertyOptional({ enum: ["ONSITE", "REMOTE", "HYBRID"] })
  @IsOptional()
  @IsIn(["ONSITE", "REMOTE", "HYBRID"])
  workLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
