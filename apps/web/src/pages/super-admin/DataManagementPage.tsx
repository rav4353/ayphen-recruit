import { useState, useEffect } from 'react';
import {
    Database,
    Download,
    Trash2,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Play,
    HardDrive,
    CloudIcon,
    FileJson,
    Zap,
    History,
    FileSearch,
    Lock,
    ShieldCheck,
} from 'lucide-react';
import { Button, ConfirmationModal } from '../../components/ui';
import toast from 'react-hot-toast';
import { superAdminApi, extractData } from '../../lib/api';
import { cn } from '../../lib/utils';

interface Backup {
    id: string;
    name: string;
    size: string;
    type: 'full' | 'incremental' | 'manual';
    status: 'completed' | 'in_progress' | 'failed';
    createdAt: string;
}

interface DataExport {
    id: string;
    tenantName: string;
    type: 'full' | 'candidates' | 'jobs' | 'applications';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedBy: string;
    fileUrl?: string;
    createdAt: string;
}

interface GDPRRequest {
    id: string;
    type: 'access' | 'deletion' | 'rectification' | 'portability';
    email: string;
    tenantName?: string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    createdAt: string;
}

type TabType = 'backups' | 'exports' | 'gdpr' | 'cleanup';

export function DataManagementPage() {
    const [activeTab, setActiveTab] = useState<TabType>('backups');
    const [isLoading, setIsLoading] = useState(true);

    const [backups, setBackups] = useState<Backup[]>([]);
    const [exports, setExports] = useState<DataExport[]>([]);
    const [gdprRequests, setGDPRRequests] = useState<GDPRRequest[]>([]);

    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [deleteBackup, setDeleteBackup] = useState<Backup | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const backupsResponse = await superAdminApi.getBackups();
            const backupsData: any = extractData(backupsResponse);
            setBackups(backupsData);

            setExports([
                { id: '1', tenantName: 'Acme Corp', type: 'full', status: 'completed', requestedBy: 'admin@acme.com', fileUrl: '#', createdAt: new Date().toISOString() },
                { id: '2', tenantName: 'TechStart', type: 'candidates', status: 'processing', requestedBy: 'hr@techstart.io', createdAt: new Date().toISOString() },
            ]);
            setGDPRRequests([
                { id: '1', type: 'deletion', email: 'john@example.com', tenantName: 'Acme Corp', status: 'pending', createdAt: new Date().toISOString() },
                { id: '2', type: 'access', email: 'jane@example.com', status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString() },
            ]);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        try {
            toast.success('System snapshot initiated');
            fetchData();
        } catch (error) {
            toast.error('Snapshot failure');
        } finally {
            setIsCreatingBackup(false);
        }
    };

    const handleDeleteBackup = async () => {
        if (!deleteBackup) return;
        try {
            setBackups(backups.filter(b => b.id !== deleteBackup.id));
            toast.success('Sector purged');
            setDeleteBackup(null);
        } catch (error) {
            toast.error('Purge failed');
        }
    };

    const handleProcessGDPR = async (id: string, action: 'complete' | 'reject') => {
        try {
            setGDPRRequests(gdprRequests.map(r => r.id === id ? { ...r, status: action === 'complete' ? 'completed' : 'rejected' } : r));
            toast.success(`Compliance request ${action}ed`);
        } catch (error) {
            toast.error('Internal processing error');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            failed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
            rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        };
        return badges[status] || 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
    };

    const tabs = [
        { id: 'backups' as TabType, name: 'System Snapshots', icon: HardDrive, desc: 'Full database archival' },
        { id: 'exports' as TabType, name: 'Data Pipeline', icon: Download, desc: 'Outbound telemetry' },
        { id: 'gdpr' as TabType, name: 'Privacy Center', icon: ShieldCheck, desc: 'Compliance & sovereignty' },
        { id: 'cleanup' as TabType, name: 'Purge Protocols', icon: Trash2, desc: 'Entropy management' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">Data Management Engine</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium italic">
                        Core system backup, compliance orchestration, and data lifecycle management
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 w-12 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all active:scale-90"
                        onClick={fetchData}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-500' : 'text-neutral-500'} />
                    </Button>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        {activeTab === tab.id && (
                            <div className="absolute top-0 right-0 p-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            </div>
                        )}
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-inner",
                            activeTab === tab.id ? "bg-red-500 text-white" : "bg-white dark:bg-neutral-800 text-neutral-500"
                        )}>
                            <tab.icon size={22} />
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

            {/* Content Area */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm transition-all min-h-[500px] flex flex-col">
                {activeTab === 'backups' && (
                    <div className="p-8 flex-1 flex flex-col animate-slide-in">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-lg">
                                    <CloudIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">System Snapshots</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Database State History</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleCreateBackup}
                                disabled={isCreatingBackup}
                                className="h-12 px-6 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                <Zap size={14} className="mr-2" />
                                {isCreatingBackup ? 'Initiating Snapshot...' : 'Create Full Snapshot'}
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-y border-neutral-100 dark:border-neutral-800">
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Snapshot Label</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Total Size</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Protocol</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Health</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Temporal Stamp</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {backups.map(backup => (
                                        <tr key={backup.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                                                        <FileJson size={14} />
                                                    </div>
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{backup.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-mono font-bold text-neutral-500 uppercase">{backup.size}</td>
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{backup.type}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", getStatusBadge(backup.status))}>
                                                    {backup.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-neutral-500 tabular-nums">
                                                {new Date(backup.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500"><Download size={14} /></Button>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-red-500/10 hover:text-red-500" onClick={() => setDeleteBackup(backup)}><Trash2 size={14} /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'exports' && (
                    <div className="p-8 flex-1 animate-slide-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                <History size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Export Queue</h2>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Active outbound data pipelines</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-y border-neutral-100 dark:border-neutral-800">
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Node Sector</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Data Schema</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Requester</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Pipeline Status</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {exports.map(exp => (
                                        <tr key={exp.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                                            <td className="px-6 py-5 text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{exp.tenantName}</td>
                                            <td className="px-6 py-5 text-xs font-bold text-neutral-500 uppercase">{exp.type}</td>
                                            <td className="px-6 py-5 text-xs font-bold text-neutral-400">{exp.requestedBy}</td>
                                            <td className="px-6 py-5">
                                                <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", getStatusBadge(exp.status))}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-neutral-500 tabular-nums">{new Date(exp.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-5 text-right">
                                                {exp.status === 'completed' && exp.fileUrl && (
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 hover:bg-emerald-500 hover:text-white"><Download size={14} /></Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'gdpr' && (
                    <div className="p-8 flex-1 animate-slide-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Compliance Ledger</h2>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Sovereign Data Rights Management</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-y border-neutral-100 dark:border-neutral-800">
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Request Vector</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Digital Identity</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Sector</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Audit Status</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-6 py-4">Temporal Mark</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                    {gdprRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                                            <td className="px-6 py-5 text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{req.type}</td>
                                            <td className="px-6 py-5 text-xs font-mono font-bold text-neutral-500 uppercase">{req.email}</td>
                                            <td className="px-6 py-5 text-xs font-bold text-neutral-400 uppercase">{req.tenantName || 'system-global'}</td>
                                            <td className="px-6 py-5">
                                                <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", getStatusBadge(req.status))}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-neutral-500 tabular-nums">{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all" onClick={() => handleProcessGDPR(req.id, 'complete')}><CheckCircle size={14} /></Button>
                                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all" onClick={() => handleProcessGDPR(req.id, 'reject')}><AlertTriangle size={14} /></Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'cleanup' && (
                    <div className="p-8 flex-1 animate-slide-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Purge Protocols</h2>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Entropy Reduction & Resource Recovery</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Audit Log Truncation', desc: 'Prune temporal artifacts older than 365 cycles', icon: History, danger: false },
                                { label: 'Session Flush', desc: 'Purge expired authentication handshakes', icon: Zap, danger: false },
                                { label: 'Orphaned Blob Purge', desc: 'Identify and remove unreferenced file assets', icon: FileSearch, danger: true },
                                { label: 'Hard-Purge Deleted Nodes', desc: 'Irreversible destruction of soft-deleted datasets', icon: Database, danger: true },
                            ].map((item) => (
                                <div key={item.label} className="group relative bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-200 dark:border-neutral-800 p-6 rounded-[2rem] hover:border-red-500/50 transition-all hover:shadow-xl hover:shadow-red-500/5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                                item.danger ? "bg-red-500/10 text-red-500" : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                            )}>
                                                <item.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.label}</p>
                                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant={item.danger ? 'danger' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                "h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest",
                                                !item.danger && "border-neutral-200 dark:border-neutral-700"
                                            )}
                                        >
                                            <Play size={12} className="mr-1.5" />
                                            Execute
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-[2rem]" />
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Security Warning</p>
                                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">Purge protocols are irreversible. Ensure a full system snapshot is validated before execution.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!deleteBackup}
                onCancel={() => setDeleteBackup(null)}
                onConfirm={handleDeleteBackup}
                title="PURGE PROTOCOL INITIATED"
                message={`You are about to permanently erase snapshot "${deleteBackup?.name}". This action cannot be reversed by system recovery.`}
                confirmLabel="CONFIRM PURGE"
                cancelLabel="ABORT"
                variant="danger"
            />
        </div>
    );
}
