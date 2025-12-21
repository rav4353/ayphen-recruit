import { IsString, IsEnum, IsDateString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VideoMeetingProviderEnum {
    GOOGLE_MEET = 'GOOGLE_MEET',
    ZOOM = 'ZOOM',
    MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
}

export class CreateMeetingDto {
    @ApiProperty({ enum: VideoMeetingProviderEnum, description: 'Video meeting provider' })
    @IsEnum(VideoMeetingProviderEnum)
    provider: VideoMeetingProviderEnum;

    @ApiProperty({ description: 'Meeting topic/title' })
    @IsString()
    topic: string;

    @ApiProperty({ description: 'Meeting start time (ISO 8601)' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ description: 'Meeting duration in minutes', minimum: 15, maximum: 480 })
    @IsNumber()
    @Min(15)
    @Max(480)
    durationMinutes: number;

    @ApiPropertyOptional({ description: 'List of attendee emails', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attendees?: string[];

    @ApiPropertyOptional({ description: 'Meeting description/agenda' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class SaveZoomConfigDto {
    @ApiProperty({ description: 'Zoom Account ID (Server-to-Server OAuth)' })
    @IsString()
    accountId: string;

    @ApiProperty({ description: 'Zoom OAuth Client ID' })
    @IsString()
    clientId: string;

    @ApiProperty({ description: 'Zoom OAuth Client Secret' })
    @IsString()
    clientSecret: string;
}

export class SaveGoogleMeetConfigDto {
    @ApiProperty({ description: 'Google OAuth Client ID' })
    @IsString()
    clientId: string;

    @ApiProperty({ description: 'Google OAuth Client Secret' })
    @IsString()
    clientSecret: string;

    @ApiProperty({ description: 'Google OAuth Refresh Token' })
    @IsString()
    refreshToken: string;
}

export class SaveTeamsConfigDto {
    @ApiProperty({ description: 'Microsoft App Client ID' })
    @IsString()
    clientId: string;

    @ApiProperty({ description: 'Microsoft App Client Secret' })
    @IsString()
    clientSecret: string;

    @ApiProperty({ description: 'Microsoft Tenant ID' })
    @IsString()
    tenantId: string;
}

export class DeleteMeetingDto {
    @ApiProperty({ enum: VideoMeetingProviderEnum })
    @IsEnum(VideoMeetingProviderEnum)
    provider: VideoMeetingProviderEnum;

    @ApiProperty({ description: 'Meeting ID to delete' })
    @IsString()
    meetingId: string;
}
