import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Label,
    Textarea,
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '../ui';
import { SkillSelector } from '../ui/SkillSelector';
import { PhoneInput } from '../ui/PhoneInput';
import { candidatesApi, storageApi, referralsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle } from 'lucide-react';

const referralSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    phone: z.string(),
    linkedinUrl: z.string().refine(
        (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
        'Invalid URL (must start with http:// or https://)'
    ),
    portfolioUrl: z.string().refine(
        (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
        'Invalid URL (must start with http:// or https://)'
    ),
    location: z.string(),
    currentCompany: z.string(),
    currentTitle: z.string(),
    skills: z.array(z.string()),
    resumeUrl: z.string(),
    notes: z.string(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const DEFAULT_VALUES: ReferralFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    portfolioUrl: '',
    location: '',
    currentCompany: '',
    currentTitle: '',
    skills: [],
    resumeUrl: '',
    notes: ''
};

export function ReferralModal({ isOpen, onClose, onSuccess }: ReferralModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        setError,
        formState: { errors, isDirty }
    } = useForm<ReferralFormData>({
        resolver: zodResolver(referralSchema),
        defaultValues: DEFAULT_VALUES,
        mode: 'onBlur'
    });

    const resumeUrl = watch('resumeUrl');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset(DEFAULT_VALUES);
            setShowConfirmClose(false);
        }
    }, [isOpen, reset]);

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
            const url = response.data.url || response.data.data?.url || response.data.path;

            if (url) {
                setValue('resumeUrl', url, { shouldDirty: true });
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
        reset(DEFAULT_VALUES);
        onClose();
    };

    const onSubmit = async (data: ReferralFormData) => {
        setIsLoading(true);

        try {
            const { notes, ...candidateData } = data;
            
            // Step 1: Create the candidate
            const candidateResponse = await candidatesApi.createReferral({
                ...candidateData,
                summary: notes
            });
            
            // Step 2: Create the referral tracking record
            const candidateId = candidateResponse.data?.data?.id || candidateResponse.data?.id;
            if (candidateId) {
                await referralsApi.create({
                    candidateId,
                    notes: notes || undefined,
                });
            }
            
            toast.success('Referral submitted successfully');
            onSuccess?.();
            reset(DEFAULT_VALUES);
            onClose();
        } catch (error: any) {
            console.error('Failed to submit referral', error);

            if (error.response?.status === 409) {
                setError('email', { message: 'This candidate is already in the system' });
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
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
                    <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-950 z-10">
                        <DialogTitle className="text-xl font-semibold">Refer a Candidate</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-6" noValidate>
                        {/* Section 1: Candidate Details */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                Candidate Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="First Name *"
                                    {...register('firstName')}
                                    error={errors.firstName?.message}
                                />
                                <Input
                                    label="Last Name *"
                                    {...register('lastName')}
                                    error={errors.lastName?.message}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Email *"
                                    type="email"
                                    {...register('email')}
                                    error={errors.email?.message}
                                    placeholder="email@example.com"
                                />
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</Label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <PhoneInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                error={errors.phone?.message}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <Input
                                label="Location"
                                {...register('location')}
                                placeholder="e.g. San Francisco, CA"
                            />
                        </section>

                        {/* Section 2: Professional Profile */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                Professional Profile
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Current Company"
                                    {...register('currentCompany')}
                                />
                                <Input
                                    label="Current Title"
                                    {...register('currentTitle')}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="LinkedIn URL"
                                    type="url"
                                    {...register('linkedinUrl')}
                                    error={errors.linkedinUrl?.message}
                                    placeholder="https://linkedin.com/in/username"
                                />
                                <Input
                                    label="Portfolio URL"
                                    type="url"
                                    {...register('portfolioUrl')}
                                    error={errors.portfolioUrl?.message}
                                    placeholder="https://portfolio.com"
                                />
                            </div>

                            <Controller
                                name="skills"
                                control={control}
                                render={({ field }) => (
                                    <SkillSelector
                                        label="Skills"
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Resume</Label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center transition-all duration-200 group-hover:border-primary-400 group-hover:bg-primary-50/50 dark:group-hover:bg-primary-900/10">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                <Upload size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                                                </p>
                                                <p className="text-xs text-neutral-500 mt-1">
                                                    PDF, DOC, DOCX (max 5MB)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {resumeUrl && (
                                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                                        <CheckCircle size={16} />
                                        <span>Resume uploaded successfully</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 3: Referral Context */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                Referral Context
                            </h3>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Why are you referring this person?
                                </Label>
                                <Textarea
                                    className="min-h-[120px] resize-none"
                                    {...register('notes')}
                                    placeholder="Share how you know them, why they'd be a great fit, their strengths..."
                                />
                            </div>
                        </section>

                        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6 mt-2 border-t border-neutral-200 dark:border-neutral-800">
                            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isLoading || isUploading} className="w-full sm:w-auto">
                                Submit Referral
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmClose} className="bg-amber-600 hover:bg-amber-700">
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
