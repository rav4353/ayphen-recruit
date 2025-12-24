import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum DocumentStatus {
  REQUESTED = "REQUESTED",
  UPLOADED = "UPLOADED",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class CreateApplicationDocumentDto {
  @ApiProperty({ example: "Educational Certificates" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Please upload your degree certificates" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

export class UpdateApplicationDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;
}

export class ReviewDocumentDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED"] })
  @IsEnum(["APPROVED", "REJECTED"])
  status: "APPROVED" | "REJECTED";

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
