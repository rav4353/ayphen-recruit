import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../../lib/api';
import { logger } from '../../lib/logger';
import toast from 'react-hot-toast';

const log = logger.component('useApplications');

// Query keys factory
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  listByJob: (jobId: string) => [...applicationKeys.lists(), 'job', jobId] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};

// Fetch applications by job
export function useApplicationsByJob(jobId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: applicationKeys.listByJob(jobId),
    queryFn: async () => {
      log.debug('Fetching applications for job', { jobId });
      const response = await applicationsApi.getByJob(jobId, params);
      return response.data.data || [];
    },
    enabled: !!jobId,
    staleTime: 1000 * 60 * 1, // 1 minute for pipeline data
  });
}

// Move application to stage
export function useMoveToStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, stageId }: { applicationId: string; stageId: string }) => {
      log.info('Moving application to stage', { applicationId, stageId });
      const response = await applicationsApi.moveToStage(applicationId, stageId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Candidate moved successfully');
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to move candidate';
      log.error('Failed to move application', error);
      toast.error(message);
    },
  });
}

// Update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      status, 
      reason 
    }: { 
      applicationId: string; 
      status: string; 
      reason?: string;
    }) => {
      log.info('Updating application status', { applicationId, status });
      const response = await applicationsApi.updateStatus(applicationId, status, reason);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to update status';
      log.error('Failed to update application status', error);
      toast.error(message);
    },
  });
}

// Copy applications to another job
export function useCopyToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationIds, targetJobId }: { applicationIds: string[]; targetJobId: string }) => {
      log.info('Copying applications to job', { count: applicationIds.length, targetJobId });
      const response = await applicationsApi.copyToJob(applicationIds, targetJobId);
      return response.data;
    },
    onSuccess: (_, { applicationIds }) => {
      toast.success(`${applicationIds.length} candidates copied`);
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to copy candidates';
      log.error('Failed to copy applications', error);
      toast.error(message);
    },
  });
}
