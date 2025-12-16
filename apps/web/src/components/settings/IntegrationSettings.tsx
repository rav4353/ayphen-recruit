import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button, Input, CardHeader } from '../ui';
import { CheckCircle2, AlertCircle, Calendar, FileSignature, Loader2, ExternalLink, Trash2, Shield, Briefcase, MessageSquare, Send, Mail, Save, Edit } from 'lucide-react';
import { calendarApi, esignatureApi, jobBoardsApi, bgvApi, messagingApi, settingsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { PasswordConfirmModal } from '../modals/PasswordConfirmModal';

type TabType = 'smtp' | 'calendar' | 'esignature' | 'jobBoards' | 'bgv' | 'messaging';

interface EmailAlias {
    email: string;
    name: string;
}

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
    secure: boolean;
    // Purpose-specific from addresses (optional overrides)
    fromAliases?: {
        notifications?: EmailAlias;
        interviews?: EmailAlias;
        offers?: EmailAlias;
        rejections?: EmailAlias;
        bulkEmails?: EmailAlias;
    };
}

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
    secure: false,
    fromAliases: {
        notifications: { email: '', name: '' },
        interviews: { email: '', name: '' },
        offers: { email: '', name: '' },
        rejections: { email: '', name: '' },
        bulkEmails: { email: '', name: '' },
    },
};

interface CalendarConnection {
    id: string;
    provider: 'GOOGLE' | 'OUTLOOK';
    email: string;
    isActive: boolean;
}

interface ESignatureSettings {
    provider: 'DOCUSIGN' | 'ADOBE_SIGN' | 'ZOHO_SIGN';
    clientId?: string;
    accountId?: string;
    isConfigured: boolean;
}

type JobBoardProvider = 'LINKEDIN' | 'INDEED' | 'ZIPRECRUITER' | 'GLASSDOOR' | 'MONSTER';
type BGVProvider = 'CHECKR' | 'SPRINGVERIFY' | 'AUTHBRIDGE' | 'MANUAL';

interface JobBoardSettings {
    [key: string]: { isConfigured: boolean; companyId?: string };
}

interface BGVSettings {
    id?: string;
    provider?: BGVProvider;
    isConfigured: boolean;
    sandboxMode?: boolean;
}

interface JobBoardInfo {
    id: string;
    name: string;
    description: string;
    icon: string;
    requiresApiKey: boolean;
    requiresCompanyId: boolean;
}

