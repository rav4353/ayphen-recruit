import axios from 'axios';
import { useAuthStore } from '../../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export type VideoMeetingProvider = 'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS';

export interface MeetingDetails {
    provider: VideoMeetingProvider;
    meetingId: string;
    meetingLink: string;
    joinUrl: string;
    hostUrl?: string;
    password?: string;
    dialInNumbers?: { country: string; number: string }[];
    startTime: string;
    endTime: string;
    topic: string;
}

export interface CreateMeetingDto {
    provider: VideoMeetingProvider;
    topic: string;
    startTime: string;
    durationMinutes: number;
    attendees?: string[];
    description?: string;
}

export interface ProviderStatus {
    provider: VideoMeetingProvider;
    configured: boolean;
    name: string;
}

export const videoMeetingsApi = {
    // Get configured providers
    getProviders: () => 
        api.get<{ providers: ProviderStatus[] }>('/video-meetings/providers'),

    // Create a meeting
    createMeeting: (data: CreateMeetingDto) =>
        api.post<MeetingDetails>('/video-meetings/create', data),

    // Delete a meeting
    deleteMeeting: (provider: VideoMeetingProvider, meetingId: string) =>
        api.delete('/video-meetings/delete', { data: { provider, meetingId } }),

    // Save Zoom config
    saveZoomConfig: (config: { accountId: string; clientId: string; clientSecret: string }) =>
        api.post('/video-meetings/config/zoom', config),

    // Save Google Meet config
    saveGoogleMeetConfig: (config: { clientId: string; clientSecret: string; refreshToken: string }) =>
        api.post('/video-meetings/config/google-meet', config),

    // Save Teams config
    saveTeamsConfig: (config: { clientId: string; clientSecret: string; tenantId: string }) =>
        api.post('/video-meetings/config/teams', config),
};
