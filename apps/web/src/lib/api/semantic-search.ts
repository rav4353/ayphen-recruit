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

export interface SemanticSearchResult {
    candidateId: string;
    firstName: string;
    lastName: string;
    email: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    skills: string[];
    matchScore: number;
    matchReason: string;
    highlights: string[];
}

export interface SemanticSearchParams {
    query: string;
    limit?: number;
    minScore?: number;
    skills?: string[];
    location?: string;
    excludeCandidateIds?: string[];
}

export interface TalentRecommendationsParams {
    role?: string;
    skills?: string[];
    seniority?: 'junior' | 'mid' | 'senior' | 'lead';
    industry?: string;
}

export const semanticSearchApi = {
    // Natural language search
    search: (params: SemanticSearchParams) =>
        api.post<SemanticSearchResult[]>('/candidates/search/semantic', params),

    // Match candidates to a job
    matchToJob: (jobId: string, limit?: number) =>
        api.post<SemanticSearchResult[]>('/candidates/search/match-to-job', { jobId, limit }),

    // Get AI-powered recommendations
    getRecommendations: (params: TalentRecommendationsParams) =>
        api.post<SemanticSearchResult[]>('/candidates/search/recommendations', params),

    // Find similar candidates
    findSimilar: (candidateId: string, limit?: number) =>
        api.post<SemanticSearchResult[]>('/candidates/search/similar', { candidateId, limit }),

    // Find similar by ID (GET)
    findSimilarById: (candidateId: string) =>
        api.get<SemanticSearchResult[]>(`/candidates/search/similar/${candidateId}`),
};
