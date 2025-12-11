import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardHeader, Alert } from '../../components/ui';
import toast from 'react-hot-toast';

interface ChangePasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function ChangePasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    // Check if this is a forced password change
    const isForced = location.state?.forced === true;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ChangePasswordForm>();

    const newPassword = watch('newPassword');

    // Prevent navigation away if forced password change
    useEffect(() => {
        if (!isForced) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isForced]);

    const onSubmit = async (data: ChangePasswordForm) => {
        setIsLoading(true);
        setError('');

        try {
            await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });

            toast.success('Password changed successfully');

            // Navigate to dashboard after successful password change
            if (user?.tenantId) {
                navigate(`/${user.tenantId}/dashboard`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader
                    title={isForced ? 'Change Your Password' : 'Change Password'}
                    description={
                        isForced
                            ? 'For security reasons, you must change your password before continuing.'
                            : 'Update your password to keep your account secure.'
                    }
                />

                {isForced && (
                    <Alert variant="warning" className="mb-4">
                        <AlertCircle size={16} />
                        <div>
                            <strong>Password Change Required</strong>
                            <p className="text-sm mt-1">
                                You're using a temporary password. Please create a new password to continue.
                            </p>
                        </div>
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {error && <Alert variant="error">{error}</Alert>}

                    <Input
                        label="Current Password"
                        type="password"
                        placeholder="Enter your current password"
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

                    <div className="flex gap-3">
                        <Button type="submit" isLoading={isLoading} className="flex-1">
                            {isLoading ? 'Changing Password...' : 'Change Password'}
                        </Button>
                        {!isForced && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate(-1)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                    {isForced && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                            >
                                Logout instead
                            </button>
                        </div>
                    )}
                </form>
            </Card>
        </div>
    );
}
