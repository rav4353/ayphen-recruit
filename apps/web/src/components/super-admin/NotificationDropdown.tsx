import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Shield,
  Building2,
  CreditCard,
  MessageSquare,
  Server,
  User,
  Megaphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSuperAdminNotificationStore, NotificationType, NotificationPriority } from '../../stores/superAdminNotifications';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<NotificationType, React.ElementType> = {
  SYSTEM: Server,
  SECURITY: Shield,
  TENANT: Building2,
  SUBSCRIPTION: CreditCard,
  SUPPORT: MessageSquare,
  ANNOUNCEMENT: Megaphone,
  USER: User,
};

const typeColors: Record<NotificationType, string> = {
  SYSTEM: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SECURITY: 'bg-red-500/10 text-red-500 border-red-500/20',
  TENANT: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  SUBSCRIPTION: 'bg-green-500/10 text-green-500 border-green-500/20',
  SUPPORT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ANNOUNCEMENT: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  USER: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

const priorityColors: Record<NotificationPriority, string> = {
  LOW: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSuperAdminNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ page: 1 });
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[70vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-neutral-600 dark:text-neutral-400" />
              <h3 className="font-bold text-neutral-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-700 border-t-red-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-neutral-500 mt-3">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Bell size={28} className="text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No notifications</p>
                <p className="text-xs text-neutral-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors group',
                      !notification.read && 'bg-red-50/50 dark:bg-red-500/5'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border',
                          typeColors[notification.type]
                        )}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  'text-sm font-semibold truncate',
                                  notification.read
                                    ? 'text-neutral-700 dark:text-neutral-300'
                                    : 'text-neutral-900 dark:text-white'
                                )}
                              >
                                {notification.title}
                              </p>
                              {notification.priority !== 'MEDIUM' && (
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                                    priorityColors[notification.priority]
                                  )}
                                >
                                  {notification.priority}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead([notification.id]);
                                }}
                                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-green-500 transition-colors"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <button
                onClick={() => {
                  navigate('/super-admin/notifications');
                  setIsOpen(false);
                }}
                className="w-full py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
