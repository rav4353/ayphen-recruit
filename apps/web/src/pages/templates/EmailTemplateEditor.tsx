import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { settingsApi } from '../../lib/api';
import { Button, Input } from '../../components/ui';
import { Save, ArrowLeft, Copy, Upload, X, Image, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDER_CATEGORIES = [
    {
        category: 'Candidate',
        items: [
            { label: 'Candidate Name', value: '{{CandidateName}}' },
            { label: 'Candidate First Name', value: '{{CandidateFirstName}}' },
            { label: 'Candidate Last Name', value: '{{CandidateLastName}}' },
            { label: 'Candidate Email', value: '{{CandidateEmail}}' },
            { label: 'Candidate Phone', value: '{{CandidatePhone}}' },
            { label: 'Candidate Address', value: '{{CandidateAddress}}' },
            { label: 'Current Position', value: '{{CurrentPosition}}' },
            { label: 'Current Company', value: '{{CurrentCompany}}' },
        ]
    },
    {
        category: 'Job',
        items: [
            { label: 'Job Title', value: '{{JobTitle}}' },
            { label: 'Job ID', value: '{{JobId}}' },
            { label: 'Department', value: '{{Department}}' },
            { label: 'Location', value: '{{Location}}' },
            { label: 'Employment Type', value: '{{EmploymentType}}' },
            { label: 'Salary Range', value: '{{SalaryRange}}' },
        ]
    },
    {
        category: 'Interview',
        items: [
            { label: 'Interview Date', value: '{{InterviewDate}}' },
            { label: 'Interview Time', value: '{{InterviewTime}}' },
            { label: 'Interview Duration', value: '{{InterviewDuration}}' },
            { label: 'Interview Type', value: '{{InterviewType}}' },
            { label: 'Interviewer Name', value: '{{InterviewerName}}' },
            { label: 'Interviewer Email', value: '{{InterviewerEmail}}' },
            { label: 'Meeting Link', value: '{{MeetingLink}}' },
            { label: 'Meeting Location', value: '{{MeetingLocation}}' },
        ]
    },
    {
        category: 'Company',
        items: [
            { label: 'Company Name', value: '{{CompanyName}}' },
            { label: 'Company Website', value: '{{CompanyWebsite}}' },
            { label: 'Company Address', value: '{{CompanyAddress}}' },
            { label: 'Company Phone', value: '{{CompanyPhone}}' },
            { label: 'Company Email', value: '{{CompanyEmail}}' },
        ]
    },
    {
        category: 'Recruiter',
        items: [
            { label: 'Recruiter Name', value: '{{RecruiterName}}' },
            { label: 'Recruiter Email', value: '{{RecruiterEmail}}' },
            { label: 'Recruiter Phone', value: '{{RecruiterPhone}}' },
            { label: 'Hiring Manager', value: '{{HiringManager}}' },
            { label: 'Hiring Manager Email', value: '{{HiringManagerEmail}}' },
        ]
    },
    {
        category: 'Offer',
        items: [
            { label: 'Offer Amount', value: '{{OfferAmount}}' },
            { label: 'Start Date', value: '{{StartDate}}' },
            { label: 'Offer Expiry Date', value: '{{OfferExpiryDate}}' },
            { label: 'Offer Link', value: '{{OfferLink}}' },
            { label: 'Benefits Summary', value: '{{BenefitsSummary}}' },
        ]
    },
    {
        category: 'Dates',
        items: [
            { label: 'Current Date', value: '{{CurrentDate}}' },
            { label: 'Application Date', value: '{{ApplicationDate}}' },
            { label: 'Days Since Applied', value: '{{DaysSinceApplied}}' },
        ]
    },
];

const EMAIL_TYPES = [
    { value: 'general', label: 'General' },
    { value: 'application_received', label: 'Application Received' },
    { value: 'interview', label: 'Interview Invitation' },
    { value: 'interview_reminder', label: 'Interview Reminder' },
    { value: 'interview_feedback', label: 'Interview Feedback Request' },
    { value: 'rejection', label: 'Rejection' },
    { value: 'offer', label: 'Offer Related' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'referral', label: 'Referral Request' },
];

export function EmailTemplateEditor() {
    const { tenantId, templateId } = useParams<{ tenantId: string; templateId: string }>();
    const navigate = useNavigate();
    const isEditMode = templateId && templateId !== 'new';

    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('general');
    const [letterhead, setLetterhead] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await settingsApi.getByKey('email_templates');
            // Handle different API response structures
            const value = response.data?.data?.value || response.data?.value || response.data || [];
            const data = Array.isArray(value) ? value : [];
            setTemplates(data);
            
            if (isEditMode) {
                const template = data.find((t: any) => t.id === templateId);
                if (template) {
                    setName(template.name || '');
                    setSubject(template.subject || '');
                    setBody(template.body || '');
                    setType(template.type || 'general');
                    setLetterhead(template.letterhead || null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };

    const handleSave = async () => {
        if (!name || !subject) {
            toast.error('Please enter template name and subject');
            return;
        }

        setLoading(true);
        try {
            const templateData = {
                id: isEditMode ? templateId : Date.now().toString(),
                name,
                subject,
                body,
                type,
                letterhead,
                createdAt: isEditMode ? templates.find(t => t.id === templateId)?.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            let newTemplates;
            if (isEditMode) {
                newTemplates = templates.map(t => t.id === templateId ? templateData : t);
            } else {
                newTemplates = [...templates, templateData];
            }

            await settingsApi.update('email_templates', { value: newTemplates, category: 'TEMPLATES' });
            toast.success(isEditMode ? 'Template updated' : 'Template created');
            navigate(`/${tenantId}/settings?tab=templates`);
        } catch (error) {
            console.error('Failed to save template', error);
            toast.error('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const copyPlaceholder = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success(`Copied ${value}`);
    };

    const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLetterhead(reader.result as string);
                toast.success('Letterhead uploaded');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/${tenantId}/settings?tab=templates`)}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {isEditMode ? 'Edit Email Template' : 'Create Email Template'}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPreview(true)}>
                        <Eye size={16} className="mr-2" />
                        Preview
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save size={16} className="mr-2" />
                        {loading ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                <div className="flex-1 flex flex-col gap-4 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Template Name *
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Interview Invitation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            >
                                {EMAIL_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Email Subject *
                        </label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Interview Invitation for {{JobTitle}} at {{CompanyName}}"
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-[300px]">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Email Body
                        </label>
                        <div className="flex-1">
                            <ReactQuill
                                theme="snow"
                                value={body}
                                onChange={setBody}
                                className="h-full"
                                placeholder="Write your email template here..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'align': [] }],
                                        ['link'],
                                        ['clean']
                                    ]
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-72 flex flex-col gap-4">
                    {/* Letterhead Upload */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                            <Image size={16} /> Letterhead
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                            Upload a letterhead to wrap your email content.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLetterheadUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        {letterhead ? (
                            <div className="relative">
                                <img src={letterhead} alt="Letterhead" className="w-full h-24 object-contain border rounded-lg bg-neutral-50 dark:bg-neutral-800" />
                                <button
                                    onClick={() => setLetterhead(null)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center gap-2"
                            >
                                <Upload size={20} className="text-neutral-400" />
                                <span className="text-xs text-neutral-500">Click to upload</span>
                            </button>
                        )}
                    </div>

                    {/* Placeholders */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-y-auto flex-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Placeholders</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                            Click to copy. Use in subject or body.
                        </p>
                        <div className="space-y-4">
                            {PLACEHOLDER_CATEGORIES.map((cat) => (
                                <div key={cat.category}>
                                    <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{cat.category}</h4>
                                    <div className="space-y-1">
                                        {cat.items.map((placeholder) => (
                                            <button
                                                key={placeholder.value}
                                                onClick={() => copyPlaceholder(placeholder.value)}
                                                className="w-full flex items-center justify-between p-1.5 text-sm text-left rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                                            >
                                                <span className="text-neutral-700 dark:text-neutral-300 text-xs">
                                                    {placeholder.label}
                                                </span>
                                                <Copy size={10} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">Email Preview</h3>
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {letterhead && (
                                <div className="mb-4">
                                    <img src={letterhead} alt="Letterhead" className="w-full max-h-32 object-contain" />
                                </div>
                            )}
                            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                {/* Email Header */}
                                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-neutral-500">To:</span>
                                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{'{{CandidateEmail}}'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-neutral-500">Subject:</span>
                                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{subject || 'No subject'}</span>
                                    </div>
                                </div>
                                {/* Email Body */}
                                <div className="p-6 bg-white dark:bg-neutral-900">
                                    <div 
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: body || '<p class="text-neutral-400">No content yet...</p>' }}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500 mt-4 text-center">
                                Note: Placeholders like {'{{CandidateName}}'} will be replaced with actual values when sending.
                            </p>
                        </div>
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
                            <Button variant="outline" onClick={() => setShowPreview(false)}>
                                Close Preview
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
