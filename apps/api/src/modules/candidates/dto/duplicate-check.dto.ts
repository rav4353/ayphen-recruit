import { IsEmail, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DuplicateCheckDto {
  @ApiPropertyOptional({ description: "Email to check for duplicates" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Phone number to check for duplicates" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "First name for fuzzy matching" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: "Last name for fuzzy matching" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: "Exclude this candidate ID from results",
  })
  @IsOptional()
  @IsString()
  excludeId?: string;
}

export class DuplicateResult {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ description: "Match confidence: high, medium, low" })
  matchType: "exact_email" | "exact_phone" | "fuzzy_name";

  @ApiProperty({ description: "Confidence score 0-100" })
  confidence: number;
}

export class GdprConsentDto {
  @ApiProperty({ description: "Has the candidate given consent to store data" })
  dataProcessingConsent: boolean;

  @ApiPropertyOptional({
    description: "Has the candidate consented to marketing",
  })
  @IsOptional()
  marketingConsent?: boolean;

  @ApiPropertyOptional({
    description: "Source of consent (e.g., application form, email)",
  })
  @IsOptional()
  @IsString()
  consentSource?: string;
}
