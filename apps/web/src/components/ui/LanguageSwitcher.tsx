import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { languages, LanguageCode } from '../../lib/i18n';
import { usePreferences } from '../../hooks/usePreferences';
import { cn } from '../../lib/utils';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'dropdown' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'dropdown', className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const { setLanguage } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'icon') {
    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
            'dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
          )}
          title={t('language.select')}
        >
          <Globe size={20} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                  i18n.language === lang.code
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {i18n.language === lang.code && (
                  <Check size={16} className="text-green-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          'dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800',
          'border border-neutral-200 dark:border-neutral-700'
        )}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium">{currentLanguage.name}</span>
        <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                i18n.language === lang.code
                  ? 'text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-700/50'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.name}</span>
              {i18n.language === lang.code && (
                <Check size={16} className="text-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
