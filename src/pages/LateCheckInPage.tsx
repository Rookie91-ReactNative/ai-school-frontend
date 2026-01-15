import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Camera, X, CheckCircle, AlertCircle, RefreshCw, FlipHorizontal,
    Clock, User, Lightbulb, ArrowLeft, AlertTriangle, UserX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LanguageSwitcherCompact from '../components/LanguageSwitcherCompact';

// Late check-in result interface
interface LateCheckInResult {
    success: boolean;
    isRecognized: boolean;
    studentCode?: string;
    studentName?: string;
    facesDetected: number;
    confidence: number;
    distance: number;
    checkInTime?: string;
    attendanceId?: number;
    snapshotUrl?: string;
    remarks?: string;
    message: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    messageKey: string;
    errors?: string[];
}

const LateCheckInPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(true);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showTips, setShowTips] = useState(false);
    const [result, setResult] = useState<LateCheckInResult | null>(null);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Initialize camera on mount
    useEffect(() => {
        initCamera();
        checkMultipleCameras();
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    // Check if device has multiple cameras
    const checkMultipleCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            setHasMultipleCameras(videoDevices.length > 1 || isMobile);
        } catch {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            setHasMultipleCameras(isMobile);
        }
    };

    // Initialize camera stream
    const initCamera = async () => {
        setIsLoading(true);
        setError('');
        setIsCameraReady(false);

        try {
            stopCamera();

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    aspectRatio: { ideal: 1 }
                },
                audio: false
            };

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCameraReady(true);
        } catch (err) {
            console.error('Camera error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError(t('lateCheckIn.permissionDenied', 'Camera permission denied. Please allow camera access.'));
                } else if (err.name === 'NotFoundError') {
                    setError(t('lateCheckIn.noCameraFound', 'No camera found on this device.'));
                } else {
                    setError(t('lateCheckIn.cameraError', 'Camera error: ') + err.message);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Stop camera stream
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraReady(false);
    };

    // Flip camera
    const flipCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // Start capture with countdown
    const startCapture = () => {
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    capturePhoto();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Capture photo from video
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        const offsetX = (video.videoWidth - size) / 2;
        const offsetY = (video.videoHeight - size) / 2;

        ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

        // Mirror if front camera
        if (facingMode === 'user') {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(canvas, -size, 0);
            ctx.restore();
        }

        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(imageData);
        setCountdown(null);
        stopCamera();
    }, [facingMode]);

    // Submit for late check-in
    const submitCheckIn = async () => {
        if (!capturedImage) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            // Convert base64 to blob
            const response = await fetch(capturedImage);
            const blob = await response.blob();

            // Create form data
            const formData = new FormData();
            formData.append('image', blob, `late_checkin_${Date.now()}.jpg`);
            formData.append('remarks', t('lateCheckIn.remarkText', 'Late check-in via kiosk'));

            // Call API
            const apiResponse = await api.post<ApiResponse<LateCheckInResult>>(
                '/api/LateRecognition/check-in-late',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (apiResponse.data.success && apiResponse.data.data) {
                setResult(apiResponse.data.data);
            } else {
                setError(apiResponse.data.message || t('lateCheckIn.checkInFailed', 'Check-in failed'));
            }
        } catch (err: unknown) {
            console.error('Check-in error:', err);
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string; errors?: string[] } } };
                const errorMsg = axiosError.response?.data?.errors?.[0] ||
                    axiosError.response?.data?.message ||
                    t('lateCheckIn.checkInFailed', 'Check-in failed');
                setError(errorMsg);
            } else {
                setError(t('lateCheckIn.checkInFailed', 'Check-in failed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Reset and try again
    const resetCapture = () => {
        setCapturedImage(null);
        setResult(null);
        setError('');
        initCamera();
    };

    // Get camera label
    const getCameraLabel = () => {
        return facingMode === 'user'
            ? '📷 ' + t('lateCheckIn.frontCamera', 'Front Camera')
            : '📷 ' + t('lateCheckIn.backCamera', 'Back Camera');
    };

    // Format time
    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Full screen dark background */}
            <div className="absolute inset-0 bg-gray-900" />

            {/* Container */}
            <div className="relative h-full flex flex-col">

                {/* Header */}
                <div className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm px-4 py-3 sm:py-4 flex items-center justify-between safe-area-top">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-semibold text-white">
                                {t('lateCheckIn.title', 'Late Check-In')}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-400">
                                {t('lateCheckIn.subtitle', 'Face recognition for late students')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcherCompact />
                        <button
                            onClick={() => setShowTips(!showTips)}
                            className={`p-2 rounded-lg transition-colors ${showTips ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            <Lightbulb className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tips Panel */}
                {showTips && (
                    <div className="flex-shrink-0 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3">
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">
                            {t('lateCheckIn.tips.title', 'Tips for Best Results')}
                        </h4>
                        <ul className="text-xs text-yellow-200/80 space-y-1">
                            <li>• {t('lateCheckIn.tips.tip1', 'Ensure good lighting on your face')}</li>
                            <li>• {t('lateCheckIn.tips.tip2', 'Look directly at the camera')}</li>
                            <li>• {t('lateCheckIn.tips.tip3', 'Remove sunglasses or hats')}</li>
                            <li>• {t('lateCheckIn.tips.tip4', 'Keep a neutral expression')}</li>
                        </ul>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 relative overflow-hidden">

                    {/* Show Result */}
                    {result ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-4">
                            <div className="w-full max-w-sm">
                                {result.success && result.isRecognized ? (
                                    // Success Result
                                    <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6 text-center">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-green-500/30 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-10 h-10 text-green-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-green-400 mb-2">
                                            {t('lateCheckIn.success', 'Check-In Successful!')}
                                        </h2>
                                        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                                            <div className="flex items-center justify-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-lg font-semibold text-white">{result.studentName}</p>
                                                    <p className="text-sm text-gray-400">{result.studentCode}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-orange-400">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {t('lateCheckIn.checkedInAt', 'Checked in at')} {formatTime(result.checkInTime)}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-4">
                                            {t('lateCheckIn.confidenceLevel', 'Confidence')}: {result.confidence.toFixed(1)}%
                                        </p>
                                        <button
                                            onClick={resetCapture}
                                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            {t('lateCheckIn.checkInAnother', 'Check In Another Student')}
                                        </button>
                                    </div>
                                ) : (
                                    // Not Recognized Result
                                    <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-center">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-red-500/30 rounded-full flex items-center justify-center">
                                            {result.facesDetected === 0 ? (
                                                <AlertTriangle className="w-10 h-10 text-red-400" />
                                            ) : (
                                                <UserX className="w-10 h-10 text-red-400" />
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-red-400 mb-2">
                                            {result.facesDetected === 0
                                                ? t('lateCheckIn.noFaceDetected', 'No Face Detected')
                                                : t('lateCheckIn.notRecognized', 'Not Recognized')}
                                        </h2>
                                        <p className="text-gray-400 mb-6">
                                            {result.message || t('lateCheckIn.tryAgainMessage', 'Please try again with better lighting or positioning.')}
                                        </p>
                                        <button
                                            onClick={resetCapture}
                                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            {t('lateCheckIn.tryAgain', 'Try Again')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Loading State */}
                            {isLoading && !capturedImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-3"></div>
                                        <p className="text-gray-400 text-sm">{t('common.loading', 'Loading...')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Video Stream */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${capturedImage ? 'hidden' : ''}`}
                            />

                            {/* Captured Image Preview */}
                            {capturedImage && (
                                <img
                                    src={capturedImage}
                                    alt="Captured"
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {/* Canvas (hidden) */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Circular Frame Overlay */}
                            {!capturedImage && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                                        <defs>
                                            <mask id="circleMaskLate">
                                                <rect width="100" height="100" fill="white" />
                                                <circle cx="50" cy="50" r="35" fill="black" />
                                            </mask>
                                        </defs>
                                        <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#circleMaskLate)" />
                                    </svg>

                                    {/* Ring */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[70%] max-w-[300px] aspect-square rounded-full border-4 border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.4)]" />
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            {!capturedImage && (
                                <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-10">
                                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-lg ${countdown
                                            ? 'bg-orange-500 text-white text-xl'
                                            : 'bg-orange-500/90 text-white'
                                        }`}>
                                        {countdown
                                            ? countdown.toString()
                                            : t('lateCheckIn.positionFace', 'Position your face in the circle')}
                                    </span>
                                </div>
                            )}

                            {/* Preview Status */}
                            {capturedImage && !isLoading && (
                                <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-10">
                                    <span className="inline-block px-4 py-2 rounded-full text-sm font-medium shadow-lg bg-orange-500 text-white">
                                        {t('lateCheckIn.photoReady', 'Photo ready for check-in')}
                                    </span>
                                </div>
                            )}

                            {/* Countdown Overlay */}
                            {countdown !== null && countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                                    <span className="text-7xl sm:text-8xl font-bold text-white animate-pulse drop-shadow-lg">
                                        {countdown}
                                    </span>
                                </div>
                            )}

                            {/* Processing Overlay */}
                            {isLoading && capturedImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                                        <p className="text-white font-medium">{t('lateCheckIn.processing', 'Recognizing face...')}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex-shrink-0 mx-4 my-2 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-200 flex-1">{error}</p>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Action Buttons */}
                {!result && (
                    <div className="flex-shrink-0 p-4 bg-gray-900/80 backdrop-blur-sm safe-area-bottom">
                        {!capturedImage ? (
                            // Camera Mode
                            <div className="flex flex-col items-center gap-3">
                                {hasMultipleCameras && (
                                    <div className="text-xs text-gray-400">{getCameraLabel()}</div>
                                )}

                                <div className="flex items-center justify-center gap-4 sm:gap-6">
                                    {hasMultipleCameras && (
                                        <button
                                            onClick={flipCamera}
                                            disabled={isLoading}
                                            className="p-3 sm:p-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-full transition-all disabled:opacity-50 touch-manipulation"
                                        >
                                            <FlipHorizontal className="w-6 h-6 sm:w-7 sm:h-7" />
                                        </button>
                                    )}

                                    <button
                                        onClick={startCapture}
                                        disabled={isLoading || !isCameraReady || countdown !== null}
                                        className="p-5 sm:p-6 rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 active:from-orange-600 active:to-orange-500 shadow-orange-500/30 active:scale-95"
                                    >
                                        <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                    </button>

                                    {hasMultipleCameras && <div className="w-12 h-12 sm:w-14 sm:h-14" />}
                                </div>
                            </div>
                        ) : (
                            // Preview Mode
                            <div className="flex gap-3">
                                <button
                                    onClick={resetCapture}
                                    disabled={isLoading}
                                    className="flex-1 py-3 sm:py-3.5 px-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    <span className="text-sm sm:text-base">{t('lateCheckIn.retake', 'Retake')}</span>
                                </button>
                                <button
                                    onClick={submitCheckIn}
                                    disabled={isLoading}
                                    className="flex-1 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            <span className="text-sm sm:text-base">{t('lateCheckIn.checking', 'Checking...')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-5 h-5" />
                                            <span className="text-sm sm:text-base">{t('lateCheckIn.checkIn', 'Check In')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            disabled={isLoading}
                            className="w-full mt-3 py-2.5 text-gray-400 hover:text-white active:text-gray-300 text-sm font-medium transition-colors disabled:opacity-50 touch-manipulation"
                        >
                            {t('lateCheckIn.backToDashboard', 'Back to Dashboard')}
                        </button>
                    </div>
                )}

                {/* Footer for result page */}
                {result && (
                    <div className="flex-shrink-0 p-4 bg-gray-900/80 backdrop-blur-sm safe-area-bottom">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            {t('lateCheckIn.backToDashboard', 'Back to Dashboard')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LateCheckInPage;