import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Clock, Check } from 'lucide-react';
import { Theme } from '../../contexts/ThemeContext';
import { usePreferences } from '../../hooks/usePreferences';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'buttons';
  className?: string;
}

const themeOptions: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
  { value: 'auto', icon: Clock, labelKey: 'theme.auto' },
];

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, setTheme } = usePreferences();
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-soft', className)}>
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                theme === option.value
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-soft'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{t(option.labelKey)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (default for navbar)
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg transition-all duration-150',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          'dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
        )}
        title={t('theme.select')}
        aria-label={t('theme.select')}
      >
        <CurrentIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 py-1 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-lg shadow-soft-lg z-50">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-all duration-150',
                  'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  theme === option.value
                    ? 'text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{t(option.labelKey)}</span>
                {theme === option.value && (
                  <Check size={16} className="text-primary-600 dark:text-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
