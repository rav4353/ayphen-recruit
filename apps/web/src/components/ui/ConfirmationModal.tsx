import { useEffect, useState, ReactNode } from 'react';
import { X, AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmationVariant;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const variantConfig = {
    danger: {
        icon: Trash2,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-500',
        confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-500',
        confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white',
    },
    info: {
        icon: Info,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-500',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    },
    success: {
        icon: CheckCircle,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-500',
        confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
    },
};

export function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'warning',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmationModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setShow(false), 200); // Wait for animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!show && !isOpen) return null;

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
                onClick={!isLoading ? onCancel : undefined}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl transform transition-all duration-200 scale-100 border border-neutral-100 dark:border-neutral-800",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <div className="p-6 pt-8">
                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-6", config.iconBg)}>
                            <Icon className={cn("w-8 h-8", config.iconColor)} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                            {title}
                        </h3>
                        <div className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-8 max-w-[90%]">
                            {message}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 w-full">
                            <Button
                                variant="secondary"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 h-11 text-base font-medium border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                onClick={onConfirm}
                                isLoading={isLoading}
                                className={cn("flex-1 h-11 text-base font-medium shadow-lg shadow-current/20", config.confirmButton)}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
