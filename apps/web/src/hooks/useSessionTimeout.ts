import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { authApi } from '../lib/api';
import i18n from '../lib/i18n';

interface SessionTimeoutConfig {
  warningMinutes: number;
  onWarning?: () => void;
  onTimeout?: () => void;
}

export function useSessionTimeout(config: SessionTimeoutConfig = { warningMinutes: 2 }) {
  const { isAuthenticated, session, logout, updateSession, updateLastActivity } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimeouts = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimeouts();
    setShowWarning(false);
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('talentx-language');
    i18n.changeLanguage('en');
    logout();
    config.onTimeout?.();
  }, [clearAllTimeouts, logout, config]);

  const extendSession = useCallback(async () => {
    try {
      const response = await authApi.refreshSession();
      const { expiresAt } = response.data;
      updateSession(session.sessionToken || '', new Date(expiresAt));
      setShowWarning(false);
      updateLastActivity();
    } catch (e) {
      // If refresh fails, logout
      handleLogout();
    }
  }, [session.sessionToken, updateSession, updateLastActivity, handleLogout]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    extendSession();
  }, [extendSession]);

  useEffect(() => {
    if (!isAuthenticated || !session.sessionExpiresAt) {
      clearAllTimeouts();
      return;
    }

    const expiresAt = new Date(session.sessionExpiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const warningTime = config.warningMinutes * 60 * 1000;
    const timeUntilWarning = timeUntilExpiry - warningTime;

    // Clear existing timeouts
    clearAllTimeouts();

    // Set warning timeout
    if (timeUntilWarning > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingSeconds(Math.floor(warningTime / 1000));
        config.onWarning?.();

        // Start countdown
        countdownRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, timeUntilWarning);
    } else if (timeUntilExpiry > 0) {
      // Already in warning period
      setShowWarning(true);
      setRemainingSeconds(Math.floor(timeUntilExpiry / 1000));
      config.onWarning?.();

      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Set logout timeout
    if (timeUntilExpiry > 0) {
      logoutTimeoutRef.current = setTimeout(() => {
        handleLogout();
      }, timeUntilExpiry);
    } else {
      // Already expired
      handleLogout();
    }

    return () => {
      clearAllTimeouts();
    };
  }, [isAuthenticated, session.sessionExpiresAt, config, clearAllTimeouts, handleLogout]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, updateLastActivity]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
    dismissWarning,
    logout: handleLogout,
  };
}
