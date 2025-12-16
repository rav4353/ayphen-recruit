import { useState } from 'react';
import { X, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '../ui';
import { authApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface PasswordConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export function PasswordConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Your Identity',
    description = 'Please enter your password to continue with this action.',
}: PasswordConfirmModalProps) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authApi.verifyPassword(password);
            setPassword('');
            onConfirm();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Invalid password';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-neutral-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {description}
                    </p>

                    <div>
                        <Input
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter your password"
                            leftIcon={<Lock size={18} />}
                            error={error}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading || !password.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
