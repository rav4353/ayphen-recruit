import { format, isValid, parseISO } from 'date-fns';
import { useOrganizationStore } from '../stores/organization';

// Map our format strings to date-fns format strings if they differ
// Our settings: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
// date-fns: MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd
const FORMAT_MAP: Record<string, string> = {
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'DD-MM-YYYY': 'dd-MM-yyyy',
    'DD.MM.YYYY': 'dd.MM.yyyy',
};

export const normalizeFormat = (fmt: string) => {
    return FORMAT_MAP[fmt] || 'MM/dd/yyyy';
};

/**
 * Hook to get a date formatting function that automatically uses the organization's
 * preferred date format. Using this hook ensures the component re-renders when
 * the date format setting changes.
 */
export function useDateFormatter() {
    const dateFormat = useOrganizationStore((state) => state.settings.dateFormat);
    const normalizedFormat = normalizeFormat(dateFormat);

    const formatDate = (date: Date | string | number | null | undefined, customFormat?: string) => {
        if (!date) return '';

        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);

        if (!isValid(dateObj)) return '';

        try {
            return format(dateObj, customFormat || normalizedFormat);
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    return { formatDate, dateFormat: normalizedFormat };
}

/**
 * Static formatter using current store state. 
 * Warning: Components using this directly inside render without subscribing to the store
 * will NOT update immediately when settings change. Use the hook version when possible.
 */
export function formatDateStatic(date: Date | string | number | null | undefined, customFormat?: string) {
    if (!date) return '';

    const dateFormat = useOrganizationStore.getState().settings.dateFormat;
    const normalizedFormat = normalizeFormat(dateFormat);

    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);

    if (!isValid(dateObj)) return '';

    try {
        return format(dateObj, customFormat || normalizedFormat);
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}
