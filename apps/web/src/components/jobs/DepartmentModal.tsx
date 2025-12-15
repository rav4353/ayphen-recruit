import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '../ui';

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

export function DepartmentModal({ isOpen, onClose, initialData, onSubmit, isLoading }: DepartmentModalProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData?.name || '',
                code: initialData?.code || '',
            });
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('settings.departments.edit', 'Edit Department') : t('settings.departments.add', 'Add Department')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t('settings.departments.name', 'Department Name')} *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Engineering"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t('settings.departments.code', 'Department Code')}
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. ENG"
                    />
                    <p className="text-xs text-neutral-500 mt-1">{t('settings.departments.codeHelp', 'Optional short code for the department')}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <Button variant="ghost" onClick={onClose} type="button">{t('common.cancel')}</Button>
                    <Button type="submit" isLoading={isLoading}>{initialData ? t('common.save') : t('common.add')}</Button>
                </div>
            </form>
        </Modal>
    );
}
