import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { jobsApi } from '../../lib/api';
import { JobForm, JobFormData } from '../../components/jobs/JobForm';
import { useState } from 'react';

export function CreateJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: JobFormData, requestApproval: boolean) => {
    if (!tenantId) return;

    setIsSubmitting(true);
    try {
      const skillsArray = data.skills || [];

      // Filter out invalid scorecardTemplateId values (like "new" or empty string)
      const scorecardTemplateId = data.scorecardTemplateId && data.scorecardTemplateId !== 'new'
        ? data.scorecardTemplateId
        : undefined;

      const res = await jobsApi.create(tenantId, {
        ...data,
        skills: skillsArray,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        scorecardTemplateId,
      });

      if (requestApproval) {
        try {
          await jobsApi.submitApproval(tenantId, res.data.data.id);
          toast.success(t('jobs.create.messages.submittedForApproval'));
        } catch (approvalError) {
          console.error('Failed to submit for approval', approvalError);
          toast.error(t('jobs.create.validation.approvalSubmitError'));
        }
      } else {
        toast.success(t('jobs.create.success'));
      }

      navigate(`/${tenantId}/jobs`);
    } catch (error) {
      console.error('Failed to create job', error);
      toast.error(t('jobs.create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tenantId) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('jobs.create.title')}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('jobs.create.subtitle')}</p>
      </div>

      <JobForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/${tenantId}/jobs`)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
