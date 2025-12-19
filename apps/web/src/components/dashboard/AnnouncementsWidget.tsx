import { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { announcementsApi, extractData } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'critical';
    priority: 'low' | 'medium' | 'high';
    dismissible: boolean;
    showBanner: boolean;
}

export function AnnouncementsWidget() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementsApi.getActive().then(extractData);
            setAnnouncements(data as Announcement[]);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            // Optimistic update
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            await announcementsApi.markAsRead(id);
        } catch (error) {
            toast.error('Failed to dismiss announcement');
            fetchAnnouncements(); // Revert on failure
        }
    };

    if (isLoading || announcements.length === 0) return null;

    // Filter banners to show first or separately?
    // For now, let's just show them in a stack or list.
    // Maybe show high priority/banners prominently.

    return (
        <div className="space-y-4 mb-6">
            {announcements.map((announcement) => (
                <div
                    key={announcement.id}
                    className={cn(
                        "relative flex items-start gap-4 p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-2",
                        announcement.type === 'critical' ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                            announcement.type === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
                                announcement.type === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" :
                                    "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        announcement.type === 'critical' ? "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200" :
                            announcement.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-200" :
                                announcement.type === 'success' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200" :
                                    "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200"
                    )}>
                        {announcement.type === 'critical' || announcement.type === 'warning' ? <AlertTriangle size={20} /> :
                            announcement.type === 'success' ? <CheckCircle size={20} /> :
                                <Bell size={20} />}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-neutral-900 dark:text-white">
                                {announcement.title}
                            </h3>
                            {announcement.priority === 'high' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
                                    Urgent
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {announcement.content}
                        </p>
                    </div>

                    {announcement.dismissible && (
                        <button
                            onClick={() => handleDismiss(announcement.id)}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            title="Dismiss"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
