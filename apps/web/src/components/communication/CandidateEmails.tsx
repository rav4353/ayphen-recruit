import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { communicationApi } from '../../lib/api';
import EmailComposer from './EmailComposer';
import { format } from 'date-fns';
import { Mail, ArrowUpRight, ArrowDownLeft, File } from 'lucide-react';

interface CandidateEmailsProps {
    candidateId: string;
    candidateEmail: string;
}

interface Email {
    id: string;
    subject: string;
    body: string;
    from: string;
    to: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'FAILED';
    createdAt: string;
    sentAt?: string;
    user?: {
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    attachments: {
        id: string;
        filename: string;
        url: string;
    }[];
}

const CandidateEmails: React.FC<CandidateEmailsProps> = ({ candidateId, candidateEmail }) => {
    const { data: emailsResponse, isLoading, refetch } = useQuery({
        queryKey: ['candidate-emails', candidateId],
        queryFn: () => communicationApi.getCandidateEmails(candidateId),
    });

    const emails = emailsResponse?.data?.data || [];

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading emails...</div>;
    }

    return (
        <div className="space-y-6">
            {/* List */}
            <div className="space-y-6">
                {!emails || emails.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <Mail className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No emails yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Start a conversation with this candidate.</p>
                    </div>
                ) : (
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {emails.map((email: Email, emailIdx: number) => (
                                <li key={email.id}>
                                    <div className="relative pb-8">
                                        {emailIdx !== emails.length - 1 ? (
                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${email.direction === 'OUTBOUND' ? 'bg-blue-500' : 'bg-green-500'
                                                    }`}>
                                                    {email.direction === 'OUTBOUND' ? (
                                                        <ArrowUpRight className="h-5 w-5 text-white" />
                                                    ) : (
                                                        <ArrowDownLeft className="h-5 w-5 text-white" />
                                                    )}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div className="w-full">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-sm font-medium text-gray-900">
                                                            {email.subject}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 whitespace-nowrap">
                                                            {format(new Date(email.createdAt), 'MMM d, yyyy h:mm a')}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {email.direction === 'OUTBOUND'
                                                            ? `Sent by ${email.user?.firstName || 'System'} to ${email.to}`
                                                            : `Received from ${email.from}`}
                                                    </p>
                                                    <div
                                                        className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200 prose prose-sm max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: email.body }}
                                                    />
                                                    {/* Attachments */}
                                                    {email.attachments && email.attachments.length > 0 && (
                                                        <div className="mt-3 flex gap-2">
                                                            {email.attachments.map(att => (
                                                                <div key={att.id} className="flex items-center p-2 bg-white border border-gray-200 rounded text-xs text-blue-600">
                                                                    <File className="h-4 w-4 mr-1" />
                                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                                        {att.filename}
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 pt-6">
                <EmailComposer
                    candidateId={candidateId}
                    candidateEmail={candidateEmail}
                    onSent={refetch}
                />
            </div>
        </div>
    );
};

export default CandidateEmails;
