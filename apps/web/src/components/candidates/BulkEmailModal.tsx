import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal } from '../ui';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery } from '@tanstack/react-query';
import { communicationApi } from '../../lib/api';

interface BulkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (subject: string, message: string) => Promise<void>;
    recipientCount: number;
}

export function BulkEmailModal({ isOpen, onClose, onSend, recipientCount }: BulkEmailModalProps) {
    const { t } = useTranslation();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { data: templatesResponse } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => communicationApi.getTemplates(),
        enabled: isOpen,
    });

    const templates = templatesResponse?.data?.data || [];

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = templates.find((t: any) => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setMessage(template.body);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setIsLoading(true);
        try {
            await onSend(subject, message);
            onClose();
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('candidates.bulkEmailTitle', 'Send Email to {{count}} Candidates', { count: recipientCount })}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Use Template
                    </label>
                    <select
                        onChange={handleTemplateChange}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                    >
                        <option value="" disabled>Select a template...</option>
                        {templates && Array.isArray(templates) && templates.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label={t('candidates.emailSubject', 'Subject')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('candidates.emailSubjectPlaceholder', 'e.g. Interview Invitation')}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t('candidates.emailMessage', 'Message')}
                    </label>
                    <div className="h-64 mb-12">
                        <ReactQuill
                            theme="snow"
                            value={message}
                            onChange={setMessage}
                            className="h-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {t('common.send', 'Send Email')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
