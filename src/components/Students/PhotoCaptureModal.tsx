import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw, FlipHorizontal, Download, Lightbulb } from 'lucide-react';
import { studentService } from '../../services/studentService';

// TypeScript declarations for FaceDetector API (Chrome desktop only)
declare global {
    interface Window {
        FaceDetector: new (options?: FaceDetectorOptions) => FaceDetector;
    }
    interface FaceDetectorOptions {
        fastMode?: boolean;
        maxDetectedFaces?: number;
    }
    interface FaceDetector {
        detect(image: ImageBitmapSource): Promise<DetectedFace[]>;
    }
    interface DetectedFace {
        boundingBox: DOMRectReadOnly;
        landmarks?: Array<{ type: string; locations: Array<{ x: number; y: number }> }>;
    }
}

interface PhotoCaptureModalProps {
    studentCode: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Face detection status
type FaceStatus = 'no-face' | 'too-far' | 'too-close' | 'off-center' | 'good' | 'capturing' | 'ready';

const PhotoCaptureModal = ({ studentCode, studentName, isOpen, onClose, onSuccess }: PhotoCaptureModalProps) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceDetectorRef = useRef<FaceDetector | null>(null);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoCaptureTriggerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const goodFrameCountRef = useRef<number>(0);

    const [isLoading, setIsLoading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(true);
    const [faceStatus, setFaceStatus] = useState<FaceStatus>('no-face');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showTips, setShowTips] = useState(false);
    const [faceDetectorSupported, setFaceDetectorSupported] = useState(false);
    const [stabilityProgress, setStabilityProgress] = useState(0);

    // Constants for face detection
    const GOOD_FRAMES_REQUIRED = 15;
    const MIN_FACE_SIZE_RATIO = 0.20;
    const MAX_FACE_SIZE_RATIO = 0.80;
    const CENTER_TOLERANCE = 0.25;

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

    // Initialize face detector
    useEffect(() => {
        if ('FaceDetector' in window) {
            try {
                faceDetectorRef.current = new window.FaceDetector({
                    fastMode: true,
                    maxDetectedFaces: 1
                });
                setFaceDetectorSupported(true);
                console.log('✅ FaceDetector API supported');
            } catch (e) {
                console.log('⚠️ FaceDetector API not available:', e);
                setFaceDetectorSupported(false);
            }
        } else {
            console.log('⚠️ FaceDetector API not supported in this browser (normal for mobile)');
            setFaceDetectorSupported(false);
        }
    }, []);

    // Initialize camera on mount
    useEffect(() => {
        if (isOpen) {
            initCamera();
            checkMultipleCameras();
        }
        return () => {
            stopCamera();
            stopFaceDetection();
        };
    }, [isOpen, facingMode]);

    // Start face detection when capturing (only if supported)
    useEffect(() => {
        if (isCapturing && !capturedImage) {
            if (faceDetectorSupported) {
                startFaceDetection();
            } else {
                // ⭐ KEY FIX: When face detection not available, show "ready" status immediately
                setFaceStatus('ready');
            }
        }
        return () => {
            stopFaceDetection();
        };
    }, [isCapturing, capturedImage, faceDetectorSupported]);

