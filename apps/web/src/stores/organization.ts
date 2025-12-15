import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationSettings {
  name: string;
  website: string;
  industry: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
  weekStartsOn: string;
  numberFormat: string;
}

interface OrganizationState {
  settings: OrganizationSettings;
  isLoaded: boolean;
  setSettings: (settings: Partial<OrganizationSettings>) => void;
  setLogoUrl: (url: string | null) => void;
  reset: () => void;
}

const defaultSettings: OrganizationSettings = {
  name: '',
  website: '',
  industry: '',
  logoUrl: null,
  timezone: 'UTC',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  language: 'en',
  weekStartsOn: 'sunday',
  numberFormat: 'en-US',
};

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      isLoaded: false,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          isLoaded: true,
        })),
      setLogoUrl: (url) =>
        set((state) => ({
          settings: { ...state.settings, logoUrl: url },
        })),
      reset: () =>
        set({
          settings: defaultSettings,
          isLoaded: false,
        }),
    }),
    {
      name: 'talentx-organization',
    }
  )
);
