import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { KanbanBoard } from '../../components/applications/KanbanBoard';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { usePipelineJobs, usePipelineJob, usePipelineApplications, useMoveApplication } from '../../hooks/queries';
import { logger } from '../../lib/logger';

const log = logger.component('PipelinePage');

export function PipelinePage() {
  const { t } = useTranslation();
  const { jobId, tenantId } = useParams<{ jobId: string; tenantId: string }>();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || '');

  // React Query hooks
  const { data: jobs = [], isLoading: jobsLoading } = usePipelineJobs(tenantId || '');
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineJob(tenantId || '', selectedJobId);
  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = usePipelineApplications(selectedJobId);
  const moveApplicationMutation = useMoveApplication(selectedJobId);

  // Derived state
  const stages = pipelineData?.stages || [];
  const isLoading = jobsLoading || pipelineLoading || appsLoading;

  // Auto-select first job if none selected
  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  // Update URL when job changes
  useEffect(() => {
    if (selectedJobId && selectedJobId !== jobId) {
      navigate(`/${tenantId}/pipeline/${selectedJobId}`, { replace: true });
    }
  }, [selectedJobId, jobId, navigate, tenantId]);

  const handleMoveCard = (applicationId: string, stageId: string) => {
    log.info('Moving card', { applicationId, stageId });
    moveApplicationMutation.mutate({ applicationId, stageId });
  };

  const handleCardClick = (application: { candidateId?: string }) => {
    if (application.candidateId) {
      navigate(`/${tenantId}/candidates/${application.candidateId}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {t('pipeline.title')}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t('pipeline.manageProcess')}
          </p>
        </div>

        {/* Job selector and refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchApps()}
            disabled={isLoading}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw size={16} className={`text-neutral-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative w-full sm:w-auto">
            <select
            className="appearance-none w-full sm:min-w-[280px] h-10 pl-4 pr-10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map((job: { id: string; title: string }) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">{t('common.loading')}</p>
          </div>
        ) : stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <ChevronDown size={24} className="text-neutral-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white mb-1">No pipeline stages</p>
            <p className="text-sm text-neutral-500">{t('pipeline.noStages')}</p>
          </div>
        ) : (
          <KanbanBoard
            stages={stages}
            applications={applications}
            onMoveCard={handleMoveCard}
            onCardClick={handleCardClick}
          />
        )}
      </div>
    </div>
  );
}
