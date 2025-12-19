import { useState, useEffect } from 'react';
import {
    Megaphone,
    Plus,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    Users,
    Send,
    RefreshCw,
    AlertTriangle,
    Info,
    CheckCircle,
    X,
} from 'lucide-react';
import { Button, Input, ConfirmationModal } from '../../components/ui';
import toast from 'react-hot-toast';
import { superAdminApi, extractData } from '../../lib/api';
import { cn } from '../../lib/utils';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'critical';
    priority: 'low' | 'medium' | 'high';
    audience: 'all' | 'admins' | 'specific_tenants';
    targetTenantIds?: string[];
    dismissible: boolean;
    showBanner: boolean;
    status: 'draft' | 'scheduled' | 'active' | 'expired';
    scheduledAt?: string;
    expiresAt?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    dismissCount: number;
    content?: string;
}

export function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Announcement | null>(null);

    // Form state
    const [formData, setFormData] = useState<{
        title: string;
        message: string;
        type: Announcement['type'];
        priority: Announcement['priority'];
        audience: Announcement['audience'];
        dismissible: boolean;
        showBanner: boolean;
        scheduledAt: string;
        expiresAt: string;
    }>({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        audience: 'all',
        dismissible: true,
        showBanner: false,
        scheduledAt: '',
        expiresAt: '',
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const data = await superAdminApi.getAnnouncements().then(extractData);
            const mappedData = (data as any[]).map(item => ({
                ...item,
                message: item.content || item.message
            }));
            setAnnouncements(mappedData);
        } catch (error) {
            toast.error('Failed to fetch announcements');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        try {
            const payload = {
                ...formData,
                scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
            };

            if (editingAnnouncement) {
                await superAdminApi.updateAnnouncement(editingAnnouncement.id, payload);
                toast.success('Announcement updated');
            } else {
                await superAdminApi.createAnnouncement(payload);
                toast.success('Announcement created');
            }
            handleCloseModal();
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to save announcement');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await superAdminApi.deleteAnnouncement(deleteConfirm.id);
            toast.success('Announcement deleted');
            setDeleteConfirm(null);
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to delete announcement');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await superAdminApi.publishAnnouncement(id);
            toast.success('Announcement published');
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to publish announcement');
        }
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            message: '',
            type: 'info',
            priority: 'medium',
            audience: 'all',
            dismissible: true,
            showBanner: false,
            scheduledAt: '',
            expiresAt: '',
        });
    };

    const openEditModal = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            message: announcement.message,
            type: announcement.type,
            priority: announcement.priority,
            audience: announcement.audience,
            dismissible: announcement.dismissible,
            showBanner: announcement.showBanner,
            scheduledAt: announcement.scheduledAt || '',
            expiresAt: announcement.expiresAt || '',
        });
        setShowCreateModal(true);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle size={18} className="text-amber-500" />;
            case 'success':
                return <CheckCircle size={18} className="text-emerald-500" />;
            case 'critical':
                return <AlertTriangle size={18} className="text-red-500" />;
            default:
                return <Info size={18} className="text-blue-500" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'warning':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
            case 'success':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
            case 'critical':
                return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
            default:
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 ring-1 ring-emerald-500/20';
            case 'scheduled':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20';
            case 'expired':
                return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-500/20';
            default:
                return 'bg-neutral-500/10 text-neutral-500 ring-1 ring-neutral-500/20';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Broadcasting Hub</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium transition-colors">
                        Communicate critical updates and announcements across the entire platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 h-11 px-4 rounded-xl"
                        onClick={fetchAnnouncements}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black h-11 px-6 rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-neutral-900/10 dark:shadow-none">
                        <Plus size={18} className="mr-2" />
                        New Announcement
                    </Button>
                </div>
            </div>

            {/* Stats Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Streams', count: announcements.filter((a) => a.status === 'active').length, color: 'emerald', icon: Megaphone },
                    { label: 'Queued', count: announcements.filter((a) => a.status === 'scheduled').length, color: 'purple', icon: Calendar },
                    { label: 'Drafts', count: announcements.filter((a) => a.status === 'draft').length, color: 'amber', icon: Edit3 },
                    { label: 'Global Reach', count: announcements.reduce((sum, a) => sum + a.viewCount, 0), color: 'blue', icon: Eye },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{stat.count.toLocaleString()}</p>
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-2">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Announcements Feed */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse">
                        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Hydrating broadcast directory...</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-20 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
                            <Megaphone size={40} className="text-neutral-300" />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Silent Waves</h3>
                        <p className="text-neutral-500 mt-2 font-medium max-w-xs mx-auto">No announcements found. Start a conversation with your users by creating a new broadcast.</p>
                        <Button className="mt-8 h-12 px-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black rounded-2xl" onClick={() => setShowCreateModal(true)}>
                            Initialize First Stream
                        </Button>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner", getTypeBadge(announcement.type))}>
                                        {getTypeIcon(announcement.type)}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-neutral-900 dark:text-white font-black text-lg group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors uppercase tracking-tight">
                                                {announcement.title}
                                            </h3>
                                            <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", getStatusBadge(announcement.status))}>
                                                {announcement.status}
                                            </span>
                                            {announcement.showBanner && (
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20">
                                                    BANNER VIEW
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-base font-medium leading-relaxed max-w-3xl">
                                            {announcement.message}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                                <Users size={14} className="text-neutral-400" />
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Target: {announcement.audience.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400">
                                                    <Eye size={14} />
                                                    {announcement.viewCount.toLocaleString()} IMPRESSIONS
                                                </span>
                                                {announcement.dismissible && (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400">
                                                        <EyeOff size={14} />
                                                        {announcement.dismissCount.toLocaleString()} DISMISSED
                                                    </span>
                                                )}
                                            </div>
                                            {announcement.scheduledAt && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                    <Calendar size={14} />
                                                    Active on: {new Date(announcement.scheduledAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-2xl lg:bg-transparent">
                                    {announcement.status === 'scheduled' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-4"
                                            onClick={() => handlePublish(announcement.id)}
                                        >
                                            <Send size={14} className="mr-2" />
                                            Force Deploy
                                        </Button>
                                    )}
                                    <button
                                        className="p-3 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-all shadow-sm border border-transparent hover:border-neutral-200"
                                        onClick={() => openEditModal(announcement)}
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        className="p-3 rounded-xl text-neutral-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm border border-transparent hover:border-red-200"
                                        onClick={() => setDeleteConfirm(announcement)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Editor Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                        <div className="px-10 py-8 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-transparent">
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                                    {editingAnnouncement ? 'Configure Broadcast' : 'Initialize Broadcast'}
                                </h3>
                                <p className="text-sm text-neutral-500 font-medium mt-1">Refine your message and distribution strategy</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-3 rounded-2xl hover:bg-white dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 shadow-sm transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-10 space-y-8 overflow-y-auto scrollbar-thin flex-1">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest px-1">Broadcast Title</label>
                                    <Input
                                        placeholder="e.g. System Infrastructure Upgrade"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-14 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-2xl font-bold px-6 shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest px-1">Announcement Message</label>
                                    <textarea
                                        placeholder="Type your message here..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full h-32 px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 resize-none focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all font-medium shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest px-1">Alert Category</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full h-14 px-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-red-500/5 outline-none shadow-sm"
                                    >
                                        <option value="info">Informational</option>
                                        <option value="success">Success / Resolved</option>
                                        <option value="warning">System Warning</option>
                                        <option value="critical">Critical Failure</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest px-1">Priority Weight</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full h-14 px-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-red-500/5 outline-none shadow-sm"
                                    >
                                        <option value="low">Standard</option>
                                        <option value="medium">Elevated</option>
                                        <option value="high">Urgent Response</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6 bg-neutral-50 dark:bg-neutral-800/50 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">Interactive Dismissal</p>
                                        <p className="text-xs text-neutral-500 font-medium">Allow participants to acknowledge and close the stream</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, dismissible: !formData.dismissible })}
                                        className={cn("w-14 h-8 rounded-full transition-all relative ring-4 ring-transparent", formData.dismissible ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700')}
                                    >
                                        <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all", formData.dismissible ? 'left-7' : 'left-1')} />
                                    </button>
                                </div>
                                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">Header Banner Escalation</p>
                                        <p className="text-xs text-neutral-500 font-medium">Pin this broadcast to the primary system navbar</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, showBanner: !formData.showBanner })}
                                        className={cn("w-14 h-8 rounded-full transition-all relative ring-4 ring-transparent", formData.showBanner ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700')}
                                    >
                                        <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all", formData.showBanner ? 'left-7' : 'left-1')} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-8 bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-4">
                            <Button variant="ghost" onClick={handleCloseModal} className="h-14 px-8 rounded-2xl font-black text-neutral-500 uppercase tracking-widest">
                                Discard Changes
                            </Button>
                            <Button onClick={handleCreateOrUpdate} className="h-14 px-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                                {editingAnnouncement ? 'Apply Updates' : formData.scheduledAt ? 'Queue Broadcast' : 'Initialize Stream'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Overlay */}
            <ConfirmationModal
                isOpen={!!deleteConfirm}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Terminate Broadcast"
                message={`Are you absolutely sure you want to permanently erase the broadcast "${deleteConfirm?.title}"? This will remove it from all user interfaces immediately.`}
                confirmLabel="Confirm Erasure"
                cancelLabel="Abort"
                variant="danger"
            />
        </div>
    );
}

// Global additions to index.css would be ideal for these animations
