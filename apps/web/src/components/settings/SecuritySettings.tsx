import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { Card, CardHeader, Button, Input, Alert } from '../ui';
import { authApi } from '../../lib/api';

interface ChangePasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function SecuritySettings() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<ChangePasswordForm>();

    const newPassword = watch('newPassword');

    const onSubmit = async (data: ChangePasswordForm) => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setSuccessMessage(t('settings.security.passwordChanged', 'Password changed successfully'));
            reset();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || t('common.error', 'Something went wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader
                    title={t('settings.security.title', 'Security Settings')}
                    description={t('settings.security.description', 'Manage your password and security preferences.')}
                />
                <div className="p-6 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
                        {successMessage && (
                            <Alert variant="success">
                                {successMessage}
                            </Alert>
                        )}

                        {error && (
                            <Alert variant="error">
                                {error}
                            </Alert>
                        )}

                        <Input
                            label={t('settings.security.currentPassword', 'Current Password')}
                            type="password"
                            leftIcon={<Lock size={18} />}
                            error={errors.currentPassword?.message}
                            {...register('currentPassword', {
                                required: t('auth.validation.passwordRequired', 'Password is required'),
                            })}
                        />

                        <Input
                            label={t('settings.security.newPassword', 'New Password')}
                            type="password"
                            leftIcon={<Lock size={18} />}
                            error={errors.newPassword?.message}
                            hint={t('auth.register.passwordRequirements', 'At least 8 chars, uppercase, lowercase, number, special char')}
                            {...register('newPassword', {
                                required: t('auth.validation.passwordRequired', 'Password is required'),
                                minLength: {
                                    value: 8,
                                    message: t('auth.validation.passwordMin', 'At least 8 characters'),
                                },
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                    message: t('auth.validation.passwordWeak', 'Password is too weak'),
                                },
                            })}
                        />

                        <Input
                            label={t('settings.security.confirmNewPassword', 'Confirm New Password')}
                            type="password"
                            leftIcon={<Lock size={18} />}
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword', {
                                required: t('auth.validation.passwordRequired', 'Password is required'),
                                validate: (value) =>
                                    value === newPassword || t('auth.validation.passwordsDoNotMatch', 'Passwords do not match'),
                            })}
                        />

                        <div className="pt-2">
                            <Button type="submit" isLoading={isLoading}>
                                {t('settings.security.updatePassword', 'Update Password')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
}
