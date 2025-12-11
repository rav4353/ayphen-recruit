import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { authApi } from '../../lib/api';
import { Button, Input, Alert } from '../ui';
import toast from 'react-hot-toast';

interface ChangePasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface ForcedPasswordChangeModalProps {
    isOpen: boolean;
}

export function ForcedPasswordChangeModal({ isOpen }: ForcedPasswordChangeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const logout = useAuthStore((state) => state.logout);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ChangePasswordForm>();

    const newPassword = watch('newPassword');

    const onSubmit = async (data: ChangePasswordForm) => {
        setIsLoading(true);
        setError('');

        try {
            await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });

            toast.success('Password changed successfully! Please log in again with your new password.');

            // Logout and redirect to login
            logout();
            window.location.href = '/login';
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                            Password Change Required
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            For security reasons, you must change your temporary password before continuing.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && <Alert variant="error">{error}</Alert>}

                    <Input
                        label="Current Password"
                        type="password"
                        placeholder="Enter your temporary password"
                        leftIcon={<Lock size={18} />}
                        error={errors.currentPassword?.message}
                        autoComplete="current-password"
                        {...register('currentPassword', {
                            required: 'Current password is required',
                        })}
                    />

                    <Input
                        label="New Password"
                        type="password"
                        placeholder="Enter your new password"
                        leftIcon={<Lock size={18} />}
                        error={errors.newPassword?.message}
                        autoComplete="new-password"
                        {...register('newPassword', {
                            required: 'New password is required',
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                            },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                message: 'Password must contain uppercase, lowercase, number, and special character',
                            },
                        })}
                    />

                    <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Confirm your new password"
                        leftIcon={<Lock size={18} />}
                        error={errors.confirmPassword?.message}
                        autoComplete="new-password"
                        {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (value) =>
                                value === newPassword || 'Passwords do not match',
                        })}
                    />

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" isLoading={isLoading} className="flex-1">
                            {isLoading ? 'Changing Password...' : 'Change Password'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                logout();
                                window.location.href = '/login';
                            }}
                            disabled={isLoading}
                        >
                            Logout
                        </Button>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                        You cannot access the application until you change your password.
                    </p>
                </form>
            </div>
        </div>
    );
}
