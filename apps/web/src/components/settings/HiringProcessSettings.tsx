import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, Button, Modal, ConfirmationModal } from '../ui';
import { Plus, Clock, Video, CheckSquare, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { PipelineSettings } from './PipelineSettings';
import { ScorecardTemplatesSettings } from './ScorecardTemplatesSettings';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, rolesApi, usersApi, extractData } from '../../lib/api';
import toast from 'react-hot-toast';

export function HiringProcessSettings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('view') as 'pipelines' | 'slas' | 'scorecards' | 'interviews' | 'approvals') || 'pipelines';

    const setActiveTab = (tab: 'pipelines' | 'slas' | 'scorecards' | 'interviews' | 'approvals') => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', tab);
            return newParams;
        });
    };

    // Interview Types State
    const [interviewModalOpen, setInterviewModalOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState<any>(null);
    const [deleteInterviewId, setDeleteInterviewId] = useState<string | null>(null);

    // Approvals State
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [editingApproval, setEditingApproval] = useState<any>(null);
    const [deleteApprovalId, setDeleteApprovalId] = useState<string | null>(null);

    // SLA State
    const [slaSettings, setSlaSettings] = useState({
        screening: { days: 2, alertEnabled: true, alertDaysBefore: 1 },
        phoneScreen: { days: 3, alertEnabled: true, alertDaysBefore: 1 },
        interview: { days: 5, alertEnabled: true, alertDaysBefore: 1 },
        assessment: { days: 3, alertEnabled: false, alertDaysBefore: 1 },
        backgroundCheck: { days: 7, alertEnabled: true, alertDaysBefore: 2 },
        offer: { days: 3, alertEnabled: true, alertDaysBefore: 1 },
        offerAcceptance: { days: 5, alertEnabled: true, alertDaysBefore: 2 },
        onboarding: { days: 14, alertEnabled: true, alertDaysBefore: 3 },
    });
    const [savingSla, setSavingSla] = useState(false);

    // Interview Types Query
    const { data: interviewTypes = [], isLoading: interviewTypesLoading } = useQuery({
        queryKey: ['interview-types'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('interview_types');
                console.log('[HiringProcessSettings] interview_types API response:', response);
                const extracted = extractData(response);
                console.log('[HiringProcessSettings] extracted data:', extracted);
                return extracted?.value || [];
            } catch (error) {
                console.error('[HiringProcessSettings] Failed to fetch interview_types:', error);
                return [];
            }
        },
    });

    // Approvals Query
    const { data: approvalWorkflows = [] } = useQuery({
        queryKey: ['approval-workflows'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('approval_workflows');
                return extractData(response)?.value || [
                    { id: '1', name: 'Job Requisition Approval', description: 'Standard approval chain for new job openings', steps: ['Hiring Manager', 'Finance', 'VP of HR'] },
                    { id: '2', name: 'Offer Approval', description: 'Approval required for offers above budget', steps: ['Recruiter', 'Hiring Manager'] },
                ];
            } catch {
                return [
                    { id: '1', name: 'Job Requisition Approval', description: 'Standard approval chain for new job openings', steps: ['Hiring Manager', 'Finance', 'VP of HR'] },
                    { id: '2', name: 'Offer Approval', description: 'Approval required for offers above budget', steps: ['Recruiter', 'Hiring Manager'] },
                ];
            }
        },
    });

    // Interview Types Mutations
    const saveInterviewTypesMutation = useMutation({
        mutationFn: async (newTypes: any[]) => {
            return settingsApi.update('interview_types', { value: newTypes, category: 'HIRING' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interview-types'] });
            toast.success(editingInterview ? 'Interview type updated' : 'Interview type created');
            setInterviewModalOpen(false);
            setEditingInterview(null);
        },
        onError: () => toast.error('Failed to save interview type'),
    });

    const handleSaveInterviewType = (formData: any) => {
        const newTypes = editingInterview
            ? interviewTypes.map((t: any) => t.id === editingInterview.id ? { ...formData, id: t.id } : t)
            : [...interviewTypes, { ...formData, id: Date.now().toString() }];
        saveInterviewTypesMutation.mutate(newTypes);
    };

    const handleDeleteInterviewType = () => {
        if (!deleteInterviewId) return;
        const newTypes = interviewTypes.filter((t: any) => t.id !== deleteInterviewId);
        saveInterviewTypesMutation.mutate(newTypes);
        setDeleteInterviewId(null);
    };

    // SLA Query
    const { data: slaData } = useQuery({
        queryKey: ['sla-settings'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('sla_settings');
                return extractData(response)?.value || null;
            } catch {
                return null;
            }
        },
    });

    // Update SLA settings when data is fetched
    useEffect(() => {
        if (slaData) {
            setSlaSettings(prev => ({ ...prev, ...slaData }));
        }
    }, [slaData]);

    // SLA Mutation
    const saveSlaSettingsMutation = useMutation({
        mutationFn: async (settings: typeof slaSettings) => {
            return settingsApi.update('sla_settings', { value: settings, category: 'HIRING' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-settings'] });
            toast.success('SLA settings saved successfully');
            setSavingSla(false);
        },
        onError: () => {
            toast.error('Failed to save SLA settings');
            setSavingSla(false);
        },
    });

    const handleSaveSlaSettings = () => {
        setSavingSla(true);
        saveSlaSettingsMutation.mutate(slaSettings);
    };

    const updateSlaStage = (stage: keyof typeof slaSettings, field: string, value: number | boolean) => {
        setSlaSettings(prev => ({
            ...prev,
            [stage]: { ...prev[stage], [field]: value }
        }));
    };

    // Approvals Mutations
    const saveApprovalsMutation = useMutation({
        mutationFn: async (newWorkflows: any[]) => {
            return settingsApi.update('approval_workflows', { value: newWorkflows, category: 'HIRING' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
            toast.success(editingApproval ? 'Workflow updated' : 'Workflow created');
            setApprovalModalOpen(false);
            setEditingApproval(null);
        },
        onError: () => toast.error('Failed to save workflow'),
    });

    const handleSaveApproval = (formData: any) => {
        const newWorkflows = editingApproval
            ? approvalWorkflows.map((w: any) => w.id === editingApproval.id ? { ...formData, id: w.id } : w)
            : [...approvalWorkflows, { ...formData, id: Date.now().toString() }];
        saveApprovalsMutation.mutate(newWorkflows);
    };

    const handleDeleteApproval = () => {
        if (!deleteApprovalId) return;
        const newWorkflows = approvalWorkflows.filter((w: any) => w.id !== deleteApprovalId);
        saveApprovalsMutation.mutate(newWorkflows);
        setDeleteApprovalId(null);
    };

    const formatDuration = (minutes: number) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        return `${minutes} min`;
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-1 overflow-x-auto">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'pipelines'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('pipelines')}
                >
                    {t('hiringProcess.tabs.pipelines')}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'slas'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('slas')}
                >
                    {t('hiringProcess.tabs.slas')}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'scorecards'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('scorecards')}
                >
                    {t('hiringProcess.tabs.scorecards')}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'interviews'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('interviews')}
                >
                    {t('hiringProcess.tabs.interviews')}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'approvals'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('approvals')}
                >
                    {t('hiringProcess.tabs.approvals')}
                </button>
            </div>




            {activeTab === 'pipelines' && (
                <PipelineSettings />
            )}

            {activeTab === 'slas' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader title={t('hiringProcess.slas.title')} description={t('hiringProcess.slas.description')} />
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Resume Screening */}
                                <SlaStageCard
                                    title="Resume Screening"
                                    description="Time to review and screen new applications"
                                    stage="screening"
                                    settings={slaSettings.screening}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Phone Screen */}
                                <SlaStageCard
                                    title="Phone Screen"
                                    description="Time to complete initial phone screening"
                                    stage="phoneScreen"
                                    settings={slaSettings.phoneScreen}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Interview */}
                                <SlaStageCard
                                    title="Interview Scheduling"
                                    description="Time to schedule and complete interviews"
                                    stage="interview"
                                    settings={slaSettings.interview}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Assessment */}
                                <SlaStageCard
                                    title="Assessment"
                                    description="Time to complete candidate assessments"
                                    stage="assessment"
                                    settings={slaSettings.assessment}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Background Check */}
                                <SlaStageCard
                                    title="Background Check"
                                    description="Time to complete background verification"
                                    stage="backgroundCheck"
                                    settings={slaSettings.backgroundCheck}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Offer */}
                                <SlaStageCard
                                    title="Offer Generation"
                                    description="Time to prepare and send offer letter"
                                    stage="offer"
                                    settings={slaSettings.offer}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Offer Acceptance */}
                                <SlaStageCard
                                    title="Offer Acceptance"
                                    description="Time for candidate to accept/decline offer"
                                    stage="offerAcceptance"
                                    settings={slaSettings.offerAcceptance}
                                    onUpdate={updateSlaStage}
                                />

                                {/* Onboarding */}
                                <SlaStageCard
                                    title="Onboarding Preparation"
                                    description="Time to prepare onboarding materials"
                                    stage="onboarding"
                                    settings={slaSettings.onboarding}
                                    onUpdate={updateSlaStage}
                                />
                            </div>

                            <div className="flex justify-end mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <Button onClick={handleSaveSlaSettings} isLoading={savingSla}>
                                    {t('hiringProcess.slas.save')}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* SLA Info Card */}
                    <Card>
                        <div className="p-6">
                            <h3 className="font-medium text-neutral-900 dark:text-white mb-3">How SLAs Work</h3>
                            <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <p>• <strong>Target Days:</strong> Maximum number of days allowed for each hiring stage</p>
                                <p>• <strong>Alerts:</strong> When enabled, notifications are sent before the deadline</p>
                                <p>• <strong>Alert Days Before:</strong> How many days before the deadline to send alerts</p>
                                <p>• SLA breaches are tracked in the Reports section for performance monitoring</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'scorecards' && (
                <ScorecardTemplatesSettings />
            )}

            {activeTab === 'interviews' && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-medium text-lg text-neutral-900 dark:text-white">Interview Types</h3>
                                <p className="text-sm text-neutral-500">Configure different types of interviews for your hiring process.</p>
                            </div>
                            <Button className="gap-2" onClick={() => { setEditingInterview(null); setInterviewModalOpen(true); }}>
                                <Plus size={16} /> {t('hiringProcess.interviews.addType')}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {interviewTypesLoading ? (
                                <div className="text-center py-8 text-neutral-500">Loading interview types...</div>
                            ) : interviewTypes.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
                                    <Video className="mx-auto text-neutral-400 mb-2" size={32} />
                                    <p className="text-neutral-500">No interview types configured yet.</p>
                                    <p className="text-sm text-neutral-400">Click "Add Interview Type" to create one.</p>
                                </div>
                            ) : (
                                interviewTypes.map((type: any) => (
                                    <div key={type.id} className="group flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${type.type === 'remote' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                                                <Video size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-neutral-900 dark:text-white">{type.name}</h3>
                                                <p className="text-sm text-neutral-500">{formatDuration(type.duration)} • {type.type === 'remote' ? 'Remote' : 'In Person'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingInterview(type); setInterviewModalOpen(true); }}>
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteInterviewId(type.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Interview Type Modal */}
            <Modal isOpen={interviewModalOpen} onClose={() => { setInterviewModalOpen(false); setEditingInterview(null); }} title={editingInterview ? 'Edit Interview Type' : 'Add Interview Type'}>
                <InterviewTypeForm initialData={editingInterview} onSubmit={handleSaveInterviewType} onCancel={() => setInterviewModalOpen(false)} isLoading={saveInterviewTypesMutation.isPending} />
            </Modal>

            {/* Delete Interview Type Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteInterviewId}
                onCancel={() => setDeleteInterviewId(null)}
                onConfirm={handleDeleteInterviewType}
                title="Delete Interview Type"
                message="Are you sure you want to delete this interview type?"
                confirmLabel="Delete"
                variant="danger"
            />


            {activeTab === 'approvals' && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-medium text-lg text-neutral-900 dark:text-white">Approval Workflows</h3>
                                <p className="text-sm text-neutral-500">Configure approval chains for job requisitions and offers.</p>
                            </div>
                            <Button className="gap-2" onClick={() => { setEditingApproval(null); setApprovalModalOpen(true); }}>
                                <Plus size={16} /> {t('hiringProcess.approvals.createWorkflow')}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {approvalWorkflows.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
                                    <CheckSquare className="mx-auto text-neutral-400 mb-2" size={32} />
                                    <p className="text-neutral-500">No approval workflows configured yet.</p>
                                    <p className="text-sm text-neutral-400">Click "Create Workflow" to create one.</p>
                                </div>
                            ) : (
                                approvalWorkflows.map((workflow: any) => (
                                    <div key={workflow.id} className="group flex items-start justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 transition-colors">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                                                <CheckSquare size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-neutral-900 dark:text-white">{workflow.name}</h3>
                                                <p className="text-sm text-neutral-500 mb-3">{workflow.description || 'No description'}</p>

                                                {/* Approval Steps */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {workflow.steps?.map((step: any, index: number) => {
                                                        const isOldFormat = typeof step === 'string';
                                                        const displayName = isOldFormat ? step : (step.userName || step.roleName || 'Unknown');
                                                        const roleName = isOldFormat ? null : step.roleName;

                                                        return (
                                                            <div key={index} className="flex items-center gap-1.5">
                                                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm">
                                                                    <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                                                        {index + 1}
                                                                    </span>
                                                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{displayName}</span>
                                                                    {roleName && (
                                                                        <span className="text-xs text-neutral-500">({roleName})</span>
                                                                    )}
                                                                </div>
                                                                {index < workflow.steps.length - 1 && (
                                                                    <ArrowRight size={14} className="text-neutral-400" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingApproval(workflow); setApprovalModalOpen(true); }}>
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteApprovalId(workflow.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Approval Workflow Modal */}
            <Modal isOpen={approvalModalOpen} onClose={() => { setApprovalModalOpen(false); setEditingApproval(null); }} title={editingApproval ? 'Edit Workflow' : 'Create Workflow'}>
                <ApprovalWorkflowForm initialData={editingApproval} onSubmit={handleSaveApproval} onCancel={() => setApprovalModalOpen(false)} isLoading={saveApprovalsMutation.isPending} />
            </Modal>

            {/* Delete Approval Workflow Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteApprovalId}
                onCancel={() => setDeleteApprovalId(null)}
                onConfirm={handleDeleteApproval}
                title="Delete Workflow"
                message="Are you sure you want to delete this approval workflow?"
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}

// SLA Stage Card Component
interface SlaStageSettings {
    days: number;
    alertEnabled: boolean;
    alertDaysBefore: number;
}

function SlaStageCard({ title, description, stage, settings, onUpdate }: {
    title: string;
    description: string;
    stage: string;
    settings: SlaStageSettings;
    onUpdate: (stage: any, field: string, value: number | boolean) => void;
}) {
    return (
        <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-medium text-neutral-900 dark:text-white">{title}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
                </div>
                <Clock size={16} className="text-neutral-400 mt-1" />
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 dark:text-neutral-400 w-24">Target Days</label>
                    <input
                        type="number"
                        min={1}
                        max={90}
                        value={settings.days}
                        onChange={(e) => onUpdate(stage, 'days', Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                    />
                    <span className="text-xs text-neutral-500">days</span>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 dark:text-neutral-400 w-24">Send Alerts</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.alertEnabled}
                            onChange={(e) => onUpdate(stage, 'alertEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {settings.alertEnabled && (
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-neutral-600 dark:text-neutral-400 w-24">Alert Before</label>
                        <input
                            type="number"
                            min={1}
                            max={settings.days - 1 || 1}
                            value={settings.alertDaysBefore}
                            onChange={(e) => onUpdate(stage, 'alertDaysBefore', Number(e.target.value))}
                            className="w-20 px-3 py-1.5 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                        />
                        <span className="text-xs text-neutral-500">days before deadline</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Interview Type Form Component
function InterviewTypeForm({ initialData, onSubmit, onCancel, isLoading }: any) {
    const [name, setName] = useState(initialData?.name || '');
    const [duration, setDuration] = useState(initialData?.duration || 30);
    const [type, setType] = useState(initialData?.type || 'remote');
    const [description, setDescription] = useState(initialData?.description || '');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, duration, type, description }); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Interview Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" placeholder="e.g., Technical Interview" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <input type="number" min={15} required value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700">
                        <option value="remote">Remote</option>
                        <option value="in-person">In Person</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" placeholder="Brief description of this interview type..." />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" isLoading={isLoading}>Save</Button>
            </div>
        </form>
    );
}

// Approval Step interface
interface ApprovalStep {
    role: string;
    roleName: string;
    userId: string;
    userName: string;
}

// Approval Workflow Form Component
function ApprovalWorkflowForm({ initialData, onSubmit, onCancel, isLoading }: any) {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [steps, setSteps] = useState<ApprovalStep[]>(() => {
        // Convert old format (string[]) to new format if needed
        if (initialData?.steps) {
            if (typeof initialData.steps[0] === 'string') {
                return initialData.steps.map((s: string) => ({ role: '', roleName: s, userId: '', userName: '' }));
            }
            return initialData.steps;
        }
        return [{ role: '', roleName: '', userId: '', userName: '' }];
    });

    // Fetch roles
    const [roles, setRoles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, []);

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const response = await rolesApi.getAll();
            setRoles(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch roles', error);
            // Fallback roles
            setRoles([
                { id: 'ADMIN', name: 'Admin' },
                { id: 'RECRUITER', name: 'Recruiter' },
                { id: 'HIRING_MANAGER', name: 'Hiring Manager' },
                { id: 'HR', name: 'HR' },
            ]);
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await usersApi.getAll();
            setUsers(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const getUsersByRole = (roleId: string) => {
        if (!roleId) return [];
        const normalizedRole = roleId.startsWith('SYS_') ? roleId.replace('SYS_', '') : roleId;
        return users.filter((user: any) =>
            user.role === roleId ||
            user.role === normalizedRole ||
            user.roleId === roleId
        );
    };

    const addStep = () => setSteps([...steps, { role: '', roleName: '', userId: '', userName: '' }]);
    const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

    const updateStepRole = (index: number, roleId: string) => {
        const role = roles.find((r: any) => r.id === roleId);
        const newSteps = [...steps];
        newSteps[index] = {
            ...newSteps[index],
            role: roleId,
            roleName: role?.name || roleId,
            userId: '', // Reset user when role changes
            userName: '',
        };
        setSteps(newSteps);
    };

    const updateStepUser = (index: number, userId: string) => {
        const user = users.find((u: any) => u.id === userId);
        const newSteps = [...steps];
        newSteps[index] = {
            ...newSteps[index],
            userId: userId,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '',
        };
        setSteps(newSteps);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validSteps = steps.filter(s => s.role && s.userId);
        if (validSteps.length === 0) {
            toast.error('Please add at least one approval step with a role and user');
            return;
        }
        onSubmit({ name, description, steps: validSteps });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Workflow Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" placeholder="e.g., Job Requisition Approval" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" placeholder="When this workflow should be triggered..." />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Approval Steps</label>
                <p className="text-xs text-neutral-500 mb-3">Select a role, then choose a specific user from that role to approve.</p>
                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <span className="text-sm font-medium text-neutral-500 w-6 pt-2">{index + 1}.</span>
                            <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1">Role</label>
                                        <select
                                            value={step.role}
                                            onChange={(e) => updateStepRole(index, e.target.value)}
                                            className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 text-sm"
                                            disabled={loadingRoles}
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map((role: any) => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1">Approver</label>
                                        <select
                                            value={step.userId}
                                            onChange={(e) => updateStepUser(index, e.target.value)}
                                            className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700 text-sm"
                                            disabled={!step.role || loadingUsers}
                                        >
                                            <option value="">{step.role ? 'Select User' : 'Select role first'}</option>
                                            {getUsersByRole(step.role).map((user: any) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName} ({user.employeeId || user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {steps.length > 1 && (
                                <button type="button" onClick={() => removeStep(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded mt-5">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={addStep} className="mt-2 gap-1">
                    <Plus size={14} /> Add Step
                </Button>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" isLoading={isLoading}>Save</Button>
            </div>
        </form>
    );
}
