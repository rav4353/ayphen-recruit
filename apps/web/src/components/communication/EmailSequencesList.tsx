'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Mail,
  Plus,
  Search,
  Trash2,
  Eye,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import { emailSequencesApi } from '@/lib/api';

interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  stepCount: number;
  status: string;
  createdAt: string;
}

const triggerLabels: Record<string, string> = {
  MANUAL: 'Manual',
  APPLICATION_CREATED: 'New Application',
  STAGE_ENTERED: 'Stage Change',
  OFFER_SENT: 'Offer Sent',
};

export function EmailSequencesList() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sequences, isLoading } = useQuery({
    queryKey: ['email-sequences'],
    queryFn: () => emailSequencesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailSequencesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-sequences'] }),
  });

  const sequenceList: EmailSequence[] = sequences?.data || [];
  const filteredSequences = sequenceList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Email Sequences</h1>
          <p className="text-sm text-neutral-500 mt-1">Automate candidate communication with drip campaigns</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sequence
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search sequences..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sequences Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filteredSequences.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Email Sequences
          </h3>
          <p className="text-neutral-500 mb-4">
            Create automated email sequences to nurture candidates.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSequences.map((sequence) => (
            <Card key={sequence.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Mail className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{sequence.name}</h3>
                    <p className="text-xs text-neutral-500">{sequence.stepCount} steps</p>
                  </div>
                </div>
                <Badge variant={sequence.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {sequence.status}
                </Badge>
              </div>

              {sequence.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                  {sequence.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {triggerLabels[sequence.triggerType] || sequence.triggerType}
                </Badge>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button variant="ghost" size="sm" onClick={() => setSelectedSequence(sequence.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(sequence.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateSequenceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['email-sequences'] });
        }}
      />

      {/* Detail Modal */}
      {selectedSequence && (
        <SequenceDetailModal
          sequenceId={selectedSequence}
          isOpen={!!selectedSequence}
          onClose={() => setSelectedSequence(null)}
        />
      )}
    </div>
  );
}

function CreateSequenceModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'MANUAL' as const,
  });
  const [steps, setSteps] = useState<{ subject: string; body: string; delayDays: number; delayHours: number }[]>([]);

  const createMutation = useMutation({
    mutationFn: () => emailSequencesApi.create({
      ...formData,
      steps,
    }),
    onSuccess: () => {
      onSuccess();
      setFormData({ name: '', description: '', triggerType: 'MANUAL' });
      setSteps([]);
    },
  });

  const addStep = () => {
    setSteps([...steps, { subject: '', body: '', delayDays: 0, delayHours: 0 }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Email Sequence" className="max-w-2xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label="Sequence Name"
          placeholder="e.g., Application Follow-up"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
            rows={2}
            placeholder="What this sequence does..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Trigger
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
            value={formData.triggerType}
            onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as any })}
          >
            <option value="MANUAL">Manual Enrollment</option>
            <option value="APPLICATION_CREATED">New Application</option>
            <option value="STAGE_ENTERED">Stage Entered</option>
            <option value="OFFER_SENT">Offer Sent</option>
          </select>
        </div>

        {/* Steps */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Steps
            </h4>
            <Button variant="secondary" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>

          {steps.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No steps added yet</p>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-500">Step {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Delay (days)"
                      type="number"
                      value={step.delayDays}
                      onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      placeholder="Delay (hours)"
                      type="number"
                      value={step.delayHours}
                      onChange={(e) => updateStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <Input
                    placeholder="Email subject..."
                    value={step.subject}
                    onChange={(e) => updateStep(index, 'subject', e.target.value)}
                    className="mb-2"
                  />

                  <textarea
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm"
                    rows={3}
                    placeholder="Email body..."
                    value={step.body}
                    onChange={(e) => updateStep(index, 'body', e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!formData.name || steps.length === 0}
          >
            Create Sequence
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SequenceDetailModal({ sequenceId, isOpen, onClose }: { sequenceId: string; isOpen: boolean; onClose: () => void }) {
  const { data: sequence, isLoading } = useQuery({
    queryKey: ['email-sequence', sequenceId],
    queryFn: () => emailSequencesApi.getById(sequenceId),
    enabled: isOpen,
  });

  const sequenceData = sequence?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sequenceData?.name || 'Email Sequence'} className="max-w-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : sequenceData ? (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {sequenceData.description && (
            <p className="text-neutral-600 dark:text-neutral-400">{sequenceData.description}</p>
          )}

          <div className="flex items-center gap-4">
            <Badge variant="primary">{triggerLabels[sequenceData.triggerType] || sequenceData.triggerType}</Badge>
            <Badge variant="secondary">{sequenceData.steps?.length || 0} steps</Badge>
          </div>

          {sequenceData.steps?.length > 0 && (
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Email Steps</h4>
              <div className="space-y-3">
                {sequenceData.steps.map((step: any, index: number) => (
                  <div key={step.id || index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-500">Step {index + 1}</span>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.delayDays}d {step.delayHours}h delay
                      </Badge>
                    </div>
                    <p className="font-medium text-neutral-900 dark:text-white">{step.subject}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
