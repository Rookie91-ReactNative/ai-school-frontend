import { useState, useEffect } from 'react';
import { Camera, Play, Square, Plus, Wifi, WifiOff, Power } from 'lucide-react';
import api from '../services/api';
import AddCameraModal from '../components/Cameras/AddCameraModal';
import { authService } from '../services/authService';
import axios from 'axios';

interface CameraConfig {
    cameraId: number;
    cameraName: string;
    location: string;
    rtspUrl: string;
    ipAddress: string;
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
    const [cameras, setCameras] = useState<CameraConfig[]>([]);
    const [cameraStatuses, setCameraStatuses] = useState<{ [key: number]: CameraStatus }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userSchoolId, setUserSchoolId] = useState<number | null>(null);

    useEffect(() => {
        const initializePage = async () => {
            await fetchUserProfile();
            // fetchCameras will be called after userSchoolId is set
        };
        initializePage();

        // Poll camera statuses every 5 seconds
        const interval = setInterval(fetchCameraStatuses, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch cameras when userSchoolId changes
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
            // Filter cameras: only show active cameras that belong to user's school
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

    const startCamera = async (cameraId: number) => {
        try {
            await api.post(`/camera/${cameraId}/start`);
            await fetchCameraStatuses();
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Failed to start camera. Make sure the face recognition model is trained.');
        }
    };

    const stopCamera = async (cameraId: number) => {
        try {
            await api.post(`/camera/${cameraId}/stop`);
            await fetchCameraStatuses();
        } catch (error) {
            console.error('Error stopping camera:', error);
        }
    };

    const startAllCameras = async () => {
        try {
            await api.post('/camera/start-all');
            await fetchCameraStatuses();
        } catch (error) {
            console.error('Error starting all cameras:', error);
            alert('Failed to start cameras. Make sure the face recognition model is trained.');
        }
    };

    const stopAllCameras = async () => {
        try {
            await api.post('/camera/stop-all');
            await fetchCameraStatuses();
        } catch (error) {
            console.error('Error stopping all cameras:', error);
        }
    };

    const toggleCameraActive = async (cameraId: number, currentStatus: boolean) => {
        // Show confirmation dialog
        const action = currentStatus ? 'deactivate' : 'activate';
        const confirmed = window.confirm(
            `Are you sure you want to ${action} this camera?\n\n${currentStatus
                ? 'The camera will be stopped and hidden from the camera list.'
                : 'The camera will be available for use.'
            }`
        );

        if (!confirmed) {
            return; // User cancelled
        }

        try {
            // If camera is currently running, stop it first
            const running = isRunning(cameraId);
            if (running && currentStatus) {
                await stopCamera(cameraId);
                // Wait a bit for camera to stop
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Find the camera to get all its data
            const camera = cameras.find(c => c.cameraId === cameraId);
            if (!camera) {
                alert('Camera not found');
                return;
            }

            // Update the active status - send complete camera object
            const updateData = {
                cameraName: camera.cameraName,
                location: camera.location,
                rtspUrl: camera.rtspUrl,
                ipAddress: camera.ipAddress,
                isActive: !currentStatus
            };

            console.log('Updating camera with data:', updateData);

            const response = await api.put(`/camera/${cameraId}`, updateData);

            console.log('Update response:', response.data);

            // Refresh camera list
            await fetchCameras();

            alert(`Camera ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error('Error toggling camera status:', error);
                console.error('Error response:', error.response?.data);
                const errorMsg = error.response?.data?.message || 'Failed to update camera status';
                alert(errorMsg);
            }
            throw new Error('An unexpected error occurred on listing camera.');
            
        }
    };

    const getCameraStatus = (cameraId: number) => {
        return cameraStatuses[cameraId];
    };

    const isRunning = (cameraId: number) => {
        const status = getCameraStatus(cameraId);
        return status?.isOnline || false;
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Camera className="w-8 h-8 text-blue-600" />
                        Camera Management
                    </h1>
                    <p className="text-gray-600 mt-1">Monitor and control cameras for face detection</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Camera
                    </button>
                    <button onClick={startAllCameras} className="btn-primary flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        Start All
                    </button>
                    <button onClick={stopAllCameras} className="btn-secondary flex items-center gap-2">
                        <Square className="w-5 h-5" />
                        Stop All
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Camera className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Cameras</p>
                            <p className="text-2xl font-bold text-gray-900">{cameras.length}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Wifi className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Online</p>
                            <p className="text-2xl font-bold text-green-900">
                                {Object.values(cameraStatuses).filter(s => s.isOnline).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <WifiOff className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Offline</p>
                            <p className="text-2xl font-bold text-red-900">
                                {cameras.length - Object.values(cameraStatuses).filter(s => s.isOnline).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* No Cameras Message */}
            {cameras.length === 0 && (
                <div className="card text-center py-12">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cameras Configured</h3>
                    <p className="text-gray-600 mb-6">
                        Add cameras to start monitoring student attendance
                    </p>
                    <button onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary flex items-center gap-2 mx-auto">
                        <Plus className="w-5 h-5" />
                        Add Camera
                    </button>
                </div>
            )}

            {/* Cameras Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera) => {
                    const status = getCameraStatus(camera.cameraId);
                    const running = isRunning(camera.cameraId);

                    return (
                        <div key={camera.cameraId} className="card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${running ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <Camera className={`w-6 h-6 ${running ? 'text-green-600' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{camera.cameraName}</h3>
                                        <p className="text-sm text-gray-500">{camera.location}</p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${running
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {running ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            {/* Camera Details */}
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <p>
                                    <span className="font-medium">IP:</span> {camera.ipAddress}
                                </p>
                                {status && running && (
                                    <>
                                        <p>
                                            <span className="font-medium">Status:</span> {status.statusMessage}
                                        </p>
                                        <p>
                                            <span className="font-medium">Frames:</span> {status.framesProcessed}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {running ? (
                                    <button
                                        onClick={() => stopCamera(camera.cameraId)}
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Square className="w-4 h-4" />
                                        Stop
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => startCamera(camera.cameraId)}
                                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        Start
                                    </button>
                                )}
                                <button
                                    onClick={() => toggleCameraActive(camera.cameraId, camera.isActive)}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                    title="Deactivate Camera"
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <AddCameraModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchCameras}
            />
        </div>
    );
};

export default CamerasPage;