import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { communicationApi, aiApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui';
import { Sparkles, Loader2 } from 'lucide-react';

interface EmailComposerProps {
    candidateId: string;
    candidateEmail: string;
    candidateName?: string;
    jobTitle?: string;
    onSent: () => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ 
    candidateId, 
    candidateEmail, 
    candidateName,
    jobTitle,
    onSent 
}) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
    const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [emailContext, setEmailContext] = useState('general');

    const { data: templatesResponse } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => communicationApi.getTemplates(),
    });

    const generateSubjectSuggestions = async () => {
        setLoadingSuggestions(true);
        setShowSubjectSuggestions(true);
        try {
            const response = await aiApi.generateSubjectLines({
                context: emailContext,
                candidateName,
                jobTitle,
            });
            setSubjectSuggestions(response.data.suggestions || []);
        } catch (error) {
            console.error('Failed to generate suggestions:', error);
            // Fallback suggestions
            setSubjectSuggestions([
                `Regarding Your Application${jobTitle ? ` for ${jobTitle}` : ''}`,
                'Next Steps in Your Application',
                'Important Update from Our Team',
                `We'd Like to Connect${candidateName ? `, ${candidateName.split(' ')[0]}` : ''}`,
                'Your Application Status',
            ]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const selectSuggestion = (suggestion: string) => {
        setSubject(suggestion);
        setShowSubjectSuggestions(false);
    };

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

                <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                        </label>
                        <button
                            type="button"
                            onClick={generateSubjectSuggestions}
                            disabled={loadingSuggestions}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            {loadingSuggestions ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Sparkles className="h-3 w-3" />
                            )}
                            AI Suggest
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g. Interview Invitation"
                        />
                        {showSubjectSuggestions && subjectSuggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                <div className="p-2 border-b border-gray-100">
                                    <select
                                        value={emailContext}
                                        onChange={(e) => {
                                            setEmailContext(e.target.value);
                                            generateSubjectSuggestions();
                                        }}
                                        className="w-full text-xs border-gray-200 rounded"
                                    >
                                        <option value="general">General</option>
                                        <option value="interview">Interview Invitation</option>
                                        <option value="offer">Offer Letter</option>
                                        <option value="rejection">Application Update</option>
                                        <option value="followup">Follow Up</option>
                                    </select>
                                </div>
                                <ul className="max-h-48 overflow-y-auto">
                                    {subjectSuggestions.map((suggestion, idx) => (
                                        <li key={idx}>
                                            <button
                                                type="button"
                                                onClick={() => selectSuggestion(suggestion)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 text-gray-700 hover:text-indigo-700"
                                            >
                                                {suggestion}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowSubjectSuggestions(false)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
