import { IsString, IsNotEmpty, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    tenantId?: string;

    @IsArray()
    @IsString({ each: true })
    scopes: string[];

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class CreateWebhookDto {
    @IsString()
    @IsNotEmpty()
    url: string;

    @IsOptional()
    @IsString()
    tenantId?: string;

    @IsArray()
    @IsString({ each: true })
    events: string[];
}
