import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2 } from 'lucide-react';
import { storageApi, aiApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface ResumeUploadProps {
    onUploadSuccess: (url: string) => void;
    onParseSuccess: (data: any) => void;
    onParseError?: (error: any) => void;
    disabled?: boolean;
}

export function ResumeUpload({ onUploadSuccess, onParseSuccess, onParseError, disabled }: ResumeUploadProps) {
    const { t } = useTranslation();
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFile = async (file: File) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
            toast.error(t('candidates.invalidFileType', 'Please upload a PDF or DOCX file.'));
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('candidates.fileTooLarge', 'File size must be less than 5MB.'));
            return;
        }

        setIsUploading(true);
        setUploadProgress(10); // Started

        try {
            // 1. Upload File
            setUploadProgress(30);
            const uploadResponse = await storageApi.upload(file);
            const resumeUrl = uploadResponse.data.data.url;
            onUploadSuccess(resumeUrl);
            setUploadProgress(60);

            // 2. Parse Resume
            const parseResponse = await aiApi.parseResume(file);
            const parsedData = parseResponse.data.data;

            setUploadProgress(100);
            toast.success(t('candidates.parseSuccess', 'Resume uploaded and parsed successfully'));
            onParseSuccess(parsedData);

        } catch (error) {
            console.error('Upload/Parse error:', error);
            toast.error(t('candidates.parseError', 'Failed to process resume'));
            if (onParseError) onParseError(error);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        if (disabled) return;

        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className={`
                relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out
                flex flex-col items-center justify-center text-center cursor-pointer
                ${isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && document.getElementById('resume-upload-input')?.click()}
        >
            <input
                id="resume-upload-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleInputChange}
                disabled={disabled || isUploading}
            />

            {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary-600">{uploadProgress}%</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {uploadProgress < 50 ? t('candidates.uploading', 'Uploading...') : t('candidates.parsing', 'Analyzing resume...')}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t('candidates.pleaseWait', 'Please wait while we extract the details')}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors
                        ${isDragActive ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}
                    `}>
                        <Upload size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                        {t('candidates.clickToUpload', 'Click to upload or drag and drop')}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                        {t('candidates.uploadFormats', 'PDF, DOCX up to 5MB')}
                    </p>
                </>
            )}
        </div>
    );
}
