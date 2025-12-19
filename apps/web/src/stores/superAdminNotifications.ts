import { create } from 'zustand';
import { superAdminNotificationsApi } from '../lib/superAdminApi';

export type NotificationType = 
  | 'SYSTEM' 
  | 'SECURITY' 
  | 'TENANT' 
  | 'SUBSCRIPTION' 
  | 'SUPPORT' 
  | 'ANNOUNCEMENT' 
  | 'USER';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SuperAdminNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: SuperAdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  page: number;
  totalPages: number;
  total: number;

  // Actions
  fetchNotifications: (params?: { page?: number; unreadOnly?: boolean; type?: NotificationType }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  addNotification: (notification: SuperAdminNotification) => void;
  reset: () => void;
}

export const useSuperAdminNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,
  total: 0,

  fetchNotifications: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await superAdminNotificationsApi.getAll({
        page: params?.page || 1,
        limit: 20,
        unreadOnly: params?.unreadOnly,
        type: params?.type,
      });
      
      const { data, meta } = response.data;
      set({
        notifications: data,
        unreadCount: meta.unreadCount,
        page: meta.page,
        totalPages: meta.totalPages,
        total: meta.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch notifications',
        isLoading: false 
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await superAdminNotificationsApi.getUnreadCount();
      set({ unreadCount: response.data.data.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationIds) => {
    try {
      const response = await superAdminNotificationsApi.markAsRead(notificationIds);
      const { unreadCount } = response.data.data;
      
      set((state) => ({
        notifications: state.notifications.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount,
      }));
    } catch (error: any) {
      console.error('Failed to mark notifications as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await superAdminNotificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await superAdminNotificationsApi.delete(id);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read ? state.unreadCount - 1 : state.unreadCount,
          total: state.total - 1,
        };
      });
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
    }
  },

  deleteAllRead: async () => {
    try {
      await superAdminNotificationsApi.deleteAll(true);
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.read),
        total: state.notifications.filter((n) => !n.read).length,
      }));
    } catch (error: any) {
      console.error('Failed to delete read notifications:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      total: state.total + 1,
    }));
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      page: 1,
      totalPages: 1,
      total: 0,
    });
  },
}));
