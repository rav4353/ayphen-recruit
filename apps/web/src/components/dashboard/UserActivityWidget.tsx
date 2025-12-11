import { Card, CardHeader } from '../ui';
import { Users, UserPlus } from 'lucide-react';

export function UserActivityWidget() {
    return (
        <Card className="h-full">
            <CardHeader title="User Activity" align="left" />
            <div className="p-6 pt-2">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center gap-2 text-neutral-500 mb-2">
                            <Users size={16} />
                            <span className="text-sm">Active Today</span>
                        </div>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">42</p>
                        <p className="text-xs text-green-600 mt-1">+5 vs yesterday</p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center gap-2 text-neutral-500 mb-2">
                            <UserPlus size={16} />
                            <span className="text-sm">Licenses</span>
                        </div>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">48/50</p>
                        <p className="text-xs text-amber-600 mt-1">2 remaining</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">Most Active Recruiters</h4>
                    <div className="space-y-3">
                        {[
                            { name: 'Sarah Chen', actions: 145 },
                            { name: 'Mike Johnson', actions: 123 },
                            { name: 'Alex Kim', actions: 98 },
                        ].map((user, i) => (
                            <div key={user.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-5 text-neutral-400 font-mono">#{i + 1}</span>
                                    <span className="text-neutral-700 dark:text-neutral-300">{user.name}</span>
                                </div>
                                <span className="font-medium text-neutral-900 dark:text-white">{user.actions} actions</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
