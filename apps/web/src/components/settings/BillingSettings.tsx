import { useState } from 'react';
import { Card, CardHeader, Button, Input, Modal } from '../ui';
import {
    CreditCard,
    CheckCircle2,
    Download,
    Plus,
    Trash2,
    Star,
    Zap,
    Building2,
    Users,
    Briefcase,
    HardDrive,
    Clock,
    Check,
    AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface Plan {
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
}

interface PaymentMethod {
    id: string;
    type: 'visa' | 'mastercard' | 'amex';
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    pdfUrl?: string;
}

interface BillingAddress {
    company: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    taxId?: string;
}

const plans: Plan[] = [
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
    },
];

export function BillingSettings() {
    const { t } = useTranslation();
    const [currentPlan] = useState<string>('pro');
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock data - in real app, fetch from API
    const [paymentMethods] = useState<PaymentMethod[]>([
        { id: '1', type: 'visa', last4: '4242', expMonth: 12, expYear: 2025, isDefault: true },
    ]);

    const [invoices] = useState<Invoice[]>([
        { id: 'inv_001', date: '2024-12-01', amount: 49.00, currency: 'USD', status: 'paid' },
        { id: 'inv_002', date: '2024-11-01', amount: 49.00, currency: 'USD', status: 'paid' },
        { id: 'inv_003', date: '2024-10-01', amount: 49.00, currency: 'USD', status: 'paid' },
        { id: 'inv_004', date: '2024-09-01', amount: 49.00, currency: 'USD', status: 'paid' },
    ]);

    const [billingAddress, setBillingAddress] = useState<BillingAddress>({
        company: 'Acme Corporation',
        address: '123 Business Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'United States',
        taxId: '',
    });

    // Current usage mock data
    const usage = {
        jobs: { used: 5, limit: 10 },
        users: { used: 8, limit: 20 },
        storage: { used: 12, limit: 50, unit: 'GB' },
    };

    const getCardIcon = (_type: string) => {
        return <CreditCard size={20} className="text-neutral-500" />;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleUpgrade = async (planId: string) => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(`Upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
        } catch {
            toast.error('Failed to upgrade plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadInvoice = (invoiceId: string) => {
        toast.success(`Downloading invoice ${invoiceId}...`);
    };

    const handleDeleteCard = (_cardId: string) => {
        toast.success('Payment method removed');
    };

    const handleSaveAddress = () => {
        toast.success('Billing address updated');
        setShowAddressModal(false);
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
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Pro Plan</h3>
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                                        Active
                                    </span>
                                </div>
                                <p className="text-neutral-500">$49/month • Renews on Jan 1, 2025</p>
                            </div>
                        </div>
                        <Button variant="secondary">Manage Subscription</Button>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase size={16} className="text-blue-500" />
                                <span className="text-sm text-neutral-500">Active Jobs</span>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {usage.jobs.used} / {usage.jobs.limit}
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full mt-3">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(usage.jobs.used / usage.jobs.limit) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={16} className="text-green-500" />
                                <span className="text-sm text-neutral-500">Team Members</span>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {usage.users.used} / {usage.users.limit}
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full mt-3">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(usage.users.used / usage.users.limit) * 100}%` }}
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
                                    style={{ width: `${(usage.storage.used / usage.storage.limit) * 100}%` }}
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

            {/* Payment Methods */}
            <Card>
                <CardHeader
                    title={t('settings.billing.paymentMethods', 'Payment Methods')}
                    description={t('settings.billing.paymentMethodsDesc', 'Manage your payment cards and billing details')}
                    action={
                        <Button variant="secondary" size="sm" onClick={() => setShowAddCardModal(true)}>
                            <Plus size={16} className="mr-1" /> Add Card
                        </Button>
                    }
                />
                <div className="p-6 pt-0 space-y-3">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    {getCardIcon(method.type)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-neutral-900 dark:text-white capitalize">
                                            {method.type} •••• {method.last4}
                                        </span>
                                        {method.isDefault && (
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-neutral-500">
                                        Expires {method.expMonth}/{method.expYear}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => handleDeleteCard(method.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {paymentMethods.length === 0 && (
                        <div className="text-center py-8 text-neutral-500">
                            <CreditCard size={40} className="mx-auto mb-3 opacity-50" />
                            <p>No payment methods added yet</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Billing Address */}
            <Card>
                <CardHeader
                    title={t('settings.billing.billingAddress', 'Billing Address')}
                    description={t('settings.billing.billingAddressDesc', 'This address will appear on your invoices')}
                    action={
                        <Button variant="ghost" size="sm" onClick={() => setShowAddressModal(true)}>
                            Edit
                        </Button>
                    }
                />
                <div className="p-6 pt-0">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <p className="font-medium text-neutral-900 dark:text-white">{billingAddress.company}</p>
                        <p className="text-neutral-600 dark:text-neutral-400">{billingAddress.address}</p>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-400">{billingAddress.country}</p>
                        {billingAddress.taxId && (
                            <p className="text-neutral-500 text-sm mt-2">Tax ID: {billingAddress.taxId}</p>
                        )}
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
                                                {invoice.id.toUpperCase()}
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
                                                onClick={() => handleDownloadInvoice(invoice.id)}
                                            >
                                                <Download size={16} className="mr-1" /> Download
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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

            {/* Add Card Modal */}
            <Modal isOpen={showAddCardModal} onClose={() => setShowAddCardModal(false)} title="Add Payment Method">
                <div className="space-y-4">
                    <Input label="Card Number" placeholder="1234 5678 9012 3456" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Expiry Date" placeholder="MM/YY" />
                        <Input label="CVC" placeholder="123" />
                    </div>
                    <Input label="Cardholder Name" placeholder="John Doe" />
                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <Button variant="secondary" onClick={() => setShowAddCardModal(false)}>Cancel</Button>
                        <Button onClick={() => { setShowAddCardModal(false); toast.success('Card added successfully'); }}>
                            Add Card
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Billing Address Modal */}
            <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Edit Billing Address">
                <div className="space-y-4">
                    <Input
                        label="Company Name"
                        value={billingAddress.company}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, company: e.target.value }))}
                    />
                    <Input
                        label="Address"
                        value={billingAddress.address}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="City"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        />
                        <Input
                            label="State/Province"
                            value={billingAddress.state}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Postal Code"
                            value={billingAddress.postalCode}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        />
                        <Input
                            label="Country"
                            value={billingAddress.country}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                        />
                    </div>
                    <Input
                        label="Tax ID (optional)"
                        value={billingAddress.taxId || ''}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, taxId: e.target.value }))}
                        placeholder="VAT, GST, or EIN"
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <Button variant="secondary" onClick={() => setShowAddressModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveAddress}>Save Address</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
