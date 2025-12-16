import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { settingsApi } from '../../lib/api';
import { Button, Input } from '../../components/ui';
import { Save, ArrowLeft, Copy, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDER_CATEGORIES = [
    {
        category: 'Job Details',
        items: [
            { label: 'Job Title', value: '{{JobTitle}}' },
            { label: 'Job ID', value: '{{JobId}}' },
            { label: 'Department', value: '{{Department}}' },
            { label: 'Location', value: '{{Location}}' },
            { label: 'Employment Type', value: '{{EmploymentType}}' },
            { label: 'Work Mode', value: '{{WorkMode}}' },
            { label: 'Experience Level', value: '{{ExperienceLevel}}' },
            { label: 'Reports To', value: '{{ReportsTo}}' },
        ]
    },
    {
        category: 'Compensation',
        items: [
            { label: 'Salary Range', value: '{{SalaryRange}}' },
            { label: 'Min Salary', value: '{{MinSalary}}' },
            { label: 'Max Salary', value: '{{MaxSalary}}' },
            { label: 'Currency', value: '{{Currency}}' },
            { label: 'Pay Frequency', value: '{{PayFrequency}}' },
            { label: 'Benefits', value: '{{Benefits}}' },
            { label: 'Bonus', value: '{{Bonus}}' },
            { label: 'Equity', value: '{{Equity}}' },
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
            { label: 'Industry', value: '{{Industry}}' },
        ]
    },
    {
        category: 'Team',
        items: [
            { label: 'Manager Name', value: '{{ManagerName}}' },
            { label: 'Team Name', value: '{{TeamName}}' },
            { label: 'Team Size', value: '{{TeamSize}}' },
            { label: 'Hiring Manager', value: '{{HiringManager}}' },
            { label: 'Recruiter Name', value: '{{RecruiterName}}' },
            { label: 'Recruiter Email', value: '{{RecruiterEmail}}' },
        ]
    },
    {
        category: 'Dates',
        items: [
            { label: 'Posted Date', value: '{{PostedDate}}' },
            { label: 'Application Deadline', value: '{{ApplicationDeadline}}' },
            { label: 'Start Date', value: '{{StartDate}}' },
            { label: 'Current Date', value: '{{CurrentDate}}' },
        ]
    },
];

export function JobDescriptionTemplateEditor() {
    const { tenantId, templateId } = useParams<{ tenantId: string; templateId: string }>();
    const navigate = useNavigate();
    const isEditMode = templateId && templateId !== 'new';

    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [responsibilities, setResponsibilities] = useState('');
    const [letterhead, setLetterhead] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await settingsApi.getByKey('job_description_templates');
            // Handle different API response structures
            const value = response.data?.data?.value || response.data?.value || response.data || [];
            const data = Array.isArray(value) ? value : [];
            setTemplates(data);

            if (isEditMode) {
                const template = data.find((t: any) => t.id === templateId);
                if (template) {
                    setName(template.name || '');
                    setDepartment(template.department || '');
                    setDescription(template.description || '');
                    setRequirements(template.requirements || '');
                    setResponsibilities(template.responsibilities || '');
                    setLetterhead(template.letterhead || null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };

    const handleSave = async () => {
        if (!name) {
            toast.error('Please enter a template name');
            return;
        }

        setLoading(true);
        try {
            const templateData = {
                id: isEditMode ? templateId : Date.now().toString(),
                name,
                department,
                description,
                requirements,
                responsibilities,
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

            await settingsApi.update('job_description_templates', { value: newTemplates, category: 'TEMPLATES' });
            toast.success(isEditMode ? 'Template updated' : 'Template created');
            navigate(`/${tenantId}/settings?tab=templates&view=jobs`);
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
                    <Button variant="ghost" onClick={() => navigate(`/${tenantId}/settings?tab=templates&view=jobs`)}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {isEditMode ? 'Edit Job Description Template' : 'Create Job Description Template'}
                    </h1>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Save size={16} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Template'}
                </Button>
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
                                placeholder="e.g., Software Engineer Template"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Department
                            </label>
                            <Input
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g., Engineering"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[200px]">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Job Description
                        </label>
                        <div className="flex-1">
                            <ReactQuill
                                theme="snow"
                                value={description}
                                onChange={setDescription}
                                className="h-[150px]"
                                placeholder="Describe the role and what the candidate will be doing..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[200px] mt-12">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Requirements
                        </label>
                        <div className="flex-1">
                            <ReactQuill
                                theme="snow"
                                value={requirements}
                                onChange={setRequirements}
                                className="h-[150px]"
                                placeholder="List the qualifications and skills required..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[200px] mt-12">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Responsibilities
                        </label>
                        <div className="flex-1">
                            <ReactQuill
                                theme="snow"
                                value={responsibilities}
                                onChange={setResponsibilities}
                                className="h-[150px]"
                                placeholder="List the key responsibilities..."
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
                            Upload a letterhead image to be used as background.
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
                            Click to copy placeholders to clipboard.
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
        </div>
    );
}
