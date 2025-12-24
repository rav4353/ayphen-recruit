import { IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum ReviewAction {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class ReviewDocumentDto {
  @ApiProperty({ enum: ReviewAction })
  @IsEnum(ReviewAction)
  @IsNotEmpty()
  status: ReviewAction;
}
