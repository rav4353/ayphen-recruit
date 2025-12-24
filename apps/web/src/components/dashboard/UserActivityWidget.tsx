import { Card, CardHeader } from '../ui';
import { Users, UserPlus, Loader2, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, extractData } from '../../lib/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface UserActivityData {
    activeUsersToday: number;
    totalUsers: number;
    licenseLimit: number;
    mostActiveUsers: {
        name: string;
        actions: number;
    }[];
    activityTrend: {
        date: string;
        count: number;
    }[];
    actionBreakdown: {
        action: string;
        count: number;
    }[];
}

export function UserActivityWidget() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['user-activity'],
        queryFn: () => analyticsApi.getUserActivity(),
    });

    const data = response?.data ? extractData<UserActivityData>(response.data) : null;

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader title="User Activity" align="left" />
                <div className="p-6 flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                </div>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader title="User Activity" align="left" />
            <div className="p-6 pt-2 flex-1 space-y-6">

                {/* Top Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center gap-2 text-neutral-500 mb-2">
                            <Users size={16} />
                            <span className="text-sm">Active Today</span>
                        </div>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.activeUsersToday}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center gap-2 text-neutral-500 mb-2">
                            <UserPlus size={16} />
                            <span className="text-sm">Licenses</span>
                        </div>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {data.totalUsers}/{data.licenseLimit}
                        </p>
                    </div>
                </div>

                {/* Activity Trend Chart */}
                {data.activityTrend && data.activityTrend.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-blue-500" />
                            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">Activity (Last 7 Days)</h4>
                        </div>
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.activityTrend}>
                                    <XAxis dataKey="date" hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Action Breakdown */}
                {data.actionBreakdown && data.actionBreakdown.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Activity size={16} className="text-purple-500" />
                            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">Common Actions</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.actionBreakdown.map((item) => (
                                <span key={item.action} className="px-2 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md border border-neutral-200 dark:border-neutral-700">
                                    {item.action.replace(/_/g, ' ')} ({item.count})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Most Active Users */}
                <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">Most Active Recruiters (30d)</h4>
                    <div className="space-y-3">
                        {data?.mostActiveUsers?.length === 0 ? (
                            <p className="text-sm text-neutral-500 italic">No activity recorded yet.</p>
                        ) : (
                            data?.mostActiveUsers?.map((user, i) => (
                                <div key={user.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                i === 1 ? 'bg-gray-100 text-gray-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <span className="text-neutral-700 dark:text-neutral-300">{user.name}</span>
                                    </div>
                                    <span className="font-medium text-neutral-900 dark:text-white">{user.actions} actions</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
