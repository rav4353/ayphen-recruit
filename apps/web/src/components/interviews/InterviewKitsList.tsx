'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Copy,
  Loader2,
  Clock,
  MessageSquare,
  ListChecks,
  Lightbulb,
  Link,
  Eye,
} from 'lucide-react';
import { interviewKitsApi } from '@/lib/api';

interface InterviewKit {
  id: string;
  name: string;
  description?: string;
  interviewType: string;
  duration: number;
  questionCount: number;
  hasScorecard: boolean;
  questions?: any[];
  scorecard?: any;
  tips?: string[];
  resources?: { title: string; url: string }[];
  status: string;
  createdAt: string;
}

const interviewTypeLabels: Record<string, string> = {
  PHONE_SCREEN: 'Phone Screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  CASE_STUDY: 'Case Study',
  CULTURE_FIT: 'Culture Fit',
  HIRING_MANAGER: 'Hiring Manager',
  PANEL: 'Panel',
  FINAL: 'Final',
};

export function InterviewKitsList() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const { data: kits, isLoading } = useQuery({
    queryKey: ['interview-kits', filterType],
    queryFn: () => interviewKitsApi.getAll(filterType || undefined),
  });

  const { data: types } = useQuery({
    queryKey: ['interview-types'],
    queryFn: () => interviewKitsApi.getInterviewTypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewKitsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interview-kits'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => interviewKitsApi.duplicate(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interview-kits'] }),
  });

  const kitList: InterviewKit[] = kits?.data || [];
  const typeList = types?.data || [];

  const filteredKits = kitList.filter(k =>
    k.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Interview Kits</h1>
          <p className="text-sm text-neutral-500 mt-1">Prepare interviewers with questions, scorecards, and tips</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Kit
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search kits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {typeList.map((type: any) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Kits Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filteredKits.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Interview Kits Found
          </h3>
          <p className="text-neutral-500 mb-4">
            Create interview kits to help interviewers prepare.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Kit
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit) => (
            <Card key={kit.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{kit.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {interviewTypeLabels[kit.interviewType] || kit.interviewType}
                    </Badge>
                  </div>
                </div>
              </div>

              {kit.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                  {kit.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {kit.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {kit.questionCount} questions
                </span>
                {kit.hasScorecard && (
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3 w-3 text-green-500" />
                    Scorecard
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button variant="ghost" size="sm" onClick={() => setSelectedKit(kit.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateMutation.mutate({ id: kit.id, name: `${kit.name} (Copy)` })}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(kit.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateInterviewKitModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['interview-kits'] });
        }}
        types={typeList}
      />

      {/* Detail Modal */}
      {selectedKit && (
        <InterviewKitDetailModal
          kitId={selectedKit}
          isOpen={!!selectedKit}
          onClose={() => setSelectedKit(null)}
        />
      )}
    </div>
  );
}

function CreateInterviewKitModal({
  isOpen,
  onClose,
  onSuccess,
  types,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  types: any[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    interviewType: 'TECHNICAL',
    duration: 60,
  });
  const [questions, setQuestions] = useState<{ question: string; category: string; expectedAnswer: string }[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [newTip, setNewTip] = useState('');

  const createMutation = useMutation({
    mutationFn: () => interviewKitsApi.create({
      ...formData,
      questions: questions.filter(q => q.question),
      tips: tips.filter(t => t),
    }),
    onSuccess: () => {
      onSuccess();
      setFormData({ name: '', description: '', interviewType: 'TECHNICAL', duration: 60 });
      setQuestions([]);
      setTips([]);
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, { question: '', category: '', expectedAnswer: '' }]);
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addTip = () => {
    if (newTip.trim()) {
      setTips([...tips, newTip.trim()]);
      setNewTip('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Interview Kit" className="max-w-2xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label="Kit Name"
          placeholder="e.g., Frontend Technical Interview"
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
            placeholder="What this interview kit covers..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Interview Type
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              value={formData.interviewType}
              onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
            >
              {types.map((type: any) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Duration (minutes)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
          />
        </div>

        {/* Questions */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Questions
            </h4>
            <Button variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No questions added yet</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div key={index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-500">Question {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Enter question..."
                    value={q.question}
                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                    className="mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Category (e.g., React)"
                      value={q.category}
                      onChange={(e) => updateQuestion(index, 'category', e.target.value)}
                    />
                    <Input
                      placeholder="Expected answer hint"
                      value={q.expectedAnswer}
                      onChange={(e) => updateQuestion(index, 'expectedAnswer', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4" />
            Interviewer Tips
          </h4>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a tip for interviewers..."
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTip()}
            />
            <Button variant="secondary" onClick={addTip}>Add</Button>
          </div>
          {tips.length > 0 && (
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="w-1 h-1 bg-primary-500 rounded-full" />
                  {tip}
                  <button onClick={() => setTips(tips.filter((_, i) => i !== index))} className="text-red-500 ml-auto">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!formData.name}
          >
            Create Kit
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InterviewKitDetailModal({ kitId, isOpen, onClose }: { kitId: string; isOpen: boolean; onClose: () => void }) {
  const { data: kit, isLoading } = useQuery({
    queryKey: ['interview-kit', kitId],
    queryFn: () => interviewKitsApi.getById(kitId),
    enabled: isOpen,
  });

  const kitData = kit?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={kitData?.name || 'Interview Kit'} className="max-w-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : kitData ? (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4">
            <Badge variant="primary">{interviewTypeLabels[kitData.interviewType] || kitData.interviewType}</Badge>
            <span className="text-sm text-neutral-500 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {kitData.duration} minutes
            </span>
          </div>

          {kitData.description && (
            <p className="text-neutral-600 dark:text-neutral-400">{kitData.description}</p>
          )}

          {kitData.questions?.length > 0 && (
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Questions ({kitData.questions.length})
              </h4>
              <div className="space-y-2">
                {kitData.questions.map((q: any, index: number) => (
                  <div key={q.id || index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="font-medium text-neutral-900 dark:text-white">{index + 1}. {q.question}</p>
                    {q.category && <Badge variant="outline" className="text-xs mt-1">{q.category}</Badge>}
                    {q.expectedAnswer && (
                      <p className="text-xs text-neutral-500 mt-2">
                        <span className="font-medium">Expected:</span> {q.expectedAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {kitData.tips?.length > 0 && (
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Tips for Interviewers
              </h4>
              <ul className="space-y-1">
                {kitData.tips.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {kitData.resources?.length > 0 && (
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Resources
              </h4>
              <ul className="space-y-1">
                {kitData.resources.map((r: any, index: number) => (
                  <li key={index}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:underline">
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
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
