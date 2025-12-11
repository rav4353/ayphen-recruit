import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { Card, CardHeader, Button, Input, Badge, ConfirmationModal } from '../ui';
import { useStatusColors, StatusColors } from '../../contexts/StatusColorContext';
import toast from 'react-hot-toast';

export function StatusSettings() {
    const { colors, updateColors, resetColors, isLoading } = useStatusColors();
    const [localColors, setLocalColors] = useState<StatusColors | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const justSavedRef = useRef(false);

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    console.log('StatusSettings render:', {
        colors,
        isLoading,
        localColors,
        'localColors.job': localColors?.job,
        'localColors.application': localColors?.application,
        error
    });

    useEffect(() => {
        console.log('StatusSettings useEffect:', { colors, isLoading, justSaved: justSavedRef.current });

        // Skip update if we just saved to prevent overwriting with potentially stale data
        if (justSavedRef.current) {
            console.log('Skipping localColors update - just saved');
            justSavedRef.current = false;
            return;
        }

        if (colors) {
            console.log('Setting localColors to:', colors);
            console.log('colors.job:', colors.job);
            console.log('colors.application:', colors.application);
            setLocalColors(colors);
            setError(null);
        } else if (!isLoading && !colors) {
            console.error('No colors after loading completed');
            setError('Failed to load status colors');
        }
    }, [colors, isLoading]);

    const handleColorChange = (
        type: 'job' | 'application',
        status: string,
        field: 'bg' | 'text',
        value: string
    ) => {
        if (!localColors) return;
        setLocalColors((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                [type]: {
                    ...prev[type],
                    [status]: {
                        ...prev[type][status],
                        [field]: value,
                    },
                },
            };
        });
    };

    const handleSave = async () => {
        if (!localColors) return;
        setIsSaving(true);
        try {
            justSavedRef.current = true;
            await updateColors(localColors);
            toast.success('Status colors updated successfully');
        } catch (error) {
            justSavedRef.current = false;
            toast.error('Failed to update status colors');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetClick = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = async () => {
        setIsResetting(true);
        try {
            await resetColors();
            toast.success('Status colors reset to default');
        } catch (error) {
            toast.error('Failed to reset status colors');
        } finally {
            setIsResetting(false);
            setShowResetConfirm(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-neutral-500 dark:text-neutral-400">Loading status colors...</p>
                </div>
            </div>
        );
    }

    if (error || !localColors) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || 'Failed to load status colors'}</p>
                    <Button onClick={() => window.location.reload()}>Reload Page</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-white">Status Appearance</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Customize the colors for job and application statuses.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleResetClick} disabled={isSaving} className="gap-2">
                        <RotateCcw size={16} />
                        Reset Defaults
                    </Button>
                    <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                        <Save size={16} />
                        Save Changes
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader title="Job Statuses" />
                <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {localColors.job && Object.entries(localColors.job).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{status}</span>
                                    <Badge customColor={color}>{status}</Badge>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-neutral-500 mb-1 block">Background</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={color.bg}
                                                onChange={(e) => handleColorChange('job', status, 'bg', e.target.value)}
                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <Input
                                                key={`job-${status}-bg-input-${color.bg}`}
                                                value={color.bg}
                                                onChange={(e) => handleColorChange('job', status, 'bg', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-neutral-500 mb-1 block">Text</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={color.text}
                                                onChange={(e) => handleColorChange('job', status, 'text', e.target.value)}
                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <Input
                                                key={`job-${status}-text-input-${color.text}`}
                                                value={color.text}
                                                onChange={(e) => handleColorChange('job', status, 'text', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <CardHeader title="Application Statuses" />
                <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {localColors.application && Object.entries(localColors.application).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{status}</span>
                                    <Badge customColor={color}>{status}</Badge>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-neutral-500 mb-1 block">Background</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={color.bg}
                                                onChange={(e) => handleColorChange('application', status, 'bg', e.target.value)}
                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <Input
                                                key={`app-${status}-bg-input-${color.bg}`}
                                                value={color.bg}
                                                onChange={(e) => handleColorChange('application', status, 'bg', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-neutral-500 mb-1 block">Text</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={color.text}
                                                onChange={(e) => handleColorChange('application', status, 'text', e.target.value)}
                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <Input
                                                key={`app-${status}-text-input-${color.text}`}
                                                value={color.text}
                                                onChange={(e) => handleColorChange('application', status, 'text', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <ConfirmationModal
                isOpen={showResetConfirm}
                onCancel={() => setShowResetConfirm(false)}
                onConfirm={confirmReset}
                title="Reset Status Colors"
                message="Are you sure you want to reset all colors to default? This action cannot be undone."
                confirmLabel="Reset to Defaults"
                cancelLabel="Cancel"
                isLoading={isResetting}
                variant="danger"
            />
        </div>
    );
}
