import { useState, useEffect } from 'react';
import { Tag, Plus, X, Settings, Zap, Check } from 'lucide-react';
import { Button, Input } from '../ui';
import { candidateTaggingApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function CandidateTaggingPanel() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    tag: '',
    conditions: [{ field: 'skills' as const, operator: 'contains' as const, value: '' }],
    conditionLogic: 'AND' as 'AND' | 'OR',
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await candidateTaggingApi.getRules();
      setRules(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tagging rules:', error);
      toast.error('Failed to load tagging rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.tag) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      await candidateTaggingApi.createRule(newRule);
      toast.success('Tagging rule created successfully');
      setShowCreateModal(false);
      setNewRule({
        name: '',
        tag: '',
        conditions: [{ field: 'skills', operator: 'contains', value: '' }],
        conditionLogic: 'AND',
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast.error('Failed to create tagging rule');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await candidateTaggingApi.updateRule(ruleId, { isActive: !isActive });
      toast.success(`Rule ${!isActive ? 'activated' : 'deactivated'}`);
      fetchRules();
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await candidateTaggingApi.deleteRule(ruleId);
      toast.success('Rule deleted successfully');
      fetchRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleCreatePresets = async () => {
    try {
      await candidateTaggingApi.createPresetRules();
      toast.success('Preset rules created successfully');
      fetchRules();
    } catch (error) {
      toast.error('Failed to create preset rules');
    }
  };

  const handleTagAllCandidates = async () => {
    if (!confirm('This will apply all active tagging rules to all candidates. Continue?')) return;

    const loadingToast = toast.loading('Tagging candidates...');
    try {
      await candidateTaggingApi.tagAllCandidates();
      toast.success('All candidates tagged successfully', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to tag candidates', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Tag size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Candidate Tagging Rules
            </h2>
            <p className="text-sm text-neutral-500">
              Automatically tag candidates based on criteria
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCreatePresets}
            className="gap-2"
          >
            <Settings size={16} />
            Create Presets
          </Button>
          <Button
            variant="secondary"
            onClick={handleTagAllCandidates}
            className="gap-2"
          >
            <Zap size={16} />
            Tag All
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus size={16} />
            New Rule
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-8 text-center">
            <Tag size={48} className="mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              No tagging rules yet
            </p>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              Create Your First Rule
            </Button>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {rule.name}
                    </h3>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      {rule.tag}
                    </span>
                    {rule.isActive ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full flex items-center gap-1">
                        <Check size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {rule.conditions?.length || 0} condition(s) • {rule.conditionLogic} logic
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id, rule.isActive)}
                  >
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Create Tagging Rule
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Rule Name"
                placeholder="e.g., Senior Engineers"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />

              <Input
                label="Tag"
                placeholder="e.g., senior-engineer"
                value={newRule.tag}
                onChange={(e) => setNewRule({ ...newRule, tag: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Condition Logic
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewRule({ ...newRule, conditionLogic: 'AND' })}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      newRule.conditionLogic === 'AND'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    AND (All conditions must match)
                  </button>
                  <button
                    onClick={() => setNewRule({ ...newRule, conditionLogic: 'OR' })}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      newRule.conditionLogic === 'OR'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    OR (Any condition matches)
                  </button>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  💡 Tip: Start with simple rules and test them before creating complex conditions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRule}
                isLoading={isCreating}
              >
                Create Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
