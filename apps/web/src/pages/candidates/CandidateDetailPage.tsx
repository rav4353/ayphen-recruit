import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, Mail, Phone, MapPin, Linkedin, Globe, Download, Edit, Trash2,
    Briefcase, GraduationCap, FileText, ExternalLink, MoreHorizontal, User,
    Calendar, Clock, CheckCircle, Copy, Send, GitMerge, Building2, Award, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Badge, Alert, ConfirmationModal, Skeleton } from '../../components/ui';
import { candidatesApi } from '../../lib/api';
import type { Candidate } from '../../lib/types';
import { CandidateActivityLog } from '../../components/candidates/CandidateActivityLog';
import { CandidateBGVTracking } from '../../components/candidates/CandidateBGVTracking';
import { MergeCandidateModal } from '../../components/candidates/MergeCandidateModal';
import { ScheduleInterviewModal } from '../../components/interviews/ScheduleInterviewModal';
import { CandidateInterviews } from '../../components/candidates/CandidateInterviews';
import CandidateEmails from '../../components/communication/CandidateEmails';

type TabType = 'overview' | 'applications' | 'timeline' | 'documents';

export function CandidateDetailPage() {
    const { t } = useTranslation();
    const { id, tenantId } = useParams<{ id: string; tenantId: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showActions, setShowActions] = useState(false);

    const handleScheduleInterview = (applicationId: string) => {
        setSelectedApplicationId(applicationId);
        setIsScheduleModalOpen(true);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const tabs = [
        { id: 'overview' as TabType, label: t('candidates.overview', 'Overview'), icon: User },
        { id: 'applications' as TabType, label: t('candidates.applications', 'Applications'), icon: Briefcase },
        { id: 'timeline' as TabType, label: t('candidates.timeline', 'Timeline'), icon: History },
        { id: 'documents' as TabType, label: t('candidates.documents', 'Documents'), icon: FileText },
    ];

    useEffect(() => {
        if (!id) return;

        const fetchCandidate = async () => {
            try {
                const response = await candidatesApi.getById(id);
                setCandidate(response.data.data);
            } catch (err) {
                console.error('Failed to fetch candidate', err);
                setError(t('candidates.fetchError', 'Failed to load candidate details'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidate();
    }, [id, t]);

    const confirmDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        try {
            await candidatesApi.delete(id);
            toast.success(t('candidates.deleteSuccess', 'Candidate deleted successfully'));
            navigate(`/${tenantId}/candidates`);
        } catch (err) {
            console.error('Failed to delete candidate', err);
            toast.error(t('candidates.deleteError', 'Failed to delete candidate'));
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8">
                    <div className="flex items-start gap-6">
                        <Skeleton variant="circular" className="w-20 h-20" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-5 w-48" />
                            <div className="flex gap-3 pt-2">
                                <Skeleton className="h-8 w-32 rounded-lg" />
                                <Skeleton className="h-8 w-28 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 rounded-xl" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => navigate(`/${tenantId}/candidates`)} className="gap-2">
                    <ArrowLeft size={16} />
                    {t('common.back', 'Back')}
                </Button>
                <Alert variant="error">{error || t('candidates.notFound', 'Candidate not found')}</Alert>
            </div>
        );
    }

    const applicationCount = candidate.applications?.length || 0;
    const documentCount = candidate.applications?.reduce((acc, app) => acc + (app.documents?.length || 0), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Modals */}
            <MergeCandidateModal
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                primaryCandidateId={id!}
                onSuccess={() => window.location.reload()}
            />
            {selectedApplicationId && (
                <ScheduleInterviewModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    applicationId={selectedApplicationId}
                    onSuccess={() => window.location.reload()}
                />
            )}

            {/* Premium Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative p-6 sm:p-8">
                    {/* Top navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigate(`/${tenantId}/candidates`)}
                            className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} />
                            {t('candidates.backToList', 'Back to Candidates')}
                        </button>
                        
                        {/* Actions */}
                        <div className="relative">
                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => navigate(`/${tenantId}/candidates/${id}/edit`)} className="gap-2">
                                    <Edit size={14} />
                                    {t('common.edit', 'Edit')}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowActions(!showActions)} className="px-2">
                                    <MoreHorizontal size={16} />
                                </Button>
                            </div>
                            
                            {showActions && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg z-20 py-1">
                                        <button onClick={() => { setIsMergeModalOpen(true); setShowActions(false); }} className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center gap-3">
                                            <GitMerge size={14} />
                                            {t('candidates.merge', 'Merge')}
                                        </button>
                                        {candidate.resumeUrl && (
                                            <button onClick={() => { window.open(candidate.resumeUrl, '_blank'); setShowActions(false); }} className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center gap-3">
                                                <Download size={14} />
                                                {t('candidates.downloadResume', 'Download Resume')}
                                            </button>
                                        )}
                                        <div className="border-t border-neutral-200 dark:border-neutral-700 my-1" />
                                        <button onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }} className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3">
                                            <Trash2 size={14} />
                                            {t('common.delete', 'Delete')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Profile section */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {candidate.avatarUrl ? (
                                <img 
                                    src={candidate.avatarUrl} 
                                    alt={`${candidate.firstName} ${candidate.lastName}`}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg shadow-blue-500/25"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg shadow-blue-500/25">
                                    {(candidate.firstName?.[0] || '').toUpperCase()}{(candidate.lastName?.[0] || '').toUpperCase()}
                                </div>
                            )}
                            {candidate.gdprConsent && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
                                    <CheckCircle size={12} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                    {candidate.firstName} {candidate.lastName}
                                </h1>
                                {candidate.candidateId && (
                                    <span className="inline-flex items-center text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        #{candidate.candidateId}
                                    </span>
                                )}
                            </div>
                            
                            {(candidate.currentTitle || candidate.currentCompany) && (
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4 flex items-center gap-2">
                                    {candidate.currentTitle && <span className="font-medium">{candidate.currentTitle}</span>}
                                    {candidate.currentTitle && candidate.currentCompany && <span className="text-neutral-400">at</span>}
                                    {candidate.currentCompany && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Building2 size={14} className="text-neutral-400" />
                                            {candidate.currentCompany}
                                        </span>
                                    )}
                                </p>
                            )}

                            {/* Contact chips */}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => copyToClipboard(candidate.email, 'Email')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                                    <Mail size={14} className="text-neutral-400 group-hover:text-blue-500" />
                                    <span className="truncate max-w-[180px]">{candidate.email}</span>
                                    <Copy size={12} className="opacity-0 group-hover:opacity-100 text-neutral-400" />
                                </button>
                                
                                {candidate.phone && (
                                    <button onClick={() => copyToClipboard(candidate.phone!, 'Phone')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
                                        <Phone size={14} className="text-neutral-400 group-hover:text-green-500" />
                                        {candidate.phone}
                                        <Copy size={12} className="opacity-0 group-hover:opacity-100 text-neutral-400" />
                                    </button>
                                )}
                                
                                {candidate.location && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400">
                                        <MapPin size={14} className="text-neutral-400" />
                                        {candidate.location}
                                    </span>
                                )}
                                
                                {candidate.linkedinUrl && (
                                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                        <Linkedin size={14} className="text-[#0A66C2]" />
                                        LinkedIn
                                        <ExternalLink size={12} className="text-neutral-400" />
                                    </a>
                                )}
                                
                                {candidate.portfolioUrl && (
                                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                                        <Globe size={14} className="text-purple-500" />
                                        Portfolio
                                        <ExternalLink size={12} className="text-neutral-400" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="hidden xl:flex flex-col gap-3">
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Briefcase size={18} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{applicationCount}</p>
                                    <p className="text-xs text-neutral-500">{t('candidates.applications', 'Applications')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{documentCount}</p>
                                    <p className="text-xs text-neutral-500">{t('candidates.documents', 'Documents')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-neutral-200/60 dark:border-neutral-700/60">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${candidate.email}`} className="gap-2">
                            <Send size={14} />
                            {t('common.sendEmail', 'Send Email')}
                        </Button>
                        {candidate.phone && (
                            <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${candidate.phone}`} className="gap-2">
                                <Phone size={14} />
                                {t('common.call', 'Call')}
                            </Button>
                        )}
                        {applicationCount > 0 && (
                            <Button variant="outline" size="sm" onClick={() => handleScheduleInterview(candidate.applications![0].id)} className="gap-2">
                                <Calendar size={14} />
                                {t('interviews.schedule', 'Schedule Interview')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'}`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {tab.id === 'applications' && applicationCount > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>{applicationCount}</span>
                                )}
                                {tab.id === 'documents' && documentCount > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>{documentCount}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Summary */}
                            {candidate.summary && (
                                <Card className="overflow-hidden">
                                    <div className="p-6">
                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <User size={16} className="text-blue-500" />
                                            {t('candidates.summary', 'Professional Summary')}
                                        </h3>
                                        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{candidate.summary}</p>
                                    </div>
                                </Card>
                            )}

                            {/* Experience */}
                            <Card className="overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <Briefcase size={16} className="text-blue-500" />
                                        {t('candidates.experience', 'Work Experience')}
                                    </h3>
                                    {candidate.experience && candidate.experience.length > 0 ? (
                                        <div className="space-y-6">
                                            {candidate.experience.map((exp, index) => (
                                                <div key={index} className="relative pl-6 pb-6 last:pb-0 border-l-2 border-neutral-200 dark:border-neutral-700 last:border-transparent">
                                                    <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-blue-500 -translate-x-[7px]" />
                                                    <h4 className="font-semibold text-neutral-900 dark:text-white">{exp.title}</h4>
                                                    <p className="text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                                                        <Building2 size={14} className="text-neutral-400" />
                                                        {exp.company}
                                                    </p>
                                                    <p className="text-sm text-neutral-500 flex items-center gap-2 mb-2">
                                                        <Clock size={12} />
                                                        {exp.startDate} - {exp.endDate || t('candidates.present', 'Present')}
                                                    </p>
                                                    {exp.description && <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{exp.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-500 text-sm italic">{t('candidates.noExperience', 'No experience added')}</p>
                                    )}
                                </div>
                            </Card>

                            {/* Education */}
                            <Card className="overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <GraduationCap size={16} className="text-purple-500" />
                                        {t('candidates.education', 'Education')}
                                    </h3>
                                    {candidate.education && candidate.education.length > 0 ? (
                                        <div className="space-y-4">
                                            {candidate.education.map((edu, index) => (
                                                <div key={index} className="flex gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Award size={20} className="text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-neutral-900 dark:text-white">{edu.degree}</h4>
                                                        <p className="text-neutral-600 dark:text-neutral-400">{edu.institution}</p>
                                                        <p className="text-sm text-neutral-500 mt-1">{edu.year}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-500 text-sm italic">{t('candidates.noEducation', 'No education added')}</p>
                                    )}
                                </div>
                            </Card>

                            {/* Resume Viewer */}
                            {candidate.resumeUrl && (
                                <Card className="overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                                <FileText size={16} className="text-emerald-500" />
                                                {t('candidates.resume', 'Resume')}
                                            </h3>
                                            <Button variant="outline" size="sm" onClick={() => window.open(candidate.resumeUrl, '_blank')} className="gap-2">
                                                <Download size={14} />
                                                {t('common.download', 'Download')}
                                            </Button>
                                        </div>
                                        <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                            <iframe src={candidate.resumeUrl} className="w-full h-[500px]" title="Resume" />
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Applications Tab */}
                    {activeTab === 'applications' && (
                        <Card className="overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Briefcase size={16} className="text-blue-500" />
                                    {t('candidates.jobApplications', 'Job Applications')}
                                </h3>
                                {candidate.applications && candidate.applications.length > 0 ? (
                                    <div className="space-y-4">
                                        {candidate.applications.map((app) => (
                                            <div key={app.id} className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 bg-white dark:bg-neutral-800/50 transition-all hover:shadow-md">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <h4 className="font-semibold text-neutral-900 dark:text-white text-lg">{app.job?.title || t('candidates.unknownJob', 'Unknown Job')}</h4>
                                                            {app.applicationId && (
                                                                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">{app.applicationId}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <Badge variant={app.status === 'HIRED' ? 'success' : app.status === 'REJECTED' ? 'destructive' : 'secondary'}>{app.status}</Badge>
                                                            {app.matchScore !== undefined && app.matchScore !== null && (
                                                                <Badge variant={app.matchScore >= 80 ? 'success' : app.matchScore >= 50 ? 'warning' : 'error'}>
                                                                    {app.matchScore.toFixed(0)}% {t('candidates.match', 'Match')}
                                                                </Badge>
                                                            )}
                                                            <span className="text-sm text-neutral-500">{t('candidates.appliedOn')} {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                        </div>
                                                        {app.matchSummary && (
                                                            <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-100 dark:border-neutral-700">
                                                                <strong>{t('candidates.aiAnalysis', 'AI Analysis')}:</strong> {app.matchSummary}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button size="sm" onClick={() => handleScheduleInterview(app.id)} className="gap-2 shrink-0">
                                                        <Calendar size={16} />
                                                        {t('interviews.schedule')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-500 italic">{t('candidates.noApplications')}</p>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <>
                            <CandidateActivityLog candidateId={id} />
                            <Card className="overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Mail size={16} className="text-blue-500" />
                                        {t('candidates.emails', 'Emails & Messages')}
                                    </h3>
                                    <CandidateEmails candidateId={id!} candidateEmail={candidate.email} />
                                </div>
                            </Card>
                        </>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <Card className="overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <FileText size={16} className="text-emerald-500" />
                                    {t('candidates.documents', 'Documents')}
                                </h3>
                                {candidate.applications?.some(app => app.documents && app.documents.length > 0) ? (
                                    <div className="space-y-3">
                                        {candidate.applications.flatMap(app => 
                                            (app.documents || []).map(doc => ({ ...doc, jobTitle: app.job?.title }))
                                        ).map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium text-neutral-900 dark:text-white">{doc.title}</h4>
                                                            <Badge variant={doc.status === 'APPROVED' ? 'success' : doc.status === 'REJECTED' ? 'destructive' : doc.status === 'UPLOADED' || doc.status === 'PENDING_REVIEW' ? 'warning' : 'outline'} className="text-[10px] px-1.5 py-0 h-5">
                                                                {doc.status.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                                            <span>{doc.jobTitle}</span>
                                                            <span>•</span>
                                                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {doc.documentUrl ? (
                                                    <Button variant="outline" size="sm" onClick={() => window.open(doc.documentUrl, '_blank')} className="gap-2">
                                                        <ExternalLink size={14} />
                                                        {t('common.view', 'View')}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-neutral-400 italic">{doc.status === 'REQUESTED' ? 'Not uploaded' : 'Processing'}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-500 italic">{t('candidates.noDocuments', 'No documents found')}</p>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Interviews */}
                    <CandidateInterviews candidateId={id!} candidateName={`${candidate.firstName} ${candidate.lastName}`} />

                    {/* Background Verification */}
                    <Card className="overflow-hidden">
                        <CandidateBGVTracking candidateId={id!} />
                    </Card>

                    {/* Skills */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Award size={16} className="text-amber-500" />
                                {t('candidates.skills', 'Skills')}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills && candidate.skills.length > 0 ? (
                                    candidate.skills.map((skill) => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
                                    ))
                                ) : (
                                    <p className="text-neutral-500 text-sm italic">{t('candidates.noSkills')}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Tags */}
                    {candidate.tags && candidate.tags.filter(tag => !['AI Generated', 'Parsed', 'Auto-generated'].includes(tag)).length > 0 && (
                        <Card className="overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">{t('candidates.tags', 'Tags')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.tags.filter(tag => !['AI Generated', 'Parsed', 'Auto-generated'].includes(tag)).map((tag) => (
                                        <Badge key={tag} variant="outline" className="px-3 py-1">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Metadata */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">{t('common.details', 'Details')}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">{t('common.created')}</span>
                                    <span className="text-neutral-900 dark:text-white font-medium">{new Date(candidate.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">{t('candidates.source')}</span>
                                    <span className="text-neutral-900 dark:text-white font-medium">{candidate.source ? t(`candidates.${candidate.source.toLowerCase()}`, candidate.source) : t('candidates.manual')}</span>
                                </div>
                                {candidate.gdprConsent && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-neutral-500">{t('candidates.gdpr')}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                            <CheckCircle size={14} />
                                            {t('common.yes')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={t('candidates.deleteConfirmTitle')}
                message={t('candidates.deleteConfirm')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
