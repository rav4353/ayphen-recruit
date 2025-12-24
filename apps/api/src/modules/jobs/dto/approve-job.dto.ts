import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ApproveJobDto {
  @ApiProperty({
    description: "Approval decision",
    enum: ["APPROVED", "REJECTED"],
  })
  @IsEnum(["APPROVED", "REJECTED"])
  status: "APPROVED" | "REJECTED";

  @ApiProperty({
    description: "Comment/feedback for the decision",
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: "Rejection reason (required when rejecting)",
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
