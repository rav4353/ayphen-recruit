import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCommit, ChevronRight, Zap } from 'lucide-react';
import { Card, Select } from '../ui';
import { pipelinesApi } from '../../lib/api';
import { Pipeline, PipelineStage } from '../../lib/types';
import { WorkflowList } from './WorkflowList';

export function AutomationSettings() {
    const { t } = useTranslation();
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
    const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPipelines();
    }, []);

    const fetchPipelines = async () => {
        try {
            const response = await pipelinesApi.getAll();
            const data = response.data.data || response.data || [];
            setPipelines(data);
            if (data.length > 0) {
                setSelectedPipelineId(data[0].id);
                if (data[0].stages?.length > 0) {
                    setSelectedStage(data[0].stages[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch pipelines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                    {t('settings.automations', 'Pipeline Automations')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('settings.automationsDesc', 'Automate actions when candidates move through pipeline stages.')}
                </p>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-neutral-500">{t('common.loading', 'Loading...')}</div>
            ) : pipelines.length === 0 ? (
                <Card className="p-8 text-center bg-neutral-50 dark:bg-neutral-900/50">
                    <Zap className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">{t('settings.noPipelines', 'No pipelines found. Create a job/pipeline first.')}</p>
                </Card>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar: Pipeline & Stage Selection */}
                    <div className="w-full lg:w-1/3 space-y-4">
                        <Card className="p-4">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                {t('common.pipeline', 'Select Pipeline')}
                            </label>
                            <Select
                                value={selectedPipelineId}
                                onChange={(e) => {
                                    setSelectedPipelineId(e.target.value);
                                    const pipeline = pipelines.find(p => p.id === e.target.value);
                                    if (pipeline && pipeline.stages?.length > 0) {
                                        setSelectedStage(pipeline.stages[0]);
                                    } else {
                                        setSelectedStage(null);
                                    }
                                }}
                                options={pipelines.map(p => ({ value: p.id, label: p.name }))}
                            />
                        </Card>

                        {selectedPipeline && (
                            <Card className="overflow-hidden">
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 border-b border-neutral-200 dark:border-neutral-700 font-medium text-sm text-neutral-600 dark:text-neutral-300">
                                    {t('common.stages', 'Stages')}
                                </div>
                                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {selectedPipeline.stages?.map((stage) => (
                                        <button
                                            key={stage.id}
                                            onClick={() => setSelectedStage(stage)}
                                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors
                         ${selectedStage?.id === stage.id
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || '#ccc' }} />
                                                {stage.name}
                                            </span>
                                            {selectedStage?.id === stage.id && <ChevronRight size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Main Content: Workflow List */}
                    <div className="flex-1">
                        {selectedStage ? (
                            <WorkflowList stage={selectedStage} />
                        ) : (
                            <div className="h-full flex items-center justify-center p-12 text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                                <div className="text-center">
                                    <GitCommit className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                    <p>{t('settings.selectStage', 'Select a stage to manage automations')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
