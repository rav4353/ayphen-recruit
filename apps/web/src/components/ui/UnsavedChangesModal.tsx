import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    message: string;
    onStay: () => void;
    onLeave: () => void;
}

export function UnsavedChangesModal({
    isOpen,
    message,
    onStay,
    onLeave,
}: UnsavedChangesModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(isOpen);
    }, [isOpen]);

    if (!show) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onStay}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-in">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 pb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            Unsaved Changes
                        </h3>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onStay}
                        className="flex-shrink-0 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    <Button
                        variant="secondary"
                        onClick={onStay}
                        className="flex-1"
                    >
                        Stay on Page
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onLeave}
                        className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    >
                        Leave Anyway
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
