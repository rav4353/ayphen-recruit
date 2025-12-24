import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
        iconBg: 'bg-danger-100 dark:bg-danger-900/30',
        iconColor: 'text-danger-600 dark:text-danger-400',
        confirmButton: 'bg-danger-600 hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500/50 text-white shadow-soft hover:shadow-soft-lg',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-warning-100 dark:bg-warning-900/30',
        iconColor: 'text-warning-600 dark:text-warning-400',
        confirmButton: 'bg-warning-600 hover:bg-warning-700 active:bg-warning-800 focus:ring-warning-500/50 text-white shadow-soft hover:shadow-soft-lg',
    },
    info: {
        icon: Info,
        iconBg: 'bg-primary-100 dark:bg-primary-900/30',
        iconColor: 'text-primary-600 dark:text-primary-400',
        confirmButton: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500/50 text-white shadow-soft hover:shadow-soft-lg',
    },
    success: {
        icon: CheckCircle,
        iconBg: 'bg-success-100 dark:bg-success-900/30',
        iconColor: 'text-success-600 dark:text-success-400',
        confirmButton: 'bg-success-600 hover:bg-success-700 active:bg-success-800 focus:ring-success-500/50 text-white shadow-soft hover:shadow-soft-lg',
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

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onCancel : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-soft-xl transform transition-all duration-200 border border-neutral-200/60 dark:border-neutral-800/60",
                    isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
                )}
                role="alertdialog"
                aria-modal="true"
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 disabled:opacity-50"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <div className="p-6 pt-8">
                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-soft", config.iconBg)}>
                            <Icon className={cn("w-8 h-8", config.iconColor)} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">
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
                                className="flex-1 h-11 text-base font-medium"
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                onClick={onConfirm}
                                isLoading={isLoading}
                                className={cn("flex-1 h-11 text-base font-medium", config.confirmButton)}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
