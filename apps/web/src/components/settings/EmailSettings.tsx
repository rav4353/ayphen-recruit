import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Save, AlertCircle, Send, Users, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { settingsApi, candidatesApi } from '../../lib/api';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('view') as 'smtp' | 'templates' | 'campaigns') || 'smtp';

    const setActiveTab = (tab: 'smtp' | 'templates' | 'campaigns') => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', tab);
            return newParams;
        });
    };
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
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'campaigns'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('campaigns')}
                >
                    <span className="flex items-center gap-1.5">
                        <Send size={14} />
                        Bulk Campaigns
                    </span>
                </button>
            </div>

            {activeTab === 'templates' && <EmailTemplatesSettings />}
            {activeTab === 'campaigns' && <BulkEmailCampaigns />}

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

// ==================== BULK EMAIL CAMPAIGNS ====================

function BulkEmailCampaigns() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const response = await candidatesApi.getAll({ take: 500 });
            setCandidates(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch candidates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.firstName?.toLowerCase().includes(query) ||
            c.lastName?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        );
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredCandidates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCandidates.map(c => c.id));
        }
    };

    const handleSendCampaign = async () => {
        if (selectedIds.length === 0) {
            toast.error('Please select at least one candidate');
            return;
        }
        if (!subject.trim() || !message.trim()) {
            toast.error('Please enter subject and message');
            return;
        }

        setIsSending(true);
        try {
            // Use bulk email API
            const bulkResponse = await fetch('/api/v1/emails/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, subject, message }),
            });

            if (bulkResponse.ok) {
                const result = await bulkResponse.json();
                toast.success(`Campaign sent to ${result.data?.count || selectedIds.length} candidates`);
                setSelectedIds([]);
                setSubject('');
                setMessage('');
            } else {
                throw new Error('Failed to send bulk email');
            }
        } catch (error) {
            console.error('Failed to send campaign', error);
            toast.error('Failed to send email campaign');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Bulk Email Campaigns
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">
                            Send personalized emails to multiple candidates at once
                        </p>
                    </div>
                    <div className="text-sm text-neutral-500">
                        {selectedIds.length} of {filteredCandidates.length} selected
                    </div>
                </div>

                {/* Search and Select All */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search candidates..."
                            className="pl-9"
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                        {selectedIds.length === filteredCandidates.length ? (
                            <><CheckSquare size={16} className="mr-1" /> Deselect All</>
                        ) : (
                            <><Square size={16} className="mr-1" /> Select All</>
                        )}
                    </Button>
                </div>

                {/* Candidate List */}
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-60 overflow-y-auto mb-6">
                    {isLoading ? (
                        <div className="p-8 text-center text-neutral-500">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                            Loading candidates...
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            No candidates found
                        </div>
                    ) : (
                        filteredCandidates.map(candidate => (
                            <div
                                key={candidate.id}
                                className={`flex items-center gap-3 p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${selectedIds.includes(candidate.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                onClick={() => toggleSelect(candidate.id)}
                            >
                                <div className="text-blue-600">
                                    {selectedIds.includes(candidate.id) ? (
                                        <CheckSquare size={18} />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {candidate.firstName} {candidate.lastName}
                                    </p>
                                    <p className="text-xs text-neutral-500 truncate">{candidate.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Email Composition */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject *</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Message *</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                            placeholder="Enter your message... Use {{firstName}} and {{lastName}} for personalization."
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Available placeholders: {'{{firstName}}'}, {'{{lastName}}'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button
                        variant="primary"
                        onClick={handleSendCampaign}
                        disabled={selectedIds.length === 0 || !subject || !message || isSending}
                    >
                        {isSending ? (
                            <><Loader2 size={16} className="animate-spin mr-2" /> Sending...</>
                        ) : (
                            <><Send size={16} className="mr-2" /> Send to {selectedIds.length} Candidate{selectedIds.length !== 1 ? 's' : ''}</>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
