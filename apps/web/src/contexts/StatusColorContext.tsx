import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export interface StatusColors {
    job: Record<string, { bg: string; text: string }>;
    application: Record<string, { bg: string; text: string }>;
}

interface StatusColorContextType {
    colors: StatusColors | null;
    updateColors: (newColors: StatusColors) => Promise<void>;
    resetColors: () => Promise<void>;
    getStatusColor: (type: 'job' | 'application', status: string) => { bg: string; text: string } | undefined;
    isLoading: boolean;
}

const DEFAULT_COLORS: StatusColors = {
    job: {
        DRAFT: { bg: '#F3F4F6', text: '#374151' },
        OPEN: { bg: '#D1FAE5', text: '#065F46' },
        CLOSED: { bg: '#FEE2E2', text: '#991B1B' },
        ON_HOLD: { bg: '#FEF3C7', text: '#92400E' },
        PENDING_APPROVAL: { bg: '#DBEAFE', text: '#1E40AF' },
        APPROVED: { bg: '#E0E7FF', text: '#3730A3' },
        CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
    },
    application: {
        APPLIED: { bg: '#DBEAFE', text: '#1E40AF' },
        SCREENING: { bg: '#E0E7FF', text: '#3730A3' },
        PHONE_SCREEN: { bg: '#F3E8FF', text: '#6B21A8' },
        INTERVIEW: { bg: '#FAE8FF', text: '#86198F' },
        OFFER: { bg: '#D1FAE5', text: '#065F46' },
        HIRED: { bg: '#10B981', text: '#FFFFFF' },
        REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
        WITHDRAWN: { bg: '#F3F4F6', text: '#374151' },
    },
};

const StatusColorContext = createContext<StatusColorContextType | undefined>(undefined);

export function StatusColorProvider({ children }: { children: React.ReactNode }) {
    const [colors, setColors] = useState<StatusColors | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const fetchColors = async () => {
        try {
            console.log('Fetching status colors from API...');
            const response = await settingsApi.getStatusColors();
            console.log('Status colors API response:', response.data);

            // Try different possible response structures
            let colorData = null;
            if (response.data?.data?.data) {
                // Handle nested data.data.data structure
                colorData = response.data.data.data;
            } else if (response.data?.data) {
                // Handle data.data structure
                const innerData = response.data.data;
                // Check if innerData has another data property
                if (innerData.data && typeof innerData.data === 'object') {
                    colorData = innerData.data;
                } else {
                    colorData = innerData;
                }
            } else if (response.data?.body) {
                colorData = response.data.body;
            } else if (response.data) {
                colorData = response.data;
            }

            console.log('Extracted color data:', colorData);

            if (colorData && colorData.job && colorData.application) {
                console.log('Setting colors from API:', colorData);
                setColors(colorData);
            } else {
                console.warn('Invalid color data structure, using defaults. Received:', colorData);
                setColors(DEFAULT_COLORS);
            }
        } catch (error: any) {
            console.error('Failed to fetch status colors, using defaults', error);
            // Check if it's an auth error or network error
            if (error.response?.status === 401) {
                console.log('Not authenticated, using default colors');
            }
            // Set default colors if API fails for any reason
            setColors(DEFAULT_COLORS);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchColors();
        } else {
            setColors(DEFAULT_COLORS);
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const updateColors = async (newColors: StatusColors) => {
        try {
            const response = await settingsApi.update('status_colors', {
                value: newColors,
                category: 'APPEARANCE',
                isPublic: true,
            });
            console.log('Update colors response:', response.data);

            // Immediately set the new colors
            setColors(newColors);

            // Refetch from API to ensure we have the persisted version
            await fetchColors();
        } catch (error) {
            console.error('Failed to update status colors', error);
            throw error;
        }
    };

    const resetColors = async () => {
        try {
            const response = await settingsApi.resetStatusColors();
            console.log('Reset colors response:', response.data);
            // Refetch to ensure we get the correctly parsed structure
            await fetchColors();
        } catch (error) {
            console.error('Failed to reset status colors', error);
            throw error;
        }
    };

    const getStatusColor = (type: 'job' | 'application', status: string) => {
        if (!colors) return undefined;
        const typeColors = colors[type];
        if (!typeColors) return undefined;
        return typeColors[status] || typeColors[status.toUpperCase()];
    };

    return (
        <StatusColorContext.Provider value={{ colors, updateColors, resetColors, getStatusColor, isLoading }}>
            {children}
        </StatusColorContext.Provider>
    );
}

export function useStatusColors() {
    const context = useContext(StatusColorContext);
    if (context === undefined) {
        throw new Error('useStatusColors must be used within a StatusColorProvider');
    }
    return context;
}
