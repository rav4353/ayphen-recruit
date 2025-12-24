import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, MessageSquare, RotateCcw } from 'lucide-react';
import { Card } from '../ui';

interface JobApproval {
    id: string;
    status: string;
    comment?: string;
    rejectionReason?: string;
    resubmissionComment?: string;
    approvedAt?: string;
    rejectedAt?: string;
    reviewedAt?: string;
    createdAt: string;
    approver?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
}

interface ApprovalHistoryProps {
    approvals: JobApproval[];
}

export function ApprovalHistory({ approvals }: ApprovalHistoryProps) {
    if (!approvals || approvals.length === 0) {
        return (
            <Card className="p-6">
                <p className="text-neutral-500 dark:text-neutral-400 text-center">
                    No approval history yet
                </p>
            </Card>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />;
            case 'REJECTED':
                return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
            case 'PENDING':
                return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
            default:
                return <Clock className="text-neutral-500" size={20} />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
            case 'REJECTED':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
            case 'PENDING':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
            default:
                return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700';
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Approval History
            </h3>

            <div className="space-y-3">
                {approvals.map((approval) => (
                    <Card key={approval.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            {/* Status Icon */}
                            <div className="mt-1">
                                {getStatusIcon(approval.status)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(approval.status)}`}
                                            >
                                                {approval.status}
                                            </span>
                                            {approval.reviewedAt && (
                                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {format(new Date(approval.reviewedAt), 'PPp')}
                                                </span>
                                            )}
                                        </div>
                                        {approval.approver && (
                                            <div className="flex items-center gap-2">
                                                {approval.approver.avatar ? (
                                                    <img
                                                        src={approval.approver.avatar}
                                                        alt={`${approval.approver.firstName} ${approval.approver.lastName}`}
                                                        className="w-6 h-6 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                                                            {approval.approver.firstName[0]}{approval.approver.lastName[0]}
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {approval.approver.firstName} {approval.approver.lastName}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resubmission Comment */}
                                {approval.resubmissionComment && (
                                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <RotateCcw size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                                    Resubmission Note:
                                                </p>
                                                <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                                                    {approval.resubmissionComment}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {approval.rejectionReason && (
                                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <XCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-1">
                                                    Rejection Reason:
                                                </p>
                                                <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                                                    {approval.rejectionReason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Comment */}
                                {approval.comment && (
                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={16} className="text-neutral-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                                    Feedback:
                                                </p>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                                                    {approval.comment}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
