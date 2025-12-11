import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  mfaEnabled?: boolean;
  employeeId?: string;
  permissions?: string[];
}

interface SessionInfo {
  sessionToken: string | null;
  sessionExpiresAt: Date | null;
  lastActivityAt: Date | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  session: SessionInfo;
  isAuthenticated: boolean;
  mfaPending: boolean;
  requirePasswordChange: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, sessionToken?: string, sessionExpiresAt?: Date) => void;
  setMfaPending: (pending: boolean) => void;
  setRequirePasswordChange: (required: boolean) => void;
  updateSession: (sessionToken: string, expiresAt: Date) => void;
  updateLastActivity: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      session: {
        sessionToken: null,
        sessionExpiresAt: null,
        lastActivityAt: null,
      },
      isAuthenticated: false,
      mfaPending: false,
      requirePasswordChange: false,
      setAuth: (user, accessToken, refreshToken, sessionToken, sessionExpiresAt) =>
        set({
          user,
          accessToken,
          refreshToken,
          session: {
            sessionToken: sessionToken || null,
            sessionExpiresAt: sessionExpiresAt || null,
            lastActivityAt: new Date(),
          },
          isAuthenticated: true,
          mfaPending: false,
        }),
      setMfaPending: (pending) => set({ mfaPending: pending }),
      setRequirePasswordChange: (required) => set({ requirePasswordChange: required }),
      updateSession: (sessionToken, expiresAt) =>
        set((state) => ({
          session: {
            ...state.session,
            sessionToken,
            sessionExpiresAt: expiresAt,
            lastActivityAt: new Date(),
          },
        })),
      updateLastActivity: () =>
        set((state) => ({
          session: {
            ...state.session,
            lastActivityAt: new Date(),
          },
        })),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          session: {
            sessionToken: null,
            sessionExpiresAt: null,
            lastActivityAt: null,
          },
          isAuthenticated: false,
          mfaPending: false,
          requirePasswordChange: false,
        }),
    }),
    {
      name: 'talentx-auth',
    }
  )
);
