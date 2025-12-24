'use client';

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  Loader2,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { jobsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface PendingEdit {
  fieldName: string;
  currentValue: any;
  proposedValue: any;
  editId: string;
  editedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  editedAt: string;
  comment?: string;
}

interface JobComparisonProps {
  jobId: string;
  onClose?: () => void;
}

// Field display names mapping
const FIELD_LABELS: Record<string, string> = {
  title: 'Job Title',
  description: 'Description',
  requirements: 'Requirements',
  responsibilities: 'Responsibilities',
  benefits: 'Benefits',
  salaryMin: 'Minimum Salary',
  salaryMax: 'Maximum Salary',
  salaryCurrency: 'Salary Currency',
  employmentType: 'Employment Type',
  workLocation: 'Work Location',
  openings: 'Number of Openings',
  skills: 'Required Skills',
  experience: 'Experience Level',
  education: 'Education',
  departmentId: 'Department',
  locations: 'Job Locations',
  closesAt: 'Closing Date',
};

export function JobEditComparison({ jobId }: JobComparisonProps) {
  const { tenantId } = useParams<{ tenantId: string }>();
  const queryClient = useQueryClient();
  const [selectedEdits, setSelectedEdits] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch comparison data
  const { data, isLoading, error } = useQuery({
    queryKey: ['job-comparison', tenantId, jobId],
    queryFn: () => jobsApi.getJobComparison(tenantId!, jobId),
    enabled: !!tenantId && !!jobId,
  });

  const approveMutation = useMutation({
    mutationFn: (editIds: string[]) => jobsApi.approveEdits(tenantId!, editIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-comparison'] });
      queryClient.invalidateQueries({ queryKey: ['pending-job-edits'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Edits approved and applied');
      setSelectedEdits([]);
    },
    onError: () => {
      toast.error('Failed to approve edits');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ editIds, reason }: { editIds: string[]; reason: string }) =>
      jobsApi.rejectEdits(tenantId!, editIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-comparison'] });
      queryClient.invalidateQueries({ queryKey: ['pending-job-edits'] });
      toast.success('Edits rejected');
      setSelectedEdits([]);
      setShowRejectModal(false);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('Failed to reject edits');
    },
  });

  const handleToggleEdit = (editId: string) => {
    setSelectedEdits(prev =>
      prev.includes(editId)
        ? prev.filter(id => id !== editId)
        : [...prev, editId]
    );
  };

  const handleSelectAll = () => {
    const allEditIds = pendingEdits.map((e: PendingEdit) => e.editId);
    setSelectedEdits(
      selectedEdits.length === allEditIds.length ? [] : allEditIds
    );
  };

  const handleApprove = () => {
    if (selectedEdits.length === 0) {
      toast.error('Please select at least one edit to approve');
      return;
    }
    approveMutation.mutate(selectedEdits);
  };

  const handleReject = () => {
    if (selectedEdits.length === 0) {
      toast.error('Please select at least one edit to reject');
      return;
    }
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ editIds: selectedEdits, reason: rejectionReason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400">
          Failed to load comparison data
        </p>
      </div>
    );
  }

  const comparison = data?.data?.data || data?.data;
  const job = comparison?.job;
  const pendingEdits: PendingEdit[] = comparison?.pendingEdits || [];

  if (!comparison?.hasPendingEdits) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <p className="font-medium text-neutral-900 dark:text-white mb-1">
          No Pending Edits
        </p>
        <p className="text-sm text-neutral-500">
          This job has no pending edit requests
        </p>
      </div>
    );
  }

  // Render value based on type
  const renderValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-neutral-400 italic">Not set</span>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {typeof item === 'object' ? JSON.stringify(item) : item}
            </Badge>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    if (fieldName === 'salaryMin' || fieldName === 'salaryMax') {
      return <span>${Number(value).toLocaleString()}</span>;
    }
    if (fieldName === 'closesAt') {
      return <span>{format(new Date(value), 'MMM d, yyyy')}</span>;
    }
    // For long text fields, truncate
    if (typeof value === 'string' && value.length > 200) {
      return (
        <div className="max-h-32 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap">{value}</p>
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Review Pending Edits
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Job: <span className="font-medium">{job?.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {pendingEdits.length} pending edit{pendingEdits.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {selectedEdits.length === pendingEdits.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedEdits.length > 0 && (
            <span className="text-sm text-neutral-500">
              {selectedEdits.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectModal(true)}
            disabled={selectedEdits.length === 0 || rejectMutation.isPending}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            Reject Selected
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={selectedEdits.length === 0 || approveMutation.isPending}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1.5" />
            )}
            Approve Selected
          </Button>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="space-y-4">
        {pendingEdits.map((edit: PendingEdit) => {
          const isSelected = selectedEdits.includes(edit.editId);
          return (
            <Card
              key={edit.editId}
              className={`p-0 overflow-hidden transition-all ${
                isSelected
                  ? 'ring-2 ring-primary-500 border-primary-200 dark:border-primary-800'
                  : ''
              }`}
            >
              {/* Edit Header */}
              <div
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer"
                onClick={() => handleToggleEdit(edit.editId)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleEdit(edit.editId)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                      {FIELD_LABELS[edit.fieldName] || edit.fieldName}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {edit.editedBy.firstName} {edit.editedBy.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(edit.editedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
                <Eye className="h-5 w-5 text-neutral-400" />
              </div>

              {/* Comparison Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-700">
                {/* Current Value */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  </div>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    {renderValue(edit.currentValue, edit.fieldName)}
                  </div>
                </div>

                {/* Arrow for desktop */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-primary-600" />
                  </div>
                </div>

                {/* Proposed Value */}
                <div className="p-4 bg-green-50/50 dark:bg-green-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="success" className="text-xs">Proposed</Badge>
                  </div>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    {renderValue(edit.proposedValue, edit.fieldName)}
                  </div>
                </div>
              </div>

              {/* Comment if any */}
              {edit.comment && (
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">
                        Editor's Comment
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {edit.comment}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Reject Edits
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Please provide a reason for rejecting the selected edits. This will be shared with the editor.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1.5" />
                )}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// List view for all pending edits across jobs
export function PendingJobEditsList() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-job-edits', tenantId],
    queryFn: () => jobsApi.getAllPendingEdits(tenantId!, 'PENDING'),
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const pendingEditGroups = data?.data?.data || data?.data || [];

  if (pendingEditGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <p className="font-medium text-neutral-900 dark:text-white mb-1">
          All Caught Up!
        </p>
        <p className="text-sm text-neutral-500">
          No pending job edits require your approval
        </p>
      </div>
    );
  }

  if (selectedJobId) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setSelectedJobId(null)}
          className="mb-4"
        >
          ← Back to list
        </Button>
        <JobEditComparison jobId={selectedJobId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Pending Job Edits
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Review and approve changes to approved jobs
          </p>
        </div>
        <Badge variant="warning" className="text-sm">
          {pendingEditGroups.length} job{pendingEditGroups.length !== 1 ? 's' : ''} with pending edits
        </Badge>
      </div>

      {pendingEditGroups.map((group: any) => (
        <Card
          key={group.job.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedJobId(group.job.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {group.job.title}
              </h3>
              {group.job.jobCode && (
                <p className="text-sm text-neutral-500">{group.job.jobCode}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="warning">
                {group.edits.length} edit{group.edits.length !== 1 ? 's' : ''}
              </Badge>
              <ArrowRight className="h-5 w-5 text-neutral-400" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.edits.slice(0, 5).map((edit: any) => (
              <Badge key={edit.id} variant="secondary" className="text-xs">
                {FIELD_LABELS[edit.fieldName] || edit.fieldName}
              </Badge>
            ))}
            {group.edits.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{group.edits.length - 5} more
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
