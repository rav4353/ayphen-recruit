import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Save, AlertCircle } from 'lucide-react';
import { settingsApi } from '../../lib/api';
import { Button, Input, Card, CardHeader } from '../ui';
import { EmailTemplatesSettings } from './EmailTemplatesSettings';

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
    secure: boolean;
}

const DEFAULT_CONFIG: SmtpConfig = {
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
    secure: false,
};

export function EmailSettings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'smtp' | 'templates'>('smtp');
    const [config, setConfig] = useState<SmtpConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await settingsApi.getByKey('smtp_config');
            if (response.data && response.data.value) {
                setConfig({ ...DEFAULT_CONFIG, ...response.data.value });
            }
        } catch (error) {
            console.error('Failed to fetch SMTP settings', error);
            // It's okay if it fails (e.g. setting doesn't exist yet)
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await settingsApi.update('smtp_config', {
                value: config,
                category: 'INTEGRATION',
                isPublic: false,
            });
            toast.success(t('settings.email.saveSuccess', 'Email settings saved successfully'));
        } catch (error) {
            console.error('Failed to save SMTP settings', error);
            toast.error(t('settings.email.saveError', 'Failed to save email settings'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: keyof SmtpConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return <div className="p-8 text-center text-neutral-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {t('settings.email.title', 'Email Settings')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {t('settings.email.description', 'Configure your SMTP settings and email templates.')}
                </p>
            </div>

            {/* Sub-tabs for Email Settings */}
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'smtp'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                    }`}
                    onClick={() => setActiveTab('smtp')}
                >
                    SMTP Configuration
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'templates'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                    }`}
                    onClick={() => setActiveTab('templates')}
                >
                    Email Templates
                </button>
            </div>

            {activeTab === 'templates' && <EmailTemplatesSettings />}

            {activeTab === 'smtp' && (
            <Card>
                <CardHeader
                    title="SMTP Configuration"
                    icon={<Mail className="text-neutral-500" size={20} />}
                    align="left"
                />
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                SMTP Host
                            </label>
                            <Input
                                value={config.host}
                                onChange={(e) => handleChange('host', e.target.value)}
                                placeholder="smtp.example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                SMTP Port
                            </label>
                            <Input
                                type="number"
                                value={config.port}
                                onChange={(e) => handleChange('port', parseInt(e.target.value) || 0)}
                                placeholder="587"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                SMTP User
                            </label>
                            <Input
                                value={config.user}
                                onChange={(e) => handleChange('user', e.target.value)}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                SMTP Password
                            </label>
                            <Input
                                type="password"
                                value={config.pass}
                                onChange={(e) => handleChange('pass', e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                From Email
                            </label>
                            <Input
                                value={config.fromEmail}
                                onChange={(e) => handleChange('fromEmail', e.target.value)}
                                placeholder="noreply@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                From Name
                            </label>
                            <Input
                                value={config.fromName}
                                onChange={(e) => handleChange('fromName', e.target.value)}
                                placeholder="TalentX"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="secure"
                            checked={config.secure}
                            onChange={(e) => handleChange('secure', e.target.checked)}
                            className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="secure" className="text-sm text-neutral-700 dark:text-neutral-300">
                            Use Secure Connection (SSL/TLS)
                        </label>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">Note on Security</p>
                            <p>
                                Your SMTP password is stored securely. Ensure you are using a dedicated app password if you are using services like Gmail.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            variant="primary"
                            className="flex items-center gap-2"
                        >
                            <Save size={16} />
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </Card>
            )}
        </div>
    );
}
