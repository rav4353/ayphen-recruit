import { Card, CardHeader, Button } from '../ui';

interface NewHire {
    id: string;
    name: string;
    role: string;
    startDate: string;
    onboardingStatus: 'Not Started' | 'In Progress' | 'Completed';
    progress: number;
}

export function NewHiresWidget() {
    const newHires: NewHire[] = [
        { id: '1', name: 'Emily Davis', role: 'UX Designer', startDate: 'Dec 15', onboardingStatus: 'In Progress', progress: 45 },
        { id: '2', name: 'Michael Brown', role: 'Data Scientist', startDate: 'Jan 3', onboardingStatus: 'Not Started', progress: 0 },
    ];

    return (
        <Card>
            <CardHeader title="New Hires" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="p-0">
                {newHires.map((hire) => (
                    <div key={hire.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 font-medium">
                                {hire.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-neutral-900 dark:text-white">{hire.name}</h4>
                                <p className="text-xs text-neutral-500">{hire.role} • Starts {hire.startDate}</p>

                                <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-neutral-500">Onboarding</span>
                                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{hire.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${hire.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {newHires.length === 0 && (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        No pending new hires.
                    </div>
                )}
            </div>
        </Card>
    );
}
