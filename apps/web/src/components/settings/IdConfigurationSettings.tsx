import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi, extractData } from '../../lib/api';
import { Button, Card, CardHeader } from '../ui';

interface IdSettings {
  prefix: string;
  type: 'sequential' | 'random';
  minDigits: number;
  nextNumber?: number;
}

export function IdConfigurationSettings() {
  const queryClient = useQueryClient();

  const { data: candidateSettings } = useQuery({
    queryKey: ['settings', 'candidate_id_settings'],
    queryFn: async () => {
      try {
        const response = await settingsApi.getByKey('candidate_id_settings');
        return extractData(response)?.value as IdSettings;
      } catch {
        return null;
      }
    },
  });

  const { data: jobSettings } = useQuery({
    queryKey: ['settings', 'job_id_settings'],
    queryFn: async () => {
      try {
        const response = await settingsApi.getByKey('job_id_settings');
        return extractData(response)?.value as IdSettings;
      } catch {
        return null;
      }
    },
  });

  const { data: applicationSettings } = useQuery({
    queryKey: ['settings', 'application_id_settings'],
    queryFn: async () => {
      try {
        const response = await settingsApi.getByKey('application_id_settings');
        return extractData(response)?.value as IdSettings;
      } catch {
        return null;
      }
    },
  });

  const [candidateConfig, setCandidateConfig] = useState<IdSettings>({
    prefix: 'CAND',
    type: 'sequential',
    minDigits: 6,
    nextNumber: 1,
  });

  const [jobConfig, setJobConfig] = useState<IdSettings>({
    prefix: 'JOB',
    type: 'sequential',
    minDigits: 6,
    nextNumber: 1,
  });

  const [applicationConfig, setApplicationConfig] = useState<IdSettings>({
    prefix: 'APP',
    type: 'sequential',
    minDigits: 6,
    nextNumber: 1,
  });

  // Update local state when data loads
  useState(() => {
    if (candidateSettings) setCandidateConfig(candidateSettings);
    if (jobSettings) setJobConfig(jobSettings);
    if (applicationSettings) setApplicationConfig(applicationSettings);
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: IdSettings }) => {
      return settingsApi.update(data.key, {
        value: data.value,
        category: 'ID_CONFIGURATION',
        isPublic: false,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.key] });
      queryClient.invalidateQueries({ queryKey: ['configuration-status'] });
      toast.success('ID configuration saved successfully');
    },
    onError: () => {
      toast.error('Failed to save ID configuration');
    },
  });

  const handleSave = (type: 'candidate' | 'job' | 'application') => {
    const configMap = {
      candidate: { key: 'candidate_id_settings', value: candidateConfig },
      job: { key: 'job_id_settings', value: jobConfig },
      application: { key: 'application_id_settings', value: applicationConfig },
    };

    saveMutation.mutate(configMap[type]);
  };

  const renderIdConfigSection = (
    title: string,
    description: string,
    config: IdSettings,
    setConfig: (config: IdSettings) => void,
    onSave: () => void,
    example: string
  ) => (
    <Card>
      <CardHeader title={title} />
      <div className="p-6 pt-0 space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Prefix
            </label>
            <input
              type="text"
              value={config.prefix}
              onChange={(e) => setConfig({ ...config, prefix: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              placeholder="CAND"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Type
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as 'sequential' | 'random' })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="sequential">Sequential</option>
              <option value="random">Random</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Minimum Digits
            </label>
            <input
              type="number"
              min="4"
              max="10"
              value={config.minDigits}
              onChange={(e) => setConfig({ ...config, minDigits: parseInt(e.target.value) || 6 })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
          </div>

          {config.type === 'sequential' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Next Number
              </label>
              <input
                type="number"
                min="1"
                value={config.nextNumber || 1}
                onChange={(e) => setConfig({ ...config, nextNumber: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
            Preview
          </p>
          <p className="font-mono text-lg text-neutral-900 dark:text-white">
            {example}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onSave}
            isLoading={saveMutation.isPending}
            className="gap-2"
          >
            <Save size={16} />
            Save Configuration
          </Button>
        </div>
      </div>
    </Card>
  );

  const getCandidateExample = () => {
    if (candidateConfig.type === 'sequential') {
      return `${candidateConfig.prefix}-${(candidateConfig.nextNumber || 1).toString().padStart(candidateConfig.minDigits, '0')}`;
    }
    return `${candidateConfig.prefix}-${'X'.repeat(candidateConfig.minDigits)}`;
  };

  const getJobExample = () => {
    if (jobConfig.type === 'sequential') {
      return `${jobConfig.prefix}-${(jobConfig.nextNumber || 1).toString().padStart(jobConfig.minDigits, '0')}`;
    }
    return `${jobConfig.prefix}-${'X'.repeat(jobConfig.minDigits)}`;
  };

  const getApplicationExample = () => {
    if (applicationConfig.type === 'sequential') {
      return `${applicationConfig.prefix}-${(applicationConfig.nextNumber || 1).toString().padStart(applicationConfig.minDigits, '0')}`;
    }
    return `${applicationConfig.prefix}-${'X'.repeat(applicationConfig.minDigits)}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Important: Configure Before Creating Records
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              These ID formats must be configured before creating candidates, jobs, or applications. 
              Once configured, IDs will be automatically generated for all new records.
            </p>
          </div>
        </div>
      </div>

      {renderIdConfigSection(
        'Candidate ID Format',
        'Configure how candidate IDs are generated. This ID will be visible to users and can be used for tracking.',
        candidateConfig,
        setCandidateConfig,
        () => handleSave('candidate'),
        getCandidateExample()
      )}

      {renderIdConfigSection(
        'Job ID Format',
        'Configure how job IDs are generated. This ID will be used internally and for job requisitions.',
        jobConfig,
        setJobConfig,
        () => handleSave('job'),
        getJobExample()
      )}

      {renderIdConfigSection(
        'Application ID Format',
        'Configure how application IDs are generated. This ID will be visible to candidates and recruiters.',
        applicationConfig,
        setApplicationConfig,
        () => handleSave('application'),
        getApplicationExample()
      )}
    </div>
  );
}
