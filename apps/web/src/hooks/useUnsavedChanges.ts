import { useEffect, useCallback, useContext } from 'react';
import { useBeforeUnload, UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { useUnsavedChangesContext } from '../contexts/UnsavedChangesContext';

interface UseUnsavedChangesOptions {
    when: boolean;
    message?: string;
}

/**
 * Hook to warn users about unsaved changes before navigating away
 * Works for both browser navigation and in-app navigation
 * Uses custom modal for in-app navigation
 * @param when - Boolean indicating if there are unsaved changes
 * @param message - Custom message to display (optional)
 */
export function useUnsavedChanges({ when, message }: UseUnsavedChangesOptions) {
    const defaultMessage = message || 'You have unsaved changes. Are you sure you want to leave?';
    const navigator = useContext(NavigationContext).navigator;
    const { showPrompt } = useUnsavedChangesContext();

    // Handle browser refresh/close using React Router's hook
    // Note: Browser close/refresh will always use the native dialog
    useBeforeUnload(
        useCallback(
            (event) => {
                if (when) {
                    event.preventDefault();
                    return defaultMessage;
                }
            },
            [when, defaultMessage]
        ),
        { capture: true }
    );

    // Block in-app navigation
    useEffect(() => {
        if (!when) return;

        const push = navigator.push;
        const replace = navigator.replace;

        navigator.push = (...args: Parameters<typeof push>) => {
            showPrompt(
                defaultMessage,
                () => {
                    // On Confirm: Proceed with navigation using original push
                    push(...args);
                },
                () => {
                    // On Cancel: Do nothing (stay on page)
                }
            );
        };

        navigator.replace = (...args: Parameters<typeof replace>) => {
            showPrompt(
                defaultMessage,
                () => {
                    // On Confirm: Proceed with navigation using original replace
                    replace(...args);
                },
                () => {
                    // On Cancel: Do nothing (stay on page)
                }
            );
        };

        return () => {
            navigator.push = push;
            navigator.replace = replace;
        };
    }, [when, defaultMessage, navigator, showPrompt]);

    // Also handle with standard beforeunload for better browser compatibility
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (when) {
                e.preventDefault();
                e.returnValue = defaultMessage;
                return defaultMessage;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [when, defaultMessage]);
}
