import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Briefcase,
    Users,
    Calendar,
    Edit,
    CheckCircle,
    XCircle,
    Clock,
    Globe,
    UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/auth';
import { jobsApi, applicationsApi, referenceApi } from '../../lib/api';
import { Button, Card, StatusBadge, RejectionModal } from '../../components/ui';
import { PublishJobModal } from '../../components/jobs/PublishJobModal';
import { AddApplicantModal } from '../../components/jobs/AddApplicantModal';
import { CopyToJobModal } from '../../components/jobs/CopyToJobModal';
import type { Job, Application, ApiResponse } from '../../lib/types';

export function JobDetailPage() {
    const { t } = useTranslation();
    const { id, tenantId } = useParams<{ id: string; tenantId: string }>();
    const navigate = useNavigate();

    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'applicants' | 'sourcing'>('details');
    const user = useAuthStore((state) => state.user);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isAddApplicantModalOpen, setIsAddApplicantModalOpen] = useState(false);
    const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // ... (existing useEffects)

    const handleCopyCandidates = async (targetJobId: string) => {
        if (selectedApplicantIds.length === 0) return;
        setIsCopying(true);
        try {
            await applicationsApi.copyToJob(selectedApplicantIds, targetJobId);
            toast.success('Candidates copied successfully');
            setIsCopyModalOpen(false);
            setSelectedApplicantIds([]);
        } catch (error) {
            console.error('Failed to copy candidates:', error);
            toast.error('Failed to copy candidates');
        } finally {
            setIsCopying(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedApplicantIds.length === applications.length) {
            setSelectedApplicantIds([]);
        } else {
            setSelectedApplicantIds(applications.map(app => app.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedApplicantIds.includes(id)) {
            setSelectedApplicantIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedApplicantIds(prev => [...prev, id]);
        }
    };
    const [isAddingApplicant, setIsAddingApplicant] = useState(false);

    const pendingApproval = job?.approvals?.find(
        (a) => a.approverId === user?.id && a.status === 'PENDING'
    );

    const handleApprove = async () => {
        if (!job || !tenantId) return;
        setIsApproving(true);
        try {
            await jobsApi.approve(tenantId, job.id);
            toast.success(t('jobs.detail.messages.approved'));
            const res = await jobsApi.getById(tenantId, job.id);
            setJob((res.data as ApiResponse<Job>).data);
        } catch (err) {
            toast.error(t('jobs.detail.messages.approveError'));
        } finally {
            setIsApproving(false);
        }
    };

    const handleRejectClick = () => {
        setIsRejectModalOpen(true);
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!job || !tenantId) return;
        setIsRejecting(true);
        try {
            await jobsApi.reject(tenantId, job.id, reason);
            toast.success(t('jobs.detail.messages.rejected'));
            const res = await jobsApi.getById(tenantId, job.id);
            setJob((res.data as ApiResponse<Job>).data);
            setIsRejectModalOpen(false);
        } catch (err) {
            toast.error(t('jobs.detail.messages.rejectError'));
        } finally {
            setIsRejecting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !tenantId) return;
            setIsLoading(true);
            try {
                const [jobRes, appsRes] = await Promise.all([
                    jobsApi.getById(tenantId, id),
                    applicationsApi.getByJob(id)
                ]);

                const appsData = (appsRes.data as any).data;
                const finalApps = Array.isArray(appsData) ? appsData : (appsData?.items || []);

                setJob((jobRes.data as ApiResponse<Job>).data);
                setApplications(finalApps);
            } catch (error) {
                console.error('Failed to fetch job details', error);
                toast.error(t('jobs.detail.messages.loadError'));
                navigate(`/${tenantId}/jobs`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate, tenantId]);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await referenceApi.getCurrencies();
                setCurrencies(res.data.data);
            } catch (err) {
                console.error('Failed to fetch currencies', err);
            }
        };
        fetchCurrencies();
    }, []);

    const handlePublishClick = () => {
        setIsPublishModalOpen(true);
    };

    const handlePublish = async (channels: string[]) => {
        if (!job || !tenantId) return;
        setIsPublishing(true);
        try {
            await jobsApi.publish(tenantId, job.id, channels);
            toast.success(t('jobs.detail.messages.published'));
            const res = await jobsApi.getById(tenantId, job.id);
            setJob((res.data as ApiResponse<Job>).data);
            setIsPublishModalOpen(false);
        } catch (err) {
            toast.error(t('jobs.detail.messages.publishError'));
        } finally {
            setIsPublishing(false);
        }
    };



    const handleAddApplicant = async (candidateId: string) => {
        if (!job || !tenantId) return;
        setIsAddingApplicant(true);
        try {
            await applicationsApi.create({
                candidateId,
                jobId: job.id
            });
            toast.success('Candidate added to job');
            // Refresh applicants
            const appsRes = await applicationsApi.getByJob(job.id);
            const appsData = (appsRes.data as any).data;
            setApplications(Array.isArray(appsData) ? appsData : (appsData?.items || []));
            setIsAddApplicantModalOpen(false);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 400) {
                toast.error('Candidate already applied to this job');
                // Force refresh to sync state so duplicate is disabled in modal
                try {
                    const appsRes = await applicationsApi.getByJob(job.id);
                    const appsData = (appsRes.data as any).data;
                    setApplications(Array.isArray(appsData) ? appsData : (appsData?.items || []));
                } catch (refreshErr) {
                    console.error('Failed to refresh applications', refreshErr);
                }
            } else {
                toast.error('Failed to add candidate to job');
            }
        } finally {
            setIsAddingApplicant(false);
        }
    };



    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-fit gap-2 pl-0 hover:bg-transparent hover:text-blue-600"
                    onClick={() => navigate(`/${tenantId}/jobs`)}
                >
                    <ArrowLeft size={16} />
                    {t('jobs.detail.backToJobs')}
                </Button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            {job.title}
                            <StatusBadge status={job.status} type="job" />
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            {job.jobCode && (
                                <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 font-mono text-xs">
                                    {job.jobCode}
                                </span>
                            )}
                            {job.department && (
                                <div className="flex items-center gap-1">
                                    <Briefcase size={16} />
                                    {job.department.name}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <MapPin size={16} />
                                {job.location?.name || job.workLocation}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users size={16} />
                                {job.employmentType}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={16} />
                                {t('jobs.detail.posted')} {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {pendingApproval && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={handleRejectClick}
                                    isLoading={isRejecting}
                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <XCircle size={16} />
                                    {t('jobs.detail.reject')}
                                </Button>
                                <Button variant="primary" onClick={handleApprove} isLoading={isApproving} className="gap-2 bg-green-600 hover:bg-green-700">
                                    <CheckCircle size={16} />
                                    {t('jobs.detail.approve')}
                                </Button>
                            </>
                        )}
                        {job.status === 'APPROVED' && (
                            <Button variant="primary" onClick={handlePublishClick} className="gap-2">
                                <Globe size={16} />
                                {t('jobs.detail.publish')}
                            </Button>
                        )}

                        {job.status === 'OPEN' && (
                            <Button
                                variant="secondary"
                                onClick={() => window.open(`/${tenantId}/jobs/${job.id}/public`, '_blank')}
                                className="gap-2"
                            >
                                <Globe size={16} />
                                {t('jobs.detail.viewPublicPage')}
                            </Button>
                        )}
                        <Button variant="secondary" className="gap-2" onClick={() => navigate(`/${tenantId}/jobs/${job.id}/edit`)}>
                            <Edit size={16} />
                            {t('jobs.detail.editJob')}
                        </Button>
                        <Button variant="primary" onClick={() => navigate(`/${tenantId}/pipeline/${job.id}`)}>
                            {t('jobs.detail.viewPipeline')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex gap-6">
                    <button
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        onClick={() => setActiveTab('details')}
                    >
                        {t('jobs.detail.tabs.details')}
                    </button>
                    <button
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applicants'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        onClick={() => setActiveTab('applicants')}
                    >
                        {t('jobs.detail.tabs.applicants')} ({applications.length})
                    </button>
                    <button
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sourcing'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        onClick={() => setActiveTab('sourcing')}
                    >
                        {t('jobs.detail.tabs.sourcing')}
                    </button>
                </div>
            </div>

            {/* Content */}
            {
                activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('jobs.detail.description')}</h3>
                                    <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                        {job.description}
                                    </div>
                                </div>

                                {job.requirements && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('jobs.detail.requirements')}</h3>
                                        <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                            {job.requirements}
                                        </div>
                                    </div>
                                )}

                                {job.responsibilities && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('jobs.detail.responsibilities')}</h3>
                                        <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                            {job.responsibilities}
                                        </div>
                                    </div>
                                )}

                                {job.benefits && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('jobs.detail.benefits')}</h3>
                                        <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                            {job.benefits}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                                    {t('jobs.detail.jobInfo')}
                                </h3>
                                <div className="space-y-4">
                                    {(job.salaryMin || job.salaryMax) && (
                                        <div>
                                            <span className="text-sm text-neutral-500 dark:text-neutral-400 block mb-1">{t('jobs.detail.salaryRange')}</span>
                                            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-medium">
                                                <span>
                                                    {currencies.find(c => c.code === job.salaryCurrency)?.symbol || job.salaryCurrency}
                                                </span>
                                                {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <span className="text-sm text-neutral-500 dark:text-neutral-400 block mb-1">{t('jobs.detail.hiringManager')}</span>
                                        <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                                                {job.hiringManager?.firstName?.[0]}{job.hiringManager?.lastName?.[0]}
                                            </div>
                                            {job.hiringManager ? `${job.hiringManager.firstName} ${job.hiringManager.lastName}` : t('jobs.detail.notAssigned')}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-sm text-neutral-500 dark:text-neutral-400 block mb-1">{t('jobs.detail.recruiter')}</span>
                                        <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
                                                {job.recruiter?.firstName?.[0]}{job.recruiter?.lastName?.[0]}
                                            </div>
                                            {job.recruiter ? `${job.recruiter.firstName} ${job.recruiter.lastName}` : t('jobs.detail.notAssigned')}
                                        </div>
                                    </div>

                                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                                        <div>
                                            <span className="text-sm text-neutral-500 dark:text-neutral-400 block mb-2">{t('jobs.detail.skills')}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {job.skills
                                                    .filter(skill => typeof skill === 'string' && !['AI Generated', 'Parsed', 'Auto-generated'].includes(skill))
                                                    .map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded text-xs"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {job.approvals && job.approvals.length > 0 && (
                                <Card className="p-6">
                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                                        {t('jobs.detail.approvalHistory')}
                                    </h3>
                                    <div className="space-y-4">
                                        {job.approvals.map((approval) => (
                                            <div key={approval.id} className="flex items-start gap-3">
                                                <div className={`w-2 h-2 mt-2 rounded-full ${approval.status === 'APPROVED' ? 'bg-green-500' :
                                                    approval.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`} />
                                                <div>
                                                    <div className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                                        <span>{t('jobs.detail.approver')} {approval.order}</span>
                                                        {approval.approver?.firstName && (
                                                            <span className="text-neutral-500 font-normal">
                                                                - {approval.approver.firstName} {approval.approver.lastName}
                                                            </span>
                                                        )}
                                                        {approval.approver?.employeeId && (
                                                            <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                                                {approval.approver.employeeId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                                        {approval.status === 'PENDING' && <Clock size={12} />}
                                                        {approval.status === 'APPROVED' && <CheckCircle size={12} />}
                                                        {approval.status === 'REJECTED' && <XCircle size={12} />}
                                                        {approval.status}
                                                        {approval.approvedAt && ` • ${new Date(approval.approvedAt).toLocaleDateString()}`}
                                                    </div>
                                                    {approval.comment && (
                                                        <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 italic">
                                                            "{approval.comment}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )
            }
            {
                activeTab === 'sourcing' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{t('jobs.detail.sourcing.title')}</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        {t('jobs.detail.sourcing.xmlFeedLabel')}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={`${window.location.origin}/api/v1/${tenantId}/jobs/feed/xml`}
                                            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 font-mono"
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/api/v1/${tenantId}/jobs/feed/xml`);
                                                toast.success(t('jobs.detail.sourcing.copied'));
                                            }}
                                        >
                                            {t('jobs.detail.sourcing.copy')}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                        {t('jobs.detail.sourcing.xmlFeedDesc')}
                                    </p>
                                </div>

                                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">{t('jobs.detail.sourcing.linkedinTitle')}</h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {t('jobs.detail.sourcing.linkedinDesc')}
                                            </p>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-200 dark:bg-neutral-700 cursor-not-allowed opacity-60">
                                            <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2">
                                        {t('jobs.detail.sourcing.linkedinNote')}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

            {
                activeTab === 'applicants' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            {selectedApplicantIds.length > 0 ? (
                                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        {selectedApplicantIds.length} selected
                                    </span>
                                    <div className="h-4 w-px bg-blue-200 dark:bg-blue-700 mx-1" />
                                    <Button size="sm" variant="ghost" className="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800" onClick={() => setIsCopyModalOpen(true)}>
                                        Copy to Job
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800">
                                        Reject
                                    </Button>
                                </div>
                            ) : (
                                <div></div>
                            )}
                            <Button className="gap-2" onClick={() => setIsAddApplicantModalOpen(true)}>
                                <UserPlus size={16} />
                                Add Candidate
                            </Button>
                        </div>
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                            <th className="px-6 py-3 w-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedApplicantIds.length === applications.length && applications.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-6 py-3">{t('jobs.detail.applicants.candidate')}</th>
                                            <th className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-6 py-3">{t('jobs.detail.applicants.stage')}</th>
                                            <th className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-6 py-3">{t('jobs.detail.applicants.appliedDate')}</th>
                                            <th className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-6 py-3">{t('jobs.detail.applicants.matchScore')}</th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {applications.map((app) => (
                                            <tr key={app.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${selectedApplicantIds.includes(app.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedApplicantIds.includes(app.id)}
                                                        onChange={() => toggleSelect(app.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium">
                                                            {app.candidate?.firstName[0]}{app.candidate?.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                                                {app.candidate?.firstName} {app.candidate?.lastName}
                                                                {app.candidate?.candidateId && (
                                                                    <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                                                        {app.candidate.candidateId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                {app.candidate?.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={app.status} type="application">
                                                        {app.currentStage?.name || app.status}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                                                    {new Date(app.appliedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {app.matchScore !== null && app.matchScore !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${app.matchScore >= 70 ? 'bg-green-500' :
                                                                        app.matchScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                                        }`}
                                                                    style={{ width: `${app.matchScore}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                                {Math.round(app.matchScore)}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/${tenantId}/candidates/${app.candidateId}`)}
                                                    >
                                                        {t('jobs.detail.applicants.viewProfile')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {applications.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                                                    {t('jobs.detail.applicants.empty')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )
            }

            <PublishJobModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                onPublish={handlePublish}
                isPublishing={isPublishing}
            />
            <RejectionModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleRejectConfirm}
                title={t('jobs.detail.reject')}
                description={t('jobs.detail.messages.rejectionReason')}
                isRejecting={isRejecting}
            />

            <AddApplicantModal
                isOpen={isAddApplicantModalOpen}
                onClose={() => setIsAddApplicantModalOpen(false)}
                onAdd={handleAddApplicant}
                isAdding={isAddingApplicant}
                alreadyAppliedIds={applications.map(app => app.candidateId)}
            />

            <CopyToJobModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                onCopy={handleCopyCandidates}
                isCopying={isCopying}
                count={selectedApplicantIds.length}
            />
        </div>
    );
}
