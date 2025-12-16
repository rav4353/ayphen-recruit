import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Label,
} from '../ui';
import { Plus, X } from 'lucide-react';

const criteriaItemSchema = z.object({
    key: z.string(),
    label: z.string().min(1, 'Label is required'),
    description: z.string().optional(),
    type: z.enum(['rating', 'text', 'both']).default('rating'),
});

const scorecardSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    ratingScale: z.coerce.number().min(3).max(10).default(5),
    ratingLabelMin: z.string().default('Poor'),
    ratingLabelMax: z.string().default('Excellent'),
    recommendationOptions: z.string().default('Strong No, No, Yes, Strong Yes'),
    sections: z.array(criteriaItemSchema),
});

type ScorecardFormData = z.infer<typeof scorecardSchema>;

interface ScorecardModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSubmit: (e: React.FormEvent, data: any) => void;
    isLoading: boolean;
    title?: string;
}

export const ScorecardModal = ({ isOpen, onClose, initialData, onSubmit, isLoading, title }: ScorecardModalProps) => {
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ScorecardFormData>({
        resolver: zodResolver(scorecardSchema) as any,
        defaultValues: {
            name: '',
            ratingScale: 5,
            ratingLabelMin: 'Poor',
            ratingLabelMax: 'Excellent',
            recommendationOptions: 'Strong No, No, Yes, Strong Yes',
            sections: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'sections'
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                name: initialData?.name || '',
                ratingScale: initialData?.ratingScale || 5,
                ratingLabelMin: initialData?.ratingLabelMin || 'Poor',
                ratingLabelMax: initialData?.ratingLabelMax || 'Excellent',
                recommendationOptions: Array.isArray(initialData?.recommendationOptions)
                    ? initialData.recommendationOptions.join(', ')
                    : 'Strong No, No, Yes, Strong Yes',
                sections: initialData?.sections || []
            });
        }
    }, [isOpen, initialData, reset]);

    const handleAddCriteria = () => {
        append({ key: `criteria_${Date.now()}`, label: '', description: '', type: 'rating' });
    };

    const handleFormSubmit = (data: ScorecardFormData) => {
        const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
        const formattedData = {
            ...data,
            recommendationOptions: data.recommendationOptions.split(',').map(s => s.trim()).filter(Boolean)
        };
        onSubmit(syntheticEvent, formattedData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                    <DialogTitle className="text-lg font-semibold">
                        {title || (initialData ? 'Edit Scorecard' : 'Create Scorecard')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">General Settings</h3>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Template Name
                                </Label>
                                <Input
                                    {...register('name')}
                                    placeholder="e.g. Sales Interview Scorecard"
                                    error={errors.name?.message}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Rating Scale Max
                                    </Label>
                                    <Input
                                        type="number"
                                        min={3}
                                        max={10}
                                        {...register('ratingScale')}
                                        error={errors.ratingScale?.message}
                                    />
                                    <p className="text-[10px] text-neutral-500">Scale from 1 to N</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Min Label
                                    </Label>
                                    <Input
                                        {...register('ratingLabelMin')}
                                        placeholder="Poor"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Max Label
                                    </Label>
                                    <Input
                                        {...register('ratingLabelMax')}
                                        placeholder="Excellent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Recommendation Options
                                </Label>
                                <Input
                                    {...register('recommendationOptions')}
                                    placeholder="Strong No, No, Yes, Strong Yes"
                                />
                                <p className="text-[10px] text-neutral-500">Comma separated values (from negative to positive)</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                                <Label className="text-sm font-medium text-neutral-900 dark:text-white">
                                    Evaluation Criteria
                                </Label>
                                <Button type="button" size="sm" variant="outline" onClick={handleAddCriteria} className="gap-1.5 h-8">
                                    <Plus size={14} /> Add Criteria
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {fields.length === 0 && (
                                    <div className="text-sm text-neutral-500 text-center py-8 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                                        <p className="font-medium text-neutral-600 dark:text-neutral-400">No criteria added</p>
                                        <p className="text-xs mt-1">Click "Add Criteria" to define scorecard items</p>
                                    </div>
                                )}
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-start p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-500 shrink-0 mt-0.5">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <Input
                                                        {...register(`sections.${index}.label` as const)}
                                                        placeholder="Criteria Name (e.g. Technical Skills)"
                                                    />
                                                </div>
                                                <div className="w-1/3">
                                                    <select
                                                        {...register(`sections.${index}.type`)}
                                                        className="w-full h-10 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="rating">Stars Only</option>
                                                        <option value="text">Description Only</option>
                                                        <option value="both">Stars & Description</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <Input
                                                {...register(`sections.${index}.description` as const)}
                                                placeholder="Description (optional)"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
                        <Button variant="outline" onClick={onClose} type="button" className="w-full sm:w-auto" disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                            Save Template
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
