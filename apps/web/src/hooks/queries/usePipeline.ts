import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, applicationsApi } from '../../lib/api';
import { logger } from '../../lib/logger';
import toast from 'react-hot-toast';

const log = logger.component('usePipeline');

// Query keys factory
export const pipelineKeys = {
  all: ['pipeline'] as const,
  jobs: (tenantId: string) => [...pipelineKeys.all, 'jobs', tenantId] as const,
  job: (tenantId: string, jobId: string) => [...pipelineKeys.all, 'job', tenantId, jobId] as const,
  applications: (jobId: string) => [...pipelineKeys.all, 'applications', jobId] as const,
};

// Fetch jobs for pipeline selector
export function usePipelineJobs(tenantId: string) {
  return useQuery({
    queryKey: pipelineKeys.jobs(tenantId),
    queryFn: async () => {
      log.debug('Fetching jobs for pipeline', { tenantId });
      const res = await jobsApi.getAll(tenantId, { limit: 100 });
      return res.data.data || [];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch job details with pipeline stages
export function usePipelineJob(tenantId: string, jobId: string) {
  return useQuery({
    queryKey: pipelineKeys.job(tenantId, jobId),
    queryFn: async () => {
      log.debug('Fetching job pipeline', { tenantId, jobId });
      const jobRes = await jobsApi.getById(tenantId, jobId);
      const job = jobRes.data.data;
      return {
        job,
        stages: job.pipeline?.stages || [],
      };
    },
    enabled: !!tenantId && !!jobId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch applications for a job
export function usePipelineApplications(jobId: string) {
  return useQuery({
    queryKey: pipelineKeys.applications(jobId),
    queryFn: async () => {
      log.debug('Fetching applications for pipeline', { jobId });
      const appsRes = await applicationsApi.getByJob(jobId);
      return appsRes.data.data || [];
    },
    enabled: !!jobId,
    staleTime: 1000 * 60 * 1, // 1 minute - pipeline data should be fresh
  });
}

// Move application to stage with optimistic update
export function useMoveApplication(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, stageId }: { applicationId: string; stageId: string }) => {
      log.info('Moving application to stage', { applicationId, stageId });
      const response = await applicationsApi.moveToStage(applicationId, stageId);
      return response.data;
    },
    onMutate: async ({ applicationId, stageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: pipelineKeys.applications(jobId) });

      // Snapshot the previous value
      const previousApplications = queryClient.getQueryData(pipelineKeys.applications(jobId));

      // Optimistically update
      queryClient.setQueryData(pipelineKeys.applications(jobId), (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((app) =>
          app.id === applicationId ? { ...app, currentStageId: stageId } : app
        );
      });

      return { previousApplications };
    },
    onSuccess: () => {
      toast.success('Candidate moved successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }, _, context) => {
      // Revert on error
      if (context?.previousApplications) {
        queryClient.setQueryData(pipelineKeys.applications(jobId), context.previousApplications);
      }
      const message = error.response?.data?.message || 'Failed to move candidate';
      log.error('Failed to move application', error);
      toast.error(message);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: pipelineKeys.applications(jobId) });
    },
  });
}
