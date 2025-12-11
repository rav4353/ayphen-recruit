import { Card, CardHeader } from '../ui';
import { CheckCircle2, ArrowRight, Upload, Calendar, FileText } from 'lucide-react';

interface ActionItem {
    id: string;
    title: string;
    type: 'profile' | 'document' | 'interview' | 'offer';
    due?: string;
}

export function ActionItemsWidget() {
    const items: ActionItem[] = [
        { id: '1', title: 'Complete your profile (85%)', type: 'profile' },
        { id: '2', title: 'Upload updated resume', type: 'document', due: 'Today' },
        { id: '3', title: 'Schedule interview for Senior Frontend Engineer', type: 'interview', due: 'Tomorrow' },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'profile': return <FileText size={18} className="text-blue-500" />;
            case 'document': return <Upload size={18} className="text-amber-500" />;
            case 'interview': return <Calendar size={18} className="text-purple-500" />;
            case 'offer': return <CheckCircle2 size={18} className="text-green-500" />;
            default: return <FileText size={18} />;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader title="Action Items" align="left" />
            <div className="p-0">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">{item.title}</p>
                                {item.due && (
                                    <p className="text-xs text-neutral-500 mt-0.5">Due: {item.due}</p>
                                )}
                            </div>
                            <ArrowRight size={16} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        You're all caught up!
                    </div>
                )}
            </div>
        </Card>
    );
}
