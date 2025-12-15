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
  Trash2,
  Edit,
  UserPlus,
  Eye,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  Loader2,
  Crown,
  Briefcase,
  Mic,
  ClipboardList,
} from 'lucide-react';
import { hiringTeamApi, usersApi } from '@/lib/api';

type HiringTeamRole = 'HIRING_MANAGER' | 'RECRUITER' | 'INTERVIEWER' | 'COORDINATOR' | 'APPROVER' | 'OBSERVER';

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: HiringTeamRole;
  permissions: {
    canViewCandidates: boolean;
    canEditCandidates: boolean;
    canScheduleInterviews: boolean;
    canProvideFeedback: boolean;
    canMakeOffers: boolean;
    canApprove: boolean;
  };
  status: string;
  isDefault?: boolean;
  addedAt?: string;
}

const roleConfig: Record<HiringTeamRole, { label: string; icon: React.ElementType; color: string }> = {
  HIRING_MANAGER: { label: 'Hiring Manager', icon: Crown, color: 'text-purple-500' },
  RECRUITER: { label: 'Recruiter', icon: Briefcase, color: 'text-blue-500' },
  INTERVIEWER: { label: 'Interviewer', icon: Mic, color: 'text-green-500' },
  COORDINATOR: { label: 'Coordinator', icon: ClipboardList, color: 'text-orange-500' },
  APPROVER: { label: 'Approver', icon: CheckCircle, color: 'text-red-500' },
  OBSERVER: { label: 'Observer', icon: Eye, color: 'text-neutral-500' },
};

interface HiringTeamProps {
  jobId: string;
}

