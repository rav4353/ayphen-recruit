import { useState } from 'react';
import { Card, CardHeader, Button, Badge } from '../ui';
import { Plus, Clock, FileText, Video, CheckSquare } from 'lucide-react';
import { PipelineSettings } from './PipelineSettings';
import { useTranslation } from 'react-i18next';

export function HiringProcessSettings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'pipelines' | 'slas' | 'scorecards' | 'interviews' | 'approvals'>('pipelines');

    const [interviewTypes] = useState([
        { id: 1, name: 'hiringProcess.interviews.phoneScreen', duration: '30 min', type: 'hiringProcess.interviews.remote' },
        { id: 2, name: 'hiringProcess.interviews.technicalInterview', duration: '60 min', type: 'hiringProcess.interviews.remote' },
        { id: 3, name: 'hiringProcess.interviews.onsiteLoop', duration: '4 hours', type: 'hiringProcess.interviews.inPerson' },
    ]);

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
                <Card>
                    <div className="p-6">
                        <div className="flex justify-end mb-6">
                            <Button className="gap-2">
                                <Plus size={16} /> {t('hiringProcess.scorecards.createTemplate')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">{t('hiringProcess.scorecards.culturalFit')}</h3>
                                        <p className="text-sm text-neutral-500 mt-1">{t('hiringProcess.scorecards.culturalFitDesc')}</p>
                                        <div className="mt-3 flex gap-2">
                                            <Badge variant="secondary">5 {t('hiringProcess.scorecards.questions')}</Badge>
                                            <Badge variant="secondary">{t('hiringProcess.scorecards.general')}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">{t('hiringProcess.scorecards.seniorEngineer')}</h3>
                                        <p className="text-sm text-neutral-500 mt-1">{t('hiringProcess.scorecards.seniorEngineerDesc')}</p>
                                        <div className="mt-3 flex gap-2">
                                            <Badge variant="secondary">8 {t('hiringProcess.scorecards.questions')}</Badge>
                                            <Badge variant="secondary">{t('hiringProcess.scorecards.engineering')}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {activeTab === 'interviews' && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-end mb-6">
                            <Button className="gap-2">
                                <Plus size={16} /> {t('hiringProcess.interviews.addType')}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {interviewTypes.map((type) => (
                                <div key={type.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                            <Video size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-900 dark:text-white">{t(type.name)}</h3>
                                            <p className="text-sm text-neutral-500">{type.duration} • {t(type.type)}</p>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm">{t('hiringProcess.interviews.edit')}</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {activeTab === 'approvals' && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-end mb-6">
                            <Button className="gap-2">
                                <Plus size={16} /> {t('hiringProcess.approvals.createWorkflow')}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <CheckSquare size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-900 dark:text-white">{t('hiringProcess.approvals.jobRequisition')}</h3>
                                            <p className="text-sm text-neutral-500">{t('hiringProcess.approvals.jobRequisitionDesc')}</p>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm">{t('common.edit')}</Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
                                        <span className="font-medium">1. {t('hiringProcess.approvals.hiringManager')}</span>
                                    </div>
                                    <div className="w-4 h-px bg-neutral-300 dark:bg-neutral-600" />
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
                                        <span className="font-medium">2. {t('hiringProcess.approvals.finance')}</span>
                                    </div>
                                    <div className="w-4 h-px bg-neutral-300 dark:bg-neutral-600" />
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
                                        <span className="font-medium">3. {t('hiringProcess.approvals.vpOfHr')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <CheckSquare size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-900 dark:text-white">{t('hiringProcess.approvals.offerApproval')}</h3>
                                            <p className="text-sm text-neutral-500">{t('hiringProcess.approvals.offerApprovalDesc')}</p>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm">{t('common.edit')}</Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
                                        <span className="font-medium">1. {t('hiringProcess.approvals.recruiter')}</span>
                                    </div>
                                    <div className="w-4 h-px bg-neutral-300 dark:bg-neutral-600" />
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm">
                                        <span className="font-medium">2. {t('hiringProcess.approvals.hiringManager')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
