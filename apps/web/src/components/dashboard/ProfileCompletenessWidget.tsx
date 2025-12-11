import { Card, Button } from '../ui';
import { CheckCircle2, Circle } from 'lucide-react';

export function ProfileCompletenessWidget() {
    const steps = [
        { label: 'Basic Info', completed: true },
        { label: 'Experience', completed: true },
        { label: 'Education', completed: true },
        { label: 'Skills', completed: false },
        { label: 'Resume', completed: true },
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const percentage = Math.round((completedCount / steps.length) * 100);

    return (
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-1">Profile Completeness</h3>
                <p className="text-blue-100 text-sm mb-6">Complete your profile to get better job matches.</p>

                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold">{percentage}%</span>
                    <span className="text-blue-200 mb-1.5">completed</span>
                </div>

                <div className="h-2 w-full bg-blue-900/30 rounded-full overflow-hidden mb-6">
                    <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="space-y-2 mb-6">
                    {steps.map((step) => (
                        <div key={step.label} className="flex items-center gap-2 text-sm">
                            {step.completed ? (
                                <CheckCircle2 size={16} className="text-blue-200" />
                            ) : (
                                <Circle size={16} className="text-blue-300/50" />
                            )}
                            <span className={step.completed ? 'text-blue-100' : 'text-white font-medium'}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>

                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0">
                    Complete Profile
                </Button>
            </div>
        </Card>
    );
}
