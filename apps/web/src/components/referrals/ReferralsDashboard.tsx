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
  Gift,
  TrendingUp,
  DollarSign,
  Trophy,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  Settings,
} from 'lucide-react';
import { referralsApi } from '@/lib/api';

interface ReferralStats {
  total: number;
  pending: number;
  interviewed: number;
  hired: number;
  rejected: number;
  totalBonusEarned: number;
  pendingBonus: number;
}

interface Referral {
  id: string;
  candidateId: string;
  candidateName: string;
  candidate?: {
    email: string;
    currentTitle: string;
    applications: { status: string; job: { title: string } }[];
  };
  referrer?: { firstName: string; lastName: string; email: string };
  status: string;
  bonusStatus: string;
  bonusAmount: number;
  createdAt: string;
  hiredAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  INTERVIEWED: { label: 'Interviewed', color: 'bg-blue-100 text-blue-800', icon: UserCheck },
  HIRED: { label: 'Hired', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function ReferralsDashboard({ isAdmin = false }: { isAdmin?: boolean }) {
  const queryClient = useQueryClient();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: myStats } = useQuery({
    queryKey: ['my-referral-stats'],
    queryFn: () => referralsApi.getMyStats(),
  });

  const { data: myReferrals, isLoading: loadingMy } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: () => referralsApi.getMyReferrals(),
  });

  const { data: allReferrals, isLoading: loadingAll } = useQuery({
    queryKey: ['all-referrals', statusFilter],
    queryFn: () => referralsApi.getAll({ status: statusFilter || undefined }),
    enabled: isAdmin,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['referral-leaderboard'],
    queryFn: () => referralsApi.getLeaderboard(5),
  });

  const { data: bonusConfig } = useQuery({
    queryKey: ['referral-bonus-config'],
    queryFn: () => referralsApi.getBonusConfig(),
  });

  const stats: ReferralStats = myStats?.data || {
    total: 0, pending: 0, interviewed: 0, hired: 0, rejected: 0, totalBonusEarned: 0, pendingBonus: 0
  };

  const referrals: Referral[] = isAdmin ? (allReferrals?.data || []) : (myReferrals?.data || []);
  const leaders = leaderboard?.data || [];
  const config = bonusConfig?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {isAdmin ? 'Referral Program' : 'My Referrals'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isAdmin ? 'Manage employee referrals and bonuses' : 'Track your referrals and bonuses'}
          </p>
        </div>
        {isAdmin && (
          <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Bonuses
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-neutral-500">Total Referrals</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-neutral-500">Hired</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats.hired}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-neutral-500">Bonus Earned</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                ${stats.totalBonusEarned.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Gift className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-neutral-500">Pending Bonus</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                ${stats.pendingBonus.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bonus Info */}
      {config && (
        <Card className="p-4 bg-gradient-to-r from-primary-500/10 to-purple-500/10">
          <div className="flex items-center gap-4">
            <Gift className="h-8 w-8 text-primary-500" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Referral Bonus Program</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Earn <span className="font-bold text-primary-600">{config.currency}{config.hiredBonus}</span> for each successful hire
                {config.interviewBonus > 0 && (
                  <> and <span className="font-bold text-primary-600">{config.currency}{config.interviewBonus}</span> when your referral gets interviewed</>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referrals List */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {isAdmin ? 'All Referrals' : 'My Referrals'}
              </h3>
              {isAdmin && (
                <select
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="INTERVIEWED">Interviewed</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              )}
            </div>

            {(loadingMy || loadingAll) ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                <p className="text-neutral-500">No referrals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <ReferralCard key={referral.id} referral={referral} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Leaderboard */}
        <div>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">Top Referrers</h3>
            </div>

            {leaders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {leaders.map((leader: any, index: number) => (
                  <div
                    key={leader.user?.id || index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-neutral-200 text-neutral-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {leader.user?.firstName} {leader.user?.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {leader.hired} hired • {leader.total} total
                      </p>
                    </div>
                    <Badge variant="success" className="text-xs">
                      ${leader.bonus}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bonus Config Modal */}
      {showConfigModal && (
        <BonusConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          currentConfig={config}
          onSuccess={() => {
            setShowConfigModal(false);
            queryClient.invalidateQueries({ queryKey: ['referral-bonus-config'] });
          }}
        />
      )}
    </div>
  );
}

function ReferralCard({ referral, isAdmin }: { referral: Referral; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const config = statusConfig[referral.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'PENDING' | 'INTERVIEWED' | 'HIRED' | 'REJECTED') =>
      referralsApi.updateStatus(referral.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
    },
  });

  const payBonusMutation = useMutation({
    mutationFn: () => referralsApi.markBonusPaid(referral.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
    },
  });

  return (
    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">{referral.candidateName}</p>
          {referral.candidate?.currentTitle && (
            <p className="text-xs text-neutral-500">{referral.candidate.currentTitle}</p>
          )}
          {isAdmin && referral.referrer && (
            <p className="text-xs text-neutral-500 mt-1">
              Referred by: {referral.referrer.firstName} {referral.referrer.lastName}
            </p>
          )}
        </div>
        <Badge className={`${config.color} flex items-center gap-1`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      {referral.bonusAmount > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={referral.bonusStatus === 'PAID' ? 'success' : 'warning'} className="text-xs">
            ${referral.bonusAmount} - {referral.bonusStatus === 'PAID' ? 'Paid' : 'Pending Payment'}
          </Badge>
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          {referral.status === 'PENDING' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate('INTERVIEWED')}>
                Mark Interviewed
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate('REJECTED')}>
                Reject
              </Button>
            </>
          )}
          {referral.status === 'INTERVIEWED' && (
            <>
              <Button size="sm" variant="primary" onClick={() => updateStatusMutation.mutate('HIRED')}>
                Mark Hired
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate('REJECTED')}>
                Reject
              </Button>
            </>
          )}
          {referral.status === 'HIRED' && referral.bonusStatus === 'PENDING_PAYMENT' && (
            <Button size="sm" variant="primary" onClick={() => payBonusMutation.mutate()}>
              <DollarSign className="h-4 w-4 mr-1" />
              Mark Bonus Paid
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function BonusConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: any;
  onSuccess: () => void;
}) {
  const [config, setConfig] = useState({
    hiredBonus: currentConfig?.hiredBonus || 1000,
    interviewBonus: currentConfig?.interviewBonus || 0,
    currency: currentConfig?.currency || 'USD',
  });

  const saveMutation = useMutation({
    mutationFn: () => referralsApi.setBonusConfig(config),
    onSuccess,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Referral Bonuses">
      <div className="space-y-4">
        <Input
          label="Hired Bonus Amount"
          type="number"
          value={config.hiredBonus}
          onChange={(e) => setConfig({ ...config, hiredBonus: parseInt(e.target.value) || 0 })}
        />

        <Input
          label="Interview Bonus Amount (optional)"
          type="number"
          value={config.interviewBonus}
          onChange={(e) => setConfig({ ...config, interviewBonus: parseInt(e.target.value) || 0 })}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Currency
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
            value={config.currency}
            onChange={(e) => setConfig({ ...config, currency: e.target.value })}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  );
}
