import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { interviewQuestionsApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function InterviewQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    expectedAnswer: '',
    skills: [] as string[],
    timeMinutes: 30,
  });

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [filterDifficulty, filterCategory]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await interviewQuestionsApi.getAll({
        difficulty: filterDifficulty || undefined,
        category: filterCategory || undefined,
      });
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await interviewQuestionsApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.question || !newQuestion.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      await interviewQuestionsApi.create(newQuestion);
      toast.success('Question created successfully');
      setShowCreateModal(false);
      setNewQuestion({
        question: '',
        category: '',
        difficulty: 'MEDIUM',
        expectedAnswer: '',
        skills: [],
        timeMinutes: 30,
      });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to create question');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await interviewQuestionsApi.delete(id);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'HARD':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Interview Questions Bank
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Manage your interview question library
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={16} />
          Add Question
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <select
              className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                No interview questions found
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                Create Your First Question
              </Button>
            </div>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                      {question.category && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          {question.category}
                        </span>
                      )}
                      {question.timeMinutes && (
                        <span className="text-xs text-neutral-500">
                          {question.timeMinutes} min
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-2">
                      {question.question}
                    </h3>
                    {question.expectedAnswer && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {question.expectedAnswer}
                      </p>
                    )}
                    {question.skills && question.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {question.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Add Interview Question
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Question *
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm min-h-[100px]"
                  placeholder="Enter your interview question..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Category *"
                  placeholder="e.g., Technical, Behavioral"
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <Input
                label="Time (minutes)"
                type="number"
                value={newQuestion.timeMinutes}
                onChange={(e) => setNewQuestion({ ...newQuestion, timeMinutes: parseInt(e.target.value) || 30 })}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Expected Answer / Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm min-h-[100px]"
                  placeholder="Optional: Add expected answer or evaluation notes..."
                  value={newQuestion.expectedAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuestion} isLoading={isCreating}>
                Create Question
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
