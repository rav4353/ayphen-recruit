import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '../ui';
import { CandidateForm, CandidateFormData } from '../candidates/CandidateForm';
import { applicationsApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
}

export function ApplicationModal({ isOpen, onClose, jobId, jobTitle }: ApplicationModalProps) {
    const { tenantId } = useParams<{ tenantId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (data: CandidateFormData) => {
        if (!data.resumeUrl) {
            toast.error('Please upload your resume');
            return;
        }

        setIsSubmitting(true);
        try {
            await applicationsApi.createPublic({
                jobId,
                tenantId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                currentTitle: data.currentTitle,
                currentCompany: data.currentCompany,
                location: data.location,
                linkedinUrl: data.linkedinUrl,
                portfolioUrl: data.portfolioUrl,
                summary: data.summary,
                skills: data.skills,
                resumeUrl: data.resumeUrl,
                experience: data.experience,
                education: data.education,
                customFields: data.customFields,
                gdprConsent: data.gdprConsent,
                source: 'CAREER_PAGE',
            });

            setIsSuccess(true);
        } catch (error: any) {
            console.error('Application failed', error);
            if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to submit application. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsSuccess(false);
        onClose();
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Application Sent!</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Thank you for applying to <strong>{jobTitle}</strong>. We have received your application and will review it shortly.
                    </p>
                    <Button onClick={handleClose} className="w-full">
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-5xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Apply for {jobTitle}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Please fill out the form below</p>
                    </div>
                    <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <CandidateForm
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitLabel="Submit Application"
                        publicTenantId={tenantId}
                        initialData={{
                            gdprConsent: false,
                            experience: [],
                            education: []
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
