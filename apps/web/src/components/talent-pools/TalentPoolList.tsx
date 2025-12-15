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

  const poolList = pools?.data || [];
  const statsData = stats?.data;

  const filteredPools = poolList.filter((pool: { name: string; description?: string }) =>
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Users className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{statsData?.totalPools || 0}</p>
              <p className="text-xs text-neutral-500">Total Pools</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{statsData?.totalCandidates || 0}</p>
              <p className="text-xs text-neutral-500">Total Candidates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{statsData?.publicPools || 0}</p>
              <p className="text-xs text-neutral-500">Public Pools</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Lock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{statsData?.privatePools || 0}</p>
              <p className="text-xs text-neutral-500">Private Pools</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pool
        </Button>
      </div>

      {/* Pool List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              No Talent Pools Found
            </h3>
            <p className="text-neutral-500 mb-4">
              Create your first talent pool to organize candidates.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Pool
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredPools.map((pool: {
              id: string;
              name: string;
              description?: string;
              isPublic: boolean;
              candidateCount: number;
              criteria?: { skills?: string[] };
              createdAt: string;
            }) => (
              <div key={pool.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-neutral-900 dark:text-white">{pool.name}</h4>
                      <Badge variant={pool.isPublic ? 'primary' : 'secondary'}>
                        {pool.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                        {pool.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    {pool.description && (
                      <p className="text-sm text-neutral-500 mb-2">{pool.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
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
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPool(pool.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(pool.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
      <div className="space-y-4">
        <Input
          label="Pool Name"
          placeholder="e.g., Senior Engineers"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
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
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <label htmlFor="isPublic" className="text-sm text-neutral-700 dark:text-neutral-300">
            Make this pool visible to all team members
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!formData.name}
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
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {poolData?.description && (
            <p className="text-neutral-500">{poolData.description}</p>
          )}

          {/* Add Candidates */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">Add Candidates</h4>
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
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {searchResults?.data?.map((candidate: { id: string; firstName: string; lastName: string; email: string }) => (
                  <div key={candidate.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 rounded">
                    <span className="text-sm">{candidate.firstName} {candidate.lastName}</span>
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
            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
              Candidates ({poolData?.candidateCount || 0})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {poolData?.candidates?.map((candidate: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
                currentTitle?: string;
              }) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">{candidate.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMutation.mutate([candidate.id])}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {(!poolData?.candidates || poolData.candidates.length === 0) && (
                <p className="text-center text-neutral-500 py-4">No candidates in this pool yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
