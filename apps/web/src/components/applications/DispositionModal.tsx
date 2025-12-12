import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Label,
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui';

const dispositionSchema = z.object({
    reason: z.string().min(1, 'Please select a reason'),
    notes: z.string(),
});

type DispositionFormData = z.infer<typeof dispositionSchema>;

interface DispositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, notes?: string) => void;
    type: 'REJECTION' | 'WITHDRAWAL';
    candidateName: string;
}

const REJECTION_REASONS = [
    { value: 'Not a skill fit', category: 'Skills' },
    { value: 'Insufficient experience', category: 'Experience' },
    { value: 'Cultural fit concerns', category: 'Culture' },
    { value: 'Salary expectations too high', category: 'Compensation' },
    { value: 'Failed technical assessment', category: 'Assessment' },
    { value: 'Poor communication skills', category: 'Skills' },
    { value: 'Location mismatch', category: 'Logistics' },
    { value: 'Overqualified', category: 'Experience' },
    { value: 'Position filled', category: 'Other' },
    { value: 'Other', category: 'Other' },
];

const WITHDRAWAL_REASONS = [
    { value: 'Accepted another offer', category: 'Competing Offer' },
    { value: 'Salary not competitive', category: 'Compensation' },
    { value: 'Location concerns', category: 'Logistics' },
    { value: 'Company culture concerns', category: 'Culture' },
    { value: 'Role not aligned with career goals', category: 'Career' },
    { value: 'Personal reasons', category: 'Personal' },
    { value: 'Process took too long', category: 'Process' },
    { value: 'No longer interested', category: 'Other' },
    { value: 'Other', category: 'Other' },
];

export function DispositionModal({
    isOpen,
    onClose,
    onSubmit,
    type,
    candidateName,
}: DispositionModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors }
    } = useForm<DispositionFormData>({
        resolver: zodResolver(dispositionSchema),
        defaultValues: { reason: '', notes: '' }
    });

    const selectedReason = watch('reason');

    useEffect(() => {
        if (isOpen) {
            reset({ reason: '', notes: '' });
        }
    }, [isOpen, reset]);

    const reasons = type === 'REJECTION' ? REJECTION_REASONS : WITHDRAWAL_REASONS;
    const title = type === 'REJECTION' ? 'Reject Candidate' : 'Mark as Withdrawn';
    const actionLabel = type === 'REJECTION' ? 'Reject' : 'Mark Withdrawn';

    const onFormSubmit = (data: DispositionFormData) => {
        onSubmit(data.reason, data.notes || undefined);
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0">
                <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500">
                        {candidateName}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 py-5 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Reason <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name="reason"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger error={errors.reason?.message}>
                                        <SelectValue placeholder="Select a reason..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reasons.map((reason) => (
                                            <SelectItem key={reason.value} value={reason.value}>
                                                {reason.value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Additional Notes (Optional)
                        </Label>
                        <Textarea
                            {...register('notes')}
                            className="min-h-[100px] resize-none"
                            placeholder="Add any additional context..."
                        />
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={!selectedReason}
                            className="w-full sm:w-auto"
                        >
                            {actionLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
