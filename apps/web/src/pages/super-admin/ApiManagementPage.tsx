import { useState, useEffect } from 'react';
import {
    Key,
    Lock,
    Webhook,
    Activity,
    Copy,
    AlertTriangle,
    Clock,
    Plus,
    Trash2,
    RefreshCw,
    Settings,
    Eye,
    EyeOff,
    ShieldCheck,
    Terminal,
    Network
} from 'lucide-react';
import { Button, Input, ConfirmationModal } from '../../components/ui';
import toast from 'react-hot-toast';
import { superAdminApiManagementApi } from '../../lib/superAdminApi';
import { cn } from '../../lib/utils';

interface ApiKey {
    id: string;
    name: string;
    key: string;
    tenantId?: string;
    tenantName?: string;
    permissions: string[];
    lastUsed?: string;
    expiresAt?: string;
    createdAt: string;
    isActive: boolean;
}

interface WebhookEndpoint {
    id: string;
    url: string;
    events: string[];
    tenantName?: string;
    status: 'active' | 'inactive' | 'failed';
    lastTriggered?: string;
    failureCount: number;
    createdAt: string;
}

interface RateLimitRule {
    id: string;
    name: string;
    endpoint: string;
    limit: number;
    window: string;
    isActive: boolean;
}

type TabType = 'keys' | 'webhooks' | 'rate-limits' | 'logs';

