import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { Plus, Users, Search, UserPlus, Clock, CheckCircle, Mail, Briefcase, ExternalLink, Award, History, XCircle } from 'lucide-react';
import { ReferralModal } from '../../components/referrals/ReferralModal';
import { referralsApi } from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';

type TabType = 'all' | 'pending' | 'hired' | 'rejected';

interface Referral {
    id: string;
    candidateId: string;
    candidateName: string;
    candidate?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        currentTitle?: string;
        applications?: { status: string; job: { title: string } }[];
    };
    status: string;
    bonusStatus: string;
    bonusAmount: number;
    createdAt: string;
    hiredAt?: string;
}

interface ReferralStats {
    total: number;
    pending: number;
    interviewed: number;
    hired: number;
    rejected: number;
    totalBonusEarned: number;
    pendingBonus: number;
}

export function ReferralsPage() {
    const { t } = useTranslation();
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState<ReferralStats>({
        total: 0, pending: 0, interviewed: 0, hired: 0, rejected: 0, totalBonusEarned: 0, pendingBonus: 0
    });

    const tabs = [
        { id: 'all' as TabType, label: t('referrals.allReferrals', 'All Referrals'), icon: Users },
        { id: 'pending' as TabType, label: t('referrals.pendingTab', 'Pending'), icon: Clock },
        { id: 'hired' as TabType, label: t('referrals.hiredTab', 'Hired'), icon: CheckCircle },
        { id: 'rejected' as TabType, label: t('referrals.rejectedTab', 'Rejected'), icon: XCircle },
    ];

    const fetchReferrals = async () => {
        try {
            const [referralsRes, statsRes] = await Promise.all([
                referralsApi.getMyReferrals(),
                referralsApi.getMyStats()
            ]);
            const referralsData = referralsRes.data?.data || referralsRes.data || [];
            setReferrals(referralsData);
            setFilteredReferrals(referralsData);
            setStats(statsRes.data?.data || statsRes.data || stats);
        } catch (error) {
            console.error('Failed to fetch referrals', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, []);

    useEffect(() => {
        let filtered = referrals;
        
        // Filter by tab
        if (activeTab !== 'all') {
            const statusMap: Record<TabType, string[]> = {
                all: [],
                pending: ['PENDING', 'INTERVIEWED'],
                hired: ['HIRED'],
                rejected: ['REJECTED'],
            };
            filtered = filtered.filter(r => statusMap[activeTab].includes(r.status));
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.candidateName?.toLowerCase().includes(term) ||
                r.candidate?.email?.toLowerCase().includes(term) ||
                r.candidate?.currentTitle?.toLowerCase().includes(term)
            );
        }
        setFilteredReferrals(filtered);
    }, [searchTerm, referrals, activeTab]);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-64" />
                        </div>
                        <Skeleton className="h-10 w-36 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-28 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Premium Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-purple-950/20 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                                <UserPlus size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                    {t('referrals.title', 'Employee Referrals')}
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                    {t('referrals.trackReferrals', 'Track your referrals and earn rewards')}
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-primary-500/25">
                            <Plus size={16} />
                            {t('referrals.submitReferral', 'Submit Referral')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'}`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {tab.id === 'all' && stats.total > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>{stats.total}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Users size={16} className="text-purple-500" />
                                {t('referrals.myReferrals', 'My Referrals')}
                            </h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={t('referrals.searchPlaceholder', 'Search referrals...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-9 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                                />
                            </div>
                        </div>
                        
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredReferrals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                        <UserPlus size={28} className="text-neutral-400" />
                                    </div>
                                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">{t('referrals.noReferralsTitle', 'No referrals yet')}</p>
                                    <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">{t('referrals.noReferrals', 'Start referring talented people and earn rewards!')}</p>
                                    <Button onClick={() => setIsModalOpen(true)} variant="outline" className="gap-2">
                                        <Plus size={16} />
                                        {t('referrals.submitFirst', 'Submit Your First Referral')}
                                    </Button>
                                </div>
                            ) : (
                                filteredReferrals.map((referral) => {
                                    const initials = referral.candidateName?.split(' ').map(n => n[0]).join('') || '?';
                                    const statusVariant = referral.status === 'HIRED' ? 'success' : referral.status === 'REJECTED' ? 'error' : 'secondary';
                                    const statusLabel = referral.status === 'HIRED' ? 'Hired' : referral.status === 'REJECTED' ? 'Rejected' : referral.status === 'INTERVIEWED' ? 'Interviewed' : 'Pending';
                                    return (
                                        <div
                                            key={referral.id}
                                            className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/${tenantId}/candidates/${referral.candidateId}`)}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-neutral-900 dark:text-white">{referral.candidateName}</h4>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                                                            {referral.candidate?.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail size={12} />
                                                                    {referral.candidate.email}
                                                                </span>
                                                            )}
                                                            {referral.candidate?.currentTitle && (
                                                                <span className="flex items-center gap-1">
                                                                    <Briefcase size={12} />
                                                                    {referral.candidate.currentTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-neutral-500">{t('referrals.referred', 'Referred')}</p>
                                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                            {new Date(referral.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    {referral.bonusAmount > 0 && (
                                                        <Badge variant={referral.bonusStatus === 'PAID' ? 'success' : 'warning'} className="whitespace-nowrap">
                                                            ${referral.bonusAmount}
                                                        </Badge>
                                                    )}
                                                    <Badge variant={statusVariant} className="whitespace-nowrap">{statusLabel}</Badge>
                                                    <ExternalLink size={16} className="text-neutral-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Rewards Info */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Award size={16} className="text-amber-500" />
                                {t('referrals.rewardProgram', 'Reward Program')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-sm text-neutral-500">{t('referrals.pendingRewards', 'Pending Rewards')}</span>
                                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">${stats.pendingBonus}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-sm text-neutral-500">{t('referrals.paidRewards', 'Paid Rewards')}</span>
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">${stats.totalBonusEarned}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-neutral-500">{t('referrals.totalEarnings', 'Total Earnings')}</span>
                                    <span className="text-lg font-bold text-neutral-900 dark:text-white">${stats.pendingBonus + stats.totalBonusEarned}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Activity */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <History size={16} className="text-blue-500" />
                                {t('referrals.recentActivity', 'Recent Activity')}
                            </h3>
                            {referrals.length === 0 ? (
                                <p className="text-sm text-neutral-500 italic">{t('referrals.noActivity', 'No recent activity')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {referrals.slice(0, 3).map((r) => (
                                        <div key={r.id} className="flex items-center gap-3 text-sm">
                                            <div className={`w-2 h-2 rounded-full ${r.status === 'HIRED' ? 'bg-emerald-500' : r.status === 'REJECTED' ? 'bg-red-500' : 'bg-purple-500'}`} />
                                            <span className="text-neutral-600 dark:text-neutral-400">
                                                <span className="font-medium text-neutral-900 dark:text-white">{r.candidateName}</span> - {r.status?.toLowerCase().replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ReferralModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchReferrals}
            />
        </div>
    );
}
