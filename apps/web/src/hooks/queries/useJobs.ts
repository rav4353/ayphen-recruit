import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../../lib/api';
import { logger } from '../../lib/logger';
import toast from 'react-hot-toast';
import type { Job, ApiResponse, PaginationMeta } from '../../lib/types';

const log = logger.component('useJobs');

// Query keys factory
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (tenantId: string, filters?: Record<string, unknown>) =>
    [...jobKeys.lists(), tenantId, filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (tenantId: string, id: string) => [...jobKeys.details(), tenantId, id] as const,
};

interface UseJobsParams {
  tenantId: string;
  page?: number;
  search?: string;
  status?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface JobsResponse {
  data: Job[];
  meta?: PaginationMeta;
}

// Fetch all jobs with filters
export function useJobs(params: UseJobsParams) {
  const { tenantId, ...filters } = params;

  return useQuery({
    queryKey: jobKeys.list(tenantId, filters),
    queryFn: async (): Promise<JobsResponse> => {
      log.debug('Fetching jobs', { tenantId, filters });

      const response = await jobsApi.getAll(tenantId, {
        page: filters.page,
        search: filters.search || undefined,
        status: filters.status || undefined,
        department: filters.department || undefined,
        location: filters.location || undefined,
        employmentType: filters.employmentType || undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortBy ? filters.sortOrder : undefined,
      });

      const apiResponse = response.data as ApiResponse<Job[]>;
      return {
        data: apiResponse.data || [],
        meta: apiResponse.meta,
      };
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch single job
export function useJob(tenantId: string, jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(tenantId, jobId),
    queryFn: async () => {
      log.debug('Fetching job detail', { tenantId, jobId });
      const response = await jobsApi.getById(tenantId, jobId);
      return response.data.data as Job;
    },
    enabled: !!tenantId && !!jobId,
  });
}

// Update job status
export function useUpdateJobStatus(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      log.info('Updating job status', { tenantId, jobId, status });
      const response = await jobsApi.updateStatus(tenantId, jobId, status);
      return response.data;
    },
    onSuccess: (_, { jobId, status }) => {
      toast.success(`Job status updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(tenantId, jobId) });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to update job status';
      log.error('Failed to update job status', error, { tenantId });
      toast.error(message);
    },
  });
}

// Clone job
export function useCloneJob(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      log.info('Cloning job', { tenantId, jobId });
      const response = await jobsApi.clone(tenantId, jobId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job cloned successfully');
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to clone job';
      log.error('Failed to clone job', error, { tenantId });
      toast.error(message);
    },
  });
}

// Submit for approval
export function useSubmitJobApproval(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, approverIds }: { jobId: string; approverIds?: string[] }) => {
      log.info('Submitting job for approval', { tenantId, jobId });
      const response = await jobsApi.submitApproval(tenantId, jobId, approverIds);
      return response.data;
    },
    onSuccess: (_, { jobId }) => {
      toast.success('Job submitted for approval');
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(tenantId, jobId) });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to submit for approval';
      log.error('Failed to submit job for approval', error, { tenantId });
      toast.error(message);
    },
  });
}

// Bulk update status
export function useBulkUpdateJobStatus(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobIds, status }: { jobIds: string[]; status: string }) => {
      log.info('Bulk updating job status', { tenantId, count: jobIds.length, status });
      const results = await Promise.all(
        jobIds.map((jobId) => jobsApi.updateStatus(tenantId, jobId, status))
      );
      return results;
    },
    onSuccess: (_, { jobIds, status }) => {
      toast.success(`${jobIds.length} jobs updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to update some jobs';
      log.error('Failed to bulk update jobs', error, { tenantId });
      toast.error(message);
    },
  });
}

// Create job
export function useCreateJob(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      log.info('Creating job', { tenantId });
      const response = await jobsApi.create(tenantId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Job created successfully');
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to create job';
      log.error('Failed to create job', error, { tenantId });
      toast.error(message);
    },
  });
}
