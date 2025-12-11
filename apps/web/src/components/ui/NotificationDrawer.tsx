import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Mail, Calendar, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'application' | 'interview' | 'message';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

interface NotificationDrawerProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'application',
    title: 'New Application',
    message: 'John Doe applied for Senior Developer position',
    time: '5 min ago',
    read: false,
    link: '/applications/1',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview Scheduled',
    message: 'Interview with Jane Smith tomorrow at 2:00 PM',
    time: '1 hour ago',
    read: false,
    link: '/interviews/2',
  },
  {
    id: '3',
    type: 'message',
    title: 'New Message',
    message: 'HR Manager sent you a message about the hiring process',
    time: '2 hours ago',
    read: true,
    link: '/messages/3',
  },
  {
    id: '4',
    type: 'success',
    title: 'Offer Accepted',
    message: 'Michael Brown accepted the job offer',
    time: '1 day ago',
    read: true,
  },
];

const typeIcons = {
  info: Bell,
  success: Check,
  warning: Bell,
  application: Briefcase,
  interview: Calendar,
  message: Mail,
};

const typeColors = {
  info: 'bg-blue-500/10 text-blue-500',
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-amber-500/10 text-amber-500',
  application: 'bg-purple-500/10 text-purple-500',
  interview: 'bg-cyan-500/10 text-cyan-500',
  message: 'bg-pink-500/10 text-pink-500',
};

export function NotificationDrawer({
  notifications = mockNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  className,
}: NotificationDrawerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-neutral-900 shadow-2xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
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

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              {t('notifications.markAllRead')}
            </button>
            <button
              onClick={onClearAll}
              className="text-sm text-red-500 hover:text-red-600"
            >
              {t('notifications.clearAll')}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
              <Bell size={48} className="mb-4 opacity-50" />
              <p>{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer',
                      !notification.read && 'bg-blue-50/50 dark:bg-blue-500/5'
                    )}
                    onClick={() => onMarkAsRead?.(notification.id)}
                  >
                    <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', typeColors[notification.type])}>
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
                            onDelete?.(notification.id);
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
                        {notification.time}
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
    </div>
  );
}
