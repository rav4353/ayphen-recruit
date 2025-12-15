'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  ClipboardCheck,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Clock,
  Target,
  Loader2,
  Send,
  BarChart3,
} from 'lucide-react';
import { skillAssessmentsApi } from '@/lib/api';

interface Assessment {
  id: string;
  name: string;
  description?: string;
  skills: string[];
  duration: number;
  passingScore: number;
  questionCount: number;
  totalPoints: number;
  status: string;
  createdAt: string;
}

export function AssessmentsList() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['skill-assessments'],
    queryFn: () => skillAssessmentsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => skillAssessmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-assessments'] });
    },
  });

  const assessmentList: Assessment[] = assessments?.data || [];

  const filteredAssessments = assessmentList.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Skill Assessments</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and manage skill assessments for candidates</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search assessments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Assessment Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filteredAssessments.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Assessments Found
          </h3>
          <p className="text-neutral-500 mb-4">
            Create your first skill assessment to evaluate candidates.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-500/10 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{assessment.name}</h3>
                    <p className="text-xs text-neutral-500">{assessment.questionCount} questions</p>
                  </div>
                </div>
                <Badge variant={assessment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {assessment.status}
                </Badge>
              </div>

              {assessment.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                  {assessment.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {assessment.skills?.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
                {assessment.skills?.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{assessment.skills.length - 3}</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {assessment.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {assessment.passingScore}% to pass
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {assessment.totalPoints} pts
                </span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(assessment.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(assessment.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateAssessmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['skill-assessments'] });
        }}
      />

      {/* Detail Modal */}
      {selectedAssessment && (
        <AssessmentDetailModal
          assessmentId={selectedAssessment}
          isOpen={!!selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  );
}

function CreateAssessmentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skills: '',
    duration: 60,
    passingScore: 70,
  });
  const [questions, setQuestions] = useState<{
    question: string;
    type: 'MULTIPLE_CHOICE' | 'TEXT';
    options: string[];
    correctAnswer: string;
    points: number;
  }[]>([]);

  const createMutation = useMutation({
    mutationFn: () => skillAssessmentsApi.create({
      name: formData.name,
      description: formData.description || undefined,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      duration: formData.duration,
      passingScore: formData.passingScore,
      questions: questions.map(q => ({
        question: q.question,
        options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
        correctAnswer: q.correctAnswer || undefined,
        points: q.points,
      })),
    }),
    onSuccess: () => {
      onSuccess();
      setFormData({ name: '', description: '', skills: '', duration: 60, passingScore: 70 });
      setQuestions([]);
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10,
    }]);
  };

  const updateQuestion = (index: number, updates: Partial<typeof questions[0]>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Skill Assessment" className="max-w-2xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label="Assessment Name"
          placeholder="e.g., JavaScript Fundamentals"
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
            placeholder="Describe what this assessment covers..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <Input
          label="Skills (comma-separated)"
          placeholder="JavaScript, React, TypeScript"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration (minutes)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
          />
          <Input
            label="Passing Score (%)"
            type="number"
            value={formData.passingScore}
            onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
          />
        </div>

        {/* Questions */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-neutral-900 dark:text-white">Questions</h4>
            <Button variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No questions added yet</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-500">Question {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Enter question..."
                    value={q.question}
                    onChange={(e) => updateQuestion(index, { question: e.target.value })}
                    className="mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                      className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm"
                      value={q.type}
                      onChange={(e) => updateQuestion(index, { type: e.target.value as any })}
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TEXT">Text Answer</option>
                    </select>
                    <Input
                      placeholder="Points"
                      type="number"
                      value={q.points}
                      onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={q.correctAnswer === opt}
                            onChange={() => updateQuestion(index, { correctAnswer: opt })}
                            className="w-4 h-4"
                          />
                          <Input
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...q.options];
                              newOptions[optIndex] = e.target.value;
                              updateQuestion(index, { options: newOptions });
                            }}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
            disabled={!formData.name}
          >
            Create Assessment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AssessmentDetailModal({ assessmentId, isOpen, onClose }: { assessmentId: string; isOpen: boolean; onClose: () => void }) {
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['skill-assessment', assessmentId],
    queryFn: () => skillAssessmentsApi.getById(assessmentId),
    enabled: isOpen,
  });

  const assessmentData = assessment?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={assessmentData?.name || 'Assessment'} className="max-w-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : assessmentData ? (
        <div className="space-y-4">
          {assessmentData.description && (
            <p className="text-neutral-600 dark:text-neutral-400">{assessmentData.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {assessmentData.skills?.map((skill: string) => (
              <Badge key={skill} variant="primary">{skill}</Badge>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{assessmentData.duration}</p>
              <p className="text-xs text-neutral-500">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{assessmentData.passingScore}%</p>
              <p className="text-xs text-neutral-500">To Pass</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{assessmentData.questions?.length || 0}</p>
              <p className="text-xs text-neutral-500">Questions</p>
            </div>
          </div>

          {assessmentData.questions?.length > 0 && (
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white mb-2">Questions</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {assessmentData.questions.map((q: any, index: number) => (
                  <div key={q.id || index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-neutral-900 dark:text-white">{index + 1}. {q.question}</p>
                      <Badge variant="outline" className="text-xs ml-2">{q.points} pts</Badge>
                    </div>
                    {q.type === 'MULTIPLE_CHOICE' && q.options && (
                      <div className="mt-2 pl-4 text-xs text-neutral-500">
                        {q.options.map((opt: string, i: number) => (
                          <div key={i} className={opt === q.correctAnswer ? 'text-green-600 font-medium' : ''}>
                            {String.fromCharCode(65 + i)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button onClick={() => setSendModalOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send to Candidate
            </Button>
          </div>
        </div>
      ) : null}

      {sendModalOpen && (
        <SendAssessmentModal
          assessmentId={assessmentId}
          isOpen={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
        />
      )}
    </Modal>
  );
}

function SendAssessmentModal({ assessmentId, isOpen, onClose }: { assessmentId: string; isOpen: boolean; onClose: () => void }) {
  const [candidateId, setCandidateId] = useState('');

  const sendMutation = useMutation({
    mutationFn: () => skillAssessmentsApi.sendToCandidate(assessmentId, candidateId),
    onSuccess: () => {
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Assessment to Candidate">
      <div className="space-y-4">
        <Input
          label="Candidate ID"
          placeholder="Enter candidate ID..."
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => sendMutation.mutate()}
            isLoading={sendMutation.isPending}
            disabled={!candidateId}
          >
            Send Assessment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
