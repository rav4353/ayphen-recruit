import { PartialType } from "@nestjs/swagger";
import { CreateInterviewDto } from "./create-interview.dto";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { InterviewStatus } from "@prisma/client";

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}
