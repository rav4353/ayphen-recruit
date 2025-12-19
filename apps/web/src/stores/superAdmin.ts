import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  lastLogin?: string;
  createdAt: string;
}

interface SuperAdminState {
  // Auth state
  superAdmin: SuperAdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Session
  lastActivity: number;
  sessionTimeout: number; // in minutes

  // Theme
  theme: 'light' | 'dark';

  // Actions
  setAuth: (data: {
    superAdmin: SuperAdminUser;
    accessToken: string;
    refreshToken?: string;
  }) => void;
  updateActivity: () => void;
  logout: () => void;
  isSessionValid: () => boolean;
  toggleTheme: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set, get) => ({
      // Initial state
      superAdmin: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      sessionTimeout: 30, // 30 minutes for super admin (shorter for security)
      theme: 'dark', // Default to dark for Super Admin as it's the professional standard

      // Actions
      setAuth: (data) => {
        set({
          superAdmin: data.superAdmin,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || null,
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      logout: () => {
        set({
          superAdmin: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      isSessionValid: () => {
        const state = get();
        if (!state.isAuthenticated) return false;

        const now = Date.now();
        const elapsed = (now - state.lastActivity) / 1000 / 60; // minutes
        return elapsed < state.sessionTimeout;
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },
    }),
    {
      name: 'super-admin-auth',
      partialize: (state) => ({
        superAdmin: state.superAdmin,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
        sessionTimeout: state.sessionTimeout,
        theme: state.theme,
      }),
    }
  )
);
