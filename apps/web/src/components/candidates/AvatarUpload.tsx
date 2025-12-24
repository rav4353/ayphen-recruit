import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, User } from 'lucide-react';
import { storageApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    onUploadSuccess: (url: string) => void;
    disabled?: boolean;
}

export function AvatarUpload({ currentAvatarUrl, onUploadSuccess, disabled }: AvatarUploadProps) {
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('common.invalidFileType', 'Please upload an image file.'));
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t('common.fileTooLarge', 'Image size must be less than 2MB.'));
            return;
        }

        setIsUploading(true);
        try {
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            // Upload
            const response = await storageApi.upload(file);
            const url = response.data.data.url;
            onUploadSuccess(url);
            toast.success(t('common.uploadSuccess', 'Image uploaded successfully'));
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(t('common.uploadError', 'Failed to upload image'));
            // Revert preview on error
            setPreviewUrl(currentAvatarUrl || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="relative group">
            <div 
                className={`
                    w-24 h-24 rounded-2xl overflow-hidden cursor-pointer
                    border-2 border-dashed border-neutral-200 dark:border-neutral-700
                    hover:border-primary-500 dark:hover:border-primary-500
                    transition-all duration-200
                    flex items-center justify-center bg-neutral-50 dark:bg-neutral-800
                    ${isUploading ? 'opacity-70' : ''}
                `}
                onClick={handleClick}
            >
                {previewUrl ? (
                    <img 
                        src={previewUrl} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className="w-8 h-8 text-neutral-400" />
                )}

                {/* Overlay */}
                <div className={`
                    absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 
                    group-hover:opacity-100 transition-opacity duration-200 rounded-2xl
                    ${isUploading ? 'opacity-100' : ''}
                `}>
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                        <Camera className="w-6 h-6 text-white" />
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />
        </div>
    );
}
