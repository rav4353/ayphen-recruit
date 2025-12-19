import { useState } from 'react';
import { JobFormSettings } from './JobFormSettings';
import { CandidateFormSettings } from './CandidateFormSettings';
import { cn } from '../../lib/utils';

export function FormsSettings() {
    const [activeTab, setActiveTab] = useState<'job' | 'candidate'>('job');

    return (
        <div className="space-y-6">
            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('job')}
                        className={cn(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'job'
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300"
                        )}
                        aria-current={activeTab === 'job' ? 'page' : undefined}
                    >
                        Job Form Customization
                    </button>
                    <button
                        onClick={() => setActiveTab('candidate')}
                        className={cn(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'candidate'
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300"
                        )}
                        aria-current={activeTab === 'candidate' ? 'page' : undefined}
                    >
                        Candidate Form Customization
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'job' ? (
                    <div className="animate-in fade-in duration-300">
                        <JobFormSettings />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        <CandidateFormSettings />
                    </div>
                )}
            </div>
        </div>
    );
}
