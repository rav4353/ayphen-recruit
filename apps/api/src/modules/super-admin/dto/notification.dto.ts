import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
} from "class-validator";

export enum NotificationType {
  SYSTEM = "SYSTEM",
  SECURITY = "SECURITY",
  TENANT = "TENANT",
  SUBSCRIPTION = "SUBSCRIPTION",
  SUPPORT = "SUPPORT",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  USER = "USER",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  superAdminId?: string; // If not provided, sends to all super admins
}

export class MarkNotificationsReadDto {
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

export class GetNotificationsQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;
}
