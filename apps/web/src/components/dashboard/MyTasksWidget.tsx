import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { CheckCircle2, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';

interface Task {
    id: string;
    title: string;
    due: string;
    priority: 'High' | 'Medium' | 'Low';
    type: string;
    entityId?: string;
}

export function MyTasksWidget() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await usersApi.getPendingActions();
                const actions = response.data.data || response.data || [];

                // Map backend actions to Task interface
                const mappedTasks: Task[] = actions.map((action: any) => ({
                    id: action.id,
                    title: action.title,
                    due: action.due || 'Today',
                    priority: 'High', // Approvals are generally high priority
                    type: action.type,
                    entityId: action.entityId
                }));

                setTasks(mappedTasks);
            } catch (error) {
                console.error('Failed to fetch pending actions', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
            case 'Medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
            case 'Low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
            default: return 'text-neutral-600 bg-neutral-100';
        }
    };

    const handleTaskClick = (task: Task) => {
        if (task.type === 'approval' && task.entityId) {
            // Navigate to job approval page (assuming we have one, or just job details/edit)
            // For now, go to job details
            navigate(`/${tenantId}/jobs/${task.entityId}`);
        }
    };

    if (isLoading) {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader title="My Tasks" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader
                title="My Tasks"
                align="left"
                action={<Button variant="ghost" size="sm" className="text-blue-600">View All</Button>}
            />
            <div className="p-0 flex-1 overflow-auto">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-neutral-500">
                        <CheckCircle2 size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">No pending tasks</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                                onClick={() => handleTaskClick(task)}
                            >
                                <div className="flex items-start gap-3">
                                    <button className="mt-1 text-neutral-400 hover:text-blue-600 transition-colors">
                                        {task.type === 'approval' ? <AlertTriangle size={20} className="text-amber-500" /> : <CheckCircle2 size={20} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                                                <Clock size={12} /> {task.due}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
