import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, FileSignature, FileText, Search, Clock, CheckCircle, XCircle, Send, DollarSign, ExternalLink, Briefcase, Calendar } from 'lucide-react';
import { offersApi } from '../../lib/api';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import { format } from 'date-fns';

type TabType = 'all' | 'pending' | 'sent' | 'accepted' | 'declined';

export function OffersPage() {
    const { t } = useTranslation();
    const [offers, setOffers] = useState<any[]>([]);
    const [filteredOffers, setFilteredOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    const tabs = [
        { id: 'all' as TabType, label: t('offers.allOffers', 'All Offers'), icon: FileSignature },
        { id: 'pending' as TabType, label: t('offers.pendingTab', 'Pending'), icon: Clock },
        { id: 'sent' as TabType, label: t('offers.sentTab', 'Sent'), icon: Send },
        { id: 'accepted' as TabType, label: t('offers.acceptedTab', 'Accepted'), icon: CheckCircle },
        { id: 'declined' as TabType, label: t('offers.declinedTab', 'Declined'), icon: XCircle },
    ];

    useEffect(() => {
        fetchOffers();
    }, []);

    useEffect(() => {
        let filtered = offers;
        
        // Filter by tab
        if (activeTab !== 'all') {
            const statusMap: Record<TabType, string[]> = {
                all: [],
                pending: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'],
                sent: ['SENT'],
                accepted: ['ACCEPTED'],
                declined: ['DECLINED', 'EXPIRED'],
            };
            filtered = filtered.filter(o => statusMap[activeTab].includes(o.status));
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.application?.candidate?.firstName?.toLowerCase().includes(term) ||
                o.application?.candidate?.lastName?.toLowerCase().includes(term) ||
                o.application?.job?.title?.toLowerCase().includes(term)
            );
        }
        
        setFilteredOffers(filtered);
    }, [activeTab, searchTerm, offers]);

    const fetchOffers = async () => {
        try {
            const response = await offersApi.getAll();
            const data = response.data.data || response.data;
            setOffers(data);
            setFilteredOffers(data);
        } catch (error) {
            console.error('Failed to fetch offers', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: offers.length,
        pending: offers.filter(o => ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(o.status)).length,
        sent: offers.filter(o => o.status === 'SENT').length,
        accepted: offers.filter(o => o.status === 'ACCEPTED').length,
        declined: offers.filter(o => ['DECLINED', 'EXPIRED'].includes(o.status)).length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <Badge variant="secondary">{t('offers.status.draft')}</Badge>;
            case 'PENDING_APPROVAL':
                return <Badge variant="warning">{t('offers.status.pendingApproval')}</Badge>;
            case 'APPROVED':
                return <Badge variant="success">{t('offers.status.approved')}</Badge>;
            case 'SENT':
                return <Badge variant="secondary">{t('offers.status.sent')}</Badge>;
            case 'ACCEPTED':
                return <Badge variant="success">{t('offers.status.accepted')}</Badge>;
            case 'DECLINED':
                return <Badge variant="error">{t('offers.status.declined')}</Badge>;
            case 'EXPIRED':
                return <Badge variant="secondary">{t('offers.status.expired')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-64" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-36 rounded-lg" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Premium Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                                <FileSignature size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                    {t('offers.title', 'Offer Management')}
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                    {t('offers.manageOffers', 'Create and manage job offers')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => navigate(`/${tenantId}/offers/templates`)} className="gap-2">
                                <FileText size={16} />
                                {t('offers.manageTemplates', 'Templates')}
                            </Button>
                            <Button onClick={() => navigate(`/${tenantId}/offers/new`)} className="gap-2 shadow-lg shadow-primary-500/25">
                                <Plus size={16} />
                                {t('offers.createOffer', 'Create Offer')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const count = tab.id === 'all' ? stats.total : stats[tab.id as keyof typeof stats];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'}`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>{count}</span>
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
                                <FileSignature size={16} className="text-emerald-500" />
                                {t('offers.offersList', 'Offers')}
                            </h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={t('offers.searchPlaceholder', 'Search offers...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-9 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                                />
                            </div>
                        </div>
                        
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredOffers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                        <FileSignature size={28} className="text-neutral-400" />
                                    </div>
                                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">{t('offers.noOffers', 'No offers yet')}</p>
                                    <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">{t('offers.noOffersDesc', 'Create your first offer to get started')}</p>
                                    <Button onClick={() => navigate(`/${tenantId}/offers/new`)} className="gap-2">
                                        <Plus size={16} />
                                        {t('offers.createOffer', 'Create Offer')}
                                    </Button>
                                </div>
                            ) : (
                                filteredOffers.map((offer) => (
                                    <div
                                        key={offer.id}
                                        className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/${tenantId}/offers/${offer.id}`)}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
                                                    {offer.application?.candidate?.firstName?.[0] || '?'}{offer.application?.candidate?.lastName?.[0] || ''}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                                        {offer.application?.candidate?.firstName} {offer.application?.candidate?.lastName}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase size={12} />
                                                            {offer.application?.job?.title}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign size={12} />
                                                            {offer.currency} {offer.salary?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs text-neutral-500">{t('offers.created', 'Created')}</p>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                        {format(new Date(offer.createdAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                {getStatusBadge(offer.status)}
                                                <ExternalLink size={16} className="text-neutral-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* Offer Stats */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-500" />
                                {t('offers.offerStats', 'Offer Statistics')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-sm text-neutral-500">{t('offers.totalOffers', 'Total Offers')}</span>
                                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{stats.total}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-sm text-neutral-500">{t('offers.acceptanceRate', 'Acceptance Rate')}</span>
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-neutral-500">{t('offers.pendingOffers', 'Awaiting Response')}</span>
                                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{stats.sent}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" />
                                {t('offers.recentOffers', 'Recent Offers')}
                            </h3>
                            {offers.length === 0 ? (
                                <p className="text-sm text-neutral-500 italic">{t('offers.noRecentOffers', 'No recent offers')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {offers.slice(0, 3).map((o) => (
                                        <div key={o.id} className="flex items-center gap-3 text-sm">
                                            <div className={`w-2 h-2 rounded-full ${o.status === 'ACCEPTED' ? 'bg-emerald-500' : o.status === 'DECLINED' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                            <span className="text-neutral-600 dark:text-neutral-400 truncate">
                                                <span className="font-medium text-neutral-900 dark:text-white">{o.application?.candidate?.firstName}</span> - {o.application?.job?.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
