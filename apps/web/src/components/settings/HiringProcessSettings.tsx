import { useState } from 'react';
import { Card, CardHeader, Button, Modal, ConfirmationModal } from '../ui';
import { Plus, Clock, Video, CheckSquare, Edit2, Trash2, Users, ArrowRight } from 'lucide-react';
import { PipelineSettings } from './PipelineSettings';
import { ScorecardTemplatesSettings } from './ScorecardTemplatesSettings';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function HiringProcessSettings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'pipelines' | 'slas' | 'scorecards' | 'interviews' | 'approvals'>('pipelines');

    // Interview Types State
    const [interviewModalOpen, setInterviewModalOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState<any>(null);
    const [deleteInterviewId, setDeleteInterviewId] = useState<string | null>(null);

    // Approvals State
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [editingApproval, setEditingApproval] = useState<any>(null);
    const [deleteApprovalId, setDeleteApprovalId] = useState<string | null>(null);

    // Interview Types Query
    const { data: interviewTypes = [] } = useQuery({
        queryKey: ['interview-types'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('interview_types');
                return response.data?.value || [
                    { id: '1', name: 'Phone Screen', duration: 30, type: 'remote', description: 'Initial phone screening' },
                    { id: '2', name: 'Technical Interview', duration: 60, type: 'remote', description: 'Technical assessment' },
                    { id: '3', name: 'Onsite Loop', duration: 240, type: 'in-person', description: 'Full day onsite interviews' },
                ];
            } catch {
                return [
                    { id: '1', name: 'Phone Screen', duration: 30, type: 'remote', description: 'Initial phone screening' },
                    { id: '2', name: 'Technical Interview', duration: 60, type: 'remote', description: 'Technical assessment' },
                    { id: '3', name: 'Onsite Loop', duration: 240, type: 'in-person', description: 'Full day onsite interviews' },
                ];
            }
        },
    });

    // Approvals Query
    const { data: approvalWorkflows = [] } = useQuery({
        queryKey: ['approval-workflows'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('approval_workflows');
                return response.data?.value || [
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
                <Card>
                    <CardHeader title={t('hiringProcess.slas.title')} description={t('hiringProcess.slas.description')} />
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{t('hiringProcess.slas.screening')}</span>
                                    <Clock size={16} className="text-neutral-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-20 px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" defaultValue={2} />
                                    <span className="text-sm text-neutral-500">{t('hiringProcess.slas.daysMax')}</span>
                                </div>
                            </div>

                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{t('hiringProcess.slas.interview')}</span>
                                    <Clock size={16} className="text-neutral-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-20 px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" defaultValue={5} />
                                    <span className="text-sm text-neutral-500">{t('hiringProcess.slas.daysMax')}</span>
                                </div>
                            </div>

                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{t('hiringProcess.slas.offer')}</span>
                                    <Clock size={16} className="text-neutral-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-20 px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" defaultValue={3} />
                                    <span className="text-sm text-neutral-500">{t('hiringProcess.slas.daysMax')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button>{t('hiringProcess.slas.save')}</Button>
                        </div>
                    </div>
                </Card>
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
                            {interviewTypes.map((type: any) => (
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
                            ))}
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

                        <div className="space-y-4">
                            {approvalWorkflows.map((workflow: any) => (
                                <div key={workflow.id} className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                <CheckSquare size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-neutral-900 dark:text-white">{workflow.name}</h3>
                                                <p className="text-sm text-neutral-500">{workflow.description}</p>
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

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {workflow.steps?.map((step: string, index: number) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
                                                    <Users size={14} className="text-neutral-500" />
                                                    <span className="font-medium">{index + 1}. {step}</span>
                                                </div>
                                                {index < workflow.steps.length - 1 && (
                                                    <ArrowRight size={14} className="text-neutral-400" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
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
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    );
}

// Approval Workflow Form Component
function ApprovalWorkflowForm({ initialData, onSubmit, onCancel, isLoading }: any) {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [steps, setSteps] = useState<string[]>(initialData?.steps || ['']);

    const addStep = () => setSteps([...steps, '']);
    const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
    const updateStep = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, description, steps: steps.filter(s => s.trim()) }); }} className="space-y-4">
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
                <div className="space-y-2">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <span className="text-sm text-neutral-500 w-6">{index + 1}.</span>
                            <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} className="flex-1 p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" placeholder="Role or person (e.g., Hiring Manager)" />
                            {steps.length > 1 && (
                                <button type="button" onClick={() => removeStep(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
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
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    );
}
