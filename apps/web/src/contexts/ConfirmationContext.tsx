import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmationModal, ConfirmationVariant } from '../components/ui/ConfirmationModal';

interface ConfirmationOptions {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmationVariant;
    onConfirm?: () => Promise<void> | void;
    onCancel?: () => void;
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => void;
    close: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
}

export function ConfirmationProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const confirm = useCallback((newOptions: ConfirmationOptions) => {
        setOptions(newOptions);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setIsLoading(false);
    }, []);

    const handleConfirm = async () => {
        if (options.onConfirm) {
            const result = options.onConfirm();
            if (result instanceof Promise) {
                setIsLoading(true);
                try {
                    await result;
                    close();
                } catch (error) {
                    console.error('Confirmation action failed', error);
                    setIsLoading(false);
                }
            } else {
                close();
            }
        } else {
            close();
        }
    };

    const handleCancel = () => {
        if (options.onCancel) {
            options.onCancel();
        }
        close();
    };

    return (
        <ConfirmationContext.Provider value={{ confirm, close }}>
            {children}
            <ConfirmationModal
                isOpen={isOpen}
                title={options.title}
                message={options.message}
                confirmLabel={options.confirmLabel}
                cancelLabel={options.cancelLabel}
                variant={options.variant}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </ConfirmationContext.Provider>
    );
}
