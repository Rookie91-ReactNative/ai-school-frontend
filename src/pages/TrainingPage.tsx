import { useState } from 'react';
import { Brain, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';

interface TrainingResult {
    totalImages: number;
    successfulImages: number;
    totalStudents: number;
    errors?: string[];
}

const TrainingPage = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
    const [error, setError] = useState('');

    const handleTrain = async () => {
        setIsTraining(true);
        setError('');
        setTrainingResult(null);

        try {
            const response = await api.post('/training/train');
            setTrainingResult(response.data.data);
        } catch (err) {
            console.error('Training error:', err);
            setError('Failed to train model. Please try again.');
        } finally {
            setIsTraining(false);
        }
    };

    const handleTestModel = async () => {
        // TODO: Implement test functionality
        alert('Test functionality coming soon!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Brain className="w-8 h-8 text-purple-600" />
                    Face Recognition Training
                </h1>
                <p className="text-gray-600 mt-1">Train the AI model to recognize students</p>
            </div>

            {/* Instructions Card */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
                <div className="space-y-3 text-gray-700">
                    <p>
                        <span className="font-semibold">1. Upload Photos:</span> Add 3-5 clear face photos for each student
                    </p>
                    <p>
                        <span className="font-semibold">2. Train Model:</span> Click the button below to train the AI
                    </p>
                    <p>
                        <span className="font-semibold">3. Start Cameras:</span> Once trained, cameras can detect students automatically
                    </p>
                </div>
            </div>

            {/* Training Card */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Train Face Recognition Model</h2>

                {/* Status Messages */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {trainingResult && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="font-semibold text-green-900">Training Completed Successfully!</p>
                        </div>
                        <div className="text-sm text-green-800 space-y-1">
                            <p>✓ Total Images Processed: {trainingResult.totalImages}</p>
                            <p>✓ Successfully Trained: {trainingResult.successfulImages}</p>
                            <p>✓ Students Recognized: {trainingResult.totalStudents}</p>
                        </div>
                        {trainingResult.errors && trainingResult.errors.length > 0 && (
                            <div className="mt-3 text-sm text-yellow-800">
                                <p className="font-semibold">Warnings:</p>
                                {trainingResult.errors.slice(0, 5).map((err: string, idx: number) => (
                                    <p key={idx}>• {err}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Training Button */}
                <button
                    onClick={handleTrain}
                    disabled={isTraining}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3"
                >
                    {isTraining ? (
                        <>
                            <Loader className="w-6 h-6 animate-spin" />
                            Training Model... Please wait
                        </>
                    ) : (
                        <>
                            <Brain className="w-6 h-6" />
                            Start Training
                        </>
                    )}
                </button>

                {isTraining && (
                    <p className="text-center text-sm text-gray-600 mt-4">
                        This may take 30 seconds to a few minutes depending on the number of photos...
                    </p>
                )}
            </div>

            {/* Model Status Card */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Model Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Model Status</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                            {trainingResult ? 'Trained' : 'Not Trained'}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Students</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                            {trainingResult?.totalStudents || 0}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Training Images</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">
                            {trainingResult?.successfulImages || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Test Model Card */}
            {trainingResult && (
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Test Recognition</h2>
                    <p className="text-gray-600 mb-4">
                        Upload a test photo to see if the model can recognize the student
                    </p>
                    <button
                        onClick={handleTestModel}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Brain className="w-5 h-5" />
                        Test Model
                    </button>
                </div>
            )}
        </div>
    );
};

export default TrainingPage;