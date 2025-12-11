import { Card, CardHeader, Button } from '../ui';
import { FileText, Settings, UserX, Download } from 'lucide-react';

interface Log {
    id: string;
    action: string;
    user: string;
    time: string;
    type: 'security' | 'data' | 'config';
}

export function RecentAuditLogsWidget() {
    const logs: Log[] = [
        { id: '1', action: 'Changed User Role: Junior Recruiter', user: 'Admin User', time: '10 mins ago', type: 'security' },
        { id: '2', action: 'Exported Candidate Data (500 records)', user: 'Sarah Chen', time: '1 hour ago', type: 'data' },
        { id: '3', action: 'Updated Email Templates', user: 'Mike Johnson', time: '2 hours ago', type: 'config' },
        { id: '4', action: 'Deactivated User: Alex Kim', user: 'Admin User', time: '4 hours ago', type: 'security' },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'security': return <UserX size={16} />;
            case 'data': return <Download size={16} />;
            case 'config': return <Settings size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <Card>
            <CardHeader title="Recent Audit Logs" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="p-0">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="mt-1 text-neutral-400">
                            {getIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{log.action}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">by {log.user} • {log.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
