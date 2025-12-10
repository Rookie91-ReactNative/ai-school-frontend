import { useState } from 'react';
import { Camera, X, Plus, Video, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { authService } from '../../services/authService';

interface AddCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddCameraModal = ({ isOpen, onClose, onSuccess }: AddCameraModalProps) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        cameraName: '',
        location: '',
        cameraType: 1, // 1=RTSP, 2=P6SAI
        rtspUrl: '',
        ipAddress: '',
        deviceSerial: '', // For P6SAI cameras
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.name === 'cameraType' ? parseInt(e.target.value) : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.cameraName) {
            setError(t('cameras.cameraNameRequired'));
            return;
        }

        // Validate based on camera type
        if (formData.cameraType === 1 && !formData.rtspUrl) {
            setError(t('cameras.rtspRequired'));
            return;
        }

        if (formData.cameraType === 2 && !formData.deviceSerial) {
            setError(t('cameras.deviceSerialRequired'));
            return;
        }

        // Get current user's school ID
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.schoolID) {
            setError(t('cameras.unableToGetSchool'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Send empty strings instead of null for unused fields
            const requestData = {
                cameraName: formData.cameraName,
                location: formData.location,
                cameraType: formData.cameraType,
                rtspUrl: formData.cameraType === 1 ? formData.rtspUrl : '',
                ipAddress: formData.ipAddress || '',
                deviceSerial: formData.cameraType === 2 ? formData.deviceSerial : '',
                schoolId: currentUser.schoolID
            };

            console.log('Adding camera with data:', requestData);

            await api.post('/camera', requestData);
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Error adding camera:', err);
            setError(t('cameras.addCameraError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            cameraName: '',
            location: '',
            cameraType: 1,
            rtspUrl: '',
            ipAddress: '',
            deviceSerial: '',
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
                            {t('cameras.addCameraModalTitle')}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{t('cameras.addCameraModalSubtitle')}</p>
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

                    {/* Camera Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('cameras.cameraType')} <span className="text-red-500">{t('cameras.required')}</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* RTSP Camera Option */}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, cameraType: 1 })}
                                className={`p-4 border-2 rounded-lg transition-all ${formData.cameraType === 1
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Video className={`w-6 h-6 mx-auto mb-2 ${formData.cameraType === 1 ? 'text-blue-600' : 'text-gray-400'
                                    }`} />
                                <div className="text-sm font-medium text-gray-900">
                                    {t('cameras.cameraTypeRTSP')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {t('cameras.traditionalIPCamera')}
                                </div>
                            </button>

                            {/* P6SAI Camera Option */}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, cameraType: 2 })}
                                className={`p-4 border-2 rounded-lg transition-all ${formData.cameraType === 2
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Brain className={`w-6 h-6 mx-auto mb-2 ${formData.cameraType === 2 ? 'text-purple-600' : 'text-gray-400'
                                    }`} />
                                <div className="text-sm font-medium text-gray-900">
                                    {t('cameras.cameraTypeP6SAI')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {t('cameras.aiFaceRecognition')}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Camera Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('cameras.cameraName')} <span className="text-red-500">{t('cameras.required')}</span>
                        </label>
                        <input
                            type="text"
                            name="cameraName"
                            value={formData.cameraName}
                            onChange={handleChange}
                            placeholder={t('cameras.cameraNamePlaceholder')}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('cameras.location')}
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder={t('cameras.locationPlaceholder')}
                            className="input-field"
                        />
                    </div>

                    {/* RTSP URL - Only for RTSP cameras */}
                    {formData.cameraType === 1 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('cameras.rtspUrl')} <span className="text-red-500">{t('cameras.required')}</span>
                            </label>
                            <input
                                type="text"
                                name="rtspUrl"
                                value={formData.rtspUrl}
                                onChange={handleChange}
                                placeholder={t('cameras.rtspUrlPlaceholder')}
                                className="input-field"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {t('cameras.rtspExampleTitle')}
                                <br />
                                • {t('cameras.rtspExampleHikvision')}
                                <br />
                                • {t('cameras.rtspExampleDahua')}
                            </p>
                        </div>
                    )}

                    {/* Device Serial - Only for P6SAI cameras */}
                    {formData.cameraType === 2 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('cameras.deviceSerial')} <span className="text-red-500">{t('cameras.required')}</span>
                            </label>
                            <input
                                type="text"
                                name="deviceSerial"
                                value={formData.deviceSerial}
                                onChange={handleChange}
                                placeholder={t('cameras.deviceSerialPlaceholder')}
                                className="input-field"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {t('cameras.deviceSerialHint')}
                            </p>
                        </div>
                    )}

                    {/* IP Address - Optional for both types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('cameras.ipAddress')}{' '}
                            <span className="text-gray-400 text-xs">({t('cameras.optional')})</span>
                        </label>
                        <input
                            type="text"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleChange}
                            placeholder={t('cameras.ipAddressPlaceholder')}
                            className="input-field"
                        />
                    </div>

                    {/* Guidelines */}
                    <div className={`${formData.cameraType === 1
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-purple-50 border-purple-200'
                        } border rounded-lg p-3`}>
                        <p className={`text-sm font-semibold ${formData.cameraType === 1 ? 'text-blue-900' : 'text-purple-900'
                            } mb-1`}>
                            {formData.cameraType === 1
                                ? t('cameras.rtspSetupTitle')
                                : t('cameras.p6saiSetupTitle')}
                        </p>
                        <ul className={`text-xs ${formData.cameraType === 1 ? 'text-blue-800' : 'text-purple-800'
                            } space-y-1`}>
                            {formData.cameraType === 1 ? (
                                <>
                                    <li>• {t('cameras.setupTip1')}</li>
                                    <li>• {t('cameras.setupTip2')}</li>
                                    <li>• {t('cameras.setupTip3')}</li>
                                    <li>• {t('cameras.setupTip4')}</li>
                                </>
                            ) : (
                                <>
                                    <li>• {t('cameras.p6saiSetupTip1')}</li>
                                    <li>• {t('cameras.p6saiSetupTip2')}</li>
                                    <li>• {t('cameras.p6saiSetupTip3')}</li>
                                    <li>• {t('cameras.p6saiSetupTip4')}</li>
                                </>
                            )}
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
                            {t('cameras.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {t('cameras.adding')}
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    {t('cameras.addCamera')}
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