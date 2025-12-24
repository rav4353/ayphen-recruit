import { IsOptional, IsString, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"] })
  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"])
  status?: string;

  @ApiPropertyOptional({
    enum: [
      "SUPER_ADMIN",
      "ADMIN",
      "RECRUITER",
      "HIRING_MANAGER",
      "INTERVIEWER",
      "CANDIDATE",
      "VENDOR",
    ],
  })
  @IsOptional()
  @IsIn([
    "SUPER_ADMIN",
    "ADMIN",
    "RECRUITER",
    "HIRING_MANAGER",
    "INTERVIEWER",
    "CANDIDATE",
    "VENDOR",
  ])
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}
