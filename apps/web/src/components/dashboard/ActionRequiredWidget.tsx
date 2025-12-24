import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, Button, Badge, RejectionModal } from '../ui';
import { FileText, UserCheck } from 'lucide-react';
import { usersApi, jobsApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import toast from 'react-hot-toast';

interface ActionItem {
    id: string;
    title: string;
    type: 'approval' | 'review';
    entity: 'Job' | 'Offer' | 'Candidate';
    entityId: string;
    due: string;
}

export function ActionRequiredWidget() {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectingItem, setRejectingItem] = useState<ActionItem | null>(null);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const fetchActions = async () => {
        try {
            const res = await usersApi.getPendingActions();
            setItems(res.data.data);
        } catch (error) {
            console.error('Failed to fetch pending actions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActions();
    }, []);

    const handleApprove = async (item: ActionItem) => {
        if (item.entity === 'Job' && user?.tenantId) {
            try {
                await jobsApi.approve(user.tenantId, item.entityId, { status: 'APPROVED' });
                toast.success('Job approved successfully');
                fetchActions(); // Refresh list
            } catch (error) {
                toast.error('Failed to approve job');
            }
        }
    };

    const handleRejectClick = (item: ActionItem) => {
        setRejectingItem(item);
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!rejectingItem || !user?.tenantId) return;

        try {
            await jobsApi.approve(user.tenantId, rejectingItem.entityId, { status: 'REJECTED', rejectionReason: reason });
            toast.success('Job rejected');
            setRejectingItem(null);
            fetchActions(); // Refresh list
        } catch (error) {
            toast.error('Failed to reject job');
        }
    };

    const handleReview = (item: ActionItem) => {
        if (item.entity === 'Job' && user?.tenantId) {
            navigate(`/${user.tenantId}/jobs/${item.entityId}`);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Action Required" align="left" />
                <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader
                    title="Action Required"
                    align="left"
                    action={items.length > 0 ? <Badge variant="error">{items.length} Pending</Badge> : null}
                />
                <div className="p-0">
                    {items.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                            No actions required at this time.
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 p-2 rounded-lg ${item.type === 'approval' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        }`}>
                                        {item.type === 'approval' ? <FileText size={18} /> : <UserCheck size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.title}</p>
                                        <p className="text-xs text-neutral-500 mt-1">Due: {item.due}</p>

                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                className="h-8 text-xs bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                                                onClick={() => item.type === 'approval' ? handleApprove(item) : handleReview(item)}
                                            >
                                                {item.type === 'approval' ? 'Approve' : 'Review'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="h-8 text-xs"
                                                onClick={() => handleReview(item)}
                                            >
                                                View Details
                                            </Button>
                                            {item.type === 'approval' && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => handleRejectClick(item)}
                                                >
                                                    Reject
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <RejectionModal
                isOpen={!!rejectingItem}
                onClose={() => setRejectingItem(null)}
                onConfirm={handleRejectConfirm}
                title="Reject Job"
                description="Are you sure you want to reject this job? Please provide a reason."
            />
        </>
    );
}
