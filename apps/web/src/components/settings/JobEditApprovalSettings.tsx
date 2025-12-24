'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Info,
} from 'lucide-react';
import { jobsApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface JobEditApprovalConfig {
  enabled: boolean;
  fieldsRequiringApproval: string[];
}

// Available job fields that can require approval
const AVAILABLE_FIELDS = [
  { key: 'title', label: 'Job Title', category: 'Basic Info' },
  { key: 'description', label: 'Description', category: 'Basic Info' },
  { key: 'requirements', label: 'Requirements', category: 'Details' },
  { key: 'responsibilities', label: 'Responsibilities', category: 'Details' },
  { key: 'benefits', label: 'Benefits', category: 'Details' },
  { key: 'salaryMin', label: 'Minimum Salary', category: 'Compensation' },
  { key: 'salaryMax', label: 'Maximum Salary', category: 'Compensation' },
  { key: 'salaryCurrency', label: 'Salary Currency', category: 'Compensation' },
  { key: 'employmentType', label: 'Employment Type', category: 'Job Details' },
  { key: 'workLocation', label: 'Work Location', category: 'Job Details' },
  { key: 'openings', label: 'Number of Openings', category: 'Job Details' },
  { key: 'skills', label: 'Required Skills', category: 'Requirements' },
  { key: 'experience', label: 'Experience Level', category: 'Requirements' },
  { key: 'education', label: 'Education', category: 'Requirements' },
  { key: 'departmentId', label: 'Department', category: 'Organization' },
  { key: 'locations', label: 'Job Locations', category: 'Organization' },
  { key: 'closesAt', label: 'Closing Date', category: 'Timeline' },
];

export function JobEditApprovalSettings() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<JobEditApprovalConfig>({
    enabled: false,
    fieldsRequiringApproval: [],
  });

  // Fetch current config
  const { data: configData, isLoading } = useQuery({
    queryKey: ['job-edit-approval-config', tenantId],
    queryFn: () => jobsApi.getEditApprovalConfig(tenantId!),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (configData?.data?.data) {
      setConfig(configData.data.data);
    }
  }, [configData]);

  const mutation = useMutation({
    mutationFn: (newConfig: Partial<JobEditApprovalConfig>) =>
      jobsApi.updateEditApprovalConfig(tenantId!, newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-edit-approval-config'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleToggleField = (fieldKey: string) => {
    const newFields = config.fieldsRequiringApproval.includes(fieldKey)
      ? config.fieldsRequiringApproval.filter(f => f !== fieldKey)
      : [...config.fieldsRequiringApproval, fieldKey];
    setConfig({ ...config, fieldsRequiringApproval: newFields });
  };

  const handleSave = () => {
    mutation.mutate(config);
  };

  // Group fields by category
  const fieldsByCategory = AVAILABLE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_FIELDS>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Job Edit Approval
            </h2>
            <p className="text-sm text-neutral-500">
              Configure which job field edits require approval
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Enable/Disable Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              config.enabled 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-neutral-100 dark:bg-neutral-800'
            }`}>
              {config.enabled ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-neutral-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Edit Approval Workflow
              </h3>
              <p className="text-sm text-neutral-500">
                {config.enabled 
                  ? 'Edits to approved jobs will require approval before being applied'
                  : 'Edits to approved jobs will be applied immediately'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              config.enabled ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {config.enabled && (
        <>
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>When someone edits a selected field on an already-approved job, the changes are saved as pending</li>
                <li>The original values remain visible until the same approver(s) who approved the job previously review the changes</li>
                <li>Approvers can see a side-by-side comparison of old vs new values</li>
                <li>Once approved, the new values replace the old ones</li>
              </ul>
            </div>
          </div>

          {/* Fields Selection */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
              Fields Requiring Approval
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Select which job fields should require approval when edited on approved jobs
            </p>

            <div className="space-y-6">
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fields.map((field) => {
                      const isSelected = config.fieldsRequiringApproval.includes(field.key);
                      return (
                        <button
                          key={field.key}
                          onClick={() => handleToggleField(field.key)}
                          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                            isSelected
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
                              : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle className="h-4 w-4" />}
                            {field.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {config.fieldsRequiringApproval.length > 0 && (
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-500 mb-3">
                  Selected fields ({config.fieldsRequiringApproval.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.fieldsRequiringApproval.map(fieldKey => {
                    const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
                    return (
                      <Badge
                        key={fieldKey}
                        variant="secondary"
                        className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5"
                      >
                        {field?.label || fieldKey}
                        <button
                          onClick={() => handleToggleField(fieldKey)}
                          className="hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
