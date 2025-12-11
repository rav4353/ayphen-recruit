import { Card, Button } from '../ui';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export function BillingSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Current Plan</h2>
                            <p className="text-neutral-500 mt-1">You are currently on the <span className="font-medium text-neutral-900 dark:text-white">Pro Plan</span>.</p>
                        </div>
                        <Button variant="secondary">Manage Subscription</Button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <div className="text-sm text-neutral-500 mb-1">Active Jobs</div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">5 / 10</div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-3">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <div className="text-sm text-neutral-500 mb-1">Users</div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">8 / 20</div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-3">
                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <div className="text-sm text-neutral-500 mb-1">Storage</div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">12GB / 50GB</div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-3">
                                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '24%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Payment Method</h3>
                    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center">
                                <CreditCard size={20} className="text-neutral-500" />
                            </div>
                            <div>
                                <div className="font-medium text-neutral-900 dark:text-white">Visa ending in 4242</div>
                                <div className="text-sm text-neutral-500">Expires 12/2025</div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Billing History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                    <th className="pb-3 font-medium text-neutral-500">Date</th>
                                    <th className="pb-3 font-medium text-neutral-500">Amount</th>
                                    <th className="pb-3 font-medium text-neutral-500">Status</th>
                                    <th className="pb-3 font-medium text-neutral-500 text-right">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <tr>
                                    <td className="py-4">Oct 1, 2023</td>
                                    <td className="py-4">$49.00</td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                            <CheckCircle2 size={12} /> Paid
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <Button variant="ghost" size="sm">Download</Button>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-4">Sep 1, 2023</td>
                                    <td className="py-4">$49.00</td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                            <CheckCircle2 size={12} /> Paid
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <Button variant="ghost" size="sm">Download</Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
}
