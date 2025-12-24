import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '../ui';

interface ResubmitJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResubmit: (comment: string) => Promise<void>;
    jobTitle: string;
    rejectionReason?: string;
}

export function ResubmitJobModal({
    isOpen,
    onClose,
    onResubmit,
    jobTitle,
    rejectionReason
}: ResubmitJobModalProps) {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await onResubmit(comment);
            // Reset form
            setComment('');
            onClose();
        } catch (error) {
            console.error('Failed to resubmit job:', error);
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
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <RotateCcw size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                Resubmit for Approval
                            </h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                {jobTitle}
                            </p>
                        </div>
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
                    {/* Show Previous Rejection Reason */}
                    {rejectionReason && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                                Previous Rejection Reason:
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {rejectionReason}
                            </p>
                        </div>
                    )}

                    {/* Resubmission Comment */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            Describe Your Changes <span className="text-blue-500">*</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="e.g., Updated salary range to $80k-$95k based on market research, Clarified remote work policy to be 3 days/week hybrid..."
                            required
                            rows={5}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Help approvers understand what you've changed based on their feedback.
                        </p>
                    </div>

                    {/* Info Message */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Tip:</strong> Be specific about the changes you made. This helps approvers review your updates quickly.
                        </p>
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
                            className="flex-1 gap-2"
                            disabled={isSubmitting || !comment.trim()}
                        >
                            {isSubmitting ? (
                                'Resubmitting...'
                            ) : (
                                <>
                                    <RotateCcw size={16} />
                                    Resubmit for Approval
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
