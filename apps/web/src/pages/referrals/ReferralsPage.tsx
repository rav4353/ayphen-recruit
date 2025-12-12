import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '../../components/ui';
import { Plus, Users, Gift, TrendingUp, Search } from 'lucide-react';
import { ReferralModal } from '../../components/referrals/ReferralModal';
import { candidatesApi } from '../../lib/api';
import { Candidate } from '../../lib/types';

export function ReferralsPage() {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [referrals, setReferrals] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReferrals = async () => {
        try {
            // Fetch referrals made by the current user
            const response = await candidatesApi.getMyReferrals();
            setReferrals(response.data.data);
        } catch (error) {
            console.error('Failed to fetch referrals', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">{t('referrals.title')}</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('referrals.trackReferrals')}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} />
                    {t('referrals.submitReferral')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-primary-500 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('referrals.myReferrals')}</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{referrals.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Users size={22} />
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-green-500 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Successful Hires</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">0</h3>
                        </div>
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                            <TrendingUp size={22} />
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('referrals.bonus')}</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">$0</h3>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Gift size={22} />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{t('referrals.myReferrals')}</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search referrals..."
                            className="w-full h-9 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                            onChange={(e) => {
                                const term = e.target.value.toLowerCase();
                                if (!term) {
                                    fetchReferrals();
                                    return;
                                }
                                setReferrals(prev => prev.filter(r =>
                                    r.firstName.toLowerCase().includes(term) ||
                                    r.lastName.toLowerCase().includes(term) ||
                                    r.email.toLowerCase().includes(term)
                                ));
                            }}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800/30">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('referrals.candidateName')}</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('referrals.dateReferred')}</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('referrals.status')}</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Reward Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {referrals.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                                <Users size={24} className="text-neutral-400" />
                                            </div>
                                            <p className="font-medium text-neutral-900 dark:text-white mb-1">No referrals yet</p>
                                            <p className="text-sm text-neutral-500">{t('referrals.noReferrals')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                referrals.map((referral) => (
                                    <tr key={referral.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold">
                                                    {referral.firstName[0]}{referral.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-neutral-900 dark:text-white">
                                                        {referral.firstName} {referral.lastName}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">{referral.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-neutral-500">
                                            {new Date(referral.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                                Pending
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ReferralModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchReferrals}
            />
        </div>
    );
}
