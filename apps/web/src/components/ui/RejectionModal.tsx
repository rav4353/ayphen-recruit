import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './shadcn/dialog';
import { Button } from './shadcn/button';
import { Textarea } from './shadcn/textarea';

const rejectionSchema = z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
});

type RejectionFormData = z.infer<typeof rejectionSchema>;

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title?: string;
    description?: string;
    isRejecting?: boolean;
}

export function RejectionModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Reject',
    description = 'Please provide a reason for rejection.',
    isRejecting = false,
}: RejectionModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<RejectionFormData>({
        resolver: zodResolver(rejectionSchema),
        defaultValues: { reason: '' }
    });

    useEffect(() => {
        if (isOpen) {
            reset({ reason: '' });
        }
    }, [isOpen, reset]);

    const onSubmit = (data: RejectionFormData) => {
        onConfirm(data.reason);
        reset();
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md p-0">
                <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500 mt-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
                    <Textarea
                        className="min-h-[120px] resize-none"
                        placeholder="Enter reason..."
                        {...register('reason')}
                        error={errors.reason?.message}
                        autoFocus
                    />
                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isRejecting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            isLoading={isRejecting}
                            className="w-full sm:w-auto"
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
