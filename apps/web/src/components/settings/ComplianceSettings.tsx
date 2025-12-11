import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Input } from '../ui';
import { Shield, FileText, Clock } from 'lucide-react';
import { settingsApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function ComplianceSettings() {
    const [gdprEnabled, setGdprEnabled] = useState(true);
    const [retentionPeriod, setRetentionPeriod] = useState(365);
    const [consentStatement, setConsentStatement] = useState("By applying to this job, you agree to our privacy policy and allow us to store your personal data for recruitment purposes.");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.getByKey('compliance_config');
                if (response.data) {
                    const config = response.data.value;
                    setGdprEnabled(config.gdprEnabled ?? true);
                    setRetentionPeriod(config.retentionPeriod ?? 365);
                    setConsentStatement(config.consentStatement ?? "By applying to this job, you agree to our privacy policy and allow us to store your personal data for recruitment purposes.");
                }
            } catch (error) {
                console.error('Failed to fetch compliance settings', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await settingsApi.update('compliance_config', {
                value: {
                    gdprEnabled,
                    retentionPeriod,
                    consentStatement
                },
                category: 'COMPLIANCE',
                isPublic: true // Consent statement needs to be public
            });
            toast.success('Compliance settings updated successfully');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error('Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader title="GDPR & Privacy" description="Manage data privacy settings and compliance." />
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-neutral-900 dark:text-white">GDPR Compliance Mode</h3>
                                <p className="text-sm text-neutral-500">Enforce consent collection and right-to-be-forgotten workflows.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={gdprEnabled}
                                onChange={(e) => setGdprEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-neutral-900 dark:text-white">Data Retention Period</h3>
                                <p className="text-sm text-neutral-500">Automatically anonymize candidate data after a set period.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                className="w-24 text-right"
                                value={retentionPeriod}
                                onChange={(e) => setRetentionPeriod(parseInt(e.target.value))}
                            />
                            <span className="text-sm text-neutral-500">days</span>
                        </div>
                    </div>

                    <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-neutral-900 dark:text-white">Consent Statement</h3>
                                <p className="text-sm text-neutral-500">The text displayed to candidates when applying.</p>
                            </div>
                        </div>
                        <textarea
                            className="w-full h-32 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={consentStatement}
                            onChange={(e) => setConsentStatement(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <Button size="sm" onClick={handleSave} isLoading={isLoading}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
