'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  CheckSquare,
  ArrowRight,
  UserPlus,
  Tag,
  Mail,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { bulkActionsApi } from '@/lib/api';

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  stages?: { id: string; name: string }[];
  users?: { id: string; firstName: string; lastName: string }[];
}

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  stages = [],
  users = [],
}: BulkActionsToolbarProps) {
  const queryClient = useQueryClient();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900 dark:bg-white rounded-xl shadow-xl">
          <Badge variant="primary" className="mr-2">
            <CheckSquare className="h-3 w-3 mr-1" />
            {selectedIds.length} selected
          </Badge>

          <div className="w-px h-6 bg-neutral-700 dark:bg-neutral-300" />

          <Button
            variant="ghost"
            size="sm"
            className="text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
            onClick={() => setShowMoveModal(true)}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Move
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
            onClick={() => setShowAssignModal(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Assign
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
            onClick={() => setShowTagsModal(true)}
          >
            <Tag className="h-4 w-4 mr-1" />
            Tag
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
            onClick={() => setShowEmailModal(true)}
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:bg-red-900/20"
            onClick={() => setShowStatusModal(true)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>

          <div className="w-px h-6 bg-neutral-700 dark:bg-neutral-300" />

          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white dark:hover:text-neutral-900"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Move Stage Modal */}
      <BulkMoveModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        applicationIds={selectedIds}
        stages={stages}
        onSuccess={handleSuccess}
      />

      {/* Update Status Modal */}
      <BulkStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        applicationIds={selectedIds}
        onSuccess={handleSuccess}
      />

      {/* Assign Modal */}
      <BulkAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        applicationIds={selectedIds}
        users={users}
        onSuccess={handleSuccess}
      />

      {/* Tags Modal */}
      <BulkTagsModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        applicationIds={selectedIds}
        onSuccess={handleSuccess}
      />

      {/* Email Modal */}
      <BulkEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        applicationIds={selectedIds}
        onSuccess={handleSuccess}
      />
    </>
  );
}

function BulkMoveModal({
  isOpen,
  onClose,
  applicationIds,
  stages,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
  stages: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const [targetStageId, setTargetStageId] = useState('');

  const mutation = useMutation({
    mutationFn: () => bulkActionsApi.moveStage(applicationIds, targetStageId),
    onSuccess: () => {
      onSuccess();
      onClose();
      setTargetStageId('');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move to Stage">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Move {applicationIds.length} application(s) to a new stage.
        </p>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Target Stage
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
            value={targetStageId}
            onChange={(e) => setTargetStageId(e.target.value)}
          >
            <option value="">Select stage...</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!targetStageId}
          >
            Move {applicationIds.length} Applications
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkStatusModal({
  isOpen,
  onClose,
  applicationIds,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<'REJECTED' | 'WITHDRAWN'>('REJECTED');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => bulkActionsApi.updateStatus(applicationIds, status, reason || undefined),
    onSuccess: () => {
      onSuccess();
      onClose();
      setReason('');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Status">
      <div className="space-y-4">
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            This will update the status of {applicationIds.length} application(s).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            New Status
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>

        <Input
          label="Reason (optional)"
          placeholder="e.g., Position filled"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkAssignModal({
  isOpen,
  onClose,
  applicationIds,
  users,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
  users: { id: string; firstName: string; lastName: string }[];
  onSuccess: () => void;
}) {
  const [assigneeId, setAssigneeId] = useState('');

  const mutation = useMutation({
    mutationFn: () => bulkActionsApi.assign(applicationIds, assigneeId),
    onSuccess: () => {
      onSuccess();
      onClose();
      setAssigneeId('');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Applications">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Assign {applicationIds.length} application(s) to a team member.
        </p>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Assignee
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Select team member...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!assigneeId}
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkTagsModal({
  isOpen,
  onClose,
  applicationIds,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
  onSuccess: () => void;
}) {
  const [tags, setTags] = useState('');

  const mutation = useMutation({
    mutationFn: () => bulkActionsApi.addTags(applicationIds, tags.split(',').map(t => t.trim()).filter(Boolean)),
    onSuccess: () => {
      onSuccess();
      onClose();
      setTags('');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Tags">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Add tags to {applicationIds.length} candidate(s).
        </p>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g., Senior, Remote, Urgent"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!tags.trim()}
          >
            Add Tags
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkEmailModal({
  isOpen,
  onClose,
  applicationIds,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
  onSuccess: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => bulkActionsApi.sendEmail(applicationIds, subject, body),
    onSuccess: () => {
      onSuccess();
      onClose();
      setSubject('');
      setBody('');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Email" className="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Send email to {applicationIds.length} candidate(s).
        </p>

        <Input
          label="Subject"
          placeholder="Email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Message
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
            rows={6}
            placeholder="Email body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!subject.trim() || !body.trim()}
          >
            <Mail className="h-4 w-4 mr-1" />
            Send to {applicationIds.length} Candidates
          </Button>
        </div>
      </div>
    </Modal>
  );
}
