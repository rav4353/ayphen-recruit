import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, FileSignature, FileText } from 'lucide-react';
import { offersApi } from '../../lib/api';
import { Button, Card, Badge } from '../../components/ui';
import { format } from 'date-fns';

export function OffersPage() {
    const { t } = useTranslation();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const response = await offersApi.getAll();
            setOffers(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch offers', error);
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('offers.title')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">{t('offers.manageOffers')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => navigate(`/${tenantId}/offers/templates`)}>
                        <FileText size={16} className="mr-2" />
                        {t('offers.manageTemplates')}
                    </Button>
                    <Button onClick={() => navigate(`/${tenantId}/offers/new`)}>
                        <Plus size={16} className="mr-2" />
                        {t('offers.createOffer')}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div>{t('common.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {offers.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <FileSignature className="mx-auto h-12 w-12 text-neutral-400" />
                            <h3 className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">{t('offers.noOffers')}</h3>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('offers.noOffersDesc')}</p>
                            <div className="mt-6">
                                <Button onClick={() => navigate(`/${tenantId}/offers/new`)}>
                                    <Plus size={16} className="mr-2" />
                                    {t('offers.createOffer')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        offers.map((offer) => (
                            <Card
                                key={offer.id}
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/${tenantId}/offers/${offer.id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <FileSignature className="text-purple-600 dark:text-purple-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                {offer.application.candidate.firstName} {offer.application.candidate.lastName}
                                            </h3>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {offer.application.job.title} • {offer.currency} {offer.salary.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm text-neutral-900 dark:text-white font-medium">
                                                {t('offers.created')} {format(new Date(offer.createdAt), 'MMM d, yyyy')}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {offer.template?.name || t('offers.noTemplate')}
                                            </p>
                                        </div>
                                        {getStatusBadge(offer.status)}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
