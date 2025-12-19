import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react';
import { offersApi, onboardingApi } from '../../lib/api';
import { Button, Card, Badge, Input, ConfirmationModal, RejectionModal } from '../../components/ui';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../lib/permissions';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function OfferDetailPage() {
    const { t } = useTranslation();
    const { tenantId, id } = useParams<{ tenantId: string; id: string }>();
    const navigate = useNavigate();
    const { user, can } = usePermissions();
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasOnboarding, setHasOnboarding] = useState(false);

    // Confirmation states
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showSendConfirm, setShowSendConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showOnboardingConfirm, setShowOnboardingConfirm] = useState(false);

    // Loading states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitializingOnboarding, setIsInitializingOnboarding] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        fetchOffer();
    }, [id]);

    const fetchOffer = async () => {
        try {
            const response = await offersApi.getOne(id!);
            const offerData = response.data.data || response.data;
            setOffer(offerData);

            // Check if onboarding workflow exists for this offer
            if (offerData.applicationId) {
                try {
                    const workflowsResponse = await onboardingApi.getAll();
                    const workflows = workflowsResponse.data?.data || workflowsResponse.data || [];
                    const existingWorkflow = workflows.find((w: any) => w.applicationId === offerData.applicationId);
                    setHasOnboarding(!!existingWorkflow);
                } catch (err) {
                    console.error('Failed to check onboarding status', err);
                }
            }
        } catch (error) {
            console.error('Failed to fetch offer', error);
            toast.error(t('offers.detail.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitClick = () => setShowSubmitConfirm(true);
    const handleSendClick = () => setShowSendConfirm(true);
    const handleDeleteClick = () => setShowDeleteConfirm(true);
    const handleApproveClick = () => setShowApproveConfirm(true);
    const handleRejectClick = () => setShowRejectModal(true);
    const handleInitializeOnboarding = () => setShowOnboardingConfirm(true);

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            await offersApi.submit(id!);
            toast.success(t('offers.detail.submitSuccess'));
            fetchOffer();
        } catch (error) {
            console.error('Failed to submit offer', error);
            toast.error(t('offers.detail.submitError'));
        } finally {
            setIsSubmitting(false);
            setShowSubmitConfirm(false);
        }
    };

    const confirmApprove = async () => {
        setIsApproving(true);
        try {
            await offersApi.approve(id!);
            toast.success(t('offers.detail.approveSuccess', 'Offer approved successfully'));
            fetchOffer();
        } catch (error) {
            console.error('Failed to approve offer', error);
            toast.error(t('offers.detail.approveError', 'Failed to approve offer'));
        } finally {
            setIsApproving(false);
            setShowApproveConfirm(false);
        }
    };

    const confirmReject = async (reason: string) => {
        setIsRejecting(true);
        try {
            await offersApi.reject(id!, reason);
            toast.success(t('offers.detail.rejectSuccess', 'Offer rejected'));
            fetchOffer();
        } catch (error) {
            console.error('Failed to reject offer', error);
            toast.error(t('offers.detail.rejectError', 'Failed to reject offer'));
        } finally {
            setIsRejecting(false);
            setShowRejectModal(false);
        }
    };

    const confirmSend = async () => {
        setIsSending(true);
        try {
            await offersApi.send(id!);
            toast.success(t('offers.detail.sendSuccess'));
            fetchOffer();
        } catch (error) {
            console.error('Failed to send offer', error);
            toast.error(t('offers.detail.sendError'));
        } finally {
            setIsSending(false);
            setShowSendConfirm(false);
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await offersApi.delete(id!);
            toast.success(t('offers.detail.deleteSuccess'));
            navigate(`/${tenantId}/offers`);
        } catch (error) {
            console.error('Failed to delete offer', error);
            toast.error(t('offers.detail.deleteError'));
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const confirmInitializeOnboarding = async () => {
        setIsInitializingOnboarding(true);
        try {
            const response = await onboardingApi.initialize({ applicationId: offer.applicationId });
            const workflowId = response.data?.data?.id || response.data?.id;
            toast.success('Onboarding workflow created successfully!');
            setShowOnboardingConfirm(false);
            // Navigate to onboarding detail page
            if (workflowId) {
                navigate(`/${tenantId}/onboarding/${workflowId}`);
            }
        } catch (error: any) {
            console.error('Failed to initialize onboarding', error);
            const errorMsg = error?.response?.data?.message || 'Failed to initialize onboarding';

            // Check if workflow already exists
            if (errorMsg.includes('already exists')) {
                // Try to find and navigate to existing workflow
                try {
                    const workflowsResponse = await onboardingApi.getAll();
                    const workflows = workflowsResponse.data?.data || workflowsResponse.data || [];
                    const existingWorkflow = workflows.find((w: any) => w.applicationId === offer.applicationId);

                    if (existingWorkflow) {
                        toast.success('Navigating to existing onboarding workflow');
                        navigate(`/${tenantId}/onboarding/${existingWorkflow.id}`);
                    } else {
                        toast.error('Onboarding workflow exists but could not be found');
                    }
                } catch (findError) {
                    toast.error('Onboarding workflow already exists');
                }
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setIsInitializingOnboarding(false);
            setShowOnboardingConfirm(false);
        }
    };

    const isAssignedApprover = offer?.approvals?.some((a: any) => a.approverId === user?.id && a.status === 'PENDING');
    const canApprove = offer?.status === 'PENDING_APPROVAL' && (isAssignedApprover || can(Permission.OFFER_APPROVE));

    if (loading) return <div>{t('common.loading')}</div>;
    if (!offer) return <div>{t('offers.detail.notFound')}</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/${tenantId}/offers`)}>
                        <ArrowLeft size={16} className="mr-2" />
                        {t('common.back')}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {t('offers.detail.offerFor')} {offer.application.candidate.firstName} {offer.application.candidate.lastName}
                        </h1>
                        <p className="text-neutral-500">{offer.application.job.title}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {offer.status === 'DRAFT' && (
                        <>
                            <Button variant="danger" onClick={handleDeleteClick} disabled={isDeleting || isSubmitting}>
                                <Trash2 size={16} className="mr-2" />
                                {t('common.delete')}
                            </Button>
                            <Button onClick={handleSubmitClick} disabled={isDeleting || isSubmitting}>
                                <Send size={16} className="mr-2" />
                                {t('offers.detail.submitForApproval')}
                            </Button>
                        </>
                    )}
                    {canApprove && (
                        <>
                            <Button variant="danger" onClick={handleRejectClick} disabled={isApproving || isRejecting}>
                                <XCircle size={16} className="mr-2" />
                                {t('offers.detail.reject')}
                            </Button>
                            <Button variant="success" onClick={handleApproveClick} disabled={isApproving || isRejecting}>
                                <CheckCircle size={16} className="mr-2" />
                                {t('offers.detail.approve')}
                            </Button>
                        </>
                    )}
                    {offer.status === 'APPROVED' && (
                        <Button variant="secondary" onClick={handleSendClick} disabled={isSending}>
                            <Send size={16} className="mr-2" />
                            {t('offers.detail.sendToCandidate')}
                        </Button>
                    )}
                    {offer.status === 'ACCEPTED' && (
                        <Button variant="success" onClick={handleInitializeOnboarding} disabled={isInitializingOnboarding}>
                            <UserPlus size={16} className="mr-2" />
                            {hasOnboarding ? 'View Onboarding' : 'Initialize Onboarding'}
                        </Button>
                    )}
                </div>
            </div>

            {offer.token && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">{t('offers.detail.publicLink')}</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{t('offers.detail.publicLinkDesc')}</p>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={`${window.location.origin}/offers/public/${offer.token}`}
                                className="w-96 bg-white dark:bg-neutral-900"
                            />
                            <Button variant="secondary" onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/offers/public/${offer.token}`);
                                toast.success(t('offers.detail.linkCopied'));
                            }}>
                                {t('offers.detail.copy')}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 bg-white dark:bg-neutral-900 min-h-[600px]">
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: offer.content }}
                        />
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">{t('offers.detail.details')}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{t('common.status')}</span>
                                <Badge variant={offer.status === 'APPROVED' ? 'success' : 'secondary'}>{offer.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{t('offers.create.salary')}</span>
                                <span className="font-medium">{offer.currency} {parseFloat(offer.salary).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{t('offers.create.startDate')}</span>
                                <span className="font-medium">{format(new Date(offer.startDate), 'MMM d, yyyy')}</span>
                            </div>
                            {offer.bonus && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{t('offers.create.bonus')}</span>
                                    <span className="font-medium">{offer.currency} {parseFloat(offer.bonus).toLocaleString()}</span>
                                </div>
                            )}
                            {offer.equity && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{t('offers.create.equity')}</span>
                                    <span className="font-medium">{offer.equity}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{t('offers.created')}</span>
                                <span className="font-medium">{format(new Date(offer.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    </Card>

                    {offer.approvals && offer.approvals.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-4">{t('offers.detail.approvalHistory')}</h3>
                            <div className="space-y-4">
                                {offer.approvals.map((approval: any) => (
                                    <div key={approval.id} className="flex items-start gap-3">
                                        <div className={`mt-1 ${approval.status === 'APPROVED' ? 'text-green-500' :
                                            approval.status === 'REJECTED' ? 'text-red-500' : 'text-yellow-500'
                                            }`}>
                                            {approval.status === 'APPROVED' ? <CheckCircle size={16} /> :
                                                approval.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {approval.status === 'PENDING' ? t('offers.detail.pendingApproval') :
                                                    approval.status === 'APPROVED' ? t('offers.detail.approved') : t('offers.detail.rejected')}
                                                {approval.approver && (
                                                    <span className="text-neutral-500 font-normal ml-1">
                                                        by {approval.approver.firstName} {approval.approver.lastName}
                                                    </span>
                                                )}
                                            </p>
                                            {approval.approvedAt && (
                                                <p className="text-xs text-neutral-500">
                                                    {format(new Date(approval.approvedAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            )}
                                            {approval.comment && (
                                                <p className="text-xs text-red-600 mt-1 italic">"{approval.comment}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {offer.notes && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg mb-2">{t('offers.create.internalNotes')}</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{offer.notes}</p>
                        </Card>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showSubmitConfirm}
                onCancel={() => setShowSubmitConfirm(false)}
                onConfirm={confirmSubmit}
                title={t('offers.detail.submitConfirmTitle')}
                message={t('offers.detail.submitConfirmMessage')}
                confirmLabel={t('offers.detail.submit')}
                cancelLabel={t('common.cancel')}
                isLoading={isSubmitting}
                variant="info"
            />

            <ConfirmationModal
                isOpen={showApproveConfirm}
                onCancel={() => setShowApproveConfirm(false)}
                onConfirm={confirmApprove}
                title={t('offers.detail.approveConfirmTitle', 'Approve Offer')}
                message={t('offers.detail.approveConfirmMessage', 'Are you sure you want to approve this offer?')}
                confirmLabel={t('offers.detail.approve')}
                cancelLabel={t('common.cancel')}
                isLoading={isApproving}
                variant="success"
            />

            <RejectionModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={confirmReject}
                title={t('offers.detail.rejectConfirmTitle', 'Reject Offer')}
                description={t('offers.detail.rejectConfirmMessage', 'Please provide a reason for rejecting this offer.')}
                isRejecting={isRejecting}
            />

            <ConfirmationModal
                isOpen={showSendConfirm}
                onCancel={() => setShowSendConfirm(false)}
                onConfirm={confirmSend}
                title={t('offers.detail.sendConfirmTitle')}
                message={t('offers.detail.sendConfirmMessage')}
                confirmLabel={t('offers.detail.sendOffer')}
                cancelLabel={t('common.cancel')}
                isLoading={isSending}
                variant="success"
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={t('offers.detail.deleteConfirmTitle')}
                message={t('offers.detail.deleteConfirmMessage')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                isLoading={isDeleting}
                variant="danger"
            />

            <ConfirmationModal
                isOpen={showOnboardingConfirm}
                onCancel={() => setShowOnboardingConfirm(false)}
                onConfirm={confirmInitializeOnboarding}
                title="Initialize Onboarding"
                message="This will create an onboarding workflow for this candidate and send them a welcome email with their onboarding checklist. Continue?"
                confirmLabel="Initialize Onboarding"
                cancelLabel={t('common.cancel')}
                isLoading={isInitializingOnboarding}
                variant="success"
            />
        </div>
    );
}
