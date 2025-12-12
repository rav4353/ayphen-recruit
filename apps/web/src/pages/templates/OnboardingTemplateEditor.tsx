import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { settingsApi } from '../../lib/api';
import { Button, Input } from '../../components/ui';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Copy, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
    id: string;
    title: string;
    description: string;
    dueInDays: number;
    assignee: string;
}

const PLACEHOLDER_CATEGORIES = [
    {
        category: 'New Hire',
        items: [
            { label: 'Employee Name', value: '{{EmployeeName}}' },
            { label: 'Employee First Name', value: '{{EmployeeFirstName}}' },
            { label: 'Employee Last Name', value: '{{EmployeeLastName}}' },
            { label: 'Employee Email', value: '{{EmployeeEmail}}' },
            { label: 'Employee Phone', value: '{{EmployeePhone}}' },
            { label: 'Employee ID', value: '{{EmployeeId}}' },
        ]
    },
    {
        category: 'Position',
        items: [
            { label: 'Job Title', value: '{{JobTitle}}' },
            { label: 'Department', value: '{{Department}}' },
            { label: 'Team', value: '{{Team}}' },
            { label: 'Location', value: '{{Location}}' },
            { label: 'Work Mode', value: '{{WorkMode}}' },
        ]
    },
    {
        category: 'Manager & Team',
        items: [
            { label: 'Manager Name', value: '{{ManagerName}}' },
            { label: 'Manager Email', value: '{{ManagerEmail}}' },
            { label: 'Buddy Name', value: '{{BuddyName}}' },
            { label: 'Buddy Email', value: '{{BuddyEmail}}' },
            { label: 'HR Contact', value: '{{HRContact}}' },
            { label: 'IT Contact', value: '{{ITContact}}' },
        ]
    },
    {
        category: 'Dates',
        items: [
            { label: 'Start Date', value: '{{StartDate}}' },
            { label: 'First Day', value: '{{FirstDay}}' },
            { label: 'Week Number', value: '{{WeekNumber}}' },
            { label: 'Current Date', value: '{{CurrentDate}}' },
            { label: 'Probation End Date', value: '{{ProbationEndDate}}' },
        ]
    },
    {
        category: 'Company',
        items: [
            { label: 'Company Name', value: '{{CompanyName}}' },
            { label: 'Office Address', value: '{{OfficeAddress}}' },
            { label: 'WiFi Password', value: '{{WiFiPassword}}' },
            { label: 'Slack Channel', value: '{{SlackChannel}}' },
            { label: 'Portal Link', value: '{{PortalLink}}' },
        ]
    },
];

export function OnboardingTemplateEditor() {
    const { tenantId, templateId } = useParams<{ tenantId: string; templateId: string }>();
    const navigate = useNavigate();
    const isEditMode = templateId && templateId !== 'new';

    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [description, setDescription] = useState('');
    const [tasks, setTasks] = useState<Task[]>([{ id: '1', title: '', description: '', dueInDays: 1, assignee: '' }]);
    const [letterhead, setLetterhead] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await settingsApi.getByKey('onboarding_templates');
            const data = response.data?.value || [];
            setTemplates(data);
            
            if (isEditMode) {
                const template = data.find((t: any) => t.id === templateId);
                if (template) {
                    setName(template.name || '');
                    setDepartment(template.department || '');
                    setDescription(template.description || '');
                    if (template.tasks && template.tasks.length > 0) {
                        // Convert string tasks to Task objects if needed
                        const formattedTasks = template.tasks.map((t: any, idx: number) => {
                            if (typeof t === 'string') {
                                return { id: String(idx), title: t, description: '', dueInDays: idx + 1, assignee: '' };
                            }
                            return t;
                        });
                        setTasks(formattedTasks);
                    }
                    setLetterhead(template.letterhead || null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };

    const addTask = () => {
        setTasks([...tasks, { 
            id: Date.now().toString(), 
            title: '', 
            description: '', 
            dueInDays: tasks.length + 1, 
            assignee: '' 
        }]);
    };

    const removeTask = (id: string) => {
        if (tasks.length > 1) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const updateTask = (id: string, field: keyof Task, value: string | number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleSave = async () => {
        if (!name) {
            toast.error('Please enter a checklist name');
            return;
        }

        const validTasks = tasks.filter(t => t.title.trim());
        if (validTasks.length === 0) {
            toast.error('Please add at least one task');
            return;
        }

        setLoading(true);
        try {
            const templateData = {
                id: isEditMode ? templateId : Date.now().toString(),
                name,
                department,
                description,
                tasks: validTasks,
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

            await settingsApi.update('onboarding_templates', { value: newTemplates, category: 'TEMPLATES' });
            toast.success(isEditMode ? 'Checklist updated' : 'Checklist created');
            navigate(`/${tenantId}/settings?tab=templates`);
        } catch (error) {
            console.error('Failed to save checklist', error);
            toast.error('Failed to save checklist');
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
                        {isEditMode ? 'Edit Onboarding Checklist' : 'Create Onboarding Checklist'}
                    </h1>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Save size={16} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Checklist'}
                </Button>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">
                <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Checklist Name *
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Engineering Onboarding"
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

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe when this checklist should be used..."
                            className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white min-h-[80px]"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Onboarding Tasks
                            </label>
                            <Button variant="outline" size="sm" onClick={addTask} className="gap-1">
                                <Plus size={14} /> Add Task
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {tasks.map((task, index) => (
                                <div 
                                    key={task.id} 
                                    className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center gap-2 pt-2">
                                            <GripVertical size={16} className="text-neutral-400" />
                                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    value={task.title}
                                                    onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                                                    placeholder="Task title *"
                                                />
                                                <Input
                                                    value={task.assignee}
                                                    onChange={(e) => updateTask(task.id, 'assignee', e.target.value)}
                                                    placeholder="Assignee (e.g., IT Team, Manager)"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="col-span-2">
                                                    <Input
                                                        value={task.description}
                                                        onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                                        placeholder="Task description (optional)"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-neutral-500 whitespace-nowrap">Due in</span>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={task.dueInDays}
                                                        onChange={(e) => updateTask(task.id, 'dueInDays', parseInt(e.target.value) || 1)}
                                                        className="w-20"
                                                    />
                                                    <span className="text-sm text-neutral-500">days</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => removeTask(task.id)}
                                            disabled={tasks.length === 1}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-72 flex flex-col gap-4">
                    {/* Letterhead Upload */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                            <Image size={16} /> Letterhead
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                            Upload a letterhead for printed checklists.
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
                            Use in task titles and descriptions.
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
