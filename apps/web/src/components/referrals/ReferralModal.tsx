import { useState, useEffect } from 'react';
import { Modal, Button, Input, ConfirmationModal, SkillSelector } from '../ui';
import { PhoneInput } from '../ui/PhoneInput';
import { candidatesApi, storageApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const INITIAL_DATA = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    portfolioUrl: '',
    location: '',
    currentCompany: '',
    currentTitle: '',
    skills: [] as string[],
    resumeUrl: '',
    notes: ''
};

export function ReferralModal({ isOpen, onClose, onSuccess }: ReferralModalProps) {
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(INITIAL_DATA);
            setIsDirty(false);
            setShowConfirmClose(false);
            setErrors({});
        }
    }, [isOpen]);

    const handleChange = (field: keyof typeof INITIAL_DATA, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        // Clear error when user types
        if (errors[field as string]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const response = await storageApi.upload(file);
            // Assuming response.data.url or similar. Let's check storageApi return type or assume standard
            // storageApi.upload returns axios response. 
            // Based on api.ts: return api.post('/storage/upload', ...)
            // The backend usually returns { url: '...' } or similar.
            // Let's assume response.data.url based on common patterns, or response.data.data.url

            const url = response.data.url || response.data.data?.url || response.data.path;

            if (url) {
                handleChange('resumeUrl', url);
                toast.success('Resume uploaded');
            } else {
                throw new Error('No URL returned');
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload resume');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (isDirty) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setShowConfirmClose(false);
        setIsDirty(false);
        onClose();
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (formData.linkedinUrl && !/^https?:\/\//.test(formData.linkedinUrl)) {
            newErrors.linkedinUrl = 'Invalid URL (must start with http:// or https://)';
        }

        if (formData.portfolioUrl && !/^https?:\/\//.test(formData.portfolioUrl)) {
            newErrors.portfolioUrl = 'Invalid URL (must start with http:// or https://)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsLoading(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { notes, ...candidateData } = formData;
            await candidatesApi.createReferral({
                ...candidateData,
                summary: notes
            });
            toast.success('Referral submitted successfully');
            onSuccess?.();
            setIsDirty(false);
            onClose();
            setFormData(INITIAL_DATA);
        } catch (error: any) {
            console.error('Failed to submit referral', error);

            if (error.response?.status === 409) {
                setErrors(prev => ({
                    ...prev,
                    email: 'This candidate is already in the system'
                }));
                toast.error('Candidate already exists');
            } else {
                toast.error('Failed to submit referral');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} title="Refer a Candidate" className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                    {/* Section 1: Candidate Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
                            Candidate Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    label="First Name *"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    error={errors.firstName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    label="Last Name *"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                    error={errors.lastName}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    label="Email *"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    error={errors.email}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                                    Phone
                                </label>
                                <PhoneInput
                                    value={formData.phone}
                                    onChange={(value: string) => handleChange('phone', value)}
                                    error={errors.phone}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Input
                                label="Location"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="e.g. San Francisco, CA"
                            />
                        </div>
                    </div>

                    {/* Section 2: Professional Profile */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
                            Professional Profile
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    label="Current Company"
                                    value={formData.currentCompany}
                                    onChange={(e) => handleChange('currentCompany', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    label="Current Title"
                                    value={formData.currentTitle}
                                    onChange={(e) => handleChange('currentTitle', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    label="LinkedIn URL"
                                    type="url"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                                    error={errors.linkedinUrl}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    label="Portfolio URL"
                                    type="url"
                                    value={formData.portfolioUrl}
                                    onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                                    error={errors.portfolioUrl}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <SkillSelector
                                label="Skills"
                                value={formData.skills}
                                onChange={(skills) => setFormData(prev => ({ ...prev, skills }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Resume</label>
                            <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-center relative">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                    </div>
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        PDF, DOC, DOCX up to 5MB
                                    </div>
                                </div>
                            </div>
                            {formData.resumeUrl && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md border border-green-100 dark:border-green-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    Resume uploaded successfully
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Referral Context */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
                            Referral Context
                        </h3>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Why are you referring this person?</label>
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Tell us why they would be a good fit, how you know them, etc..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading || isUploading}>Submit Referral</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={showConfirmClose}
                onCancel={() => setShowConfirmClose(false)}
                onConfirm={confirmClose}
                title="Discard Changes?"
                message="You have unsaved changes. Are you sure you want to discard them?"
                confirmLabel="Discard"
                cancelLabel="Keep Editing"
                variant="warning"
            />
        </>
    );
}
