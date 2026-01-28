import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Camera, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { studentService } from '../../services/studentService';

interface PhotoUploadModalProps {
    studentCode: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PhotoUploadModal = ({ studentCode, studentName, isOpen, onClose, onSuccess }: PhotoUploadModalProps) => {
    const { t } = useTranslation();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        Array.from(files).forEach((file) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMessage(t('students.errors.fileSizeTooBig'));
                return;
            }

            validFiles.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result as string);
                if (newPreviews.length === validFiles.length) {
                    setPreviews([...previews, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });

        setSelectedFiles([...selectedFiles, ...validFiles]);
        setErrorMessage('');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setErrorMessage(t('students.errors.atLeastOnePhoto'));
            return;
        }

        setIsUploading(true);
        setUploadStatus('idle');
        setErrorMessage('');

        try {
            // Create FileList-like object
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(file => dataTransfer.items.add(file));

            await studentService.uploadPhotos(studentCode, dataTransfer.files);

            setUploadStatus('success');
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1500);
        } catch (err: unknown) {
            console.error('Upload error:', err);
            setUploadStatus('error');
            const message = err instanceof Error ? err.message : t('students.errors.uploadFailed');
            setErrorMessage(message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFiles([]);
        setPreviews([]);
        setUploadStatus('idle');
        setErrorMessage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className="min-h-full flex items-start sm:items-center justify-center p-0 sm:p-4">
                <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl 
                              min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-hidden flex flex-col">

                    {/* Header - Sticky */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-100 rounded-lg">
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                    {t('students.uploadPhotoModal.title')}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {studentName} ({studentCode})
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

                        {/* Guidelines */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                                {t('students.uploadPhotoModal.photoGuidelines')}
                            </h3>
                            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                                <li>� {t('students.uploadPhotoModal.photoGuideline1')}</li>
                                <li>� {t('students.uploadPhotoModal.photoGuideline2')}</li>
                                <li>� {t('students.uploadPhotoModal.photoGuideline3')}</li>
                                <li>� {t('students.uploadPhotoModal.photoGuideline4')}</li>
                                <li>� {t('students.uploadPhotoModal.photoGuideline5')}</li>
                            </ul>
                        </div>

                        {/* Upload Area */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center 
                                     hover:border-blue-400 hover:bg-blue-50/50
                                     active:bg-blue-50 transition-colors cursor-pointer"
                        >
                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-600 mb-2 text-sm sm:text-base">
                                <span className="font-semibold text-blue-600">
                                    {t('students.uploadPhotoModal.clickToUpload')}
                                </span>
                                <span className="hidden sm:inline">
                                    {t('students.uploadPhotoModal.orDragandDrop')}
                                </span>
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                                {t('students.uploadPhotoModal.formatAndSize')}
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-800">{errorMessage}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {uploadStatus === 'success' && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-800">{t('students.messages.successUploaded')}</p>
                            </div>
                        )}

                        {/* Preview Grid */}
                        {previews.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-gray-600" />
                                    {t('students.uploadPhotoModal.selectedPhotos')} ({selectedFiles.length})
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full 
                                                         shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 
                                                         transition-opacity active:bg-red-600"
                                            >
                                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                                                {(selectedFiles[index].size / 1024).toFixed(0)} KB
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - Sticky */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-sm text-gray-600 text-center sm:text-left">
                                {selectedFiles.length} {selectedFiles.length === 1 ? t('students.uploadPhotoModal.photo') : t('students.uploadPhotoModal.photos')} {t('students.uploadPhotoModal.selected')}
                            </p>
                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={handleClose}
                                    disabled={isUploading}
                                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-base sm:text-sm
                                             text-gray-700 bg-white border border-gray-300 rounded-lg 
                                             hover:bg-gray-50 active:bg-gray-100
                                             disabled:opacity-50 transition-colors font-medium"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || selectedFiles.length === 0}
                                    className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-base sm:text-sm
                                             bg-cyan-600 text-white rounded-lg 
                                             hover:bg-cyan-700 active:bg-cyan-800
                                             disabled:bg-cyan-400 disabled:cursor-not-allowed 
                                             transition-colors font-medium
                                             flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {t('common.uploading')}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            {t('common.upload')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoUploadModal;