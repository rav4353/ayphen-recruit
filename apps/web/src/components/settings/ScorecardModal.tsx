import React, { useState, useEffect } from 'react';
import { Button, Modal } from '../ui';
import { Plus, X } from 'lucide-react';

interface ScorecardModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSubmit: (e: React.FormEvent, data: any) => void;
    isLoading: boolean;
    title?: string;
}

export const ScorecardModal = ({ isOpen, onClose, initialData, onSubmit, isLoading, title }: ScorecardModalProps) => {
    const [name, setName] = useState('');
    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setSections(initialData?.sections || []);
        }
    }, [isOpen, initialData]);

    const handleAddCriteria = () => {
        setSections([...sections, { key: `criteria_${Date.now()}`, label: '', description: '' }]);
    };

    const handleRemoveCriteria = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
    };

    const handleCriteriaChange = (index: number, field: string, value: string) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || (initialData ? 'Edit Scorecard' : 'Create Scorecard')} className="max-w-3xl">
            <form onSubmit={(e) => onSubmit(e, { name, sections })} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Template Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-neutral-300 dark:border-neutral-600 shadow-sm p-2 border dark:bg-neutral-800 dark:text-white"
                        placeholder="e.g. Sales Interview Scorecard"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Evaluation Criteria
                        </label>
                        <Button type="button" size="sm" variant="secondary" onClick={handleAddCriteria} className="gap-1">
                            <Plus size={14} /> Add Criteria
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {sections.length === 0 && (
                            <p className="text-sm text-neutral-500 italic text-center py-4 bg-neutral-50 rounded dark:bg-neutral-800">
                                No criteria added. Click "Add Criteria" to define scorecard items.
                            </p>
                        )}
                        {sections.map((section, index) => (
                            <div key={index} className="flex gap-2 items-start p-3 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        required
                                        value={section.label}
                                        onChange={(e) => handleCriteriaChange(index, 'label', e.target.value)}
                                        placeholder="Criteria Name (e.g. Technical Skills)"
                                        className="block w-full text-sm rounded border-neutral-300 dark:border-neutral-600 p-1.5 border dark:bg-neutral-700 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={section.description}
                                        onChange={(e) => handleCriteriaChange(index, 'description', e.target.value)}
                                        placeholder="Description (optional)"
                                        className="block w-full text-xs rounded border-neutral-300 dark:border-neutral-600 p-1.5 border dark:bg-neutral-700 dark:text-white text-neutral-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCriteria(index)}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 mt-1"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Template'}</Button>
                </div>
            </form>
        </Modal>
    );
};
