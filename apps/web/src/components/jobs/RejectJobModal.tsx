import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui';

interface RejectJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReject: (rejectionReason: string, comment?: string) => Promise<void>;
    jobTitle: string;
}

export function RejectJobModal({ isOpen, onClose, onReject, jobTitle }: RejectJobModalProps) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectionReason.trim()) return;

        setIsSubmitting(true);
        try {
            await onReject(rejectionReason, comment || undefined);
            // Reset form
            setRejectionReason('');
            setComment('');
            onClose();
        } catch (error) {
            console.error('Failed to reject job:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                            Reject Job Posting
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {jobTitle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-neutral-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rejection Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Salary range needs to be more specific, Job requirements are too broad..."
                            required
                            rows={4}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            This will be shown to the job poster. Be specific about what needs to be improved.
                        </p>
                    </div>

                    {/* Additional Feedback */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            Additional Feedback <span className="text-neutral-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Any other comments, suggestions, or guidance..."
                            rows={3}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting || !rejectionReason.trim()}
                        >
                            {isSubmitting ? 'Rejecting...' : 'Reject Job Posting'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
