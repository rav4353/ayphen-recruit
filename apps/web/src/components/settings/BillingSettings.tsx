import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import {
    CreditCard,
    CheckCircle2,
    Download,
    Star,
    Zap,
    Building2,
    Users,
    Briefcase,
    HardDrive,
    Clock,
    Check,
    AlertCircle,
    ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { analyticsApi, extractData, paymentsApi } from '../../lib/api';

export interface Plan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    description: string;
    features: string[];
    limits: {
        jobs: number | 'unlimited';
        users: number | 'unlimited';
        storage: string;
    };
    popular?: boolean;
    stripePriceId?: string;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    pdfUrl?: string;
}

export const plans: Plan[] = [
    {
        id: 'starter',
        name: 'Starter',
        price: 0,
        interval: 'month',
        description: 'Perfect for small teams getting started',
        features: [
            '3 active job postings',
            '2 team members',
            'Basic candidate tracking',
            'Email support',
            '5GB storage',
        ],
        limits: {
            jobs: 3,
            users: 2,
            storage: '5GB',
        },
        stripePriceId: 'price_starter_placeholder',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 49,
        interval: 'month',
        description: 'For growing teams with advanced needs',
        features: [
            '10 active job postings',
            '20 team members',
            'Advanced pipeline management',
            'Interview scheduling',
            'Custom scorecards',
            'Priority email support',
            '50GB storage',
        ],
        limits: {
            jobs: 10,
            users: 20,
            storage: '50GB',
        },
        popular: true,
        stripePriceId: 'price_pro_placeholder',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        interval: 'month',
        description: 'For large organizations with custom requirements',
        features: [
            'Unlimited job postings',
            'Unlimited team members',
            'Advanced analytics & reporting',
            'Custom integrations',
            'API access',
            'Dedicated account manager',
            'SSO & advanced security',
            'Unlimited storage',
            '24/7 phone support',
        ],
        limits: {
            jobs: 'unlimited',
            users: 'unlimited',
            storage: 'Unlimited',
        },
        stripePriceId: 'price_enterprise_placeholder',
    },
];

