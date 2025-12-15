import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Trash2, Mail, Calendar, Briefcase, AlertTriangle, FileText, Shield, Users, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { notificationsApi } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  type: 'APPLICATION' | 'INTERVIEW' | 'OFFER' | 'JOB' | 'SLA' | 'APPROVAL' | 'ONBOARDING' | 'BGV' | 'SYSTEM' | 'MESSAGE' | 'info' | 'success' | 'warning' | 'application' | 'interview' | 'message';
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  read: boolean;
  link?: string;
}

interface NotificationDrawerProps {
  className?: string;
}


const typeIcons: Record<string, any> = {
  APPLICATION: Briefcase,
  INTERVIEW: Calendar,
  OFFER: FileText,
  JOB: Briefcase,
  SLA: AlertTriangle,
  APPROVAL: Check,
  ONBOARDING: Users,
  BGV: Shield,
  SYSTEM: Settings,
  MESSAGE: Mail,
  // Legacy types
  info: Bell,
  success: Check,
  warning: AlertTriangle,
  application: Briefcase,
  interview: Calendar,
  message: Mail,
};

const typeColors: Record<string, string> = {
  APPLICATION: 'bg-purple-500/10 text-purple-500',
  INTERVIEW: 'bg-cyan-500/10 text-cyan-500',
  OFFER: 'bg-green-500/10 text-green-500',
  JOB: 'bg-blue-500/10 text-blue-500',
  SLA: 'bg-amber-500/10 text-amber-500',
  APPROVAL: 'bg-orange-500/10 text-orange-500',
  ONBOARDING: 'bg-indigo-500/10 text-indigo-500',
  BGV: 'bg-teal-500/10 text-teal-500',
  SYSTEM: 'bg-neutral-500/10 text-neutral-500',
  MESSAGE: 'bg-pink-500/10 text-pink-500',
  // Legacy types
  info: 'bg-blue-500/10 text-blue-500',
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-amber-500/10 text-amber-500',
  application: 'bg-purple-500/10 text-purple-500',
  interview: 'bg-cyan-500/10 text-cyan-500',
  message: 'bg-pink-500/10 text-pink-500',
};

export function NotificationDrawer({ className }: NotificationDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const drawerRef = useRef<HTMLDivElement>(null);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'APPLICATION', label: 'Applications' },
    { value: 'INTERVIEW', label: 'Interviews' },
    { value: 'OFFER', label: 'Offers' },
    { value: 'JOB', label: 'Jobs' },
    { value: 'SLA', label: 'SLA Alerts' },
    { value: 'APPROVAL', label: 'Approvals' },
    { value: 'ONBOARDING', label: 'Onboarding' },
    { value: 'SYSTEM', label: 'System' },
  ];

  // Filter notifications based on selected type
  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll();
      setNotifications(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when drawer opens
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.link) {
      const link = notification.link.startsWith('/') ? `/${tenantId}${notification.link}` : notification.link;
      navigate(link);
      setIsOpen(false);
    }
  };

  // Format time
  const formatTime = (notification: Notification) => {
    if (notification.time) return notification.time;
    if (notification.createdAt) {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    }
    return '';
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <div ref={drawerRef} className={cn('relative', className)}>
        {/* Notification Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative p-2 rounded-lg transition-colors',
            'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
            'dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
          )}
          title={t('notifications.title')}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100]">
          {/* Drawer Overlay */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-neutral-900 shadow-2xl',
              'transform transition-transform duration-300 ease-in-out',
              'animate-in slide-in-from-right duration-300'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('notifications.title')}
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full">
                    {unreadCount} {t('notifications.new')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter and Actions */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      {t('notifications.markAllRead')}
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      {t('notifications.clearAll')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                  <p>Loading...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                  <Bell size={48} className="mb-4 opacity-50" />
                  <p>{filterType === 'all' ? t('notifications.empty') : 'No notifications of this type'}</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Bell;
                    const colorClass = typeColors[notification.type] || 'bg-blue-500/10 text-blue-500';
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer',
                          !notification.read && 'bg-blue-50/50 dark:bg-blue-500/5'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', colorClass)}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              notification.read ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-900 dark:text-white'
                            )}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="flex-shrink-0 p-1 text-neutral-400 hover:text-red-500 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                            {formatTime(notification)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
