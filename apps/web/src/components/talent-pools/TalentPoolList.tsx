'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Globe,
  Lock,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { talentPoolsApi } from '@/lib/api';

export function TalentPoolList() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: pools, isLoading } = useQuery({
    queryKey: ['talent-pools'],
    queryFn: () => talentPoolsApi.getAll(),
  });

  const { data: stats } = useQuery({
    queryKey: ['talent-pools-stats'],
    queryFn: () => talentPoolsApi.getStats(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => talentPoolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      queryClient.invalidateQueries({ queryKey: ['talent-pools-stats'] });
    },
  });

  const poolsPayload = pools?.data;
  const poolList = Array.isArray(poolsPayload)
    ? poolsPayload
    : Array.isArray(poolsPayload?.data)
      ? poolsPayload.data
      : Array.isArray(poolsPayload?.data?.data)
        ? poolsPayload.data.data
        : [];

  const statsData = stats?.data?.data || stats?.data;

  const filteredPools = poolList.filter((pool: { name: string; description?: string }) =>
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
              <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{statsData?.totalPools || 0}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Pools</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success-50 dark:bg-success-900/30 rounded-xl">
              <UserPlus className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 tracking-tight">{statsData?.totalCandidates || 0}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Candidates</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
              <Globe className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">{statsData?.publicPools || 0}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Public Pools</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <Lock className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{statsData?.privatePools || 0}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Private Pools</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="md">
          <Plus className="h-4 w-4" />
          Create Pool
        </Button>
      </div>

      {/* Pool List */}
      <Card padding={false}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="empty-state py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Users className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="empty-state-title">
              No Talent Pools Found
            </h3>
            <p className="empty-state-description mb-6">
              Create your first talent pool to organize candidates.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Pool
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
            {filteredPools.map((pool: {
              id: string;
              name: string;
              description?: string;
              isPublic: boolean;
              candidateCount: number;
              criteria?: { skills?: string[] };
              createdAt: string;
            }) => (
              <div key={pool.id} className="p-5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all duration-150">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-neutral-900 dark:text-white tracking-tight">{pool.name}</h4>
                      <Badge variant={pool.isPublic ? 'primary' : 'secondary'}>
                        {pool.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                        {pool.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    {pool.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{pool.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {pool.candidateCount} candidates
                      </span>
                      {(pool.criteria?.skills?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                          {pool.criteria?.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline">{skill}</Badge>
                          ))}
                          {(pool.criteria?.skills?.length ?? 0) > 3 && (
                            <span className="text-xs">+{(pool.criteria?.skills?.length ?? 0) - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPool(pool.id)} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit pool">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(pool.id)}
                      className="hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                      title="Delete pool"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <CreatePoolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
          queryClient.invalidateQueries({ queryKey: ['talent-pools-stats'] });
        }}
      />

      {/* Pool Detail Modal */}
      {selectedPool && (
        <PoolDetailModal
          poolId={selectedPool}
          isOpen={!!selectedPool}
          onClose={() => setSelectedPool(null)}
        />
      )}
    </div>
  );
}

function CreatePoolModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    skills: '',
  });

  const createMutation = useMutation({
    mutationFn: () => talentPoolsApi.create({
      name: formData.name,
      description: formData.description || undefined,
      isPublic: formData.isPublic,
      criteria: formData.skills ? { skills: formData.skills.split(',').map(s => s.trim()) } : undefined,
    }),
    onSuccess: () => {
      onSuccess();
      setFormData({ name: '', description: '', isPublic: false, skills: '' });
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Talent Pool">
      <div className="space-y-5">
        <Input
          label="Pool Name"
          placeholder="e.g., Senior Engineers"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Description
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all duration-150 shadow-soft"
            rows={3}
            placeholder="Describe this talent pool..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <Input
          label="Skills (comma-separated)"
          placeholder="React, TypeScript, Node.js"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
        />
        <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="mt-0.5 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-colors"
          />
          <label htmlFor="isPublic" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            Make this pool visible to all team members
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-5 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <Button variant="secondary" onClick={onClose} size="md">Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!formData.name}
            size="md"
          >
            Create Pool
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PoolDetailModal({ poolId, isOpen, onClose }: { poolId: string; isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: pool, isLoading } = useQuery({
    queryKey: ['talent-pool', poolId],
    queryFn: () => talentPoolsApi.getById(poolId),
    enabled: isOpen,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['talent-pool-search', poolId, searchQuery],
    queryFn: () => talentPoolsApi.searchCandidates(poolId, searchQuery),
    enabled: isOpen && searchQuery.length > 0,
  });

  const addMutation = useMutation({
    mutationFn: (candidateIds: string[]) => talentPoolsApi.addCandidates(poolId, candidateIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool', poolId] });
      setSearchQuery('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (candidateIds: string[]) => talentPoolsApi.removeCandidates(poolId, candidateIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool', poolId] });
    },
  });

  const poolData = pool?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={poolData?.name || 'Talent Pool'} className="max-w-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-5">
          {poolData?.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{poolData.description}</p>
          )}

          {/* Add Candidates */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight">Add Candidates</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search candidates to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {(searchResults?.data?.length ?? 0) > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto space-y-2 scrollbar-thin">
                {searchResults?.data?.map((candidate: { id: string; firstName: string; lastName: string; email: string }) => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{candidate.firstName} {candidate.lastName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addMutation.mutate([candidate.id])}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Candidates */}
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight">
              Candidates ({poolData?.candidateCount || 0})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
              {poolData?.candidates?.map((candidate: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
                currentTitle?: string;
              }) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{candidate.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMutation.mutate([candidate.id])}
                    className="hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!poolData?.candidates || poolData.candidates.length === 0) && (
                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8 text-sm">No candidates in this pool yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
