import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export enum AnnouncementType {
    INFO = 'info',
    WARNING = 'warning',
    SUCCESS = 'success',
    CRITICAL = 'critical',
}

export enum AnnouncementPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum AnnouncementAudience {
    ALL = 'all',
    ADMINS = 'admins',
    SPECIFIC_TENANTS = 'specific_tenants',
}

export enum AnnouncementStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    EXPIRED = 'expired',
}

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    message: string; // Frontend sends message, mapped to content

    @IsEnum(AnnouncementType)
    type: AnnouncementType;

    @IsEnum(AnnouncementPriority)
    @IsOptional()
    priority?: AnnouncementPriority;

    @IsEnum(AnnouncementAudience)
    @IsOptional()
    audience?: AnnouncementAudience;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    targetTenantIds?: string[];

    @IsBoolean()
    @IsOptional()
    dismissible?: boolean;

    @IsBoolean()
    @IsOptional()
    showBanner?: boolean;

    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @IsEnum(AnnouncementStatus)
    @IsOptional()
    status?: AnnouncementStatus;
}

export class UpdateAnnouncementDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsEnum(AnnouncementType)
    @IsOptional()
    type?: AnnouncementType;

    @IsEnum(AnnouncementPriority)
    @IsOptional()
    priority?: AnnouncementPriority;

    @IsEnum(AnnouncementAudience)
    @IsOptional()
    audience?: AnnouncementAudience;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    targetTenantIds?: string[];

    @IsBoolean()
    @IsOptional()
    dismissible?: boolean;

    @IsBoolean()
    @IsOptional()
    showBanner?: boolean;

    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @IsEnum(AnnouncementStatus)
    @IsOptional()
    status?: AnnouncementStatus;
}
