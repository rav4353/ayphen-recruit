import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UnsavedChangesModal } from '../components/ui/UnsavedChangesModal';

interface UnsavedChangesContextType {
    showPrompt: (message: string, onConfirm: () => void, onCancel: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export function useUnsavedChangesContext() {
    const context = useContext(UnsavedChangesContext);
    if (!context) {
        throw new Error('useUnsavedChangesContext must be used within a UnsavedChangesProvider');
    }
    return context;
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
    const [onCancel, setOnCancel] = useState<(() => void) | null>(null);

    const showPrompt = useCallback((msg: string, confirmCallback: () => void, cancelCallback: () => void) => {
        setMessage(msg);
        setOnConfirm(() => confirmCallback);
        setOnCancel(() => cancelCallback);
        setIsOpen(true);
    }, []);

    const handleStay = () => {
        setIsOpen(false);
        if (onCancel) onCancel();
    };

    const handleLeave = () => {
        setIsOpen(false);
        if (onConfirm) onConfirm();
    };

    return (
        <UnsavedChangesContext.Provider value={{ showPrompt }}>
            {children}
            <UnsavedChangesModal
                isOpen={isOpen}
                message={message}
                onStay={handleStay}
                onLeave={handleLeave}
            />
        </UnsavedChangesContext.Provider>
    );
}