export function BillingSettings() {
    const { t } = useTranslation();
    const [currentPlan, setCurrentPlan] = useState<string>('starter');
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [isLoading, setIsLoading] = useState(false);
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Usage stats
    const [usage, setUsage] = useState({
        jobs: { used: 0, limit: 3 as number | 'unlimited' },
        users: { used: 0, limit: 2 as number | 'unlimited' },
        storage: { used: 0, limit: 5 as number | 'unlimited' | string, unit: 'GB' },
    });

    // Fetch real data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [subRes, invRes, summaryRes, userActivityRes] = await Promise.all([
                    paymentsApi.getSubscription(),
                    paymentsApi.getInvoices(),
                    analyticsApi.getSummary(),
                    analyticsApi.getUserActivity()
                ]);

                const subData: any = extractData(subRes);
                const summaryData: any = extractData(summaryRes);
                const userActivityData: any = extractData(userActivityRes);

                // Set Plan
                if (subData?.plan) {
                    // Try to match by ID first, then name
                    const planName = subData.plan.name?.toLowerCase();
                    const matchedPlan = plans.find(p => p.id === planName || p.name.toLowerCase() === planName);

                    if (matchedPlan) {
                        setCurrentPlan(matchedPlan.id);
                        // Use limits from the matched static plan def for now to ensure consistency, 
                        // or use subData.plan.limits if valid.
                        // Using matched plan limits:
                        setUsage(prev => ({
                            ...prev,
                            jobs: { ...prev.jobs, limit: matchedPlan.limits.jobs },
                            users: { ...prev.users, limit: matchedPlan.limits.users },
                            storage: { ...prev.storage, limit: matchedPlan.limits.storage.replace('GB', '').replace('Unlimited', 'unlimited') } // Normalize
                        }));
                    }
                } else if (subData?.planId) {
                    setCurrentPlan(subData.planId.toLowerCase());
                }

                // Set Usage
                if (summaryData) {
                    setUsage(prev => ({
                        ...prev,
                        jobs: { ...prev.jobs, used: summaryData.activeJobs || 0 },
                    }));
                }

                if (userActivityData) {
                    setUsage(prev => ({
                        ...prev,
                        users: { ...prev.users, used: userActivityData.totalUsers || 0 },
                    }));
                }

                const invData: any = extractData(invRes);
                if (Array.isArray(invData)) {
                    setInvoices(invData.map((inv: any) => ({
                        id: inv.stripeInvoiceId || inv.id,
                        date: inv.periodStart,
                        amount: inv.amount / 100, // Amount is in cents
                        currency: inv.currency.toUpperCase(),
                        status: inv.status,
                        pdfUrl: inv.pdfUrl
                    })));
                }
            } catch (err) {
                console.error('Failed to load billing info', err);
            }
        };
        loadData();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleUpgrade = async (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan || !plan.stripePriceId) {
            toast.error('Invalid plan selected');
            return;
        }

        setIsLoading(true);
        try {
            const response = await paymentsApi.createCheckoutSession(plan.stripePriceId);
            const { url } = extractData<{ url: string }>(response);
            if (url) {
                window.location.href = url;
            } else {
                toast.error('Failed to start checkout - no URL received');
            }
        } catch (error: any) {
            console.error('Upgrade error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upgrade plan';

            if (errorMessage.includes('STRIPE')) {
                toast.error('Billing system is not configured. Please contact support.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

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
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load billing portal';

            if (errorMessage.includes('No billing account')) {
                toast.error('No billing account found. Please contact support to set up billing.');
            } else if (errorMessage.includes('STRIPE')) {
                toast.error('Billing system is not configured. Please contact support.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsPortalLoading(false);
        }
    }

    const handleDownloadInvoice = (invoiceId: string, url?: string) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            toast.success(`Downloading invoice ${invoiceId}...`);
        }
    };

    const yearlyDiscount = 0.2; // 20% discount for annual billing

    return (
        <div className="space-y-6">
            {/* Current Plan & Usage */}
            <Card>
                <CardHeader
                    title={t('settings.billing.currentPlan', 'Current Plan')}
                    description={t('settings.billing.currentPlanDesc', 'View your subscription and usage details')}
                />
                <div className="p-6 pt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Zap size={24} className="text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                        {plans.find(p => p.id === currentPlan)?.name || 'Starter'} Plan
                                    </h3>
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                                        Active
                                    </span>
                                </div>
                                <p className="text-neutral-500">
                                    {currentPlan === 'starter' ? 'Free Forever' : '$49/month • Renews on Jan 1, 2025'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleManageSubscription}
                            isLoading={isPortalLoading}
                        >
                            Manage Subscription
                        </Button>
                    </div>

                    {/* Usage Stats (Mocked for now) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase size={16} className="text-blue-500" />
                                <span className="text-sm text-neutral-500">Active Jobs</span>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {usage.jobs.used} / {usage.jobs.limit === 'unlimited' ? '∞' : usage.jobs.limit}
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full mt-3">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${usage.jobs.limit === 'unlimited' ? 0 : Math.min(100, (usage.jobs.used / Number(usage.jobs.limit)) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={16} className="text-green-500" />
                                <span className="text-sm text-neutral-500">Team Members</span>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {usage.users.used} / {usage.users.limit === 'unlimited' ? '∞' : usage.users.limit}
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full mt-3">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${usage.users.limit === 'unlimited' ? 0 : Math.min(100, (usage.users.used / Number(usage.users.limit)) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-2 mb-2">
                                <HardDrive size={16} className="text-purple-500" />
                                <span className="text-sm text-neutral-500">Storage Used</span>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {usage.storage.used} / {usage.storage.limit} {usage.storage.unit}
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full mt-3">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${usage.storage.limit === 'unlimited'
                                            ? 0
                                            : Math.min(100, (usage.storage.used / Number(String(usage.storage.limit).replace(/[^0-9.]/g, ''))) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Pricing Plans */}
            <Card>
                <CardHeader
                    title={t('settings.billing.plans', 'Available Plans')}
                    description={t('settings.billing.plansDesc', 'Choose the plan that best fits your needs')}
                />
                <div className="p-6 pt-0">
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className={`text-sm ${billingInterval === 'month' ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                            className={`relative w-14 h-7 rounded-full transition-colors ${billingInterval === 'year' ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'
                                }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${billingInterval === 'year' ? 'translate-x-8' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm ${billingInterval === 'year' ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-500'}`}>
                            Yearly
                            <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                                Save 20%
                            </span>
                        </span>
                    </div>

                    {/* Plan Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const price = billingInterval === 'year'
                                ? Math.round(plan.price * 12 * (1 - yearlyDiscount))
                                : plan.price;
                            const isCurrentPlan = plan.id === currentPlan;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 rounded-xl border-2 transition-all ${plan.popular
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                                            <Star size={12} /> Most Popular
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-sm text-neutral-500 mt-1">{plan.description}</p>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                                            ${price}
                                        </span>
                                        <span className="text-neutral-500">
                                            /{billingInterval === 'year' ? 'year' : 'month'}
                                        </span>
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        variant={isCurrentPlan ? 'secondary' : plan.popular ? 'primary' : 'secondary'}
                                        className="w-full"
                                        disabled={isCurrentPlan || isLoading}
                                        onClick={() => handleUpgrade(plan.id)}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Enterprise Contact */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-750 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                                    <Building2 size={20} className="text-neutral-600 dark:text-neutral-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">Need a custom plan?</h4>
                                    <p className="text-sm text-neutral-500">Contact us for enterprise pricing and custom features.</p>
                                </div>
                            </div>
                            <Button variant="secondary">Contact Sales</Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Billing Management via Portal */}
            <Card>
                <CardHeader
                    title={t('settings.billing.management', 'Billing Management')}
                    description="Manage your payment methods, billing address, and tax information securely via the Client Portal."
                    action={
                        <Button variant="secondary" size="sm" onClick={handleManageSubscription} isLoading={isPortalLoading}>
                            <ExternalLink size={16} className="mr-1" /> Open Portal
                        </Button>
                    }
                />
                <div className="p-6 pt-0">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                        <CreditCard className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">Secure Billing Portal</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                All sensitive billing information, including credit cards and billing addresses, is handled securely by Stripe. We do not store your payment details on our servers.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Billing History */}
            <Card>
                <CardHeader
                    title={t('settings.billing.history', 'Billing History')}
                    description={t('settings.billing.historyDesc', 'View and download your past invoices')}
                />
                <div className="p-6 pt-0">
                    {invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                        <th className="pb-3 font-medium text-neutral-500">Invoice</th>
                                        <th className="pb-3 font-medium text-neutral-500">Date</th>
                                        <th className="pb-3 font-medium text-neutral-500">Amount</th>
                                        <th className="pb-3 font-medium text-neutral-500">Status</th>
                                        <th className="pb-3 font-medium text-neutral-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <td className="py-4">
                                                <span className="font-medium text-neutral-900 dark:text-white">
                                                    {invoice.id.slice(0, 8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 text-neutral-600 dark:text-neutral-400">
                                                {formatDate(invoice.date)}
                                            </td>
                                            <td className="py-4 text-neutral-900 dark:text-white font-medium">
                                                ${invoice.amount.toFixed(2)} {invoice.currency}
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'paid'
                                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                    : invoice.status === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}>
                                                    {invoice.status === 'paid' && <CheckCircle2 size={12} />}
                                                    {invoice.status === 'pending' && <Clock size={12} />}
                                                    {invoice.status === 'failed' && <AlertCircle size={12} />}
                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(invoice.id, invoice.pdfUrl)}
                                                >
                                                    <Download size={16} className="mr-1" /> Download
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-neutral-500">
                            <p>No invoices found.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Plan Features Comparison */}
            <Card>
                <CardHeader
                    title={t('settings.billing.features', 'Feature Comparison')}
                    description={t('settings.billing.featuresDesc', 'Compare features across all plans')}
                />
                <div className="p-6 pt-0 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                <th className="py-3 text-left font-medium text-neutral-500">Feature</th>
                                <th className="py-3 text-center font-medium text-neutral-500">Starter</th>
                                <th className="py-3 text-center font-medium text-neutral-500">Pro</th>
                                <th className="py-3 text-center font-medium text-neutral-500">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {[
                                { feature: 'Active Job Postings', starter: '3', pro: '10', enterprise: 'Unlimited' },
                                { feature: 'Team Members', starter: '2', pro: '20', enterprise: 'Unlimited' },
                                { feature: 'Candidate Pipeline', starter: true, pro: true, enterprise: true },
                                { feature: 'Interview Scheduling', starter: false, pro: true, enterprise: true },
                                { feature: 'Custom Scorecards', starter: false, pro: true, enterprise: true },
                                { feature: 'Advanced Analytics', starter: false, pro: false, enterprise: true },
                                { feature: 'API Access', starter: false, pro: false, enterprise: true },
                                { feature: 'SSO Integration', starter: false, pro: false, enterprise: true },
                                { feature: 'Dedicated Support', starter: false, pro: false, enterprise: true },
                                { feature: 'Custom Integrations', starter: false, pro: false, enterprise: true },
                            ].map((row, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                    <td className="py-3 text-neutral-900 dark:text-white">{row.feature}</td>
                                    <td className="py-3 text-center">
                                        {typeof row.starter === 'boolean' ? (
                                            row.starter ? (
                                                <Check size={18} className="mx-auto text-green-500" />
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                                            )
                                        ) : (
                                            <span className="text-neutral-600 dark:text-neutral-400">{row.starter}</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-center">
                                        {typeof row.pro === 'boolean' ? (
                                            row.pro ? (
                                                <Check size={18} className="mx-auto text-green-500" />
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                                            )
                                        ) : (
                                            <span className="text-neutral-600 dark:text-neutral-400">{row.pro}</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-center">
                                        {typeof row.enterprise === 'boolean' ? (
                                            row.enterprise ? (
                                                <Check size={18} className="mx-auto text-green-500" />
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                                            )
                                        ) : (
                                            <span className="text-neutral-600 dark:text-neutral-400">{row.enterprise}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
