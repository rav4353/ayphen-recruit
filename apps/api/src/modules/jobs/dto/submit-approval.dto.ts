import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SubmitApprovalDto {
  @ApiProperty({
    description: "List of user IDs who need to approve",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  approverIds?: string[];

  @ApiProperty({
    description: "Comment when resubmitting for approval",
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
