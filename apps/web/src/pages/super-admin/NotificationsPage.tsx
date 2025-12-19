import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  Shield,
  Building2,
  CreditCard,
  MessageSquare,
  Server,
  User,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSuperAdminNotificationStore, NotificationType, NotificationPriority } from '../../stores/superAdminNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

const typeLabels: Record<NotificationType, string> = {
  SYSTEM: 'System',
  SECURITY: 'Security',
  TENANT: 'Tenant',
  SUBSCRIPTION: 'Subscription',
  SUPPORT: 'Support',
  ANNOUNCEMENT: 'Announcement',
  USER: 'User',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<NotificationType | 'ALL'>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    notifications,
    unreadCount,
    isLoading,
    page,
    totalPages,
    total,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useSuperAdminNotificationStore();

  useEffect(() => {
    fetchNotifications({
      page: 1,
      type: selectedType === 'ALL' ? undefined : selectedType,
      unreadOnly: showUnreadOnly,
    });
  }, [selectedType, showUnreadOnly, fetchNotifications]);

  const handlePageChange = (newPage: number) => {
    fetchNotifications({
      page: newPage,
      type: selectedType === 'ALL' ? undefined : selectedType,
      unreadOnly: showUnreadOnly,
    });
  };

  const handleRefresh = () => {
    fetchNotifications({
      page,
      type: selectedType === 'ALL' ? undefined : selectedType,
      unreadOnly: showUnreadOnly,
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMarkSelectedRead = async () => {
    if (selectedIds.length > 0) {
      await markAsRead(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await deleteNotification(id);
    }
    setSelectedIds([]);
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-500" />
            </div>
            Notifications
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {total} total notifications, {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(isLoading && 'animate-spin')} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
          <button
            onClick={deleteAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Clear Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Filter size={16} />
          <span>Filter:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedType('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              selectedType === 'ALL'
                ? 'bg-red-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            All
          </button>
          {(Object.keys(typeLabels) as NotificationType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedType === type
                  ? 'bg-red-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-2" />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-red-500 focus:ring-red-500"
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Unread only</span>
        </label>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkSelectedRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm font-medium border border-neutral-200 dark:border-neutral-700"
            >
              <Check size={14} />
              Mark Read
            </button>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-neutral-200 dark:border-neutral-700 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-neutral-500 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Bell size={36} className="text-neutral-400" />
            </div>
            <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400">No notifications</p>
            <p className="text-sm text-neutral-500 mt-1">
              {showUnreadOnly ? 'No unread notifications' : 'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Select all</span>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group',
                      !notification.read && 'bg-red-50/30 dark:bg-red-500/5'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => handleSelect(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-red-500 focus:ring-red-500"
                      />
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border',
                          typeColors[notification.type]
                        )}
                      >
                        <Icon size={22} />
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={cn(
                                  'text-sm font-semibold',
                                  notification.read
                                    ? 'text-neutral-700 dark:text-neutral-300'
                                    : 'text-neutral-900 dark:text-white'
                                )}
                              >
                                {notification.title}
                              </p>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                                  priorityColors[notification.priority]
                                )}
                              >
                                {notification.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-medium">
                                {typeLabels[notification.type]}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                              <span>{format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead([notification.id]);
                                }}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-green-500 transition-colors"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
