import { Card, CardHeader, Button } from '../ui';
import { Zap } from 'lucide-react';

export function BillingUsageWidget() {
    return (
        <Card>
            <CardHeader title="Billing & Usage" align="left" />
            <div className="p-6 pt-2 space-y-6">
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700">
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Current Plan</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">Enterprise</p>
                    </div>
                    <Button variant="secondary" size="sm">Manage</Button>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> AI Credits
                        </span>
                        <span className="text-neutral-500">8,450 / 10,000 used</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[84%]" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Resets on Jan 1, 2026</p>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Next Billing Date</span>
                        <span className="font-medium text-neutral-900 dark:text-white">Jan 1, 2026</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-neutral-500">Estimated Cost</span>
                        <span className="font-medium text-neutral-900 dark:text-white">$499.00</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