export function IntegrationSettings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('view') as TabType) || 'smtp';

    const setActiveTab = (tab: TabType) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', tab);
            return newParams;
        });
    };

    // SMTP State
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(DEFAULT_SMTP_CONFIG);
    const [smtpLoading, setSmtpLoading] = useState(false);
    const [smtpSaving, setSmtpSaving] = useState(false);

    // Job Boards State
    const [jobBoardSettings, setJobBoardSettings] = useState<JobBoardSettings>({});
    const [availableJobBoards, setAvailableJobBoards] = useState<JobBoardInfo[]>([]);
    const [jobBoardsLoading, setJobBoardsLoading] = useState(false);
    const [configuringJobBoard, setConfiguringJobBoard] = useState<string | null>(null);
    const [jobBoardForm, setJobBoardForm] = useState<{ provider: JobBoardProvider; apiKey: string; apiSecret: string; companyId: string }>({
        provider: 'LINKEDIN',
        apiKey: '',
        apiSecret: '',
        companyId: '',
    });

    // BGV State
    const [bgvSettings, setBgvSettings] = useState<BGVSettings | null>(null);
    const [bgvLoading, setBgvLoading] = useState(false);
    const [configuringBgv, setConfiguringBgv] = useState(false);
    const [bgvForm, setBgvForm] = useState<{ provider: BGVProvider; apiKey: string; apiSecret: string; sandboxMode: boolean }>({
        provider: 'CHECKR',
        apiKey: '',
        apiSecret: '',
        sandboxMode: true,
    });

    const bgvProviders = [
        { id: 'CHECKR' as BGVProvider, name: 'Checkr', description: 'Automated background checks for US', icon: '/checkr-logo.png' },
        { id: 'SPRINGVERIFY' as BGVProvider, name: 'SpringVerify', description: 'Background verification for India', icon: '/springverify-logo.png' },
        { id: 'AUTHBRIDGE' as BGVProvider, name: 'AuthBridge', description: 'Employee background verification', icon: '/authbridge-logo.png' },
        { id: 'MANUAL' as BGVProvider, name: 'Manual', description: 'Manual verification process', icon: '' },
    ];

    // Calendar Integration State
    const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [connectingCalendar, setConnectingCalendar] = useState<string | null>(null);
    // Calendar Config Forms (admin credentials)
    const [calendarSettings, setCalendarSettings] = useState<{ google: any; outlook: any } | null>(null);
    const [googleForm, setGoogleForm] = useState({ clientId: '', clientSecret: '' });
    const [outlookForm, setOutlookForm] = useState({ clientId: '', clientSecret: '', tenantId: 'common' });
    const [savingGoogle, setSavingGoogle] = useState(false);
    const [savingOutlook, setSavingOutlook] = useState(false);

    // E-Signature State
    const [esignSettings, setEsignSettings] = useState<ESignatureSettings | null>(null);
    const [esignLoading, setEsignLoading] = useState(false);
    const [esignForm, setEsignForm] = useState({ clientId: '', clientSecret: '' });
    const [configuringEsign, setConfiguringEsign] = useState(false);

    // Messaging (Slack/Teams) State
    const [slackConfig, setSlackConfig] = useState<{ isConfigured: boolean; channels?: string[] } | null>(null);
    const [teamsConfig, setTeamsConfig] = useState<{ isConfigured: boolean; hasWebhook?: boolean } | null>(null);
    const [messagingLoading, setMessagingLoading] = useState(false);
    const [testingSlack, setTestingSlack] = useState(false);
    const [testingTeams, setTestingTeams] = useState(false);
    const [sendingTestNotification, setSendingTestNotification] = useState(false);
    const [slackForm, setSlackForm] = useState({ botToken: '', signingSecret: '', defaultChannelId: '' });
    const [teamsForm, setTeamsForm] = useState({ webhookUrl: '' });
    const [configuringSlack, setConfiguringSlack] = useState(false);
    const [configuringTeams, setConfiguringTeams] = useState(false);

    // Password Confirmation State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingEditAction, setPendingEditAction] = useState<{
        type: 'smtp' | 'calendar_google' | 'calendar_outlook' | 'esignature' | 'job_board' | 'bgv' | 'slack' | 'teams';
        provider?: string;
    } | null>(null);
    const [editModes, setEditModes] = useState<{
        smtp: boolean;
        calendar_google: boolean;
        calendar_outlook: boolean;
        esignature: boolean;
        job_board: Record<string, boolean>;
        bgv: boolean;
        slack: boolean;
        teams: boolean;
    }>({
        smtp: false,
        calendar_google: false,
        calendar_outlook: false,
        esignature: false,
        job_board: {},
        bgv: false,
        slack: false,
        teams: false,
    });

    type EditActionType = 'smtp' | 'calendar_google' | 'calendar_outlook' | 'esignature' | 'job_board' | 'bgv' | 'slack' | 'teams';

    // Request password confirmation before editing
    const requestEditAccess = (type: EditActionType, provider?: string) => {
        // Check if the integration is already configured
        let isConfigured = false;
        switch (type) {
            case 'smtp':
                isConfigured = !!smtpConfig.host && smtpConfig.host !== '';
                break;
            case 'calendar_google':
                isConfigured = !!calendarSettings?.google?.isConfigured;
                break;
            case 'calendar_outlook':
                isConfigured = !!calendarSettings?.outlook?.isConfigured;
                break;
            case 'esignature':
                isConfigured = !!esignSettings?.isConfigured;
                break;
            case 'job_board':
                isConfigured = provider ? !!jobBoardSettings[provider]?.isConfigured : false;
                break;
            case 'bgv':
                isConfigured = !!bgvSettings?.isConfigured;
                break;
            case 'slack':
                isConfigured = !!slackConfig?.isConfigured;
                break;
            case 'teams':
                isConfigured = !!teamsConfig?.isConfigured;
                break;
        }

        if (isConfigured) {
            setPendingEditAction({ type, provider });
            setShowPasswordModal(true);
        } else {
            // Not configured, allow direct access
            enableEditMode(type, provider);
        }
    };

    const enableEditMode = (type: EditActionType, provider?: string) => {
        if (type === 'job_board' && provider) {
            setEditModes(prev => ({
                ...prev,
                job_board: { ...prev.job_board, [provider]: true },
            }));
        } else {
            setEditModes(prev => ({ ...prev, [type]: true }));
        }
    };

    const handlePasswordConfirmed = () => {
        if (pendingEditAction) {
            enableEditMode(pendingEditAction.type, pendingEditAction.provider);
            setPendingEditAction(null);
        }
        setShowPasswordModal(false);
        toast.success('Identity verified. You can now edit the settings.');
    };

    const resetEditMode = (type: EditActionType, provider?: string) => {
        if (type === 'job_board' && provider) {
            setEditModes(prev => ({
                ...prev,
                job_board: { ...prev.job_board, [provider]: false },
            }));
        } else {
            setEditModes(prev => ({ ...prev, [type]: false }));
        }
    };

    // Fetch data when tabs change
    useEffect(() => {
        if (activeTab === 'smtp') {
            fetchSmtpSettings();
        } else if (activeTab === 'calendar') {
            fetchCalendarSettings();
            fetchCalendarConnections();
        } else if (activeTab === 'esignature') {
            fetchEsignSettings();
        } else if (activeTab === 'jobBoards') {
            fetchJobBoardSettings();
            fetchAvailableJobBoards();
        } else if (activeTab === 'bgv') {
            fetchBgvSettings();
        } else if (activeTab === 'messaging') {
            fetchMessagingSettings();
        }
    }, [activeTab]);

    const fetchSmtpSettings = async () => {
        setSmtpLoading(true);
        try {
            const response = await settingsApi.getByKey('smtp_config');
            // Handle nested API response structure: response.data.data.value or response.data.value
            const settingData = response.data?.data || response.data;
            if (settingData && settingData.value) {
                setSmtpConfig({ ...DEFAULT_SMTP_CONFIG, ...settingData.value });
            }
        } catch (error) {
            console.error('Failed to fetch SMTP settings', error);
        } finally {
            setSmtpLoading(false);
        }
    };

    const handleSaveSmtp = async () => {
        setSmtpSaving(true);
        try {
            await settingsApi.update('smtp_config', {
                value: smtpConfig,
                category: 'INTEGRATION',
                isPublic: false,
            });
            toast.success('SMTP configuration saved successfully');
        } catch (error) {
            console.error('Failed to save SMTP settings', error);
            toast.error('Failed to save SMTP configuration');
        } finally {
            setSmtpSaving(false);
        }
    };

    const handleSmtpChange = (key: keyof SmtpConfig, value: any) => {
        setSmtpConfig((prev) => ({ ...prev, [key]: value }));
    };

    const handleSmtpAliasChange = (purpose: keyof NonNullable<SmtpConfig['fromAliases']>, field: 'email' | 'name', value: string) => {
        setSmtpConfig((prev) => ({
            ...prev,
            fromAliases: {
                ...prev.fromAliases,
                [purpose]: {
                    ...prev.fromAliases?.[purpose],
                    [field]: value,
                },
            },
        }));
    };

    const fetchMessagingSettings = async () => {
        setMessagingLoading(true);
        try {
            const [slackRes, teamsRes] = await Promise.all([
                messagingApi.getSlackConfig().catch(() => ({ data: { isConfigured: false } })),
                messagingApi.getTeamsConfig().catch(() => ({ data: { isConfigured: false } })),
            ]);
            setSlackConfig(slackRes.data?.data || slackRes.data || { isConfigured: false });
            setTeamsConfig(teamsRes.data?.data || teamsRes.data || { isConfigured: false });
        } catch (error) {
            console.error('Failed to fetch messaging settings', error);
        } finally {
            setMessagingLoading(false);
        }
    };

    const handleTestSlack = async () => {
        setTestingSlack(true);
        try {
            const res = await messagingApi.testSlack();
            const result = res.data?.data || res.data;
            if (result?.success) {
                toast.success(result.message || 'Slack connection verified!');
            } else {
                toast.error(result?.message || 'Slack connection test failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to test Slack connection');
        } finally {
            setTestingSlack(false);
        }
    };

    const handleTestTeams = async () => {
        setTestingTeams(true);
        try {
            const res = await messagingApi.testTeams();
            const result = res.data?.data || res.data;
            if (result?.success) {
                toast.success(result.message || 'Teams connection verified!');
            } else {
                toast.error(result?.message || 'Teams connection test failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to test Teams connection');
        } finally {
            setTestingTeams(false);
        }
    };

    const handleSendTestNotification = async () => {
        setSendingTestNotification(true);
        try {
            await messagingApi.sendTestNotification();
            toast.success('Test notification sent to all configured channels!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send test notification');
        } finally {
            setSendingTestNotification(false);
        }
    };

    const handleConfigureSlack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slackForm.botToken || !slackForm.signingSecret) {
            toast.error('Bot Token and Signing Secret are required');
            return;
        }
        setConfiguringSlack(true);
        try {
            await messagingApi.configureSlack({
                botToken: slackForm.botToken,
                signingSecret: slackForm.signingSecret,
                defaultChannelId: slackForm.defaultChannelId || undefined,
            });
            toast.success('Slack configured successfully');
            setSlackForm({ botToken: '', signingSecret: '', defaultChannelId: '' });
            fetchMessagingSettings();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to configure Slack');
        } finally {
            setConfiguringSlack(false);
        }
    };

    const handleConfigureTeams = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamsForm.webhookUrl) {
            toast.error('Webhook URL is required');
            return;
        }
        setConfiguringTeams(true);
        try {
            await messagingApi.configureTeams({ webhookUrl: teamsForm.webhookUrl });
            toast.success('Teams configured successfully');
            setTeamsForm({ webhookUrl: '' });
            fetchMessagingSettings();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to configure Teams');
        } finally {
            setConfiguringTeams(false);
        }
    };

    const fetchJobBoardSettings = async () => {
        setJobBoardsLoading(true);
        try {
            const res = await jobBoardsApi.getSettings();
            setJobBoardSettings(res.data.data || {});
        } catch (error) {
            console.error('Failed to fetch job board settings', error);
        } finally {
            setJobBoardsLoading(false);
        }
    };

    const fetchAvailableJobBoards = async () => {
        try {
            const res = await jobBoardsApi.getAvailable();
            setAvailableJobBoards(res.data.data || []);
        } catch (error) {
            // Use default boards if API fails
            setAvailableJobBoards([
                { id: 'LINKEDIN', name: 'LinkedIn', description: 'Professional networking and job board', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png', requiresApiKey: true, requiresCompanyId: true },
                { id: 'INDEED', name: 'Indeed', description: "World's #1 job site", icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Indeed_logo.png', requiresApiKey: true, requiresCompanyId: false },
                { id: 'ZIPRECRUITER', name: 'ZipRecruiter', description: 'AI-powered job matching', icon: '', requiresApiKey: true, requiresCompanyId: false },
                { id: 'GLASSDOOR', name: 'Glassdoor', description: 'Jobs and company reviews', icon: '', requiresApiKey: true, requiresCompanyId: true },
                { id: 'MONSTER', name: 'Monster', description: 'Global employment website', icon: '', requiresApiKey: true, requiresCompanyId: false },
            ]);
        }
    };

    const fetchBgvSettings = async () => {
        setBgvLoading(true);
        try {
            const res = await bgvApi.getSettings();
            setBgvSettings(res.data.data || { isConfigured: false });
        } catch (error) {
            console.error('Failed to fetch BGV settings', error);
            setBgvSettings({ isConfigured: false });
        } finally {
            setBgvLoading(false);
        }
    };

    const handleConfigureJobBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobBoardForm.apiKey) {
            toast.error('API Key is required');
            return;
        }
        setConfiguringJobBoard(jobBoardForm.provider);
        try {
            await jobBoardsApi.configure({
                provider: jobBoardForm.provider,
                apiKey: jobBoardForm.apiKey,
                apiSecret: jobBoardForm.apiSecret || undefined,
                companyId: jobBoardForm.companyId || undefined,
            });
            toast.success(`${jobBoardForm.provider} configured successfully`);
            setJobBoardForm({ provider: 'LINKEDIN', apiKey: '', apiSecret: '', companyId: '' });
            fetchJobBoardSettings();
        } catch (error) {
            toast.error('Failed to configure job board');
        } finally {
            setConfiguringJobBoard(null);
        }
    };

    const handleDisconnectJobBoard = async (provider: string) => {
        try {
            await jobBoardsApi.disconnect(provider);
            toast.success(`${provider} disconnected`);
            fetchJobBoardSettings();
        } catch (error) {
            toast.error('Failed to disconnect job board');
        }
    };

    const handleConfigureBgv = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bgvForm.apiKey && bgvForm.provider !== 'MANUAL') {
            toast.error('API Key is required');
            return;
        }
        setConfiguringBgv(true);
        try {
            await bgvApi.configure({
                provider: bgvForm.provider,
                apiKey: bgvForm.apiKey,
                apiSecret: bgvForm.apiSecret || undefined,
                sandboxMode: bgvForm.sandboxMode,
            });
            toast.success('Background check provider configured successfully');
            fetchBgvSettings();
        } catch (error) {
            toast.error('Failed to configure provider');
        } finally {
            setConfiguringBgv(false);
        }
    };

    const fetchCalendarSettings = async () => {
        try {
            const res = await calendarApi.getSettings();
            setCalendarSettings(res.data.data);
            if (res.data.data?.google?.clientId) {
                setGoogleForm(prev => ({ ...prev, clientId: res.data.data.google.clientId }));
            }
            if (res.data.data?.outlook?.clientId) {
                setOutlookForm(prev => ({ ...prev, clientId: res.data.data.outlook.clientId }));
            }
        } catch (error) {
            console.error('Failed to fetch calendar settings', error);
        }
    };

    // Handle OAuth callback from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) {
            handleOAuthCallback(code, state);
        }
    }, []);

    const fetchCalendarConnections = async () => {
        setCalendarLoading(true);
        try {
            const res = await calendarApi.getConnections();
            setCalendarConnections(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch calendar connections', error);
        } finally {
            setCalendarLoading(false);
        }
    };

    const fetchEsignSettings = async () => {
        setEsignLoading(true);
        try {
            const res = await esignatureApi.getSettings();
            setEsignSettings(res.data.data);
            if (res.data.data?.clientId) {
                setEsignForm({ clientId: res.data.data.clientId, clientSecret: '' });
            }
        } catch (error) {
            console.error('Failed to fetch e-signature settings', error);
        } finally {
            setEsignLoading(false);
        }
    };

    const handleSaveGoogleConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!googleForm.clientId || !googleForm.clientSecret) {
            toast.error('Please fill in all fields');
            return;
        }
        setSavingGoogle(true);
        try {
            await calendarApi.saveGoogleConfig(googleForm);
            toast.success('Google Calendar credentials saved');
            fetchCalendarSettings();
        } catch (error) {
            toast.error('Failed to save Google credentials');
        } finally {
            setSavingGoogle(false);
        }
    };

    const handleSaveOutlookConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!outlookForm.clientId || !outlookForm.clientSecret) {
            toast.error('Please fill in all fields');
            return;
        }
        setSavingOutlook(true);
        try {
            await calendarApi.saveOutlookConfig(outlookForm);
            toast.success('Outlook Calendar credentials saved');
            fetchCalendarSettings();
        } catch (error) {
            toast.error('Failed to save Outlook credentials');
        } finally {
            setSavingOutlook(false);
        }
    };

    const handleConnectCalendar = async (provider: 'GOOGLE' | 'OUTLOOK') => {
        setConnectingCalendar(provider);
        try {
            const res = await calendarApi.getAuthUrl(provider);
            window.location.href = res.data.data.url;
        } catch (error: any) {
            console.error('Failed to get auth URL', error);
            toast.error(error?.response?.data?.message || 'Please configure credentials first');
            setConnectingCalendar(null);
        }
    };

    const handleOAuthCallback = async (code: string, state: string) => {
        try {
            const stateData = JSON.parse(atob(state));

            if (stateData.provider) {
                // Calendar OAuth
                const redirectUri = `${window.location.origin}${window.location.pathname}`;
                await calendarApi.connect({ provider: stateData.provider, code, redirectUri });
                toast.success('Calendar connected successfully!');
                fetchCalendarConnections();
            } else if (stateData.tenantId) {
                // E-Signature OAuth
                const redirectUri = `${window.location.origin}${window.location.pathname}`;
                await esignatureApi.connect({ code, redirectUri });
                toast.success('DocuSign connected successfully!');
                fetchEsignSettings();
            }

            // Clear URL params
            window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
            console.error('OAuth callback error', error);
            toast.error('Failed to complete connection');
        }
    };

    const handleDisconnectCalendar = async (connectionId: string) => {
        try {
            await calendarApi.disconnect(connectionId);
            toast.success('Calendar disconnected');
            setCalendarConnections(prev => prev.filter(c => c.id !== connectionId));
        } catch (error) {
            toast.error('Failed to disconnect calendar');
        }
    };

    const handleConfigureEsign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!esignForm.clientId || !esignForm.clientSecret) {
            toast.error('Please fill in all fields');
            return;
        }

        setConfiguringEsign(true);
        try {
            await esignatureApi.configure({
                provider: 'DOCUSIGN',
                clientId: esignForm.clientId,
                clientSecret: esignForm.clientSecret,
            });
            toast.success('DocuSign credentials saved');
            fetchEsignSettings();
        } catch (error) {
            toast.error('Failed to save credentials');
        } finally {
            setConfiguringEsign(false);
        }
    };

    const handleConnectEsign = async () => {
        try {
            const res = await esignatureApi.getAuthUrl();
            window.location.href = res.data.data.url;
        } catch (error) {
            toast.error('Failed to initiate DocuSign connection');
        }
    };

    const tabs = [
        { id: 'smtp' as TabType, label: 'Email Configuration', icon: Mail },
        { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
        { id: 'esignature' as TabType, label: 'E-Signature', icon: FileSignature },
        { id: 'jobBoards' as TabType, label: 'Job Boards', icon: Briefcase },
        { id: 'bgv' as TabType, label: 'Background Checks', icon: Shield },
        { id: 'messaging' as TabType, label: 'Slack/Teams', icon: MessageSquare },
    ];

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                            }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* SMTP Integration Tab */}
            {activeTab === 'smtp' && (
                <Card>
                    <CardHeader
                        title="SMTP Configuration"
                        icon={<Mail className="text-neutral-500" size={20} />}
                        align="left"
                    />
                    <div className="p-6 space-y-6">
                        {smtpLoading ? (
                            <div className="p-8 text-center text-neutral-500">
                                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                Loading settings...
                            </div>
                        ) : (
                            <>
                                {/* Show locked view when configured and not in edit mode */}
                                {smtpConfig.host && !editModes.smtp ? (
                                    <>
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />
                                                <div>
                                                    <p className="font-medium text-green-800 dark:text-green-200">SMTP Configured</p>
                                                    <p className="text-sm text-green-600 dark:text-green-400">
                                                        Host: {smtpConfig.host}:{smtpConfig.port} • From: {smtpConfig.fromEmail || 'Not set'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => requestEditAccess('smtp')}
                                                className="flex items-center gap-2"
                                            >
                                                <Edit size={16} />
                                                Edit Settings
                                            </Button>
                                        </div>

                                        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            <span>To modify these settings, click "Edit Settings" and verify your password.</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                    SMTP Host
                                                </label>
                                                <Input
                                                    value={smtpConfig.host}
                                                    onChange={(e) => handleSmtpChange('host', e.target.value)}
                                                    placeholder="smtp.example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                    SMTP Port
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={smtpConfig.port}
                                                    onChange={(e) => handleSmtpChange('port', parseInt(e.target.value) || 0)}
                                                    placeholder="587"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                    SMTP User
                                                </label>
                                                <Input
                                                    value={smtpConfig.user}
                                                    onChange={(e) => handleSmtpChange('user', e.target.value)}
                                                    placeholder="user@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                    SMTP Password
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={smtpConfig.pass}
                                                    onChange={(e) => handleSmtpChange('pass', e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                    From Email
                                                </label>
                                                <Input
                                                    value={smtpConfig.fromEmail}
                                                    onChange={(e) => handleSmtpChange('fromEmail', e.target.value)}
                                                    placeholder="noreply@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                    From Name
                                                </label>
                                                <Input
                                                    value={smtpConfig.fromName}
                                                    onChange={(e) => handleSmtpChange('fromName', e.target.value)}
                                                    placeholder="TalentX"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="secure"
                                                checked={smtpConfig.secure}
                                                onChange={(e) => handleSmtpChange('secure', e.target.checked)}
                                                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="secure" className="text-sm text-neutral-700 dark:text-neutral-300">
                                                Use Secure Connection (SSL/TLS)
                                            </label>
                                        </div>

                                        {/* Purpose-specific From Addresses */}
                                        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6">
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <Mail size={16} />
                                                    Purpose-Specific From Addresses
                                                </h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                    Override the default "From" address for specific email types. Leave blank to use the default from address above.
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                {[
                                                    { key: 'notifications', label: 'Notifications', description: 'System notifications, alerts', placeholder: 'notifications@' },
                                                    { key: 'interviews', label: 'Interview Invites', description: 'Interview scheduling emails', placeholder: 'interviews@' },
                                                    { key: 'offers', label: 'Offer Letters', description: 'Offer and contract emails', placeholder: 'offers@' },
                                                    { key: 'rejections', label: 'Rejection Emails', description: 'Candidate rejection notices', placeholder: 'no-reply@' },
                                                    { key: 'bulkEmails', label: 'Bulk/Campaign Emails', description: 'Mass email campaigns', placeholder: 'recruiting@' },
                                                ].map((alias) => (
                                                    <div key={alias.key} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">{alias.label}</span>
                                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">— {alias.description}</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <Input
                                                                value={smtpConfig.fromAliases?.[alias.key as keyof NonNullable<SmtpConfig['fromAliases']>]?.email || ''}
                                                                onChange={(e) => handleSmtpAliasChange(alias.key as keyof NonNullable<SmtpConfig['fromAliases']>, 'email', e.target.value)}
                                                                placeholder={`${alias.placeholder}yourdomain.com`}
                                                            />
                                                            <Input
                                                                value={smtpConfig.fromAliases?.[alias.key as keyof NonNullable<SmtpConfig['fromAliases']>]?.name || ''}
                                                                onChange={(e) => handleSmtpAliasChange(alias.key as keyof NonNullable<SmtpConfig['fromAliases']>, 'name', e.target.value)}
                                                                placeholder={`Display Name (e.g. ${alias.label})`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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

                                        <div className="flex justify-end gap-3 pt-4">
                                            {editModes.smtp && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => resetEditMode('smtp')}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                onClick={async () => {
                                                    await handleSaveSmtp();
                                                    resetEditMode('smtp');
                                                }}
                                                isLoading={smtpSaving}
                                                variant="primary"
                                                className="flex items-center gap-2"
                                            >
                                                <Save size={16} />
                                                Save Configuration
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            )}

            {/* Calendar Integration Tab */}
            {activeTab === 'calendar' && (
                <div className="space-y-6">
                    {/* Admin Configuration Section */}
                    <Card>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">OAuth Credentials Configuration</h3>
                                <p className="text-sm text-neutral-500">Configure OAuth credentials for calendar providers. Users will be able to connect their calendars once configured.</p>
                            </div>

                            {/* Google Calendar Config */}
                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">Google Calendar</h4>
                                    {calendarSettings?.google?.isConfigured && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Configured</span>
                                    )}
                                </div>

                                {/* Show locked view when configured and not in edit mode */}
                                {calendarSettings?.google?.isConfigured && !editModes.calendar_google ? (
                                    <div className="space-y-3">
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />
                                                <span className="text-sm text-green-700 dark:text-green-300">Google OAuth credentials are configured</span>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => requestEditAccess('calendar_google')}
                                                className="flex items-center gap-2"
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </Button>
                                        </div>
                                        <p className="text-xs text-neutral-500">Password verification required to edit credentials.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={async (e) => {
                                        await handleSaveGoogleConfig(e);
                                        resetEditMode('calendar_google');
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Client ID"
                                                value={googleForm.clientId}
                                                onChange={(e) => setGoogleForm(prev => ({ ...prev, clientId: e.target.value }))}
                                                placeholder="xxxxx.apps.googleusercontent.com"
                                            />
                                            <Input
                                                label="Client Secret"
                                                type="password"
                                                value={googleForm.clientSecret}
                                                onChange={(e) => setGoogleForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                                placeholder="Enter client secret"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {editModes.calendar_google && (
                                                <Button type="button" variant="secondary" size="sm" onClick={() => resetEditMode('calendar_google')}>
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button type="submit" size="sm" isLoading={savingGoogle}>Save Google Credentials</Button>
                                        </div>
                                    </form>
                                )}
                                <p className="text-xs text-neutral-500 mt-2">
                                    Get credentials at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>.
                                    Add redirect URI: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">{window.location.origin}/settings</code>
                                </p>
                            </div>

                            {/* Outlook Calendar Config */}
                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.159.152-.352.228-.578.228h-8.26v-6.182l1.458 1.042a.49.49 0 0 0 .588 0l6.453-4.629a.425.425 0 0 0 .107-.088.3.3 0 0 0 .067-.126.41.41 0 0 0 .02-.127.267.267 0 0 0-.02-.097.298.298 0 0 0-.067-.107.425.425 0 0 0-.107-.087L16.97 4.64v2.747H1.893l-.039-.069L0 7.387A.8.8 0 0 1 .238 6.8c.159-.156.351-.234.578-.234h8.892V2.234c0-.23.079-.424.238-.576.158-.152.35-.228.578-.228h4.62c.226 0 .419.076.577.228.159.152.238.346.238.576v4.332h7.225c.226 0 .419.078.578.234.158.156.238.35.238.576v.011Z" />
                                    </svg>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">Microsoft Outlook</h4>
                                    {calendarSettings?.outlook?.isConfigured && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Configured</span>
                                    )}
                                </div>

                                {/* Show locked view when configured and not in edit mode */}
                                {calendarSettings?.outlook?.isConfigured && !editModes.calendar_outlook ? (
                                    <div className="space-y-3">
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />
                                                <span className="text-sm text-green-700 dark:text-green-300">Outlook OAuth credentials are configured</span>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => requestEditAccess('calendar_outlook')}
                                                className="flex items-center gap-2"
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </Button>
                                        </div>
                                        <p className="text-xs text-neutral-500">Password verification required to edit credentials.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={async (e) => {
                                        await handleSaveOutlookConfig(e);
                                        resetEditMode('calendar_outlook');
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Client ID (Application ID)"
                                                value={outlookForm.clientId}
                                                onChange={(e) => setOutlookForm(prev => ({ ...prev, clientId: e.target.value }))}
                                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            />
                                            <Input
                                                label="Client Secret"
                                                type="password"
                                                value={outlookForm.clientSecret}
                                                onChange={(e) => setOutlookForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                                placeholder="Enter client secret"
                                            />
                                            <Input
                                                label="Tenant ID"
                                                value={outlookForm.tenantId}
                                                onChange={(e) => setOutlookForm(prev => ({ ...prev, tenantId: e.target.value }))}
                                                placeholder="common"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {editModes.calendar_outlook && (
                                                <Button type="button" variant="secondary" size="sm" onClick={() => resetEditMode('calendar_outlook')}>
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button type="submit" size="sm" isLoading={savingOutlook}>Save Outlook Credentials</Button>
                                        </div>
                                    </form>
                                )}
                                <p className="text-xs text-neutral-500 mt-2">
                                    Get credentials at <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Azure Portal</a>.
                                    Use "common" for multi-tenant apps.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* User Connections Section */}
                    <Card>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Your Calendar Connections</h3>
                                <p className="text-sm text-neutral-500">Connect your personal calendar to sync interviews.</p>
                            </div>

                            {calendarLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Google Connection */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Calendar className="w-6 h-6 text-neutral-500" />
                                            <div>
                                                <h4 className="font-medium text-neutral-900 dark:text-white">Google Calendar</h4>
                                                {!calendarSettings?.google?.isConfigured && (
                                                    <p className="text-xs text-amber-600">Admin needs to configure credentials first</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {calendarConnections.find(c => c.provider === 'GOOGLE') ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 size={16} />
                                                        {calendarConnections.find(c => c.provider === 'GOOGLE')?.email}
                                                    </div>
                                                    <Button variant="danger" size="sm" onClick={() => handleDisconnectCalendar(calendarConnections.find(c => c.provider === 'GOOGLE')!.id)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => handleConnectCalendar('GOOGLE')}
                                                    isLoading={connectingCalendar === 'GOOGLE'}
                                                    disabled={!calendarSettings?.google?.isConfigured}
                                                >
                                                    <ExternalLink size={16} className="mr-2" />
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Outlook Connection */}
                                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Calendar className="w-6 h-6 text-neutral-500" />
                                            <div>
                                                <h4 className="font-medium text-neutral-900 dark:text-white">Outlook Calendar</h4>
                                                {!calendarSettings?.outlook?.isConfigured && (
                                                    <p className="text-xs text-amber-600">Admin needs to configure credentials first</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {calendarConnections.find(c => c.provider === 'OUTLOOK') ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 size={16} />
                                                        {calendarConnections.find(c => c.provider === 'OUTLOOK')?.email}
                                                    </div>
                                                    <Button variant="danger" size="sm" onClick={() => handleDisconnectCalendar(calendarConnections.find(c => c.provider === 'OUTLOOK')!.id)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => handleConnectCalendar('OUTLOOK')}
                                                    isLoading={connectingCalendar === 'OUTLOOK'}
                                                    disabled={!calendarSettings?.outlook?.isConfigured}
                                                >
                                                    <ExternalLink size={16} className="mr-2" />
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">How it works</h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Interviews scheduled in TalentX will automatically appear in your calendar</li>
                                    <li>• Check interviewer availability in real-time when scheduling</li>
                                    <li>• Video meeting links (Google Meet / Teams) are created automatically</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* E-Signature Tab */}
            {activeTab === 'esignature' && (
                <Card>
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">E-Signature Integration</h3>
                            <p className="text-sm text-neutral-500">Connect DocuSign to send offer letters for electronic signature.</p>
                        </div>

                        {esignLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* DocuSign Configuration */}
                                <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                                            <FileSignature className="w-7 h-7 text-[#D12025]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-neutral-900 dark:text-white">DocuSign</h4>
                                            <p className="text-sm text-neutral-500">Industry-leading e-signature platform</p>
                                        </div>
                                        {esignSettings?.isConfigured && (
                                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                <CheckCircle2 size={16} />
                                                Connected
                                            </div>
                                        )}
                                    </div>

                                    {!esignSettings?.isConfigured ? (
                                        <form onSubmit={handleConfigureEsign} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Integration Key (Client ID)"
                                                    value={esignForm.clientId}
                                                    onChange={(e) => setEsignForm(prev => ({ ...prev, clientId: e.target.value }))}
                                                    placeholder="Enter your DocuSign Integration Key"
                                                    required
                                                />
                                                <Input
                                                    label="Secret Key"
                                                    type="password"
                                                    value={esignForm.clientSecret}
                                                    onChange={(e) => setEsignForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                                    placeholder="Enter your DocuSign Secret Key"
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <Button type="submit" isLoading={configuringEsign}>
                                                    Save Credentials
                                                </Button>
                                            </div>
                                        </form>
                                    ) : !esignSettings?.accountId ? (
                                        <div className="space-y-4">
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                Credentials saved. Click below to authorize TalentX with your DocuSign account.
                                            </p>
                                            <div className="flex gap-3">
                                                <Button onClick={handleConnectEsign}>
                                                    <ExternalLink size={16} className="mr-2" />
                                                    Authorize DocuSign
                                                </Button>
                                                {!editModes.esignature ? (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => requestEditAccess('esignature')}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Edit size={14} />
                                                        Edit Credentials
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => resetEditMode('esignature')}
                                                    >
                                                        Cancel Edit
                                                    </Button>
                                                )}
                                            </div>
                                            {editModes.esignature && (
                                                <form onSubmit={async (e) => {
                                                    await handleConfigureEsign(e);
                                                    resetEditMode('esignature');
                                                }} className="space-y-4 mt-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                                    <p className="text-sm text-amber-600">Editing credentials will require re-authorization.</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            label="Integration Key (Client ID)"
                                                            value={esignForm.clientId}
                                                            onChange={(e) => setEsignForm(prev => ({ ...prev, clientId: e.target.value }))}
                                                            placeholder="Enter your DocuSign Integration Key"
                                                            required
                                                        />
                                                        <Input
                                                            label="Secret Key"
                                                            type="password"
                                                            value={esignForm.clientSecret}
                                                            onChange={(e) => setEsignForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                                            placeholder="Enter your DocuSign Secret Key"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Button type="submit" isLoading={configuringEsign}>
                                                            Update Credentials
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-green-700 dark:text-green-300">
                                                        <strong>Account ID:</strong> {esignSettings.accountId}
                                                    </p>
                                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                        DocuSign is fully configured. You can now send offer letters for e-signature.
                                                    </p>
                                                </div>
                                                {!editModes.esignature && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => requestEditAccess('esignature')}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Edit size={14} />
                                                        Edit
                                                    </Button>
                                                )}
                                            </div>
                                            {editModes.esignature && (
                                                <form onSubmit={async (e) => {
                                                    await handleConfigureEsign(e);
                                                    resetEditMode('esignature');
                                                }} className="space-y-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                                    <p className="text-sm text-amber-600">Editing credentials will require re-authorization.</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            label="Integration Key (Client ID)"
                                                            value={esignForm.clientId}
                                                            onChange={(e) => setEsignForm(prev => ({ ...prev, clientId: e.target.value }))}
                                                            placeholder="Enter your DocuSign Integration Key"
                                                            required
                                                        />
                                                        <Input
                                                            label="Secret Key"
                                                            type="password"
                                                            value={esignForm.clientSecret}
                                                            onChange={(e) => setEsignForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                                            placeholder="Enter your DocuSign Secret Key"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Button type="button" variant="secondary" onClick={() => resetEditMode('esignature')}>
                                                            Cancel
                                                        </Button>
                                                        <Button type="submit" isLoading={configuringEsign}>
                                                            Update Credentials
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Setup Instructions</h4>
                                    <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                                        <li>Create a DocuSign developer account at <a href="https://developers.docusign.com" target="_blank" rel="noopener noreferrer" className="underline">developers.docusign.com</a></li>
                                        <li>Create an "Integration" and copy the Integration Key</li>
                                        <li>Generate a Secret Key and add it here</li>
                                        <li>Add this redirect URI: <code className="bg-amber-200/50 px-1 rounded">{window.location.origin}/settings</code></li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'jobBoards' && (
                <div className="space-y-6">
                    {/* Configuration Form */}
                    <Card>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Configure Job Board</h3>
                                <p className="text-sm text-neutral-500">Connect your job board accounts to automatically post jobs and receive applications.</p>
                            </div>

                            <form onSubmit={handleConfigureJobBoard} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Provider</label>
                                        <select
                                            value={jobBoardForm.provider}
                                            onChange={(e) => setJobBoardForm(prev => ({ ...prev, provider: e.target.value as JobBoardProvider }))}
                                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                        >
                                            <option value="LINKEDIN">LinkedIn</option>
                                            <option value="INDEED">Indeed</option>
                                            <option value="ZIPRECRUITER">ZipRecruiter</option>
                                            <option value="GLASSDOOR">Glassdoor</option>
                                            <option value="MONSTER">Monster</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="API Key"
                                        type="password"
                                        value={jobBoardForm.apiKey}
                                        onChange={(e) => setJobBoardForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                        placeholder="Enter API key"
                                        required
                                    />
                                    <Input
                                        label="API Secret (optional)"
                                        type="password"
                                        value={jobBoardForm.apiSecret}
                                        onChange={(e) => setJobBoardForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                                        placeholder="Enter API secret"
                                    />
                                    <Input
                                        label="Company ID (optional)"
                                        value={jobBoardForm.companyId}
                                        onChange={(e) => setJobBoardForm(prev => ({ ...prev, companyId: e.target.value }))}
                                        placeholder="Enter company ID"
                                    />
                                </div>
                                <Button type="submit" isLoading={configuringJobBoard === jobBoardForm.provider}>
                                    Connect {jobBoardForm.provider}
                                </Button>
                            </form>
                        </div>
                    </Card>

                    {/* Connected Job Boards */}
                    <Card>
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Connected Job Boards</h3>

                            {jobBoardsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {availableJobBoards.map((board) => (
                                        <div key={board.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white border border-neutral-200 rounded-lg flex items-center justify-center p-2">
                                                        {board.icon ? <img src={board.icon} alt={board.name} className="w-full h-full object-contain" /> : <Briefcase className="w-6 h-6 text-neutral-400" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-neutral-900 dark:text-white">{board.name}</h4>
                                                        <p className="text-sm text-neutral-500">{board.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {jobBoardSettings[board.id]?.isConfigured ? (
                                                        <>
                                                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                                <CheckCircle2 size={16} /> Connected
                                                            </div>
                                                            {!editModes.job_board[board.id] && (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => requestEditAccess('job_board', board.id)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Edit size={14} />
                                                                    Edit
                                                                </Button>
                                                            )}
                                                            <Button variant="danger" size="sm" onClick={() => handleDisconnectJobBoard(board.id)}>
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                                            <AlertCircle size={16} /> Not Connected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Edit form for this job board */}
                                            {editModes.job_board[board.id] && (
                                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
                                                    <form onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        setJobBoardForm(prev => ({ ...prev, provider: board.id as JobBoardProvider }));
                                                        await handleConfigureJobBoard(e);
                                                        resetEditMode('job_board', board.id);
                                                    }} className="space-y-4">
                                                        <p className="text-sm text-amber-600 mb-3">Update API credentials for {board.name}</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <Input
                                                                label="API Key"
                                                                type="password"
                                                                value={jobBoardForm.apiKey}
                                                                onChange={(e) => setJobBoardForm(prev => ({ ...prev, provider: board.id as JobBoardProvider, apiKey: e.target.value }))}
                                                                placeholder="Enter new API key"
                                                                required
                                                            />
                                                            <Input
                                                                label="API Secret (optional)"
                                                                type="password"
                                                                value={jobBoardForm.apiSecret}
                                                                onChange={(e) => setJobBoardForm(prev => ({ ...prev, provider: board.id as JobBoardProvider, apiSecret: e.target.value }))}
                                                                placeholder="Enter new API secret"
                                                            />
                                                            <Input
                                                                label="Company ID (optional)"
                                                                value={jobBoardForm.companyId}
                                                                onChange={(e) => setJobBoardForm(prev => ({ ...prev, provider: board.id as JobBoardProvider, companyId: e.target.value }))}
                                                                placeholder="Enter company ID"
                                                            />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button type="button" variant="secondary" onClick={() => resetEditMode('job_board', board.id)}>
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit" isLoading={configuringJobBoard === board.id}>
                                                                Update {board.name}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-6">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">How it works</h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Connect your job board accounts with API credentials</li>
                                    <li>• Post jobs to multiple boards with one click</li>
                                    <li>• Track applications from all sources in one place</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'bgv' && (
                <div className="space-y-6">
                    {/* Configuration Form */}
                    <Card>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Configure Background Check Provider</h3>
                                <p className="text-sm text-neutral-500">Connect a background verification provider to run automated checks on candidates.</p>
                            </div>

                            {bgvLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : bgvSettings?.isConfigured && !editModes.bgv ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-2">
                                                <CheckCircle2 size={18} />
                                                Provider Connected
                                            </div>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                <strong>Provider:</strong> {bgvSettings.provider}
                                                {bgvSettings.sandboxMode && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Sandbox Mode</span>}
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                Background checks can now be initiated from candidate profiles.
                                            </p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => requestEditAccess('bgv')}
                                            className="flex items-center gap-2"
                                        >
                                            <Edit size={14} />
                                            Edit
                                        </Button>
                                    </div>
                                    <p className="text-xs text-neutral-500">Password verification required to edit credentials.</p>
                                </div>
                            ) : (
                                <form onSubmit={async (e) => {
                                    await handleConfigureBgv(e);
                                    resetEditMode('bgv');
                                }} className="space-y-4">
                                    {editModes.bgv && (
                                        <p className="text-sm text-amber-600">Update BGV provider credentials</p>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Provider</label>
                                            <select
                                                value={bgvForm.provider}
                                                onChange={(e) => setBgvForm(prev => ({ ...prev, provider: e.target.value as BGVProvider }))}
                                                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                            >
                                                {bgvProviders.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {bgvForm.provider !== 'MANUAL' && (
                                            <Input
                                                label="API Key"
                                                type="password"
                                                value={bgvForm.apiKey}
                                                onChange={(e) => setBgvForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                                placeholder="Enter API key"
                                                required
                                            />
                                        )}
                                        {bgvForm.provider !== 'MANUAL' && (
                                            <Input
                                                label="API Secret (optional)"
                                                type="password"
                                                value={bgvForm.apiSecret}
                                                onChange={(e) => setBgvForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                                                placeholder="Enter API secret"
                                            />
                                        )}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="sandboxMode"
                                                checked={bgvForm.sandboxMode}
                                                onChange={(e) => setBgvForm(prev => ({ ...prev, sandboxMode: e.target.checked }))}
                                                className="rounded border-neutral-300"
                                            />
                                            <label htmlFor="sandboxMode" className="text-sm text-neutral-600 dark:text-neutral-400">
                                                Sandbox/Test Mode
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {editModes.bgv && (
                                            <Button type="button" variant="secondary" onClick={() => resetEditMode('bgv')}>
                                                Cancel
                                            </Button>
                                        )}
                                        <Button type="submit" isLoading={configuringBgv}>
                                            {editModes.bgv ? 'Update' : 'Configure'} {bgvForm.provider}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </Card>

                    {/* Available Providers */}
                    <Card>
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Available Providers</h3>

                            <div className="space-y-4">
                                {bgvProviders.map((provider) => (
                                    <div key={provider.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center p-2">
                                                {provider.icon ? <img src={provider.icon} alt={provider.name} className="w-full h-full object-contain" /> : <Shield className="w-6 h-6 text-neutral-400" />}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-neutral-900 dark:text-white">{provider.name}</h4>
                                                <p className="text-sm text-neutral-500">{provider.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {bgvSettings?.provider === provider.id && bgvSettings?.isConfigured ? (
                                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                    <CheckCircle2 size={16} /> Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                                    <AlertCircle size={16} /> Not Active
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-6">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">How it works</h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Configure your background check provider with API credentials</li>
                                    <li>• Initiate checks from candidate profiles or application workflows</li>
                                    <li>• Receive real-time status updates and results</li>
                                    <li>• View detailed reports directly in TalentX</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Messaging (Slack/Teams) Tab */}
            {activeTab === 'messaging' && (
                <div className="space-y-6">
                    <Card>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Slack & Microsoft Teams Integration</h3>
                                <p className="text-sm text-neutral-500">Connect Slack or Teams to receive notifications about new applications, interview updates, and more.</p>
                            </div>

                            {messagingLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Slack Configuration */}
                                    <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                                                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-900 dark:text-white">Slack</h4>
                                                    <p className="text-sm text-neutral-500">Send notifications to Slack channels</p>
                                                </div>
                                            </div>
                                            {slackConfig?.isConfigured ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 size={16} /> Connected
                                                    </span>
                                                    <Button variant="secondary" size="sm" onClick={handleTestSlack} isLoading={testingSlack}>
                                                        Test
                                                    </Button>
                                                    {!editModes.slack && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => requestEditAccess('slack')}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit size={14} />
                                                            Edit
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 text-sm">Not Connected</span>
                                            )}
                                        </div>

                                        {/* Show locked view when configured and not in edit mode */}
                                        {slackConfig?.isConfigured && !editModes.slack ? (
                                            <p className="text-xs text-neutral-500">Password verification required to edit credentials.</p>
                                        ) : (
                                            <form onSubmit={async (e) => {
                                                await handleConfigureSlack(e);
                                                resetEditMode('slack');
                                            }} className="space-y-4">
                                                {editModes.slack && (
                                                    <p className="text-sm text-amber-600">Update Slack credentials</p>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input
                                                        label="Bot Token"
                                                        type="password"
                                                        value={slackForm.botToken}
                                                        onChange={(e) => setSlackForm(prev => ({ ...prev, botToken: e.target.value }))}
                                                        placeholder="xoxb-..."
                                                    />
                                                    <Input
                                                        label="Signing Secret"
                                                        type="password"
                                                        value={slackForm.signingSecret}
                                                        onChange={(e) => setSlackForm(prev => ({ ...prev, signingSecret: e.target.value }))}
                                                        placeholder="Enter signing secret"
                                                    />
                                                </div>
                                                <Input
                                                    label="Default Channel ID (optional)"
                                                    value={slackForm.defaultChannelId}
                                                    onChange={(e) => setSlackForm(prev => ({ ...prev, defaultChannelId: e.target.value }))}
                                                    placeholder="C01234567"
                                                />
                                                <div className="flex gap-3">
                                                    {editModes.slack && (
                                                        <Button type="button" variant="secondary" size="sm" onClick={() => resetEditMode('slack')}>
                                                            Cancel
                                                        </Button>
                                                    )}
                                                    <Button type="submit" size="sm" isLoading={configuringSlack}>
                                                        {slackConfig?.isConfigured ? 'Update Slack' : 'Configure Slack'}
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>

                                    {/* Teams Configuration */}
                                    <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#6264A7] rounded-lg flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                                                        <path d="M20.625 8.089h-5.466c.235-.316.395-.688.468-1.09h4.998c.826 0 1.375.562 1.375 1.36v6.168c0 1.296-.78 2.25-1.942 2.434-.102.017-.208.025-.316.025h-1.875V11.52c0-1.905-1.483-3.43-3.333-3.43H8.333c-.213 0-.42.022-.625.056v-1.96c0-.798.549-1.36 1.375-1.36h4.998c.072.402.232.774.468 1.09H9.083c-.367 0-.625.267-.625.636v.088c.206-.033.416-.056.625-.056h6.201c.367 0 .625.267.625.635v.088c.206-.033.416-.056.625-.056h4.691c.826 0 1.375-.562 1.375-1.36 0-.798-.549-1.36-1.375-1.36h-1.875V2.867C19.375 1.285 18.118 0 16.562 0h-9.124C5.882 0 4.625 1.285 4.625 2.867V9.13c-.344.19-.625.477-.625.894v7.509c0 .693.537 1.253 1.2 1.297h.05c.033.687.566 1.236 1.225 1.236h.05c.033.654.537 1.182 1.158 1.23.033.687.566 1.236 1.225 1.236h.05c.066.654.566 1.182 1.192 1.23.033.654.537 1.182 1.158 1.23V24h8.192c1.556 0 2.813-1.285 2.813-2.867V9.449c0-.798-.549-1.36-1.375-1.36zm-9.375 1.36c0-.368.258-.635.625-.635h5.458c.367 0 .625.267.625.635v5.614c0 .368-.258.635-.625.635H11.875c-.367 0-.625-.267-.625-.635V9.449z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-900 dark:text-white">Microsoft Teams</h4>
                                                    <p className="text-sm text-neutral-500">Send notifications via webhook</p>
                                                </div>
                                            </div>
                                            {teamsConfig?.isConfigured ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 size={16} /> Connected
                                                    </span>
                                                    <Button variant="secondary" size="sm" onClick={handleTestTeams} isLoading={testingTeams}>
                                                        Test
                                                    </Button>
                                                    {!editModes.teams && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => requestEditAccess('teams')}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit size={14} />
                                                            Edit
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 text-sm">Not Connected</span>
                                            )}
                                        </div>

                                        {/* Show locked view when configured and not in edit mode */}
                                        {teamsConfig?.isConfigured && !editModes.teams ? (
                                            <p className="text-xs text-neutral-500">Password verification required to edit credentials.</p>
                                        ) : (
                                            <form onSubmit={async (e) => {
                                                await handleConfigureTeams(e);
                                                resetEditMode('teams');
                                            }} className="space-y-4">
                                                {editModes.teams && (
                                                    <p className="text-sm text-amber-600">Update Teams webhook</p>
                                                )}
                                                <Input
                                                    label="Incoming Webhook URL"
                                                    value={teamsForm.webhookUrl}
                                                    onChange={(e) => setTeamsForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                                    placeholder="https://outlook.office.com/webhook/..."
                                                />
                                                <div className="flex gap-3">
                                                    {editModes.teams && (
                                                        <Button type="button" variant="secondary" size="sm" onClick={() => resetEditMode('teams')}>
                                                            Cancel
                                                        </Button>
                                                    )}
                                                    <Button type="submit" size="sm" isLoading={configuringTeams}>
                                                        {teamsConfig?.isConfigured ? 'Update Teams' : 'Configure Teams'}
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>

                                    {/* Test Notification */}
                                    {(slackConfig?.isConfigured || teamsConfig?.isConfigured) && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Send Test Notification</h4>
                                                    <p className="text-sm text-blue-600 dark:text-blue-300">Send a test message to all configured channels</p>
                                                </div>
                                                <Button variant="secondary" size="sm" onClick={handleSendTestNotification} isLoading={sendingTestNotification}>
                                                    <Send size={16} className="mr-1" /> Send Test
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg mt-6">
                                <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">Notification Events</h4>
                                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                    <li>• New job applications received</li>
                                    <li>• Candidate stage changes</li>
                                    <li>• Interview scheduled/completed</li>
                                    <li>• Offers sent/accepted/declined</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Password Confirmation Modal */}
            <PasswordConfirmModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPendingEditAction(null);
                }}
                onConfirm={handlePasswordConfirmed}
                title="Confirm Your Identity"
                description="For security, please enter your password to edit these integration settings."
            />
        </div>
    );
}