export function ApiManagementPage() {
    const [activeTab, setActiveTab] = useState<TabType>('keys');
    const [isLoading, setIsLoading] = useState(true);

    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
    const [apiUsage, setApiUsage] = useState<any[]>([]);
    const [rateLimits, setRateLimits] = useState<RateLimitRule[]>([]);

    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null);
    const [deleteWebhook, setDeleteWebhook] = useState<WebhookEndpoint | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'keys') {
                const response = await superAdminApiManagementApi.getKeys();
                const data = response.data.data || [];
                const mappedKeys = data.map((k: any) => ({
                    id: k.id,
                    name: k.name,
                    key: k.key,
                    tenantName: k.tenant?.name,
                    permissions: k.scopes || [],
                    lastUsed: k.lastUsedAt,
                    createdAt: k.createdAt,
                    isActive: k.isActive,
                }));
                setApiKeys(mappedKeys);
            }

            if (activeTab === 'webhooks') {
                const response = await superAdminApiManagementApi.getWebhooks();
                const data = response.data.data || [];
                const mappedWebhooks = data.map((w: any) => ({
                    id: w.id,
                    url: w.url,
                    events: w.events || [],
                    tenantName: w.tenant?.name,
                    status: w.isActive ? 'active' : 'inactive',
                    createdAt: w.createdAt,
                    failureCount: 0,
                }));
                setWebhooks(mappedWebhooks);
            }

            if (activeTab === 'logs') {
                const response = await superAdminApiManagementApi.getUsage();
                setApiUsage(response.data.data.usage || []);
            }

            if (activeTab === 'rate-limits') {
                setRateLimits([
                    { id: '1', name: 'Default API Limit', endpoint: '/api/v1/*', limit: 1000, window: '1 minute', isActive: true },
                    { id: '2', name: 'Auth Endpoints', endpoint: '/api/v1/auth/*', limit: 10, window: '1 minute', isActive: true },
                    { id: '3', name: 'Bulk Operations', endpoint: '/api/v1/*/bulk', limit: 10, window: '1 hour', isActive: true },
                ]);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName) {
            toast.error('Please enter a name');
            return;
        }
        try {
            await superAdminApiManagementApi.createKey({
                name: newKeyName,
                scopes: ['all'],
            });
            toast.success('API key created');
            setShowNewKeyModal(false);
            setNewKeyName('');
            fetchData();
        } catch (error) {
            toast.error('Failed to create key');
        }
    };

    const handleDeleteKey = async () => {
        if (!deleteKey) return;
        try {
            await superAdminApiManagementApi.revokeKey(deleteKey.id);
            toast.success('API key revoked');
            setDeleteKey(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to revoke key');
        }
    };

    const handleDeleteWebhook = async () => {
        if (!deleteWebhook) return;
        try {
            await superAdminApiManagementApi.deleteWebhook(deleteWebhook.id);
            toast.success('Webhook deleted');
            setDeleteWebhook(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete webhook');
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast.success('Copied to clipboard');
    };

    const toggleKeyVisibility = (id: string) => {
        const newVisible = new Set(visibleKeys);
        if (newVisible.has(id)) {
            newVisible.delete(id);
        } else {
            newVisible.add(id);
        }
        setVisibleKeys(newVisible);
    };

    const tabs = [
        { id: 'keys' as TabType, name: 'Root Keys', icon: Key, desc: 'Authentication access' },
        { id: 'webhooks' as TabType, name: 'Webhooks', icon: Webhook, desc: 'Event propagation' },
        { id: 'rate-limits' as TabType, name: 'Throttling', icon: Activity, desc: 'Traffic flow control' },
        { id: 'logs' as TabType, name: 'Telemetry', icon: Clock, desc: 'API execution history' },
    ];

    return (
        <div className="space-y-8 animate-fade-in group/api">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
                        <Terminal className="text-red-500" size={32} />
                        Unified API Console
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium italic">
                        Gateway configuration, security handshakes, and event orchestration
                    </p>
                </div>
                <Button variant="outline" className="h-12 w-12 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all active:scale-90" onClick={fetchData}>
                    <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-500' : 'text-neutral-500'} />
                </Button>
            </div>

            {/* Tactical Switcher */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "group p-5 rounded-[2rem] border transition-all text-left relative overflow-hidden",
                            activeTab === tab.id
                                ? "bg-white dark:bg-neutral-900 border-red-500 shadow-xl shadow-red-500/5 ring-4 ring-red-500/5"
                                : "bg-neutral-50/50 dark:bg-neutral-800/10 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-inner",
                            activeTab === tab.id ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white dark:bg-neutral-800 text-neutral-500"
                        )}>
                            <tab.icon size={18} />
                        </div>
                        <h3 className={cn("text-xs font-black uppercase tracking-widest", activeTab === tab.id ? "text-neutral-900 dark:text-white" : "text-neutral-500")}>
                            {tab.name}
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-tight truncate">
                            {tab.desc}
                        </p>
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm transition-all min-h-[500px]">
                {activeTab === 'keys' && (
                    <div className="p-8 animate-slide-in">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-lg">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Root Identities</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Global Secret Management</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowNewKeyModal(true)} className="h-12 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95">
                                <Plus size={16} className="mr-2" />Issue New Key
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {apiKeys.map(key => (
                                <div key={key.id} className="bg-neutral-50/50 dark:bg-neutral-800/20 border border-neutral-100 dark:border-neutral-800/50 p-6 rounded-[2rem] hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{key.name}</h3>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                    key.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                                                )}>
                                                    {key.isActive ? 'OPERATIONAL' : 'REVOKED'}
                                                </span>
                                            </div>
                                            {key.tenantName && (
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                                                    <Network size={10} />
                                                    Scope: {key.tenantName}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-4">
                                                <div className="flex-1 h-12 flex items-center px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-inner font-mono text-xs overflow-hidden">
                                                    <span className="text-neutral-500 select-all truncate">
                                                        {visibleKeys.has(key.id) ? key.key : key.key.substring(0, 16) + '••••••••••••••••'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => toggleKeyVisibility(key.id)}
                                                    className="w-12 h-12 flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
                                                >
                                                    {visibleKeys.has(key.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleCopyKey(key.key)}
                                                    className="w-12 h-12 flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 mt-6">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700">
                                                    <ShieldCheck size={12} className="text-blue-500" />
                                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{key.permissions.join(' • ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-neutral-400" />
                                                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tight">ISSUED: {new Date(key.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setDeleteKey(key)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-300 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'webhooks' && (
                    <div className="p-8 animate-slide-in">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                                    <Webhook size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Event Propagation</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Active System Callbacks</p>
                                </div>
                            </div>
                            <Button className="h-12 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95">
                                <Plus size={16} className="mr-2" />Register Endpoint
                            </Button>
                        </div>

                        {webhooks.length === 0 ? (
                            <div className="bg-neutral-50/50 dark:bg-neutral-800/10 border border-neutral-100 dark:border-neutral-800/50 rounded-[2.5rem] p-20 text-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none flex flex-wrap gap-8 p-8 justify-center">
                                    {[...Array(12)].map((_, i) => <Webhook key={i} size={80} />)}
                                </div>
                                <div className="relative z-10 max-w-sm mx-auto">
                                    <div className="w-20 h-20 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-inner flex items-center justify-center mx-auto mb-8">
                                        <Webhook size={40} className="text-neutral-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Zero Connection Flow</h3>
                                    <p className="text-sm font-medium text-neutral-500 mt-2 leading-relaxed italic">No external endpoints registered for system event synchronization.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {webhooks.map(webhook => (
                                    <div key={webhook.id} className="bg-neutral-50/50 dark:bg-neutral-800/20 border border-neutral-100 dark:border-neutral-800/50 p-6 rounded-[2rem] hover:shadow-xl transition-all group overflow-hidden relative">
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <code className="text-xs font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 px-3 py-1.5 rounded-xl border border-cyan-500/10">
                                                        {webhook.url}
                                                    </code>
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                        webhook.status === 'active' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                                                    )}>
                                                        {webhook.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {webhook.events.map(event => (
                                                        <span key={event} className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-100 dark:border-neutral-800">
                                                            {event}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4 mt-6 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                                    <span className="flex items-center gap-2"><Activity size={12} className="text-blue-500" /> Latency Trace: Nominal</span>
                                                    {webhook.lastTriggered && <span className="flex items-center gap-2"><Clock size={12} /> Last Transmission: {new Date(webhook.lastTriggered).toLocaleTimeString()}</span>}
                                                    {webhook.failureCount > 0 && <span className="flex items-center gap-2 text-red-500"><AlertTriangle size={12} /> Dropout: {webhook.failureCount} Cycles</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setDeleteWebhook(webhook)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-300 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rate-limits' && (
                    <div className="animate-slide-in">
                        <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/30 dark:bg-neutral-800/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Throttling Protocols</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Traffic Flow Policies</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-b border-neutral-100 dark:border-neutral-800">
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Policy Node</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Checkpoint (Endpoint)</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Capacity (Limit)</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Temporal Window</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">State</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {rateLimits.map(rule => (
                                        <tr key={rule.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                                            <td className="px-8 py-6 text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{rule.name}</td>
                                            <td className="px-8 py-6">
                                                <code className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                                                    {rule.endpoint}
                                                </code>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{rule.limit.toLocaleString()} OPS</span>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-neutral-500 uppercase tracking-widest">{rule.window}</td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                    rule.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                                                )}>
                                                    {rule.isActive ? 'OPERATIONAL' : 'BYPASSED'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-all">
                                                    <Settings size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="animate-slide-in">
                        <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/30 dark:bg-neutral-800/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Telemetry Pulse</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Real-time Execution Stream</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Live Traffic</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-b border-neutral-100 dark:border-neutral-800">
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Protocol (Method)</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Subspace (Path)</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Response Code</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Origin Node</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Exec Time</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Temporal Mark</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {apiUsage.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 group/empty">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-300">
                                                        <Activity size={40} />
                                                    </div>
                                                    <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Negative Signal Trace</h3>
                                                    <p className="text-xs text-neutral-500 font-medium italic">No execution telemetry recorded in the current buffer cycle.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        apiUsage.map(log => (
                                            <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                        log.method === 'GET' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                            log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                                'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                    )}>
                                                        {log.method}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{log.endpoint}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "text-sm font-black tabular-nums",
                                                        log.status >= 400 ? 'text-red-500' : 'text-emerald-500'
                                                    )}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">{log.tenant?.name || 'ROOT PLATFORM'}</td>
                                                <td className="px-8 py-6 text-xs font-bold text-neutral-400 tabular-nums">{log.duration}ms</td>
                                                <td className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Key Modal */}
            {showNewKeyModal && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-in">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white">
                                <Plus size={24} />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Issue Root Key</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Key Identity (Label)</label>
                                <Input
                                    placeholder="Production Server Node..."
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    className="h-14 bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl text-base font-bold placeholder-neutral-400 focus:ring-4 focus:ring-red-500/5 transition-all outline-none px-6"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="outline" onClick={() => setShowNewKeyModal(false)} className="h-12 border-neutral-200 dark:border-neutral-800 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-neutral-500">Cancel</Button>
                            <Button onClick={handleCreateKey} className="h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/10">Authorize Release</Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteKey}
                onCancel={() => setDeleteKey(null)}
                onConfirm={handleDeleteKey}
                title="REVOKE ACCESS PROTOCOL"
                message={`You are about to terminate connection node "${deleteKey?.name}". This will instantaneously invalidate all traffic authenticated via this hash. Proceed with revocation?`}
                confirmLabel="CONFIRM REVOCATION"
                cancelLabel="ABORT"
                variant="danger"
            />
            <ConfirmationModal
                isOpen={!!deleteWebhook}
                onCancel={() => setDeleteWebhook(null)}
                onConfirm={handleDeleteWebhook}
                title="TERMINATE PROPAGATION"
                message={`Terminate event stream to endpoint "${deleteWebhook?.url}"? Communication sync will be severed.`}
                confirmLabel="CONFIRM TERMINAL"
                cancelLabel="ABORT"
                variant="danger"
            />
        </div>
    );
}
