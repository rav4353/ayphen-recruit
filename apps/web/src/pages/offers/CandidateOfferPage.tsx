import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { offersApi } from '../../lib/api';
import { Button, Card, Input, ConfirmationModal } from '../../components/ui';
import { CheckCircle, XCircle, FileSignature } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function CandidateOfferPage() {
    const { t } = useTranslation();
    const { token } = useParams<{ token: string }>();
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signature, setSignature] = useState('');
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showConfirmAccept, setShowConfirmAccept] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        fetchOffer();
    }, [token]);

    const fetchOffer = async () => {
        try {
            const response = await offersApi.getPublic(token!);
            setOffer(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch offer', error);
            toast.error(t('offers.candidate.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptClick = () => {
        if (!signature) {
            toast.error(t('offers.candidate.signPrompt'));
            return;
        }
        setShowConfirmAccept(true);
    };

    const confirmAccept = async () => {
        setIsAccepting(true);
        try {
            await offersApi.accept(token!, signature);
            toast.success(t('offers.candidate.acceptSuccess'));
            fetchOffer();
        } catch (error) {
            console.error('Failed to accept offer', error);
            toast.error(t('offers.candidate.acceptError'));
        } finally {
            setIsAccepting(false);
            setShowConfirmAccept(false);
        }
    };

    const handleDecline = async () => {
        if (!declineReason) {
            toast.error(t('offers.candidate.declineReasonRequired'));
            return;
        }

        try {
            await offersApi.decline(token!, declineReason);
            toast.success(t('offers.candidate.declineSuccess'));
            setShowDeclineModal(false);
            fetchOffer();
        } catch (error) {
            console.error('Failed to decline offer', error);
            toast.error(t('offers.candidate.declineError'));
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>;
    if (!offer) return <div className="flex justify-center items-center h-screen">{t('offers.candidate.notFound')}</div>;

    if (offer.status === 'ACCEPTED') {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-green-50 dark:bg-green-900/20 p-4">
                <CheckCircle size={64} className="text-green-600 mb-4" />
                <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">{t('offers.candidate.acceptedTitle')}</h1>
                <p className="text-green-700 dark:text-green-300 mt-2">
                    {t('offers.candidate.acceptedMessage', { name: offer.application.candidate.firstName })}
                </p>
                <p className="text-sm text-green-600 mt-4">{t('offers.candidate.signedOn')} {format(new Date(offer.acceptedAt), 'PPP')}</p>
            </div>
        );
    }

    if (offer.status === 'DECLINED') {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-red-50 dark:bg-red-900/20 p-4">
                <XCircle size={64} className="text-red-600 mb-4" />
                <h1 className="text-3xl font-bold text-red-800 dark:text-red-200">{t('offers.candidate.declinedTitle')}</h1>
                <p className="text-red-700 dark:text-red-300 mt-2">
                    {t('offers.candidate.declinedMessage')}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t('offers.candidate.jobOffer')}</h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        {offer.application.job.title} {t('offers.candidate.at')} {offer.application.job.department || 'Ayphen'}
                    </p>
                </div>

                <Card className="p-8 bg-white dark:bg-neutral-900 shadow-lg">
                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: offer.content }}
                    />
                </Card>

                <Card className="p-6 bg-white dark:bg-neutral-900 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">{t('offers.candidate.actionRequired')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('offers.candidate.electronicSignature')}</label>
                            <p className="text-xs text-neutral-500 mb-2">{t('offers.candidate.signDesc')}</p>
                            <Input
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder={t('offers.candidate.fullName')}
                                className="max-w-md"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={handleAcceptClick} className="w-full sm:w-auto">
                                <FileSignature size={16} className="mr-2" />
                                {t('offers.candidate.acceptAndSign')}
                            </Button>
                            <Button variant="danger" onClick={() => setShowDeclineModal(true)} className="w-full sm:w-auto">
                                {t('offers.candidate.declineOffer')}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {showDeclineModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 space-y-4">
                        <h3 className="text-lg font-semibold">{t('offers.candidate.declineTitle')}</h3>
                        <p className="text-sm text-neutral-500">{t('offers.candidate.declineDesc')}</p>
                        <textarea
                            className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                            rows={4}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowDeclineModal(false)}>{t('common.cancel')}</Button>
                            <Button variant="danger" onClick={handleDecline}>{t('offers.candidate.declineOffer')}</Button>
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmationModal
                isOpen={showConfirmAccept}
                onCancel={() => setShowConfirmAccept(false)}
                onConfirm={confirmAccept}
                title={t('offers.candidate.signConfirmTitle')}
                message={t('offers.candidate.signConfirmMessage')}
                confirmLabel={t('offers.candidate.signAndAccept')}
                cancelLabel={t('common.cancel')}
                isLoading={isAccepting}
                variant="success"
            />
        </div>
    );
}