export function HiringTeam({ jobId }: HiringTeamProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['hiring-team', jobId],
    queryFn: () => hiringTeamApi.getMembers(jobId),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => hiringTeamApi.removeMember(jobId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring-team', jobId] });
    },
  });

  const members: TeamMember[] = teamMembers?.data || [];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-neutral-900 dark:text-white">Hiring Team</h3>
          <Badge variant="secondary">{members.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <UserPlus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500">No team members added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const config = roleConfig[member.role];
            const RoleIcon = config?.icon || Users;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-white dark:bg-neutral-700 ${config?.color || ''}`}>
                    <RoleIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-white">{member.userName}</p>
                      {member.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{member.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{config?.label || member.role}</Badge>
                  
                  <div className="flex items-center gap-1">
                    {member.permissions.canViewCandidates && (
                      <span title="Can view candidates"><Eye className="h-3 w-3 text-neutral-400" /></span>
                    )}
                    {member.permissions.canScheduleInterviews && (
                      <span title="Can schedule interviews"><Calendar className="h-3 w-3 text-neutral-400" /></span>
                    )}
                    {member.permissions.canProvideFeedback && (
                      <span title="Can provide feedback"><MessageSquare className="h-3 w-3 text-neutral-400" /></span>
                    )}
                    {member.permissions.canMakeOffers && (
                      <span title="Can make offers"><FileText className="h-3 w-3 text-neutral-400" /></span>
                    )}
                    {member.permissions.canApprove && (
                      <span title="Can approve"><CheckCircle className="h-3 w-3 text-neutral-400" /></span>
                    )}
                  </div>

                  {!member.isDefault && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingMember(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      <AddTeamMemberModal
        jobId={jobId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          queryClient.invalidateQueries({ queryKey: ['hiring-team', jobId] });
        }}
      />

      {/* Edit Member Modal */}
      {editingMember && (
        <EditTeamMemberModal
          jobId={jobId}
          member={editingMember}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => {
            setEditingMember(null);
            queryClient.invalidateQueries({ queryKey: ['hiring-team', jobId] });
          }}
        />
      )}
    </Card>
  );
}

function AddTeamMemberModal({
  jobId,
  isOpen,
  onClose,
  onSuccess,
}: {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<HiringTeamRole>('INTERVIEWER');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () => usersApi.getAll({ search: searchQuery }),
    enabled: isOpen,
  });

  const addMutation = useMutation({
    mutationFn: () => hiringTeamApi.addMember(jobId, {
      userId: selectedUserId,
      role: selectedRole,
    }),
    onSuccess: () => {
      onSuccess();
      setSelectedUserId('');
      setSelectedRole('INTERVIEWER');
    },
  });

  const userList = users?.data?.users || users?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Search User
          </label>
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {userList.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
              {userList.map((user: any) => (
                <div
                  key={user.id}
                  className={`p-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    selectedUserId === user.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Role
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as HiringTeamRole)}
          >
            {Object.entries(roleConfig).map(([role, config]) => (
              <option key={role} value={role}>{config.label}</option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Role Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {selectedRole === 'HIRING_MANAGER' && (
              <>
                <span className="text-green-600">✓ View candidates</span>
                <span className="text-green-600">✓ Edit candidates</span>
                <span className="text-green-600">✓ Schedule interviews</span>
                <span className="text-green-600">✓ Provide feedback</span>
                <span className="text-green-600">✓ Make offers</span>
                <span className="text-green-600">✓ Approve decisions</span>
              </>
            )}
            {selectedRole === 'RECRUITER' && (
              <>
                <span className="text-green-600">✓ View candidates</span>
                <span className="text-green-600">✓ Edit candidates</span>
                <span className="text-green-600">✓ Schedule interviews</span>
                <span className="text-green-600">✓ Provide feedback</span>
                <span className="text-green-600">✓ Make offers</span>
                <span className="text-neutral-400">✗ Approve decisions</span>
              </>
            )}
            {selectedRole === 'INTERVIEWER' && (
              <>
                <span className="text-green-600">✓ View candidates</span>
                <span className="text-neutral-400">✗ Edit candidates</span>
                <span className="text-neutral-400">✗ Schedule interviews</span>
                <span className="text-green-600">✓ Provide feedback</span>
                <span className="text-neutral-400">✗ Make offers</span>
                <span className="text-neutral-400">✗ Approve decisions</span>
              </>
            )}
            {selectedRole === 'COORDINATOR' && (
              <>
                <span className="text-green-600">✓ View candidates</span>
                <span className="text-green-600">✓ Edit candidates</span>
                <span className="text-green-600">✓ Schedule interviews</span>
                <span className="text-neutral-400">✗ Provide feedback</span>
                <span className="text-neutral-400">✗ Make offers</span>
                <span className="text-neutral-400">✗ Approve decisions</span>
              </>
            )}
            {selectedRole === 'APPROVER' && (
              <>
                <span className="text-green-600">✓ View candidates</span>
                <span className="text-neutral-400">✗ Edit candidates</span>
                <span className="text-neutral-400">✗ Schedule interviews</span>
                <span className="text-neutral-400">✗ Provide feedback</span>
                <span className="text-neutral-400">✗ Make offers</span>
                <span className="text-green-600">✓ Approve decisions</span>
              </>
            )}
            {selectedRole === 'OBSERVER' && (
              <>
                <span className="text-green-600">✓ View candidates</span>
                <span className="text-neutral-400">✗ Edit candidates</span>
                <span className="text-neutral-400">✗ Schedule interviews</span>
                <span className="text-neutral-400">✗ Provide feedback</span>
                <span className="text-neutral-400">✗ Make offers</span>
                <span className="text-neutral-400">✗ Approve decisions</span>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => addMutation.mutate()}
            isLoading={addMutation.isPending}
            disabled={!selectedUserId}
          >
            Add Member
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditTeamMemberModal({
  jobId,
  member,
  isOpen,
  onClose,
  onSuccess,
}: {
  jobId: string;
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<HiringTeamRole>(member.role);
  const [permissions, setPermissions] = useState(member.permissions);

  const updateMutation = useMutation({
    mutationFn: () => hiringTeamApi.updateMember(jobId, member.id, {
      role: selectedRole,
      permissions,
    }),
    onSuccess: () => {
      onSuccess();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Team Member">
      <div className="space-y-4">
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <p className="font-medium text-neutral-900 dark:text-white">{member.userName}</p>
          <p className="text-sm text-neutral-500">{member.userEmail}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Role
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as HiringTeamRole)}
          >
            {Object.entries(roleConfig).map(([role, config]) => (
              <option key={role} value={role}>{config.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Custom Permissions
          </label>
          <div className="space-y-2">
            {Object.entries(permissions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => updateMutation.mutate()}
            isLoading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
