import type { Preview } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import '../src/lib/i18n';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.backgrounds?.value === '#0a0a0a';
      
      React.useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(isDark ? 'dark' : 'light');
      }, [isDark]);

      return (
        <ThemeProvider>
          <div className={`p-4 ${isDark ? 'bg-neutral-950' : 'bg-white'}`}>
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr', title: 'Français' },
          { value: 'hi', title: 'हिन्दी' },
        ],
      },
    },
  },
};

export default preview;
