import { useState } from 'react';
import { X } from 'lucide-react';

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
    const [selectedReason, setSelectedReason] = useState('');
    const [notes, setNotes] = useState('');

    const reasons = type === 'REJECTION' ? REJECTION_REASONS : WITHDRAWAL_REASONS;
    const title = type === 'REJECTION' ? 'Reject Candidate' : 'Mark as Withdrawn';
    const actionLabel = type === 'REJECTION' ? 'Reject' : 'Mark Withdrawn';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedReason) {
            onSubmit(selectedReason, notes || undefined);
            // Reset form
            setSelectedReason('');
            setNotes('');
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
            <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {candidateName}
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Reason <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select a reason...</option>
                            {reasons.map((reason) => (
                                <option key={reason.value} value={reason.value}>
                                    {reason.value}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Add any additional context..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedReason}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {actionLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
