import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Globe,
    Download,
    Edit,
    Trash2,
    Briefcase,
    GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, CardHeader, Badge, Alert, ConfirmationModal } from '../../components/ui';
import { candidatesApi } from '../../lib/api';
import type { Candidate } from '../../lib/types';
import { CandidateActivityLog } from '../../components/candidates/CandidateActivityLog';

import { MergeCandidateModal } from '../../components/candidates/MergeCandidateModal';
import { ScheduleInterviewModal } from '../../components/interviews/ScheduleInterviewModal';
import { CandidateInterviews } from '../../components/candidates/CandidateInterviews';
import CandidateEmails from '../../components/communication/CandidateEmails';
import { GitMerge, Calendar } from 'lucide-react';

// ... (keep other imports)

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

    const handleScheduleInterview = (applicationId: string) => {
        setSelectedApplicationId(applicationId);
        setIsScheduleModalOpen(true);
    };

    const handleMerge = () => {
        setIsMergeModalOpen(true);
    };

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

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

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

    if (isLoading) {
        return <div className="flex justify-center py-12">{t('common.loading', 'Loading...')}</div>;
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

    return (
        <div className="space-y-6">
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
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 sm:gap-4">
                        <Button variant="ghost" onClick={() => navigate(`/${tenantId}/candidates`)} className="mt-1">
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg sm:text-2xl font-semibold flex-shrink-0">
                                    {(candidate.firstName?.[0] || '')}{(candidate.lastName?.[0] || '')}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white">
                                            {candidate.firstName} {candidate.lastName}
                                        </h1>
                                        {candidate.candidateId && (
                                            <span className="text-sm font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                                {candidate.candidateId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-neutral-500 dark:text-neutral-400">
                                        {candidate.currentTitle} {candidate.currentCompany && `${t('candidates.at', 'at')} ${candidate.currentCompany}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4">
                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 text-sm">
                                    <Mail size={16} />
                                    <a href={`mailto:${candidate.email}`} className="hover:text-blue-600">{candidate.email}</a>
                                </div>
                                {candidate.phone && (
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 text-sm">
                                        <Phone size={16} />
                                        <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">{candidate.phone}</a>
                                    </div>
                                )}
                                {candidate.location && (
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 text-sm">
                                        <MapPin size={16} />
                                        <span>{candidate.location}</span>
                                    </div>
                                )}
                                {candidate.linkedinUrl && (
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 text-sm">
                                        <Linkedin size={16} />
                                        <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">LinkedIn</a>
                                    </div>
                                )}
                                {candidate.portfolioUrl && (
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 text-sm">
                                        <Globe size={16} />
                                        <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Portfolio</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons - top right */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleMerge}
                        >
                            <GitMerge size={14} />
                            <span className="hidden sm:inline">{t('candidates.merge')}</span>
                        </Button>
                        {candidate.resumeUrl && (
                            <Button variant="outline" className="gap-2">
                                <Download size={14} />
                                <span className="hidden sm:inline">{t('candidates.downloadResume')}</span>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => navigate(`/${tenantId}/candidates/${id}/edit`)}
                        >
                            <Edit size={14} />
                            <span className="hidden sm:inline">{t('common.edit')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">{t('common.delete')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary */}
                    {candidate.summary && (
                        <Card>
                            <CardHeader title={t('candidates.summary')} />
                            <div className="p-6 pt-0 text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                                {candidate.summary}
                            </div>
                        </Card>
                    )}

                    {/* Emails */}
                    <Card>
                        <CardHeader title={t('candidates.emails', 'Emails & Messages')} />
                        <div className="p-6 pt-0">
                            <CandidateEmails
                                candidateId={id!}
                                candidateEmail={candidate.email}
                            />
                        </div>
                    </Card>

                    {/* Applications */}
                    <Card>
                        <CardHeader title={t('candidates.applications')} />
                        <div className="p-6 pt-0 space-y-6">
                            {candidate.applications && candidate.applications.length > 0 ? (
                                candidate.applications.map((app) => (
                                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg gap-4">
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                {app.job?.title || t('candidates.unknownJob')}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <Badge variant={app.status === 'HIRED' ? 'success' : 'secondary'}>
                                                    {app.status}
                                                </Badge>
                                                {app.matchScore !== undefined && app.matchScore !== null && (
                                                    <Badge
                                                        variant={app.matchScore >= 80 ? 'success' : app.matchScore >= 50 ? 'warning' : 'error'}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <span className="font-bold">{app.matchScore.toFixed(0)}%</span> {t('candidates.match', 'Match')}
                                                    </Badge>
                                                )}
                                                <span className="text-sm text-neutral-500">
                                                    {t('candidates.appliedOn')} {new Date(app.appliedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {app.matchSummary && (
                                                <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 p-3 rounded border border-neutral-100 dark:border-neutral-700">
                                                    <strong>{t('candidates.aiAnalysis', 'AI Analysis')}:</strong> {app.matchSummary}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleScheduleInterview(app.id)}
                                            className="gap-2"
                                        >
                                            <Calendar size={16} />
                                            {t('interviews.schedule')}
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-500 italic">{t('candidates.noApplications')}</p>
                            )}
                        </div>
                    </Card>

                    {/* Experience */}
                    <Card>
                        <CardHeader title={t('candidates.experience')} />
                        <div className="p-6 pt-0 space-y-6">
                            {candidate.experience && candidate.experience.length > 0 ? (
                                candidate.experience.map((exp, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="mt-1 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-white">{exp.title}</h3>
                                            <p className="text-neutral-500 dark:text-neutral-400">{exp.company}</p>
                                            <p className="text-sm text-neutral-400 mt-1">
                                                {exp.startDate} - {exp.endDate || t('candidates.present')}
                                            </p>
                                            {exp.description && (
                                                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 whitespace-pre-line">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-500 italic">{t('candidates.noExperience')}</p>
                            )}
                        </div>
                    </Card>

                    {/* Education */}
                    <Card>
                        <CardHeader title={t('candidates.education')} />
                        <div className="p-6 pt-0 space-y-6">
                            {candidate.education && candidate.education.length > 0 ? (
                                candidate.education.map((edu, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="mt-1 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                            <GraduationCap size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-white">{edu.degree}</h3>
                                            <p className="text-neutral-500 dark:text-neutral-400">{edu.institution}</p>
                                            <p className="text-sm text-neutral-400 mt-1">{edu.year}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-500 italic">{t('candidates.noEducation')}</p>
                            )}
                        </div>
                    </Card>

                    {/* Resume Viewer */}
                    {candidate.resumeUrl && (
                        <Card>
                            <CardHeader
                                title={t('candidates.resume')}
                                action={
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(candidate.resumeUrl, '_blank')}
                                        className="gap-2"
                                    >
                                        <Download size={16} />
                                        {t('common.download')}
                                    </Button>
                                }
                            />
                            <div className="p-6 pt-0">
                                <iframe
                                    src={candidate.resumeUrl}
                                    className="w-full h-[600px] border border-neutral-200 dark:border-neutral-700 rounded-lg"
                                    title="Resume"
                                />
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Interviews */}
                    <CandidateInterviews
                        candidateId={id!}
                        candidateName={`${candidate.firstName} ${candidate.lastName}`}
                    />

                    {/* Activity Log */}
                    <CandidateActivityLog candidateId={id} />

                    {/* Skills */}
                    <Card>
                        <CardHeader title={t('candidates.skills')} />
                        <div className="p-6 pt-0 flex flex-wrap gap-2">
                            {candidate.skills && candidate.skills.length > 0 ? (
                                candidate.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary">
                                        {skill}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-neutral-500 italic">{t('candidates.noSkills')}</p>
                            )}
                        </div>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader title={t('candidates.tags')} />
                        <div className="p-6 pt-0 flex flex-wrap gap-2">
                            {candidate.tags && candidate.tags.length > 0 ? (
                                candidate.tags
                                    .filter(tag => !['AI Generated', 'Parsed', 'Auto-generated'].includes(tag))
                                    .map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))
                            ) : (
                                <p className="text-neutral-500 italic">{t('candidates.noTags')}</p>
                            )}
                        </div>
                    </Card>

                    {/* Metadata */}
                    <Card>
                        <div className="p-6 space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{t('common.created')}</span>
                                <span className="text-neutral-900 dark:text-white">
                                    {new Date(candidate.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{t('candidates.source')}</span>
                                <span className="text-neutral-900 dark:text-white">
                                    {candidate.source ? t(`candidates.${candidate.source.toLowerCase()}`, candidate.source) : t('candidates.manual')}
                                </span>
                            </div>
                            {candidate.gdprConsent && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{t('candidates.gdpr')}</span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">{t('common.yes')}</span>
                                </div>
                            )}
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
