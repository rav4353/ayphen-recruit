import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '../../lib/api';
import { logger } from '../../lib/logger';
import toast from 'react-hot-toast';
import type { Candidate } from '../../lib/types';

const log = logger.component('useCandidates');

// Query keys factory
export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...candidateKeys.lists(), filters] as const,
  details: () => [...candidateKeys.all, 'detail'] as const,
  detail: (id: string) => [...candidateKeys.details(), id] as const,
  activities: (id: string) => [...candidateKeys.detail(id), 'activities'] as const,
};

interface UseCandidatesParams {
  page?: number;
  take?: number;
  search?: string;
  location?: string;
  skills?: string[];
  status?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CandidatesResponse {
  candidates: Candidate[];
  total: number;
}

// Fetch all candidates with filters
export function useCandidates(params: UseCandidatesParams = {}) {
  return useQuery({
    queryKey: candidateKeys.list(params as Record<string, unknown>),
    queryFn: async (): Promise<CandidatesResponse> => {
      log.debug('Fetching candidates', { params });
      
      const response = await candidatesApi.getAll({
        page: params.page,
        take: params.take,
        skip: params.page && params.take ? (params.page - 1) * params.take : undefined,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        location: params.location,
        skills: params.skills,
        status: params.status,
        source: params.source,
      });

      let data = response.data;
      // Handle wrapped response
      if (data && data.data) {
        data = data.data;
      }

      return {
        candidates: data.candidates || [],
        total: data.total || 0,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch single candidate
export function useCandidate(candidateId: string) {
  return useQuery({
    queryKey: candidateKeys.detail(candidateId),
    queryFn: async () => {
      log.debug('Fetching candidate detail', { candidateId });
      const response = await candidatesApi.getById(candidateId);
      return response.data.data as Candidate;
    },
    enabled: !!candidateId,
  });
}

// Fetch candidate activities
export function useCandidateActivities(candidateId: string) {
  return useQuery({
    queryKey: candidateKeys.activities(candidateId),
    queryFn: async () => {
      log.debug('Fetching candidate activities', { candidateId });
      const response = await candidatesApi.getActivities(candidateId);
      return response.data.data || [];
    },
    enabled: !!candidateId,
  });
}

// Delete candidate
export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateId: string) => {
      log.info('Deleting candidate', { candidateId });
      const response = await candidatesApi.delete(candidateId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Candidate deleted successfully');
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to delete candidate';
      log.error('Failed to delete candidate', error);
      toast.error(message);
    },
  });
}

// Bulk delete candidates
export function useBulkDeleteCandidates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateIds: string[]) => {
      log.info('Bulk deleting candidates', { count: candidateIds.length });
      const response = await candidatesApi.bulkDelete(candidateIds);
      return response.data;
    },
    onSuccess: (_, candidateIds) => {
      toast.success(`${candidateIds.length} candidates deleted`);
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to delete candidates';
      log.error('Failed to bulk delete candidates', error);
      toast.error(message);
    },
  });
}

// Send bulk email
export function useSendBulkEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[]; subject: string; message: string }) => {
      log.info('Sending bulk email', { count: data.ids.length });
      const response = await candidatesApi.sendBulkEmail(data);
      return response.data;
    },
    onSuccess: (response) => {
      const count = response.data?.count || 0;
      toast.success(`Email sent to ${count} candidates`);
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to send bulk email';
      log.error('Failed to send bulk email', error);
      toast.error(message);
    },
  });
}

// Update candidate
export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      log.info('Updating candidate', { candidateId: id });
      const response = await candidatesApi.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      toast.success('Candidate updated successfully');
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to update candidate';
      log.error('Failed to update candidate', error);
      toast.error(message);
    },
  });
}
