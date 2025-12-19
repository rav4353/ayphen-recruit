import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { Briefcase } from 'lucide-react';
import { paymentsApi, analyticsApi, extractData } from '../../lib/api';
import { plans } from '../settings/BillingSettings';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function BillingUsageWidget() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState({
        planName: 'Starter',
        jobs: { used: 0, limit: 3 as number | 'unlimited' },
        nextBill: { date: '-', amount: 0 }
    });
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [subRes, summaryRes] = await Promise.all([
                    paymentsApi.getSubscription(),
                    analyticsApi.getSummary()
                ]);

                const sub = extractData<any>(subRes);
                const summary = extractData<any>(summaryRes);

                // Determine Plan Name & Limits
                let currentPlan = plans.find(p => p.id === 'starter');
                if (sub?.plan) {
                    const planName = sub.plan.name?.toLowerCase();
                    const found = plans.find(p => p.id === planName || p.name.toLowerCase() === planName);
                    if (found) currentPlan = found;
                } else if (sub?.planId) {
                    const found = plans.find(p => p.id === sub.planId.toLowerCase());
                    if (found) currentPlan = found;
                }

                // Next Bill Info
                let nextBillDate = '-';
                if (sub?.current_period_end) {
                    nextBillDate = new Date(sub.current_period_end * 1000).toLocaleDateString();
                }

                setUsage({
                    planName: currentPlan?.name || 'Starter',
                    jobs: {
                        used: summary?.activeJobs || 0,
                        limit: currentPlan?.limits.jobs || 3
                    },
                    nextBill: {
                        date: nextBillDate,
                        amount: currentPlan?.price || 0
                    }

                });

            } catch (err) {
                console.error('Failed to load billing widget', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleManageSubscription = async () => {
        setIsPortalLoading(true);
        try {
            const response = await paymentsApi.createPortalSession();
            const { url } = extractData<{ url: string }>(response);
            if (url) {
                window.location.href = url;
            } else {
                toast.error('No billing portal URL received');
            }
        } catch (error: any) {
            console.error('Billing portal error:', error);
            navigate('/settings?tab=billing');
        } finally {
            setIsPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader title="Billing & Usage" align="left" />
                <div className="p-6 space-y-6">
                    <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                </div>
            </Card>
        );
    }

    const jobPercentage = usage.jobs.limit === 'unlimited'
        ? 0
        : Math.min(100, Math.round((usage.jobs.used / (usage.jobs.limit as number)) * 100));

    return (
        <Card>
            <CardHeader title="Billing & Usage" align="left" />
            <div className="p-6 pt-2 space-y-6">
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700">
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Current Plan</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{usage.planName}</p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleManageSubscription}
                        isLoading={isPortalLoading}
                    >
                        {isPortalLoading ? 'Loading...' : 'Manage'}
                    </Button>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                            <Briefcase size={16} className="text-blue-500" /> Active Jobs
                        </span>
                        <span className="text-neutral-500">
                            {usage.jobs.used} / {usage.jobs.limit === 'unlimited' ? '∞' : usage.jobs.limit} used
                        </span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${jobPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Next Billing Date</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{usage.nextBill.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-neutral-500">Amount</span>
                        <span className="font-medium text-neutral-900 dark:text-white">${usage.nextBill.amount}/mo</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
