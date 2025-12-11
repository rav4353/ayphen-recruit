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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('referrals.title')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">{t('referrals.trackReferrals')}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />}>
                    {t('referrals.submitReferral')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('referrals.myReferrals')}</p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{referrals.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Successful Hires</p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">0</h3>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('referrals.bonus')}</p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">$0</h3>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400">
                            <Gift size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{t('referrals.myReferrals')}</h2>
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search referrals..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">{t('referrals.candidateName')}</th>
                                <th className="px-6 py-4">{t('referrals.dateReferred')}</th>
                                <th className="px-6 py-4">{t('referrals.status')}</th>
                                <th className="px-6 py-4">Reward Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {referrals.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-neutral-500">
                                            <Users size={48} className="mb-4 text-neutral-300 dark:text-neutral-600" />
                                            <p className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No referrals yet</p>
                                            <p className="text-sm">{t('referrals.noReferrals')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                referrals.map((referral) => (
                                    <tr key={referral.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                                    {referral.firstName[0]}{referral.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                                        {referral.firstName} {referral.lastName}
                                                        {referral.candidateId && (
                                                            <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                                                {referral.candidateId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">{referral.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-500">
                                            {new Date(referral.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-neutral-500">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
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
