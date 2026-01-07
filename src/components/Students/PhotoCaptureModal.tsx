import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw, FlipHorizontal, Download, Lightbulb } from 'lucide-react';
import { studentService } from '../../services/studentService';

interface PhotoCaptureModalProps {
    studentCode: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PhotoCaptureModal = ({ studentCode, studentName, isOpen, onClose, onSuccess }: PhotoCaptureModalProps) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showTips, setShowTips] = useState(false);

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

    // Initialize camera on mount
    useEffect(() => {
        if (isOpen) {
            initCamera();
            checkMultipleCameras();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, facingMode]);

    // Check if device has multiple cameras (for flip button)
    const checkMultipleCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasMultipleCameras(videoDevices.length > 1);
        } catch {
            setHasMultipleCameras(false);
        }
    };

    // Initialize camera stream
    const initCamera = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Stop any existing stream
            stopCamera();

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    aspectRatio: { ideal: 1 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCapturing(true);
            // Simulate face detection after camera starts
            setTimeout(() => setFaceDetected(true), 1500);
        } catch (err) {
            console.error('Camera error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError(t('students.cameraCapture.permissionDenied'));
                } else if (err.name === 'NotFoundError') {
                    setError(t('students.cameraCapture.noCameraFound'));
                } else {
                    setError(t('students.cameraCapture.cameraError') + err.message);
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
        setIsCapturing(false);
    };

    // Flip camera (front/back)
    const flipCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // Capture photo with countdown
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

    // Capture photo from video stream
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to video dimensions (square crop)
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        // Calculate crop position (center)
        const offsetX = (video.videoWidth - size) / 2;
        const offsetY = (video.videoHeight - size) / 2;

        // Draw video frame to canvas (cropped to square)
        ctx.drawImage(
            video,
            offsetX, offsetY, size, size, // Source
            0, 0, size, size // Destination
        );

        // Mirror image if using front camera
        if (facingMode === 'user') {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(canvas, -size, 0);
            ctx.restore();
        }

        // Get image data
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(imageData);
        setFaceDetected(true);

        // Stop camera after capture
        stopCamera();
    }, [facingMode]);

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        setFaceDetected(false);
        setUploadStatus('idle');
        setError('');
        initCamera();
    };

    // Upload captured photo
    const handleUpload = async () => {
        if (!capturedImage) return;

        setIsLoading(true);
        setError('');

        try {
            // Convert base64 to File
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

            // Create FileList-like object
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            await studentService.uploadPhotos(studentCode, dataTransfer.files);

            setUploadStatus('success');
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1500);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('error');
            setError(err instanceof Error ? err.message : t('students.cameraCapture.uploadError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        setFaceDetected(false);
        setUploadStatus('idle');
        setError('');
        setShowTips(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Full screen dark background for camera UI */}
            <div className="absolute inset-0 bg-gray-900" />

            {/* Modal Container - Full screen on mobile */}
            <div className="relative h-full flex flex-col">

                {/* Header */}
                <div className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm px-4 py-3 sm:py-4 flex items-center justify-between safe-area-top">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Camera className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-white">
                                {t('students.cameraCapture.title')}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-400">
                                {studentName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Tips Toggle Button */}
                        <button
                            onClick={() => setShowTips(!showTips)}
                            className={`p-2 rounded-lg transition-colors ${showTips ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            <Lightbulb className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Tips Panel (Collapsible) */}
                {showTips && (
                    <div className="flex-shrink-0 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3">
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">
                            {t('students.cameraCapture.tips.title')}
                        </h4>
                        <ul className="text-xs text-yellow-200/80 space-y-1">
                            <li>• {t('students.cameraCapture.tips.tip1')}</li>
                            <li>• {t('students.cameraCapture.tips.tip2')}</li>
                            <li>• {t('students.cameraCapture.tips.tip3')}</li>
                            <li>• {t('students.cameraCapture.tips.tip4')}</li>
                        </ul>
                    </div>
                )}

                {/* Camera View - Takes remaining space */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Loading State */}
                    {isLoading && !capturedImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-3"></div>
                                <p className="text-gray-400 text-sm">{t('common.loading')}</p>
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

                    {/* Canvas for capture (hidden) */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Circular Frame Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Dark corners mask */}
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                            <defs>
                                <mask id="circleMask">
                                    <rect width="100" height="100" fill="white" />
                                    <circle cx="50" cy="50" r="35" fill="black" />
                                </mask>
                            </defs>
                            <rect
                                width="100"
                                height="100"
                                fill="rgba(0,0,0,0.6)"
                                mask="url(#circleMask)"
                            />
                        </svg>

                        {/* Animated ring */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className={`w-[70%] max-w-[300px] aspect-square rounded-full border-4 transition-all duration-300 ${capturedImage
                                        ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)]'
                                        : faceDetected
                                            ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.5)]'
                                            : 'border-gray-500 animate-pulse'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Status Message Overlay */}
                    <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-10">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-lg ${capturedImage
                                ? 'bg-green-500 text-white'
                                : countdown
                                    ? 'bg-orange-500 text-white text-xl'
                                    : faceDetected
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-gray-700/90 text-gray-300'
                            }`}>
                            {capturedImage
                                ? t('students.cameraCapture.photoReady')
                                : countdown
                                    ? countdown.toString()
                                    : faceDetected
                                        ? t('students.cameraCapture.goodHoldStill')
                                        : t('students.cameraCapture.positionYourFace')}
                        </span>
                    </div>

                    {/* Countdown Overlay */}
                    {countdown !== null && countdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                            <span className="text-7xl sm:text-8xl font-bold text-white animate-pulse drop-shadow-lg">
                                {countdown}
                            </span>
                        </div>
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

                {/* Success Message */}
                {uploadStatus === 'success' && (
                    <div className="flex-shrink-0 mx-4 my-2 bg-green-500/20 border border-green-500/50 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <p className="text-sm text-green-200">{t('students.cameraCapture.uploadSuccess')}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex-shrink-0 p-4 bg-gray-900/80 backdrop-blur-sm safe-area-bottom">
                    {!capturedImage ? (
                        // Camera Mode Buttons
                        <div className="flex items-center justify-center gap-4 sm:gap-6">
                            {/* Flip Camera Button (if multiple cameras available) */}
                            {hasMultipleCameras && (
                                <button
                                    onClick={flipCamera}
                                    disabled={isLoading}
                                    className="p-3 sm:p-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 
                                             text-white rounded-full transition-all disabled:opacity-50
                                             touch-manipulation"
                                    title={t('students.cameraCapture.flipCamera')}
                                >
                                    <FlipHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}

                            {/* Capture Button */}
                            <button
                                onClick={startCapture}
                                disabled={isLoading || !isCapturing}
                                className="p-5 sm:p-6 bg-gradient-to-r from-cyan-500 to-cyan-400 
                                         hover:from-cyan-400 hover:to-cyan-300 
                                         active:from-cyan-600 active:to-cyan-500
                                         text-white rounded-full shadow-lg shadow-cyan-500/30 
                                         transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                         touch-manipulation"
                                title={t('students.cameraCapture.capture')}
                            >
                                <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                            </button>

                            {/* Placeholder for symmetry */}
                            {hasMultipleCameras && <div className="w-11 h-11 sm:w-14 sm:h-14" />}
                        </div>
                    ) : (
                        // Preview Mode Buttons
                        <div className="flex gap-3">
                            <button
                                onClick={retakePhoto}
                                disabled={isLoading}
                                className="flex-1 py-3 sm:py-3.5 px-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-500
                                         text-white rounded-xl font-medium transition-all disabled:opacity-50 
                                         flex items-center justify-center gap-2 touch-manipulation"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span className="text-sm sm:text-base">{t('students.cameraCapture.retake')}</span>
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isLoading}
                                className="flex-1 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-cyan-400 
                                         hover:from-cyan-400 hover:to-cyan-300 
                                         text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 
                                         transition-all disabled:opacity-50 
                                         flex items-center justify-center gap-2 touch-manipulation"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span className="text-sm sm:text-base">{t('students.cameraCapture.uploading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span className="text-sm sm:text-base">{t('students.cameraCapture.usePhoto')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Cancel Button */}
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="w-full mt-3 py-2.5 text-gray-400 hover:text-white active:text-gray-300
                                 text-sm font-medium transition-colors disabled:opacity-50 touch-manipulation"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoCaptureModal;