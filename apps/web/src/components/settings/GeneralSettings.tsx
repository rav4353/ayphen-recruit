import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    Card,
    CardHeader,
    CardContent,
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui';
import { Plus, Trash2, Upload, Building2, Languages, MapPin, Users, Edit } from 'lucide-react';
import { settingsApi, storageApi, referenceApi } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, ConfirmationModal } from '../ui';
import { useOrganizationStore } from '../../stores/organization';

// Location Modal Component
const LocationModal = ({ isOpen, onClose, initialData, onSubmit, isLoading }: {
    isOpen: boolean;
    onClose: () => void;
    initialData: any;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        timezone: '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData?.name || '',
                address: initialData?.address || '',
                city: initialData?.city || '',
                state: initialData?.state || '',
                country: initialData?.country || '',
                timezone: initialData?.timezone || '',
            });
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Location' : 'Add Location'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Location Name *</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. San Francisco Office"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">City</label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="San Francisco"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">State/Province</label>
                        <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="California"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Country *</label>
                    <input
                        type="text"
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="United States"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Address</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Market Street"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Timezone</label>
                    <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select timezone</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                        <option value="Europe/Paris">Central European Time (CET)</option>
                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                        <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                        <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>{initialData ? 'Save Changes' : 'Add Location'}</Button>
                </div>
            </form>
        </Modal>
    );
};

// Department Modal Component
const DepartmentModal = ({ isOpen, onClose, initialData, onSubmit, isLoading }: {
    isOpen: boolean;
    onClose: () => void;
    initialData: any;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}) => {
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
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Department' : 'Add Department'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Department Name *</label>
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
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Department Code</label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. ENG"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Optional short code for the department</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>{initialData ? 'Save Changes' : 'Add Department'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const orgProfileSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    website: z.string(),
    industry: z.string(),
    description: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

const localizationSchema = z.object({
    timezone: z.string(),
    currency: z.string(),
    dateFormat: z.string(),
    language: z.string(),
    weekStartsOn: z.string(),
    numberFormat: z.string(),
});

type OrgProfileForm = z.infer<typeof orgProfileSchema>;
type LocalizationForm = z.infer<typeof localizationSchema>;

const TIMEZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'EST (Eastern Standard Time)' },
    { value: 'America/Chicago', label: 'CST (Central Standard Time)' },
    { value: 'America/Denver', label: 'MST (Mountain Standard Time)' },
    { value: 'America/Los_Angeles', label: 'PST (Pacific Standard Time)' },
    { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
    { value: 'Europe/Paris', label: 'CET (Central European Time)' },
    { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
    { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
    { value: 'Asia/Shanghai', label: 'CST (China Standard Time)' },
    { value: 'Australia/Sydney', label: 'AEST (Australian Eastern Time)' },
];

const CURRENCIES = [
    { value: 'USD', label: 'USD ($) - US Dollar', symbol: '$' },
    { value: 'EUR', label: 'EUR (€) - Euro', symbol: '€' },
    { value: 'GBP', label: 'GBP (£) - British Pound', symbol: '£' },
    { value: 'INR', label: 'INR (₹) - Indian Rupee', symbol: '₹' },
    { value: 'JPY', label: 'JPY (¥) - Japanese Yen', symbol: '¥' },
    { value: 'CNY', label: 'CNY (¥) - Chinese Yuan', symbol: '¥' },
    { value: 'AUD', label: 'AUD ($) - Australian Dollar', symbol: '$' },
    { value: 'CAD', label: 'CAD ($) - Canadian Dollar', symbol: '$' },
];

const DATE_FORMATS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)', example: '12/31/2024' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU)', example: '31/12/2024' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)', example: '2024-12-31' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '31-12-2024' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (German)', example: '31.12.2024' },
];

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'zh', label: '中文 (Chinese)' },
];

export function GeneralSettings() {
    const { i18n } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingLocalization, setIsSavingLocalization] = useState(false);
    const { setSettings, setLogoUrl: setStoreLogo } = useOrganizationStore();

    const orgProfileForm = useForm<OrgProfileForm>({
        resolver: zodResolver(orgProfileSchema),
        defaultValues: {
            name: '',
            website: '',
            industry: '',
            description: '',
            phone: '',
            email: '',
            address: '',
        }
    });

    const localizationForm = useForm<LocalizationForm>({
        resolver: zodResolver(localizationSchema),
        defaultValues: {
            timezone: 'UTC',
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            language: 'en',
            weekStartsOn: 'sunday',
            numberFormat: 'en-US',
        }
    });

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await settingsApi.getAll();
                // Handle both wrapped and unwrapped response formats
                const settings = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
                
                console.log('Loaded settings:', settings);
                
                // Find organization profile settings
                const orgProfile = Array.isArray(settings) ? settings.find((s: any) => s.key === 'organization_profile') : null;
                if (orgProfile?.value) {
                    const profile = orgProfile.value;
                    orgProfileForm.reset({
                        name: profile.name || '',
                        website: profile.website || '',
                        industry: profile.industry || '',
                        description: profile.description || '',
                        phone: profile.phone || '',
                        email: profile.email || '',
                        address: profile.address || '',
                    });
                    if (profile.logoUrl) {
                        setLogoUrl(profile.logoUrl);
                        setStoreLogo(profile.logoUrl);
                    }
                    setSettings(profile);
                }

                // Find localization settings
                const localization = Array.isArray(settings) ? settings.find((s: any) => s.key === 'localization') : null;
                if (localization?.value) {
                    const loc = localization.value;
                    localizationForm.reset({
                        timezone: loc.timezone || 'UTC',
                        currency: loc.currency || 'USD',
                        dateFormat: loc.dateFormat || 'MM/DD/YYYY',
                        language: loc.language || 'en',
                        weekStartsOn: loc.weekStartsOn || 'sunday',
                        numberFormat: loc.numberFormat || 'en-US',
                    });
                    setSettings(loc);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        loadSettings();
    }, []);

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size should be less than 2MB');
            return;
        }

        setIsUploadingLogo(true);
        try {
            const response = await storageApi.upload(file);
            const uploadedUrl = response.data?.url || response.data?.data?.url;
            if (uploadedUrl) {
                setLogoUrl(uploadedUrl);
                setStoreLogo(uploadedUrl);
                toast.success('Logo uploaded successfully');
            }
        } catch (error) {
            console.error('Failed to upload logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoUrl(null);
        setStoreLogo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSaveOrgProfile = async (data: OrgProfileForm) => {
        setIsSavingProfile(true);
        try {
            const profileData = {
                ...data,
                logoUrl,
            };
            await settingsApi.update('organization_profile', {
                value: profileData,
                category: 'ORGANIZATION',
                isPublic: true,
            });
            setSettings(profileData);
            toast.success('Organization profile saved successfully');
        } catch (error) {
            console.error('Failed to save organization profile:', error);
            toast.error('Failed to save organization profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const onSaveLocalization = async (data: LocalizationForm) => {
        setIsSavingLocalization(true);
        try {
            await settingsApi.update('localization', {
                value: data,
                category: 'LOCALIZATION',
                isPublic: false,
            });
            setSettings(data);
            // Also update the app language if changed
            if (data.language !== i18n.language) {
                i18n.changeLanguage(data.language);
            }
            toast.success('Localization settings saved successfully');
        } catch (error) {
            console.error('Failed to save localization settings:', error);
            toast.error('Failed to save localization settings');
        } finally {
            setIsSavingLocalization(false);
        }
    };

    const queryClient = useQueryClient();

    // Locations state and queries
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);

    const { data: locations = [], isLoading: locationsLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const response = await referenceApi.getLocations();
            return response.data?.data || response.data || [];
        },
    });

    const createLocationMutation = useMutation({
        mutationFn: (data: any) => referenceApi.createLocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location created successfully');
            setLocationModalOpen(false);
            setEditingLocation(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to create location';
            toast.error(message);
        },
    });

    const updateLocationMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => referenceApi.updateLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location updated successfully');
            setLocationModalOpen(false);
            setEditingLocation(null);
        },
        onError: () => toast.error('Failed to update location'),
    });

    const deleteLocationMutation = useMutation({
        mutationFn: (id: string) => referenceApi.deleteLocation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location deleted successfully');
            setDeleteLocationId(null);
        },
        onError: () => toast.error('Failed to delete location'),
    });

    // Departments state and queries
    const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<any>(null);
    const [deleteDepartmentId, setDeleteDepartmentId] = useState<string | null>(null);

    const { data: departments = [], isLoading: departmentsLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await referenceApi.getDepartments();
            return response.data?.data || response.data || [];
        },
    });

    const createDepartmentMutation = useMutation({
        mutationFn: (data: any) => referenceApi.createDepartment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created successfully');
            setDepartmentModalOpen(false);
            setEditingDepartment(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to create department';
            if (message.includes('Unique constraint') || message.includes('already exists')) {
                toast.error('A department with this name already exists');
            } else {
                toast.error(message);
            }
        },
    });

    const updateDepartmentMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => referenceApi.updateDepartment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department updated successfully');
            setDepartmentModalOpen(false);
            setEditingDepartment(null);
        },
        onError: () => toast.error('Failed to update department'),
    });

    const deleteDepartmentMutation = useMutation({
        mutationFn: (id: string) => referenceApi.deleteDepartment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department deleted successfully');
            setDeleteDepartmentId(null);
        },
        onError: () => toast.error('Failed to delete department'),
    });

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Organization Profile */}
            <Card className="overflow-hidden">
                <CardHeader 
                    title="Organization Profile" 
                    description="Manage your company details. The logo will be displayed in the application header."
                    icon={<Building2 size={20} className="text-blue-500" />}
                    className="border-b border-neutral-100 dark:border-neutral-800" 
                />
                <CardContent className="pt-6">
                    <form onSubmit={orgProfileForm.handleSubmit(onSaveOrgProfile)} className="space-y-6">
                        {/* Logo Upload Section */}
                        <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="relative group">
                                {logoUrl ? (
                                    <div className="relative">
                                        <img 
                                            src={logoUrl} 
                                            alt="Organization Logo" 
                                            className="w-24 h-24 object-contain rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                                        <Building2 size={24} />
                                        <span className="text-xs mt-1">No Logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Company Logo</Label>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        Upload your company logo. Recommended size: 200x200px. Max file size: 2MB.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        isLoading={isUploadingLogo}
                                        className="gap-2"
                                    >
                                        <Upload size={14} />
                                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                                    </Button>
                                    {logoUrl && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={handleRemoveLogo}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Organization Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Organization Name *</Label>
                                <Input {...orgProfileForm.register('name')} error={orgProfileForm.formState.errors.name?.message} placeholder="Enter organization name" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Website</Label>
                                <Input {...orgProfileForm.register('website')} placeholder="https://example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Industry</Label>
                                <Input {...orgProfileForm.register('industry')} placeholder="e.g. Technology, Finance, Healthcare" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</Label>
                                <Input {...orgProfileForm.register('phone')} placeholder="+1 (555) 000-0000" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</Label>
                                <Input {...orgProfileForm.register('email')} type="email" placeholder="contact@company.com" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</Label>
                                <Input {...orgProfileForm.register('address')} placeholder="123 Business St, City, Country" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</Label>
                                <textarea 
                                    {...orgProfileForm.register('description')} 
                                    placeholder="Brief description of your organization..."
                                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-24"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <Button type="submit" isLoading={isSavingProfile}>Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Localization */}
            <Card className="overflow-hidden">
                <CardHeader 
                    title="Localization" 
                    description="Configure timezone, currency, date format, and language preferences for your organization."
                    icon={<Languages size={20} className="text-purple-500" />}
                    className="border-b border-neutral-100 dark:border-neutral-800" 
                />
                <CardContent className="pt-6">
                    <form onSubmit={localizationForm.handleSubmit(onSaveLocalization)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Timezone</Label>
                                <Controller
                                    name="timezone"
                                    control={localizationForm.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEZONES.map((tz) => (
                                                    <SelectItem key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-neutral-500">Used for scheduling and date/time display</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Currency</Label>
                                <Controller
                                    name="currency"
                                    control={localizationForm.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map((curr) => (
                                                    <SelectItem key={curr.value} value={curr.value}>
                                                        {curr.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-neutral-500">Default currency for salary and compensation</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Date Format</Label>
                                <Controller
                                    name="dateFormat"
                                    control={localizationForm.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATE_FORMATS.map((fmt) => (
                                                    <SelectItem key={fmt.value} value={fmt.value}>
                                                        <span className="flex items-center justify-between w-full gap-3">
                                                            <span>{fmt.label}</span>
                                                            <span className="text-neutral-400 text-xs">e.g. {fmt.example}</span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Language</Label>
                                <Controller
                                    name="language"
                                    control={localizationForm.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGES.map((lang) => (
                                                    <SelectItem key={lang.value} value={lang.value}>
                                                        {lang.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-neutral-500">Default language for the application</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Week Starts On</Label>
                                <Controller
                                    name="weekStartsOn"
                                    control={localizationForm.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sunday">Sunday</SelectItem>
                                                <SelectItem value="monday">Monday</SelectItem>
                                                <SelectItem value="saturday">Saturday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-neutral-500">First day of the week in calendars</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Number Format</Label>
                                <Controller
                                    name="numberFormat"
                                    control={localizationForm.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en-US">1,234.56 (US)</SelectItem>
                                                <SelectItem value="de-DE">1.234,56 (German)</SelectItem>
                                                <SelectItem value="fr-FR">1 234,56 (French)</SelectItem>
                                                <SelectItem value="en-IN">1,23,456.78 (Indian)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-neutral-500">How numbers are displayed</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <Button type="submit" isLoading={isSavingLocalization}>Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Locations */}
            <Card className="overflow-hidden">
                <CardHeader 
                    title="Locations" 
                    description="Manage your office locations."
                    icon={<MapPin size={20} className="text-green-500" />}
                    className="border-b border-neutral-100 dark:border-neutral-800" 
                />
                <CardContent className="pt-6 space-y-4">
                    {locationsLoading ? (
                        <div className="text-center py-8 text-neutral-500">Loading locations...</div>
                    ) : locations.length === 0 ? (
                        <div className="text-center py-8">
                            <MapPin className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-2" />
                            <p className="text-neutral-500">No locations added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {locations.map((loc: any) => (
                                <div key={loc.id} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <MapPin size={18} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-neutral-900 dark:text-white">{loc.name}</div>
                                        <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                                            {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                                        </div>
                                        {loc.address && (
                                            <div className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{loc.address}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8"
                                            onClick={() => { setEditingLocation(loc); setLocationModalOpen(true); }}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8"
                                            onClick={() => setDeleteLocationId(loc.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button 
                        variant="outline" 
                        className="w-full gap-2 border-dashed"
                        onClick={() => { setEditingLocation(null); setLocationModalOpen(true); }}
                    >
                        <Plus size={16} /> Add Location
                    </Button>
                </CardContent>
            </Card>

            {/* Location Modal */}
            <LocationModal
                isOpen={locationModalOpen}
                onClose={() => { setLocationModalOpen(false); setEditingLocation(null); }}
                initialData={editingLocation}
                onSubmit={(data) => {
                    if (editingLocation) {
                        updateLocationMutation.mutate({ id: editingLocation.id, data });
                    } else {
                        createLocationMutation.mutate(data);
                    }
                }}
                isLoading={createLocationMutation.isPending || updateLocationMutation.isPending}
            />

            {/* Delete Location Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteLocationId}
                onCancel={() => setDeleteLocationId(null)}
                onConfirm={() => deleteLocationId && deleteLocationMutation.mutate(deleteLocationId)}
                title="Delete Location"
                message="Are you sure you want to delete this location? Jobs using this location may be affected."
                confirmLabel="Delete"
                variant="danger"
            />

            {/* Departments */}
            <Card className="overflow-hidden">
                <CardHeader 
                    title="Departments" 
                    description="Manage your organization's departments."
                    icon={<Users size={20} className="text-orange-500" />}
                    className="border-b border-neutral-100 dark:border-neutral-800" 
                />
                <CardContent className="pt-6 space-y-4">
                    {departmentsLoading ? (
                        <div className="text-center py-8 text-neutral-500">Loading departments...</div>
                    ) : departments.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-2" />
                            <p className="text-neutral-500">No departments added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {departments.map((dept: any) => (
                                <div key={dept.id} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <Users size={18} className="text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-neutral-900 dark:text-white">{dept.name}</div>
                                        {dept.code && (
                                            <div className="text-sm text-neutral-500 dark:text-neutral-400">Code: {dept.code}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8"
                                            onClick={() => { setEditingDepartment(dept); setDepartmentModalOpen(true); }}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8"
                                            onClick={() => setDeleteDepartmentId(dept.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button 
                        variant="outline" 
                        className="w-full gap-2 border-dashed"
                        onClick={() => { setEditingDepartment(null); setDepartmentModalOpen(true); }}
                    >
                        <Plus size={16} /> Add Department
                    </Button>
                </CardContent>
            </Card>

            {/* Department Modal */}
            <DepartmentModal
                isOpen={departmentModalOpen}
                onClose={() => { setDepartmentModalOpen(false); setEditingDepartment(null); }}
                initialData={editingDepartment}
                onSubmit={(data) => {
                    if (editingDepartment) {
                        updateDepartmentMutation.mutate({ id: editingDepartment.id, data });
                    } else {
                        createDepartmentMutation.mutate(data);
                    }
                }}
                isLoading={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
            />

            {/* Delete Department Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteDepartmentId}
                onCancel={() => setDeleteDepartmentId(null)}
                onConfirm={() => deleteDepartmentId && deleteDepartmentMutation.mutate(deleteDepartmentId)}
                title="Delete Department"
                message="Are you sure you want to delete this department? Users and jobs in this department may be affected."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
