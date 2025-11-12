import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, CheckCircle, AlertCircle, Eye, EyeOff, /*Trash2,*/ RefreshCw } from 'lucide-react';
import { studentService } from '../../services/studentService';
import LoadingSpinner from '../Common/LoadingSpinner';

interface FaceImage {
    imageID: number;
    studentID: number;
    imagePath: string;
    isPrimary: boolean;
    academicYearID: number | null;
    uploadedDate: string;
    isActive: boolean;
}

interface PhotoManagementModalProps {
    studentCode: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
    onPhotoUpdated?: () => void;
}

const PhotoManagementModal = ({
    studentCode,
    studentName,
    isOpen,
    onClose,
    onPhotoUpdated
}: PhotoManagementModalProps) => {
    const [photos, setPhotos] = useState<FaceImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen) {
            loadPhotos();
        }
    }, [isOpen, showInactive]);

    const loadPhotos = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await studentService.getStudentPhotos(studentCode, showInactive);
            setPhotos(data);
        } catch (err: unknown) {
            console.error('Error loading photos:', err);
            setError(err instanceof Error ? err.message : 'Failed to load photos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivatePhoto = async (imageId: number) => {
        try {
            await studentService.deactivatePhoto(imageId);
            setSuccessMessage('Photo deactivated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            await loadPhotos();
            onPhotoUpdated?.();
        } catch (err: unknown) {
            console.error('Error deactivating photo:', err);
            setError(err instanceof Error ? err.message : 'Failed to deactivate photo');
        }
    };

    const handleActivatePhoto = async (imageId: number) => {
        try {
            await studentService.activatePhoto(imageId);
            setSuccessMessage('Photo activated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            await loadPhotos();
            onPhotoUpdated?.();
        } catch (err: unknown) {
            console.error('Error activating photo:', err);
            setError(err instanceof Error ? err.message : 'Failed to activate photo');
        }
    };

    //const handleDeletePhoto = async (imageId: number) => {
    //    if (!confirm('Are you sure you want to permanently delete this photo? This action cannot be undone.')) {
    //        return;
    //    }

    //    try {
    //        await studentService.deletePhoto(imageId);
    //        setSuccessMessage('Photo permanently deleted');
    //        setTimeout(() => setSuccessMessage(''), 3000);
    //        await loadPhotos();
    //        onPhotoUpdated?.();
    //    } catch (err: unknown) {
    //        console.error('Error deleting photo:', err);
    //        setError(err instanceof Error ? err.message : 'Failed to delete photo');
    //    }
    //};

    const handleBulkDeactivate = async () => {
        if (selectedPhotos.size === 0) {
            setError('Please select at least one photo');
            return;
        }

        if (!confirm(`Are you sure you want to deactivate ${selectedPhotos.size} photo(s)?`)) {
            return;
        }

        try {
            await studentService.bulkDeactivatePhotos(Array.from(selectedPhotos));
            setSuccessMessage(`Successfully deactivated ${selectedPhotos.size} photo(s)`);
            setTimeout(() => setSuccessMessage(''), 3000);
            setSelectedPhotos(new Set());
            await loadPhotos();
            onPhotoUpdated?.();
        } catch (err: unknown) {
            console.error('Error bulk deactivating photos:', err);
            setError(err instanceof Error ? err.message : 'Failed to deactivate photos');
        }
    };

    const togglePhotoSelection = (imageId: number) => {
        const newSelection = new Set(selectedPhotos);
        if (newSelection.has(imageId)) {
            newSelection.delete(imageId);
        } else {
            newSelection.add(imageId);
        }
        setSelectedPhotos(newSelection);
    };

    /**
     * ⭐ FIXED: Construct proper image URL
     * Converts Windows path to HTTP URL
     */
    const getImageUrl = (imagePath: string) => {
        // Get API base URL from environment or use default
        //const apiUrl = "";//import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Convert Windows path to web path
        // From: "Uploads\FaceImages\STU001\image.jpg"
        // To:   "http://localhost:5000/uploads/FaceImages/STU001/image.jpg"

        // Replace backslashes with forward slashes
        let webPath = imagePath.replace(/\\/g, '/');

        // Remove drive letter if present (C:\Users\...)
        if (webPath.includes(':')) {
            // Extract only the relevant part after the project root
            const uploadsIndex = webPath.toLowerCase().indexOf('uploads');
            if (uploadsIndex !== -1) {
                webPath = webPath.substring(uploadsIndex);
            }
        }

        // Ensure path starts with "Uploads" (capital U)
        //if (!webPath.toLowerCase().startsWith('uploads')) {
        //    webPath = 'Uploads/' + webPath;
        //}

        // Construct full URL
        const fullUrl = `${webPath}`; //`${apiUrl}/${webPath}`;

        console.log('Image URL:', fullUrl); // Debug log
        return fullUrl;
    };

    if (!isOpen) return null;

    const activePhotos = photos.filter(p => p.isActive);
    const inactivePhotos = photos.filter(p => !p.isActive);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-blue-600" />
                                Manage Photos
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {studentName} ({studentCode})
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    {/* Stats and Controls */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Active: {activePhotos.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-gray-700">Inactive: {inactivePhotos.length}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowInactive(!showInactive)}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${showInactive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                {showInactive ? 'Showing All' : 'Show Inactive'}
                            </button>

                            {selectedPhotos.size > 0 && (
                                <button
                                    onClick={handleBulkDeactivate}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <EyeOff className="w-4 h-4" />
                                    Deactivate ({selectedPhotos.size})
                                </button>
                            )}

                            <button
                                onClick={loadPhotos}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-red-800">{error}</p>
                                <button
                                    onClick={() => setError('')}
                                    className="text-xs text-red-600 underline mt-1"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-green-800">{successMessage}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No photos found for this student</p>
                            <p className="text-sm text-gray-400 mt-1">Upload some photos to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo) => (
                                <div
                                    key={photo.imageID}
                                    className={`relative group border-2 rounded-lg overflow-hidden ${photo.isActive ? 'border-green-200' : 'border-red-200 opacity-60'
                                        } ${selectedPhotos.has(photo.imageID) ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    {photo.isActive && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedPhotos.has(photo.imageID)}
                                                onChange={() => togglePhotoSelection(photo.imageID)}
                                                className="w-5 h-5 rounded cursor-pointer"
                                            />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2 z-10">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${photo.isActive
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                                }`}
                                        >
                                            {photo.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Image */}
                                    <img
                                        src={getImageUrl(photo.imagePath)}
                                        alt={`Photo ${photo.imageID}`}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // Prevent infinite loop
                                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                            console.error('Failed to load image:', photo.imagePath);
                                        }}
                                        loading="lazy"
                                    />

                                    {/* Action Buttons */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-2 justify-center">
                                            {photo.isActive ? (
                                                <button
                                                    onClick={() => handleDeactivatePhoto(photo.imageID)}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs flex items-center gap-1"
                                                    title="Deactivate this photo"
                                                >
                                                    <EyeOff className="w-3 h-3" />
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivatePhoto(photo.imageID)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs flex items-center gap-1"
                                                    title="Activate this photo"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Activate
                                                </button>
                                            )}

                                            {/*<button*/}
                                            {/*    onClick={() => handleDeletePhoto(photo.imageID)}*/}
                                            {/*    className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors text-xs flex items-center gap-1"*/}
                                            {/*    title="Permanently delete this photo"*/}
                                            {/*>*/}
                                            {/*    <Trash2 className="w-3 h-3" />*/}
                                            {/*    Delete*/}
                                            {/*</button>*/}
                                        </div>
                                    </div>

                                    {/* Upload Date */}
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                        {new Date(photo.uploadedDate).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">About Photo Management:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>Active photos</strong> are used for face recognition training</li>
                            <li>• <strong>Deactivated photos</strong> are excluded from training but kept in database</li>
                            <li>• Deactivate wrong/poor quality photos to improve recognition accuracy</li>
                            <li>• You can reactivate photos anytime if needed</li>
                            <li>• Permanently deleted photos cannot be recovered</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoManagementModal;