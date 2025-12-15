'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Building,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { jobRequisitionApi } from '@/lib/api';


interface JobRequisitionListProps {
  tenantId: string;
}

export function JobRequisitionList({ tenantId }: JobRequisitionListProps) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ['requisitions', tenantId, statusFilter, priorityFilter],
    queryFn: () => jobRequisitionApi.getAll(tenantId, { status: statusFilter || undefined, priority: priorityFilter || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ['requisition-stats', tenantId],
    queryFn: () => jobRequisitionApi.getStats(tenantId),
  });

  const approveMutation = useMutation({
    mutationFn: (requisitionId: string) => jobRequisitionApi.approve(tenantId, requisitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisition-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requisitionId: string) => jobRequisitionApi.reject(tenantId, requisitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisition-stats'] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (requisitionId: string) => jobRequisitionApi.convert(tenantId, requisitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisition-stats'] });
    },
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CONVERTED', label: 'Converted to Job' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'CONVERTED':
        return <Badge variant="primary">Converted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="error">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="primary">Medium</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const requisitionList = requisitions?.data?.data || [];
  const statsData = stats?.data?.data;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <FileText className="h-5 w-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{statsData?.total || 0}</p>
              <p className="text-xs text-neutral-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{statsData?.byStatus?.pending || 0}</p>
              <p className="text-xs text-neutral-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{statsData?.byStatus?.approved || 0}</p>
              <p className="text-xs text-neutral-500">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{statsData?.byPriority?.urgent || 0}</p>
              <p className="text-xs text-neutral-500">Urgent</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{statsData?.pendingHeadcount || 0}</p>
              <p className="text-xs text-neutral-500">Headcount</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            options={priorityOptions}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Requisition
        </Button>
      </div>

      {/* Requisition List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : requisitionList.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              No Requisitions Found
            </h3>
            <p className="text-neutral-500 mb-4">
              Create a new requisition to start the hiring process.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Requisition
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {requisitionList.map((req: {
              id: string;
              title: string;
              headcount: number;
              priority: string;
              status: string;
              department?: { name: string };
              location?: { city: string };
              targetStartDate?: string;
              salaryRange?: { min: number; max: number; currency: string };
              createdAt: string;
              createdBy?: { firstName: string; lastName: string };
              linkedJobId?: string;
            }) => (
              <div key={req.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-neutral-900 dark:text-white">{req.title}</h4>
                      {getStatusBadge(req.status)}
                      {getPriorityBadge(req.priority)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {req.headcount} position{req.headcount > 1 ? 's' : ''}
                      </span>
                      {req.department && (
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {req.department.name}
                        </span>
                      )}
                      {req.targetStartDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Target: {new Date(req.targetStartDate).toLocaleDateString()}
                        </span>
                      )}
                      {req.salaryRange && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {req.salaryRange.min.toLocaleString()} - {req.salaryRange.max.toLocaleString()} {req.salaryRange.currency}
                        </span>
                      )}
                    </div>
                    {req.createdBy && (
                      <p className="text-xs text-neutral-400 mt-2">
                        Created by {req.createdBy.firstName} {req.createdBy.lastName} on {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => approveMutation.mutate(req.id)}
                          isLoading={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rejectMutation.mutate(req.id)}
                          isLoading={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {req.status === 'APPROVED' && !req.linkedJobId && (
                      <Button
                        size="sm"
                        onClick={() => convertMutation.mutate(req.id)}
                        isLoading={convertMutation.isPending}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Convert to Job
                      </Button>
                    )}
                    {req.linkedJobId && (
                      <Button variant="ghost" size="sm">
                        <Briefcase className="h-4 w-4 mr-1" />
                        View Job
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <CreateRequisitionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tenantId={tenantId}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['requisitions'] });
          queryClient.invalidateQueries({ queryKey: ['requisition-stats'] });
        }}
      />
    </div>
  );
}

interface CreateRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

function CreateRequisitionModal({ isOpen, onClose, tenantId, onSuccess }: CreateRequisitionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    headcount: 1,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    justification: '',
    targetStartDate: '',
    salaryMin: '',
    salaryMax: '',
  });

  const createMutation = useMutation({
    mutationFn: () => jobRequisitionApi.create(tenantId, {
      title: formData.title,
      headcount: formData.headcount,
      priority: formData.priority,
      justification: formData.justification,
      targetStartDate: formData.targetStartDate || undefined,
      salaryRange: formData.salaryMin && formData.salaryMax ? {
        min: Number(formData.salaryMin),
        max: Number(formData.salaryMax),
        currency: 'USD',
      } : undefined,
    }),
    onSuccess: () => {
      onSuccess();
      setFormData({
        title: '',
        headcount: 1,
        priority: 'MEDIUM',
        justification: '',
        targetStartDate: '',
        salaryMin: '',
        salaryMax: '',
      });
    },
  });

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Job Requisition" className="max-w-lg">
      <div className="space-y-4">
        <Input
          label="Job Title"
          placeholder="e.g., Senior Software Engineer"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Headcount"
            type="number"
            min={1}
            value={formData.headcount}
            onChange={(e) => setFormData({ ...formData, headcount: Number(e.target.value) })}
          />
          <Select
            label="Priority"
            options={priorityOptions}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Salary"
            type="number"
            placeholder="80000"
            value={formData.salaryMin}
            onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
          />
          <Input
            label="Max Salary"
            type="number"
            placeholder="120000"
            value={formData.salaryMax}
            onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
          />
        </div>

        <Input
          label="Target Start Date"
          type="date"
          value={formData.targetStartDate}
          onChange={(e) => setFormData({ ...formData, targetStartDate: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Justification
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            rows={3}
            placeholder="Explain why this position is needed..."
            value={formData.justification}
            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!formData.title || !formData.justification}
          >
            Create Requisition
          </Button>
        </div>
      </div>
    </Modal>
  );
}
