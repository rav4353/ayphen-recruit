import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui';
import { CheckCircle2, ArrowRight, Upload, Calendar, FileText } from 'lucide-react';
import { usersApi, extractData } from '../../lib/api';

interface ActionItem {
    id: string;
    title: string;
    type: 'profile' | 'document' | 'interview' | 'offer' | 'other';
    due?: string;
}

export function ActionItemsWidget() {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActions = async () => {
            try {
                const response = await usersApi.getPendingActions();
                const data = extractData<any[]>(response);

                // Map to widget format
                const mappedItems: ActionItem[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    type: mapType(item.type),
                    due: item.dueDate || 'Soon'
                }));

                setItems(mappedItems);
            } catch (error) {
                console.error('Failed to fetch action items', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActions();
    }, []);

    const mapType = (type: string): ActionItem['type'] => {
        if (type.includes('profile')) return 'profile';
        if (type.includes('document')) return 'document';
        if (type.includes('interview')) return 'interview';
        if (type.includes('offer')) return 'offer';
        return 'other';
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'profile': return <FileText size={18} className="text-blue-500" />;
            case 'document': return <Upload size={18} className="text-amber-500" />;
            case 'interview': return <Calendar size={18} className="text-purple-500" />;
            case 'offer': return <CheckCircle2 size={18} className="text-green-500" />;
            default: return <FileText size={18} />;
        }
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader title="Action Items" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader title="Action Items" align="left" />
            <div className="p-0">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        You're all caught up!
                    </div>
                ) : (
                    items.map((item) => (
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
                    ))
                )}
            </div>
        </Card>
    );
}
