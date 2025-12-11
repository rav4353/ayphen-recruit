import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { communicationApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui';

interface EmailComposerProps {
    candidateId: string;
    candidateEmail: string;
    onSent: () => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ candidateId, candidateEmail, onSent }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const { data: templatesResponse } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => communicationApi.getTemplates(),
    });

    const templates = templatesResponse?.data?.data || [];

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = templates.find((t: any) => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body);
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error('Subject and body are required');
            return;
        }

        try {
            setIsSending(true);
            await communicationApi.sendEmail({
                to: candidateEmail,
                subject,
                body,
                candidateId,
            });
            toast.success('Email sent successfully');
            setSubject('');
            setBody('');
            onSent();
        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-4">New Message</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        To
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
                        {candidateEmail}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Use Template
                    </label>
                    <select
                        onChange={handleTemplateChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        defaultValue=""
                    >
                        <option value="" disabled>Select a template...</option>
                        {templates && Array.isArray(templates) && templates.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g. Interview Invitation"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Message
                    </label>
                    <div className="h-64 mb-12">
                        {/* Added extra margin bottom because Quill toolbar takes space */}
                        <ReactQuill
                            theme="snow"
                            value={body}
                            onChange={setBody}
                            className="h-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        isLoading={isSending}
                    >
                        Send Email
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposer;
