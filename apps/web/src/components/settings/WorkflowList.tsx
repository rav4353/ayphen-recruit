import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Zap, Clock, Mail, Tag, CheckSquare, MessageSquare, Power, ArrowRight } from 'lucide-react';
import { Button, Card, Badge, ConfirmationModal } from '../ui';
import { workflowsApi } from '../../lib/api';
import { WorkflowAutomation, PipelineStage } from '../../lib/types';
import { WorkflowBuilder } from './WorkflowBuilder';
import toast from 'react-hot-toast';

interface WorkflowListProps {
    stage: PipelineStage;
}

export function WorkflowList({ stage }: WorkflowListProps) {
    const { t } = useTranslation();
    const [workflows, setWorkflows] = useState<WorkflowAutomation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowAutomation | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, [stage.id]);

    const fetchWorkflows = async () => {
        setIsLoading(true);
        try {
            const response = await workflowsApi.getWorkflowsByStage(stage.id);
            setWorkflows(response.data.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (workflow: WorkflowAutomation) => {
        setSelectedWorkflow(workflow);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedWorkflow) return;

        setIsDeleting(true);
        try {
            await workflowsApi.deleteWorkflow(selectedWorkflow.id);
            toast.success(t('workflows.deleteSuccess', 'Workflow deleted successfully'));
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
            toast.error(t('workflows.deleteError', 'Failed to delete workflow'));
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setSelectedWorkflow(null);
        }
    };

    const handleEdit = (workflow: WorkflowAutomation) => {
        setSelectedWorkflow(workflow);
        setIsBuilderOpen(true);
    };

    const handleToggle = async (workflow: WorkflowAutomation) => {
        try {
            await workflowsApi.toggleWorkflow(workflow.id, !workflow.isActive);
            toast.success(t(workflow.isActive ? 'workflows.deactivated' : 'workflows.activated'));
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to toggle workflow:', error);
            toast.error(t('workflows.toggleError', 'Failed to update status'));
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'SEND_EMAIL': return <Mail size={14} />;
            case 'ADD_TAG': return <Tag size={14} />;
            case 'CREATE_TASK': return <CheckSquare size={14} />;
            case 'REQUEST_FEEDBACK': return <MessageSquare size={14} />;
            default: return <Zap size={14} />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    {t('workflows.automationsFor', 'Automations for')} {stage.name}
                </h3>
                <Button size="sm" onClick={() => { setSelectedWorkflow(null); setIsBuilderOpen(true); }}>
                    {t('workflows.addNew', 'Add Automation')}
                </Button>
            </div>

            {isLoading ? (
                <div className="py-8 text-center text-neutral-500">{t('common.loading', 'Loading...')}</div>
            ) : workflows.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="mx-auto w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3 text-neutral-400">
                        <Zap size={24} />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                        {t('workflows.noAutomations', 'No automations configured for this stage yet.')}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedWorkflow(null); setIsBuilderOpen(true); }}>
                        {t('workflows.createFirst', 'Create your first automation')}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {workflows.map((workflow) => (
                        <Card key={workflow.id} className={`p-4 transition-all ${!workflow.isActive ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-neutral-900 dark:text-white">{workflow.name}</h4>
                                        {!workflow.isActive && (
                                            <Badge variant="secondary" className="text-xs">{t('workflows.inactive', 'Inactive')}</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{workflow.description}</p>

                                    <div className="flex items-center flex-wrap gap-2 text-xs">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Power size={10} className="text-blue-500" />
                                            {workflow.trigger === 'STAGE_ENTER' ? t('workflows.triggers.enter') :
                                                workflow.trigger === 'STAGE_EXIT' ? t('workflows.triggers.exit') :
                                                    t('workflows.triggers.time')}
                                        </Badge>

                                        {workflow.delayMinutes > 0 && (
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Clock size={10} className="text-orange-500" />
                                                {workflow.delayMinutes}m delay
                                            </Badge>
                                        )}

                                        <div className="flex items-center gap-1 text-neutral-400">
                                            <ArrowRight size={12} />
                                            <span>{(workflow.actions || []).length} actions:</span>
                                        </div>

                                        {(workflow.actions || []).map((action, i) => (
                                            <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800">
                                                {getActionIcon(action.type as string)}
                                                {(action.type || 'UNKNOWN').replace('_', ' ').toLowerCase()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={workflow.isActive ? "text-amber-600" : "text-green-600"}
                                        onClick={() => handleToggle(workflow)}
                                        title={workflow.isActive ? t('common.deactivate') : t('common.activate')}
                                    >
                                        <Power size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(workflow)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(workflow)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {isBuilderOpen && (
                <WorkflowBuilder
                    stageId={stage.id}
                    workflow={selectedWorkflow}
                    onClose={() => setIsBuilderOpen(false)}
                    onSuccess={() => {
                        fetchWorkflows();
                        setIsBuilderOpen(false);
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={t('workflows.deleteTitle', 'Delete Automation')}
                message={t('workflows.deleteConfirm', 'Are you sure you want to delete this automation? This action cannot be undone.')}
                confirmLabel={t('common.delete', 'Delete')}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
