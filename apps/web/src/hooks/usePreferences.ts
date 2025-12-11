import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/auth';
import { preferencesApi } from '../lib/api';

export function usePreferences() {
  const { theme, setTheme: setThemeContext } = useTheme();
  const { i18n } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeContext(newTheme);
    
    // Save to API if authenticated
    if (isAuthenticated) {
      try {
        await preferencesApi.update({ theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  }, [setThemeContext, isAuthenticated]);

  const setLanguage = useCallback(async (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('talentx-language', newLanguage);
    
    // Save to API if authenticated
    if (isAuthenticated) {
      try {
        await preferencesApi.update({ language: newLanguage });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  }, [i18n, isAuthenticated]);

  return {
    theme,
    language: i18n.language,
    setTheme,
    setLanguage,
  };
}
