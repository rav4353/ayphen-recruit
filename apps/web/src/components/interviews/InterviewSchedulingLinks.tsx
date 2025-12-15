'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Link,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { interviewSchedulingApi } from '@/lib/api';

interface SchedulingLink {
  token: string;
  candidateName: string;
  jobTitle: string;
  interviewType: string;
  duration: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  BOOKED: { label: 'Booked', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-neutral-100 text-neutral-800', icon: Clock },
};

export function InterviewSchedulingLinks() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ['scheduling-links', statusFilter],
    queryFn: () => interviewSchedulingApi.getLinks(statusFilter || undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (token: string) => interviewSchedulingApi.cancelLink(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduling-links'] }),
  });

  const linkList: SchedulingLink[] = links?.data || [];

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/schedule/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Interview Scheduling</h1>
          <p className="text-sm text-neutral-500 mt-1">Send self-scheduling links to candidates</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Link
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === '' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'ACTIVE' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('ACTIVE')}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'BOOKED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('BOOKED')}
        >
          Booked
        </Button>
        <Button
          variant={statusFilter === 'CANCELLED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('CANCELLED')}
        >
          Cancelled
        </Button>
      </div>

      {/* Links List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : linkList.length === 0 ? (
        <Card className="p-12 text-center">
          <Link className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Scheduling Links
          </h3>
          <p className="text-neutral-500 mb-4">
            Create scheduling links to let candidates book their own interviews.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {linkList.map((link) => {
            const config = statusConfig[link.status] || statusConfig.ACTIVE;
            const StatusIcon = config.icon;
            const expired = isExpired(link.expiresAt) && link.status === 'ACTIVE';

            return (
              <Card key={link.token} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">
                        {link.candidateName}
                      </h3>
                      <p className="text-sm text-neutral-500">{link.jobTitle}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {link.duration} min
                        </span>
                        <Badge variant="outline" className="text-xs">{link.interviewType}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`${expired ? 'bg-neutral-100 text-neutral-800' : config.color} flex items-center gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {expired ? 'Expired' : config.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500">
                    Expires: {new Date(link.expiresAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    {link.status === 'ACTIVE' && !expired && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(link.token)}
                        >
                          {copiedToken === link.token ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedToken === link.token ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/schedule/${link.token}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMutation.mutate(link.token)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateSchedulingLinkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['scheduling-links'] });
        }}
      />
    </div>
  );
}

function CreateSchedulingLinkModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    applicationId: '',
    interviewerIds: [] as string[],
    duration: 60,
    interviewType: 'TECHNICAL',
    expiresInDays: 7,
    instructions: '',
  });

  const createMutation = useMutation({
    mutationFn: () => interviewSchedulingApi.createLink(formData),
    onSuccess: () => {
      onSuccess();
      setFormData({
        applicationId: '',
        interviewerIds: [],
        duration: 60,
        interviewType: 'TECHNICAL',
        expiresInDays: 7,
        instructions: '',
      });
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Scheduling Link">
      <div className="space-y-4">
        <Input
          label="Application ID"
          placeholder="Enter application ID"
          value={formData.applicationId}
          onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
          required
        />

        <Input
          label="Interviewer IDs (comma-separated)"
          placeholder="Enter interviewer IDs"
          value={formData.interviewerIds.join(', ')}
          onChange={(e) => setFormData({
            ...formData,
            interviewerIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
          })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration (minutes)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
          />
          <Input
            label="Expires in (days)"
            type="number"
            value={formData.expiresInDays}
            onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 7 })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Interview Type
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
            value={formData.interviewType}
            onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
          >
            <option value="PHONE_SCREEN">Phone Screen</option>
            <option value="TECHNICAL">Technical</option>
            <option value="BEHAVIORAL">Behavioral</option>
            <option value="CULTURE_FIT">Culture Fit</option>
            <option value="HIRING_MANAGER">Hiring Manager</option>
            <option value="FINAL">Final</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Instructions for Candidate
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
            rows={3}
            placeholder="Any special instructions..."
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!formData.applicationId || formData.interviewerIds.length === 0}
          >
            Create Link
          </Button>
        </div>
      </div>
    </Modal>
  );
}
