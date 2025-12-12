import { useState, useEffect } from 'react';
import { Card, Button, Input } from '../ui';
import { CheckCircle2, AlertCircle, Calendar, FileSignature, Loader2, ExternalLink, Trash2, Shield, Briefcase, Settings as SettingsIcon } from 'lucide-react';
import { calendarApi, esignatureApi, jobBoardsApi, bgvApi } from '../../lib/api';
import toast from 'react-hot-toast';

type TabType = 'calendar' | 'esignature' | 'jobBoards' | 'bgv';

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
    const [activeTab, setActiveTab] = useState<TabType>('calendar');

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

    // Fetch data when tabs change
    useEffect(() => {
        if (activeTab === 'calendar') {
            fetchCalendarSettings();
            fetchCalendarConnections();
        } else if (activeTab === 'esignature') {
            fetchEsignSettings();
        } else if (activeTab === 'jobBoards') {
            fetchJobBoardSettings();
            fetchAvailableJobBoards();
        } else if (activeTab === 'bgv') {
            fetchBgvSettings();
        }
    }, [activeTab]);

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
            const res = await jobBoardsApi.getAvailableBoards();
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
        { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
        { id: 'esignature' as TabType, label: 'E-Signature', icon: FileSignature },
        { id: 'jobBoards' as TabType, label: 'Job Boards', icon: Briefcase },
        { id: 'bgv' as TabType, label: 'Background Checks', icon: Shield },
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
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">Google Calendar</h4>
                                    {calendarSettings?.google?.isConfigured && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Configured</span>
                                    )}
                                </div>
                                <form onSubmit={handleSaveGoogleConfig} className="space-y-4">
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
                                    <Button type="submit" size="sm" isLoading={savingGoogle}>Save Google Credentials</Button>
                                </form>
                                <p className="text-xs text-neutral-500 mt-2">
                                    Get credentials at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>. 
                                    Add redirect URI: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">{window.location.origin}/settings</code>
                                </p>
                            </div>

                            {/* Outlook Calendar Config */}
                            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.159.152-.352.228-.578.228h-8.26v-6.182l1.458 1.042a.49.49 0 0 0 .588 0l6.453-4.629a.425.425 0 0 0 .107-.088.3.3 0 0 0 .067-.126.41.41 0 0 0 .02-.127.267.267 0 0 0-.02-.097.298.298 0 0 0-.067-.107.425.425 0 0 0-.107-.087L16.97 4.64v2.747H1.893l-.039-.069L0 7.387A.8.8 0 0 1 .238 6.8c.159-.156.351-.234.578-.234h8.892V2.234c0-.23.079-.424.238-.576.158-.152.35-.228.578-.228h4.62c.226 0 .419.076.577.228.159.152.238.346.238.576v4.332h7.225c.226 0 .419.078.578.234.158.156.238.35.238.576v.011Z"/>
                                    </svg>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">Microsoft Outlook</h4>
                                    {calendarSettings?.outlook?.isConfigured && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Configured</span>
                                    )}
                                </div>
                                <form onSubmit={handleSaveOutlookConfig} className="space-y-4">
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
                                    <Button type="submit" size="sm" isLoading={savingOutlook}>Save Outlook Credentials</Button>
                                </form>
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
                                            <Button onClick={handleConnectEsign}>
                                                <ExternalLink size={16} className="mr-2" />
                                                Authorize DocuSign
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                <strong>Account ID:</strong> {esignSettings.accountId}
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                DocuSign is fully configured. You can now send offer letters for e-signature.
                                            </p>
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
                                        <div key={board.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
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
                            ) : bgvSettings?.isConfigured ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
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
                                    <Button variant="secondary" onClick={() => setBgvSettings({ isConfigured: false })}>
                                        <SettingsIcon size={16} className="mr-2" />
                                        Reconfigure
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleConfigureBgv} className="space-y-4">
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
                                    <Button type="submit" isLoading={configuringBgv}>
                                        Configure {bgvForm.provider}
                                    </Button>
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

        </div>
    );
}
