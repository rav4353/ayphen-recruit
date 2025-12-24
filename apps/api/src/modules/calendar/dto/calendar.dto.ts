import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Define locally - will be imported from @prisma/client after prisma generate
type CalendarProvider = "GOOGLE" | "OUTLOOK";

export class ConnectCalendarDto {
  @ApiProperty({ enum: ["GOOGLE", "OUTLOOK"] })
  @IsEnum(["GOOGLE", "OUTLOOK"])
  provider: CalendarProvider;

  @ApiProperty({ description: "OAuth authorization code" })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: "Redirect URI used in OAuth flow" })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class CreateCalendarEventDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: "Video meeting link (Zoom, Meet, Teams)",
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional({
    type: [String],
    description: "List of attendee emails",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @ApiPropertyOptional({ description: "Interview ID to link this event to" })
  @IsOptional()
  @IsString()
  interviewId?: string;

  @ApiPropertyOptional({ enum: ["GOOGLE", "OUTLOOK"] })
  @IsOptional()
  @IsEnum(["GOOGLE", "OUTLOOK"])
  provider?: CalendarProvider;

  @ApiPropertyOptional({ description: "Generate ICS file" })
  @IsOptional()
  @IsBoolean()
  generateIcs?: boolean;
}

export class UpdateCalendarEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];
}

export class FreeBusyQueryDto {
  @ApiProperty({
    type: [String],
    description: "User IDs to check availability for",
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: "Duration in minutes for each slot" })
  @IsOptional()
  durationMinutes?: number;
}

export class AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

export class UserAvailability {
  userId: string;
  email: string;
  name: string;
  connected: boolean;
  slots: AvailabilitySlot[];
}
