import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import axios from 'axios';

export type VideoMeetingProvider = 'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS';

export interface MeetingDetails {
    provider: VideoMeetingProvider;
    meetingId: string;
    meetingLink: string;
    joinUrl: string;
    hostUrl?: string;
    password?: string;
    dialInNumbers?: { country: string; number: string }[];
    startTime: Date;
    endTime: Date;
    topic: string;
}

export interface CreateMeetingDto {
    provider: VideoMeetingProvider;
    topic: string;
    startTime: Date;
    durationMinutes: number;
    attendees?: string[];
    description?: string;
}

interface ZoomConfig {
    accountId: string;
    clientId: string;
    clientSecret: string;
}

interface GoogleMeetConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}

interface TeamsConfig {
    clientId: string;
    clientSecret: string;
    tenantId: string;
}

// Settings keys
const ZOOM_CONFIG_KEY = 'zoom_config';
const GOOGLE_MEET_CONFIG_KEY = 'google_meet_config';
const TEAMS_CONFIG_KEY = 'microsoft_teams_config';

@Injectable()
export class VideoMeetingService {
    private readonly logger = new Logger(VideoMeetingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Get provider configuration from tenant settings
     */
    private async getZoomConfig(tenantId: string): Promise<ZoomConfig | null> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: ZOOM_CONFIG_KEY } },
        });
        return setting?.value as unknown as ZoomConfig | null;
    }

    private async getGoogleMeetConfig(tenantId: string): Promise<GoogleMeetConfig | null> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: GOOGLE_MEET_CONFIG_KEY } },
        });
        return setting?.value as unknown as GoogleMeetConfig | null;
    }

    private async getTeamsConfig(tenantId: string): Promise<TeamsConfig | null> {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: TEAMS_CONFIG_KEY } },
        });
        return setting?.value as unknown as TeamsConfig | null;
    }

    /**
     * Save provider configuration
     */
    async saveZoomConfig(tenantId: string, config: ZoomConfig) {
        return this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: ZOOM_CONFIG_KEY } },
            update: { value: config as unknown as Prisma.InputJsonValue, category: 'INTEGRATION' },
            create: { tenantId, key: ZOOM_CONFIG_KEY, value: config as unknown as Prisma.InputJsonValue, category: 'INTEGRATION', isPublic: false },
        });
    }

    async saveGoogleMeetConfig(tenantId: string, config: GoogleMeetConfig) {
        return this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: GOOGLE_MEET_CONFIG_KEY } },
            update: { value: config as unknown as Prisma.InputJsonValue, category: 'INTEGRATION' },
            create: { tenantId, key: GOOGLE_MEET_CONFIG_KEY, value: config as unknown as Prisma.InputJsonValue, category: 'INTEGRATION', isPublic: false },
        });
    }

    async saveTeamsConfig(tenantId: string, config: TeamsConfig) {
        return this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: TEAMS_CONFIG_KEY } },
            update: { value: config as unknown as Prisma.InputJsonValue, category: 'INTEGRATION' },
            create: { tenantId, key: TEAMS_CONFIG_KEY, value: config as unknown as Prisma.InputJsonValue, category: 'INTEGRATION', isPublic: false },
        });
    }

    /**
     * Get configured providers for a tenant
     */
    async getConfiguredProviders(tenantId: string): Promise<{
        providers: { provider: VideoMeetingProvider; configured: boolean; name: string }[];
    }> {
        const [zoomConfig, googleConfig, teamsConfig] = await Promise.all([
            this.getZoomConfig(tenantId),
            this.getGoogleMeetConfig(tenantId),
            this.getTeamsConfig(tenantId),
        ]);

        return {
            providers: [
                { provider: 'GOOGLE_MEET', configured: !!googleConfig?.clientId, name: 'Google Meet' },
                { provider: 'ZOOM', configured: !!zoomConfig?.clientId, name: 'Zoom' },
                { provider: 'MICROSOFT_TEAMS', configured: !!teamsConfig?.clientId, name: 'Microsoft Teams' },
            ],
        };
    }

    /**
     * Create a video meeting with the specified provider
     */
    async createMeeting(tenantId: string, dto: CreateMeetingDto): Promise<MeetingDetails> {
        const { provider, topic, startTime, durationMinutes, attendees, description } = dto;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        switch (provider) {
            case 'ZOOM':
                return this.createZoomMeeting(tenantId, topic, startTime, durationMinutes, attendees, description);
            case 'GOOGLE_MEET':
                return this.createGoogleMeetMeeting(tenantId, topic, startTime, endTime, attendees, description);
            case 'MICROSOFT_TEAMS':
                return this.createTeamsMeeting(tenantId, topic, startTime, endTime, attendees, description);
            default:
                throw new BadRequestException(`Unsupported video meeting provider: ${provider}`);
        }
    }

    /**
     * Create Zoom Meeting using Server-to-Server OAuth
     */
    private async createZoomMeeting(
        tenantId: string,
        topic: string,
        startTime: Date,
        durationMinutes: number,
        attendees?: string[],
        description?: string,
    ): Promise<MeetingDetails> {
        const config = await this.getZoomConfig(tenantId);
        if (!config?.clientId || !config?.clientSecret || !config?.accountId) {
            throw new BadRequestException('Zoom is not configured. Please add credentials in Settings > Integrations.');
        }

        try {
            // Get access token using Server-to-Server OAuth
            const tokenResponse = await axios.post(
                'https://zoom.us/oauth/token',
                null,
                {
                    params: {
                        grant_type: 'account_credentials',
                        account_id: config.accountId,
                    },
                    auth: {
                        username: config.clientId,
                        password: config.clientSecret,
                    },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Create meeting
            const meetingResponse = await axios.post(
                'https://api.zoom.us/v2/users/me/meetings',
                {
                    topic,
                    type: 2, // Scheduled meeting
                    start_time: startTime.toISOString(),
                    duration: durationMinutes,
                    timezone: 'UTC',
                    agenda: description,
                    settings: {
                        host_video: true,
                        participant_video: true,
                        join_before_host: true,
                        waiting_room: false,
                        meeting_invitees: attendees?.map(email => ({ email })),
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const meeting = meetingResponse.data;

            return {
                provider: 'ZOOM',
                meetingId: String(meeting.id),
                meetingLink: meeting.join_url,
                joinUrl: meeting.join_url,
                hostUrl: meeting.start_url,
                password: meeting.password,
                dialInNumbers: meeting.settings?.global_dial_in_numbers?.map((n: { country: string; number: string }) => ({
                    country: n.country,
                    number: n.number,
                })),
                startTime,
                endTime: new Date(startTime.getTime() + durationMinutes * 60 * 1000),
                topic,
            };
        } catch (error) {
            this.logger.error('Failed to create Zoom meeting:', error);
            if (axios.isAxiosError(error)) {
                throw new BadRequestException(`Zoom API error: ${error.response?.data?.message || error.message}`);
            }
            throw new BadRequestException('Failed to create Zoom meeting');
        }
    }

    /**
     * Create Google Meet meeting using Google Calendar API
     * Note: Google Meet links are generated through Google Calendar events with conferenceData
     */
    private async createGoogleMeetMeeting(
        tenantId: string,
        topic: string,
        startTime: Date,
        endTime: Date,
        attendees?: string[],
        description?: string,
    ): Promise<MeetingDetails> {
        const config = await this.getGoogleMeetConfig(tenantId);
        if (!config?.clientId || !config?.clientSecret || !config?.refreshToken) {
            throw new BadRequestException('Google Meet is not configured. Please add credentials in Settings > Integrations.');
        }

        try {
            // Get access token using refresh token
            const tokenResponse = await axios.post(
                'https://oauth2.googleapis.com/token',
                {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token: config.refreshToken,
                    grant_type: 'refresh_token',
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Create calendar event with Google Meet conference
            const eventResponse = await axios.post(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
                {
                    summary: topic,
                    description,
                    start: {
                        dateTime: startTime.toISOString(),
                        timeZone: 'UTC',
                    },
                    end: {
                        dateTime: endTime.toISOString(),
                        timeZone: 'UTC',
                    },
                    attendees: attendees?.map(email => ({ email })),
                    conferenceData: {
                        createRequest: {
                            requestId: `talentx-${Date.now()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const event = eventResponse.data;
            const meetLink = event.conferenceData?.entryPoints?.find(
                (ep: { entryPointType: string; uri: string }) => ep.entryPointType === 'video'
            )?.uri || event.hangoutLink;

            const dialInInfo = event.conferenceData?.entryPoints?.find(
                (ep: { entryPointType: string }) => ep.entryPointType === 'phone'
            );

            return {
                provider: 'GOOGLE_MEET',
                meetingId: event.id,
                meetingLink: meetLink,
                joinUrl: meetLink,
                dialInNumbers: dialInInfo ? [{ country: 'US', number: dialInInfo.uri }] : undefined,
                startTime,
                endTime,
                topic,
            };
        } catch (error) {
            this.logger.error('Failed to create Google Meet meeting:', error);
            if (axios.isAxiosError(error)) {
                throw new BadRequestException(`Google API error: ${error.response?.data?.error?.message || error.message}`);
            }
            throw new BadRequestException('Failed to create Google Meet meeting');
        }
    }

    /**
     * Create Microsoft Teams meeting using Graph API
     */
    private async createTeamsMeeting(
        tenantId: string,
        topic: string,
        startTime: Date,
        endTime: Date,
        attendees?: string[],
        description?: string,
    ): Promise<MeetingDetails> {
        const config = await this.getTeamsConfig(tenantId);
        if (!config?.clientId || !config?.clientSecret || !config?.tenantId) {
            throw new BadRequestException('Microsoft Teams is not configured. Please add credentials in Settings > Integrations.');
        }

        try {
            // Get access token using client credentials flow
            const tokenResponse = await axios.post(
                `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
                new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    scope: 'https://graph.microsoft.com/.default',
                    grant_type: 'client_credentials',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Create online meeting
            const meetingResponse = await axios.post(
                'https://graph.microsoft.com/v1.0/me/onlineMeetings',
                {
                    subject: topic,
                    startDateTime: startTime.toISOString(),
                    endDateTime: endTime.toISOString(),
                    participants: {
                        attendees: attendees?.map(email => ({
                            upn: email,
                            role: 'attendee',
                        })),
                    },
                    lobbyBypassSettings: {
                        scope: 'everyone',
                        isDialInBypassEnabled: true,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const meeting = meetingResponse.data;

            return {
                provider: 'MICROSOFT_TEAMS',
                meetingId: meeting.id,
                meetingLink: meeting.joinWebUrl,
                joinUrl: meeting.joinWebUrl,
                dialInNumbers: meeting.audioConferencing?.dialinUrl ? [
                    { country: 'Dial-in', number: meeting.audioConferencing.tollNumber || meeting.audioConferencing.dialinUrl }
                ] : undefined,
                password: meeting.audioConferencing?.conferenceId,
                startTime,
                endTime,
                topic,
            };
        } catch (error) {
            this.logger.error('Failed to create Microsoft Teams meeting:', error);
            if (axios.isAxiosError(error)) {
                throw new BadRequestException(`Microsoft Graph API error: ${error.response?.data?.error?.message || error.message}`);
            }
            throw new BadRequestException('Failed to create Microsoft Teams meeting');
        }
    }

    /**
     * Delete a meeting
     */
    async deleteMeeting(tenantId: string, provider: VideoMeetingProvider, meetingId: string): Promise<void> {
        switch (provider) {
            case 'ZOOM':
                await this.deleteZoomMeeting(tenantId, meetingId);
                break;
            case 'GOOGLE_MEET':
                await this.deleteGoogleMeetMeeting(tenantId, meetingId);
                break;
            case 'MICROSOFT_TEAMS':
                await this.deleteTeamsMeeting(tenantId, meetingId);
                break;
        }
    }

    private async deleteZoomMeeting(tenantId: string, meetingId: string): Promise<void> {
        const config = await this.getZoomConfig(tenantId);
        if (!config) return;

        try {
            const tokenResponse = await axios.post(
                'https://zoom.us/oauth/token',
                null,
                {
                    params: {
                        grant_type: 'account_credentials',
                        account_id: config.accountId,
                    },
                    auth: {
                        username: config.clientId,
                        password: config.clientSecret,
                    },
                }
            );

            await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
                headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
            });
        } catch (error) {
            this.logger.error('Failed to delete Zoom meeting:', error);
        }
    }

    private async deleteGoogleMeetMeeting(tenantId: string, eventId: string): Promise<void> {
        const config = await this.getGoogleMeetConfig(tenantId);
        if (!config) return;

        try {
            const tokenResponse = await axios.post(
                'https://oauth2.googleapis.com/token',
                {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token: config.refreshToken,
                    grant_type: 'refresh_token',
                }
            );

            await axios.delete(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                { headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` } }
            );
        } catch (error) {
            this.logger.error('Failed to delete Google Meet event:', error);
        }
    }

    private async deleteTeamsMeeting(tenantId: string, meetingId: string): Promise<void> {
        const config = await this.getTeamsConfig(tenantId);
        if (!config) return;

        try {
            const tokenResponse = await axios.post(
                `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
                new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    scope: 'https://graph.microsoft.com/.default',
                    grant_type: 'client_credentials',
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            await axios.delete(
                `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
                { headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` } }
            );
        } catch (error) {
            this.logger.error('Failed to delete Teams meeting:', error);
        }
    }
}
