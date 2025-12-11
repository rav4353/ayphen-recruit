import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';


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
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Rejection reason is required');
            return;
        }
        onConfirm(reason);
        setReason('');
        setError('');
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {description}
                </p>

                <div className="space-y-1">
                    <textarea
                        className={`w-full px-3 py-2 bg-white dark:bg-neutral-900 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-none ${error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-neutral-200 dark:border-neutral-700 focus:border-blue-500'
                            } text-neutral-900 dark:text-white placeholder-neutral-400`}
                        placeholder="Enter reason..."
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (e.target.value.trim()) setError('');
                        }}
                        autoFocus
                    />
                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isRejecting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        isLoading={isRejecting}
                    >
                        Reject
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
