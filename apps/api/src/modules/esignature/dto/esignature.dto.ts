import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEmail,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Define locally until prisma generate runs
type ESignatureProvider = "DOCUSIGN" | "ADOBE_SIGN" | "ZOHO_SIGN";
type ESignatureStatus =
  | "CREATED"
  | "SENT"
  | "DELIVERED"
  | "VIEWED"
  | "SIGNED"
  | "DECLINED"
  | "VOIDED"
  | "EXPIRED";

export class SignerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  order?: number;
}

export class ConfigureESignatureDto {
  @ApiProperty({
    enum: ["DOCUSIGN", "ADOBE_SIGN", "ZOHO_SIGN"],
    default: "DOCUSIGN",
  })
  @IsEnum(["DOCUSIGN", "ADOBE_SIGN", "ZOHO_SIGN"])
  provider: ESignatureProvider;

  @ApiProperty({ description: "OAuth Client ID / Integration Key" })
  @IsString()
  clientId: string;

  @ApiProperty({ description: "OAuth Client Secret" })
  @IsString()
  clientSecret: string;

  @ApiPropertyOptional({ description: "DocuSign Account ID (for production)" })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({
    description: "Base URL (e.g., https://demo.docusign.net for sandbox)",
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;
}

export class ConnectESignatureDto {
  @ApiProperty({ description: "OAuth authorization code" })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: "Redirect URI used in OAuth flow" })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class SendForSignatureDto {
  @ApiProperty({ description: "Offer ID to send for signature" })
  @IsString()
  offerId: string;

  @ApiProperty({ type: [SignerDto], description: "List of signers" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignerDto)
  signers: SignerDto[];

  @ApiPropertyOptional({ description: "Email subject line" })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({ description: "Email body message" })
  @IsOptional()
  @IsString()
  emailMessage?: string;

  @ApiPropertyOptional({ description: "Days until expiration", default: 7 })
  @IsOptional()
  expirationDays?: number;

  @ApiPropertyOptional({ description: "Send reminder emails", default: true })
  @IsOptional()
  @IsBoolean()
  sendReminders?: boolean;
}

export class WebhookEventDto {
  @ApiProperty()
  event: string;

  @ApiPropertyOptional()
  envelopeId?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  data?: any;
}

export class ESignatureStatusResponse {
  envelopeId: string;
  status: ESignatureStatus;
  signers: {
    name: string;
    email: string;
    status: string;
    signedAt?: string;
    declinedAt?: string;
    declineReason?: string;
  }[];
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  declinedAt?: string;
  documentUrl?: string;
  signedDocumentUrl?: string;
}

export class EmbeddedSigningResponse {
  url: string;
  expiresAt: string;
}
