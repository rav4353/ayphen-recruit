import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi, applicationsApi } from '../../lib/api';
import { KanbanBoard } from '../../components/applications/KanbanBoard';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';

export function PipelinePage() {
  const { t } = useTranslation();
  const { jobId, tenantId } = useParams<{ jobId: string; tenantId: string }>();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || '');
  const [stages, setStages] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      if (!tenantId) return;
      try {
        const res = await jobsApi.getAll(tenantId, { limit: 100 });
        setJobs(res.data.data);

        // If no job selected, select the first one
        if (!selectedJobId && res.data.data.length > 0) {
          setSelectedJobId(res.data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch jobs', err);
        toast.error(t('pipeline.loadJobsError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [tenantId]);

  // Update URL when job changes
  useEffect(() => {
    if (selectedJobId && selectedJobId !== jobId) {
      navigate(`/${tenantId}/pipeline/${selectedJobId}`, { replace: true });
    }
  }, [selectedJobId, jobId, navigate, tenantId]);

  // Fetch pipeline and applications when job changes
  useEffect(() => {
    if (!selectedJobId || !tenantId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch job details to get pipeline
        const jobRes = await jobsApi.getById(tenantId, selectedJobId);
        const pipeline = jobRes.data.data.pipeline;
        if (pipeline && pipeline.stages) {
          setStages(pipeline.stages);
        } else {
          setStages([]);
        }

        // Fetch applications
        const appsRes = await applicationsApi.getByJob(selectedJobId);
        setApplications(appsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch board data', err);
        toast.error(t('pipeline.loadBoardError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedJobId, tenantId]);

  const handleMoveCard = async (applicationId: string, stageId: string) => {
    // Optimistic update
    const oldApplications = [...applications];
    setApplications(prev => prev.map(app =>
      app.id === applicationId ? { ...app, currentStageId: stageId } : app
    ));

    try {
      await applicationsApi.moveToStage(applicationId, stageId);
      toast.success(t('pipeline.moveSuccess'));
    } catch (err) {
      console.error('Failed to move card', err);
      toast.error(t('pipeline.moveError'));
      setApplications(oldApplications); // Revert
    }
  };

  const handleCardClick = (application: any) => {
    if (application.candidateId) {
      navigate(`/${tenantId}/candidates/${application.candidateId}`);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {t('pipeline.title')}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t('pipeline.manageProcess')}
          </p>
        </div>

        {/* Job selector */}
        <div className="relative">
          <select
            className="appearance-none min-w-[240px] pl-3 pr-10 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400"></div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">{t('common.loading')}</p>
          </div>
        ) : stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
            <p className="text-sm">{t('pipeline.noStages')}</p>
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
