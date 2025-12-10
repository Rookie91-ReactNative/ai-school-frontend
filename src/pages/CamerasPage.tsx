import { useState, useEffect } from 'react';
import { Camera, Play, Square, Plus, Wifi, WifiOff, Video, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AddCameraModal from '../components/Cameras/AddCameraModal';
import { authService } from '../services/authService';

interface CameraConfig {
    cameraId: number;
    cameraName: string;
    location: string;
    cameraType: number; // 1=RTSP, 2=P6SAI
    rtspUrl: string;
    ipAddress: string;
    deviceSerial?: string; // For P6SAI cameras
    isActive: boolean;
    schoolId?: number;
}

interface CameraStatus {
    cameraId: number;
    cameraName: string;
    isOnline: boolean;
    statusMessage: string;
    lastFrameTime: string;
    framesProcessed: number;
}

const CamerasPage = () => {
    const { t } = useTranslation();
    const [cameras, setCameras] = useState<CameraConfig[]>([]);
    const [cameraStatuses, setCameraStatuses] = useState<{ [key: number]: CameraStatus }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userSchoolId, setUserSchoolId] = useState<number | null>(null);

    useEffect(() => {
        const initializePage = async () => {
            await fetchUserProfile();
        };
        initializePage();

        // Poll camera statuses every 5 seconds (only for RTSP cameras)
        const interval = setInterval(fetchCameraStatuses, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (userSchoolId !== null) {
            fetchCameras();
            fetchCameraStatuses();
        }
    }, [userSchoolId]);

    const fetchUserProfile = async () => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser?.schoolID !== undefined) {
                console.log('User profile:', currentUser);
                setUserSchoolId(currentUser.schoolID);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setIsLoading(false);
        }
    };

    const fetchCameras = async () => {
        try {
            const response = await api.get('/camera');
            const allCameras = response.data.data;
            const filteredCameras = allCameras.filter((camera: CameraConfig) =>
                camera.isActive === true &&
                (userSchoolId === null || camera.schoolId === userSchoolId)
            );
            setCameras(filteredCameras);
        } catch (error) {
            console.error('Error fetching cameras:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCameraStatuses = async () => {
        try {
            const response = await api.get('/camera/statuses');
            const statuses = response.data.data.cameras || [];
            const statusMap: { [key: number]: CameraStatus } = {};
            statuses.forEach((status: CameraStatus) => {
                statusMap[status.cameraId] = status;
            });
            setCameraStatuses(statusMap);
        } catch (error) {
            console.error('Error fetching camera statuses:', error);
        }
    };

    const handleStartCamera = async (cameraId: number) => {
        try {
            await api.post(`/camera/${cameraId}/start`);
            setTimeout(fetchCameraStatuses, 1000);
        } catch (error: unknown) {
            console.error('Error starting camera:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to start camera';
            alert(errorMessage);
        }
    };

    const handleStopCamera = async (cameraId: number) => {
        try {
            await api.post(`/camera/${cameraId}/stop`);
            setTimeout(fetchCameraStatuses, 1000);
        } catch (error) {
            console.error('Error stopping camera:', error);
            alert('Failed to stop camera');
        }
    };

    const handleStopAllCameras = async () => {
        try {
            await api.post('/camera/stop-all');
            setTimeout(fetchCameraStatuses, 1000);
        } catch (error) {
            console.error('Error stopping all cameras:', error);
            alert('Failed to stop all cameras');
        }
    };

    const getCameraTypeBadge = (cameraType: number) => {
        if (cameraType === 2) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                    <Brain className="w-3 h-3" />
                    {t('cameras.badgeP6SAI')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                <Video className="w-3 h-3" />
                {t('cameras.badgeRTSP')}
            </span>
        );
    };

    const getCameraConnectionInfo = (camera: CameraConfig) => {
        if (camera.cameraType === 2) {
            // P6SAI Camera - show device serial
            return (
                <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                        <span className="font-medium">{t('cameras.serialLabel')}</span>
                        <span className="font-mono">
                            {camera.deviceSerial || t('cameras.notConfigured')}
                        </span>
                    </div>
                    {camera.ipAddress && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{t('cameras.ipLabel')}</span>
                            <span className="font-mono">{camera.ipAddress}</span>
                        </div>
                    )}
                </div>
            );
        }
        // RTSP Camera - show RTSP URL
        return (
            <div className="text-xs text-gray-500">
                <div className="font-mono truncate" title={camera.rtspUrl}>
                    {camera.rtspUrl}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Camera className="w-8 h-8 text-blue-600" />
                        {t('cameras.title')}
                    </h1>
                    <p className="text-gray-600 mt-1">{t('cameras.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleStopAllCameras}
                        className="px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <Square className="w-4 h-4" />
                        {t('cameras.stopAll')}
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {t('cameras.addCamera')}
                    </button>
                </div>
            </div>

            {/* Camera Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera) => {
                    const status = cameraStatuses[camera.cameraId];
                    const isRunning = status?.isOnline || false;

                    return (
                        <div
                            key={camera.cameraId}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden"
                        >
                            {/* Camera Header */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                            {camera.cameraName}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">{camera.location}</p>
                                    </div>
                                    {getCameraTypeBadge(camera.cameraType)}
                                </div>
                                {getCameraConnectionInfo(camera)}
                            </div>

                            {/* Status Section - Only for RTSP cameras */}
                            {camera.cameraType === 1 && (
                                <div className="p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {isRunning ? (
                                                <>
                                                    <Wifi className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium text-green-600">
                                                        {t('cameras.online')}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <WifiOff className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-500">
                                                        {t('cameras.offline')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {status && (
                                            <span className="text-xs text-gray-500">
                                                {status.framesProcessed} {t('cameras.framesProcessed')}
                                            </span>
                                        )}
                                    </div>

                                    {status?.statusMessage && (
                                        <p className="text-xs text-gray-600 mb-3">{status.statusMessage}</p>
                                    )}

                                    {/* Control Button */}
                                    {isRunning ? (
                                        <button
                                            onClick={() => handleStopCamera(camera.cameraId)}
                                            className="w-full px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Square className="w-4 h-4" />
                                            {t('cameras.stop')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStartCamera(camera.cameraId)}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            {t('cameras.start')}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* P6SAI Camera Info */}
                            {camera.cameraType === 2 && (
                                <div className="p-4 bg-purple-50">
                                    <div className="flex items-center gap-2 text-purple-700 mb-2">
                                        <Brain className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {t('cameras.aiPoweredRecognition')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-purple-600">
                                        {t('cameras.aiAutomaticDescription')}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {cameras.length === 0 && (
                <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t('cameras.noCameras')}
                    </h3>
                    <p className="text-gray-600 mb-4">{t('cameras.noCamerasDesc')}</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {t('cameras.addFirstCamera')}
                    </button>
                </div>
            )}

            {/* Add Camera Modal */}
            <AddCameraModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    fetchCameras();
                }}
            />
        </div>
    );
};

export default CamerasPage;