    // Check if device has multiple cameras
    const checkMultipleCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('📷 Video devices found:', videoDevices.length);

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
        setFaceStatus('no-face');
        goodFrameCountRef.current = 0;
        setStabilityProgress(0);

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
            } catch (constraintError) {
                console.warn('Camera with facingMode not available, trying default:', constraintError);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        aspectRatio: { ideal: 1 }
                    },
                    audio: false
                });
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCapturing(true);

            await checkMultipleCameras();
        } catch (err) {
            console.error('Camera error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError(t('students.cameraCapture.permissionDenied', 'Camera permission denied'));
                } else if (err.name === 'NotFoundError') {
                    setError(t('students.cameraCapture.noCameraFound', 'No camera found'));
                } else {
                    setError(t('students.cameraCapture.cameraError', 'Camera error: ') + err.message);
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

    // Start face detection loop
    const startFaceDetection = () => {
        if (detectionIntervalRef.current) return;

        detectionIntervalRef.current = setInterval(async () => {
            await detectFace();
        }, 100);
    };

    // Stop face detection
    const stopFaceDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        if (autoCaptureTriggerRef.current) {
            clearTimeout(autoCaptureTriggerRef.current);
            autoCaptureTriggerRef.current = null;
        }
    };

    // Detect face in video frame
    const detectFace = async () => {
        if (!videoRef.current || !faceDetectorRef.current || capturedImage || countdown !== null) return;

        try {
            const video = videoRef.current;
            if (video.readyState !== 4) return;

            const faces = await faceDetectorRef.current.detect(video);

            if (faces.length === 0) {
                setFaceStatus('no-face');
                goodFrameCountRef.current = 0;
                setStabilityProgress(0);
                return;
            }

            const face = faces[0];
            const box = face.boundingBox;

            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const frameSize = Math.min(videoWidth, videoHeight);

            const faceSize = Math.max(box.width, box.height);
            const faceSizeRatio = faceSize / frameSize;

            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const frameCenterX = videoWidth / 2;
            const frameCenterY = videoHeight / 2;

            const offsetX = Math.abs(faceCenterX - frameCenterX) / frameSize;
            const offsetY = Math.abs(faceCenterY - frameCenterY) / frameSize;

            let status: FaceStatus = 'good';

            if (faceSizeRatio < MIN_FACE_SIZE_RATIO) {
                status = 'too-far';
                goodFrameCountRef.current = 0;
            } else if (faceSizeRatio > MAX_FACE_SIZE_RATIO) {
                status = 'too-close';
                goodFrameCountRef.current = 0;
            } else if (offsetX > CENTER_TOLERANCE || offsetY > CENTER_TOLERANCE) {
                status = 'off-center';
                goodFrameCountRef.current = 0;
            } else {
                goodFrameCountRef.current++;
                status = 'good';
            }

            setFaceStatus(status);

            const progress = Math.min(100, (goodFrameCountRef.current / GOOD_FRAMES_REQUIRED) * 100);
            setStabilityProgress(progress);

            // Auto-capture when stable
            if (status === 'good' && goodFrameCountRef.current >= GOOD_FRAMES_REQUIRED) {
                setFaceStatus('capturing');
                goodFrameCountRef.current = 0;

                if (!autoCaptureTriggerRef.current) {
                    autoCaptureTriggerRef.current = setTimeout(() => {
                        capturePhoto();
                        autoCaptureTriggerRef.current = null;
                    }, 200);
                }
            }
        } catch (err) {
            console.debug('Face detection error:', err);
        }
    };

    // Flip camera (front/back)
    const flipCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // Manual capture with countdown
    const startManualCapture = () => {
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

        stopFaceDetection();

        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        const offsetX = (video.videoWidth - size) / 2;
        const offsetY = (video.videoHeight - size) / 2;

        ctx.drawImage(
            video,
            offsetX, offsetY, size, size,
            0, 0, size, size
        );

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

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        setFaceStatus('no-face');
        setUploadStatus('idle');
        setError('');
        goodFrameCountRef.current = 0;
        setStabilityProgress(0);
        initCamera();
    };

    // Upload captured photo
    const handleUpload = async () => {
        if (!capturedImage) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

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
            setError(err instanceof Error ? err.message : t('students.cameraCapture.uploadError', 'Upload failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        stopFaceDetection();
        setCapturedImage(null);
        setFaceStatus('no-face');
        setUploadStatus('idle');
        setError('');
        setShowTips(false);
        setCountdown(null);
        goodFrameCountRef.current = 0;
        setStabilityProgress(0);
        onClose();
    };

    // Get status message and color based on face detection support
    const getStatusInfo = () => {
        // ⭐ KEY FIX: When face detection not available, always show "Ready to capture"
        if (!faceDetectorSupported) {
            return {
                message: t('students.cameraCapture.readyToCapture', 'Ready! Tap to capture'),
                color: 'bg-green-500 text-white',
                ringColor: 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)]'
            };
        }

        // Face detection is available - show appropriate status
        switch (faceStatus) {
            case 'no-face':
                return {
                    message: t('students.cameraCapture.positionYourFace', 'Position your face in the circle'),
                    color: 'bg-gray-700/90 text-gray-300',
                    ringColor: 'border-gray-500 animate-pulse'
                };
            case 'too-far':
                return {
                    message: t('students.cameraCapture.moveCloser', 'Move closer'),
                    color: 'bg-yellow-500 text-white',
                    ringColor: 'border-yellow-400'
                };
            case 'too-close':
                return {
                    message: t('students.cameraCapture.moveBack', 'Move back'),
                    color: 'bg-yellow-500 text-white',
                    ringColor: 'border-yellow-400'
                };
            case 'off-center':
                return {
                    message: t('students.cameraCapture.centerFace', 'Center your face'),
                    color: 'bg-orange-500 text-white',
                    ringColor: 'border-orange-400'
                };
            case 'good':
                return {
                    message: t('students.cameraCapture.holdStill', 'Hold still...'),
                    color: 'bg-cyan-500 text-white',
                    ringColor: 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.5)]'
                };
            case 'ready':
                return {
                    message: t('students.cameraCapture.readyToCapture', 'Ready! Tap to capture'),
                    color: 'bg-green-500 text-white',
                    ringColor: 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)]'
                };
            case 'capturing':
                return {
                    message: t('students.cameraCapture.capturing', 'Capturing...'),
                    color: 'bg-green-500 text-white',
                    ringColor: 'border-green-400 shadow-[0_0_40px_rgba(74,222,128,0.6)]'
                };
            default:
                return {
                    message: t('students.cameraCapture.readyToCapture', 'Ready! Tap to capture'),
                    color: 'bg-green-500 text-white',
                    ringColor: 'border-green-400'
                };
        }
    };

    const statusInfo = getStatusInfo();

    // Get camera label with fallback
    const getCameraLabel = () => {
        if (facingMode === 'user') {
            return '📷 ' + t('students.cameraCapture.frontCamera', 'Front Camera');
        }
        return '📷 ' + t('students.cameraCapture.backCamera', 'Back Camera');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Full screen dark background */}
            <div className="absolute inset-0 bg-gray-900" />

            {/* Modal Container */}
            <div className="relative h-full flex flex-col">

                {/* Header */}
                <div className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm px-4 py-3 sm:py-4 flex items-center justify-between safe-area-top">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Camera className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-white">
                                {t('students.cameraCapture.title', 'Capture Photo')}
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
                            className={`p-2 rounded-lg transition-colors ${showTips
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
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

                {/* Tips Panel */}
                {showTips && (
                    <div className="flex-shrink-0 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3">
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">
                            {t('students.cameraCapture.tips.title', 'Photo Tips')}
                        </h4>
                        <ul className="text-xs text-yellow-200/80 space-y-1">
                            <li>• {t('students.cameraCapture.tips.tip1', 'Ensure good lighting on your face')}</li>
                            <li>• {t('students.cameraCapture.tips.tip2', 'Remove glasses if possible')}</li>
                            <li>• {t('students.cameraCapture.tips.tip3', 'Look directly at the camera')}</li>
                            <li>• {t('students.cameraCapture.tips.tip4', 'Keep a neutral expression')}</li>
                        </ul>
                    </div>
                )}

                {/* Camera View */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Loading State */}
                    {isLoading && !capturedImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-3"></div>
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
                                        : statusInfo.ringColor
                                    }`}
                            />
                        </div>

                        {/* Stability Progress Ring (only when face detection works and status is good) */}
                        {faceDetectorSupported && faceStatus === 'good' && stabilityProgress > 0 && !capturedImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-[72%] max-w-[312px] aspect-square -rotate-90">
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r="48%"
                                        fill="none"
                                        stroke="rgba(34, 211, 238, 0.3)"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r="48%"
                                        fill="none"
                                        stroke="rgb(34, 211, 238)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${stabilityProgress * 3.02} 302`}
                                        className="transition-all duration-100"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Status Message Overlay */}
                    <div className="absolute top-4 sm:top-8 left-0 right-0 text-center z-10">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-lg ${capturedImage
                                ? 'bg-green-500 text-white'
                                : countdown
                                    ? 'bg-orange-500 text-white text-xl'
                                    : statusInfo.color
                            }`}>
                            {capturedImage
                                ? t('students.cameraCapture.photoReady', 'Photo ready!')
                                : countdown
                                    ? countdown.toString()
                                    : statusInfo.message}
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
                        <p className="text-sm text-green-200">{t('students.cameraCapture.uploadSuccess', 'Photo uploaded successfully!')}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex-shrink-0 p-4 bg-gray-900/80 backdrop-blur-sm safe-area-bottom">
                    {!capturedImage ? (
                        // Camera Mode Buttons
                        <div className="flex flex-col items-center gap-3">
                            {/* Camera indicator */}
                            {hasMultipleCameras && (
                                <div className="text-xs text-gray-400">
                                    {getCameraLabel()}
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-4 sm:gap-6">
                                {/* Flip Camera Button */}
                                {hasMultipleCameras && (
                                    <button
                                        onClick={flipCamera}
                                        disabled={isLoading}
                                        className="p-3 sm:p-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 
                                                 text-white rounded-full transition-all disabled:opacity-50
                                                 touch-manipulation"
                                        title={t('students.cameraCapture.flipCamera', 'Flip camera')}
                                    >
                                        <FlipHorizontal className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </button>
                                )}

                                {/* Capture Button - Always green and ready */}
                                <button
                                    onClick={startManualCapture}
                                    disabled={isLoading || !isCapturing || countdown !== null}
                                    className="p-5 sm:p-6 rounded-full shadow-lg transition-all 
                                             disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation
                                             bg-gradient-to-r from-green-500 to-green-400 
                                             hover:from-green-400 hover:to-green-300 
                                             active:from-green-600 active:to-green-500
                                             shadow-green-500/30 active:scale-95"
                                    title={t('students.cameraCapture.capture', 'Capture')}
                                >
                                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                </button>

                                {/* Placeholder for symmetry */}
                                {hasMultipleCameras && <div className="w-12 h-12 sm:w-14 sm:h-14" />}
                            </div>
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
                                <span className="text-sm sm:text-base">{t('students.cameraCapture.retake', 'Retake')}</span>
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
                                        <span className="text-sm sm:text-base">{t('students.cameraCapture.uploading', 'Uploading...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span className="text-sm sm:text-base">{t('students.cameraCapture.usePhoto', 'Use Photo')}</span>
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
                        {t('common.cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoCaptureModal;