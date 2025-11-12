import { useState } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import api from '../../services/api';
import { authService } from '../../services/authService';

interface AddCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddCameraModal = ({ isOpen, onClose, onSuccess }: AddCameraModalProps) => {
    const [formData, setFormData] = useState({
        cameraName: '',
        location: '',
        rtspUrl: '',
        ipAddress: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.cameraName || !formData.rtspUrl) {
            setError('Camera name and RTSP URL are required');
            return;
        }

        // Get current user's school ID
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.schoolID) {
            setError('Unable to determine school. Please log in again.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Include schoolId in the request
            const requestData = {
                ...formData,
                schoolId: currentUser.schoolID
            };

            console.log('Adding camera with data:', requestData);

            await api.post('/camera', requestData);
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Error adding camera:', err);
            setError('Failed to add camera. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            cameraName: '',
            location: '',
            rtspUrl: '',
            ipAddress: '',
        });
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Camera className="w-6 h-6 text-blue-600" />
                            Add New Camera
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Configure a new camera for monitoring</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Camera Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Camera Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="cameraName"
                            value={formData.cameraName}
                            onChange={handleChange}
                            placeholder="e.g., Main Gate Camera"
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., School Main Entrance"
                            className="input-field"
                        />
                    </div>

                    {/* RTSP URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            RTSP URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="rtspUrl"
                            value={formData.rtspUrl}
                            onChange={handleChange}
                            placeholder="rtsp://admin:password@192.168.1.100:554/stream1"
                            className="input-field"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Example formats:
                            <br />
                            • Hikvision: rtsp://admin:password@ip:554/Streaming/Channels/101
                            <br />
                            • Dahua: rtsp://admin:password@ip:554/cam/realmonitor?channel=1
                            <br />• For testing, use: 0 (for default webcam)
                        </p>
                    </div>

                    {/* IP Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                        <input
                            type="text"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleChange}
                            placeholder="192.168.1.100"
                            className="input-field"
                        />
                    </div>

                    {/* Guidelines */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Camera Setup Tips:</p>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Ensure camera is accessible from this network</li>
                            <li>• Test RTSP URL in VLC Media Player first</li>
                            <li>• Use "0" for testing with your computer's webcam</li>
                            <li>• Camera should have clear view of entry points</li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add Camera
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCameraModal;