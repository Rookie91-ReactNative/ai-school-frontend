import { useState, useEffect } from 'react';
import { X, Users, GraduationCap, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface ClassEnrollmentPreview {
    classID: number;
    className: string;
    studentCount: number;
    matchedClassID: number | null;
    matchedClassName: string | null;
    hasMatch: boolean;
}

interface GradeEnrollmentPreview {
    gradeID: number;
    gradeName: string;
    gradeLevel: number;
    studentCount: number;
    nextGradeID: number | null;
    nextGradeName: string | null;
    nextGradeLevel: number | null;
    isGraduating: boolean;
    classes: ClassEnrollmentPreview[];
}

interface EnrollmentPreviewResponse {
    currentAcademicYearID: number;
    currentAcademicYear: string;
    newAcademicYearID: number;
    newAcademicYear: string;
    totalStudents: number;
    studentsToPromote: number;
    studentsToGraduate: number;
    grades: GradeEnrollmentPreview[];
}

interface EnrollmentResult {
    totalProcessed: number;
    promoted: number;
    graduated: number;
    failed: number;
    errors: string[];
}

interface EnrollmentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    academicYearId: number;
    academicYearName: string;
    onEnrollmentComplete: () => void;
}

const EnrollmentPreviewModal = ({
    isOpen,
    onClose,
    academicYearId,
    academicYearName,
    onEnrollmentComplete
}: EnrollmentPreviewModalProps) => {
    const { t } = useTranslation();
    const [preview, setPreview] = useState<EnrollmentPreviewResponse | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentResult, setEnrollmentResult] = useState<EnrollmentResult | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
        }
    }, [isOpen, academicYearId]);

    const fetchPreview = async () => {
        try {
            setIsLoadingPreview(true);
            setError(null);
            const response = await api.get(`/academic/enrollment-preview/${academicYearId}`);
            setPreview(response.data.data);
        } catch (error: unknown) {
            console.error('Error fetching enrollment preview:', error);
            const errorMessage = error && typeof error === 'object' && 'response' in error 
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
                : undefined;
            setError(errorMessage || t('enrollment.errorFetchPreview'));
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleEnroll = async () => {
        try {
            setIsEnrolling(true);
            setError(null);
            const response = await api.post(`/academic/enroll-students/${academicYearId}`);
            setEnrollmentResult(response.data.data);
            setShowConfirmation(false);
            
            // Call the completion callback
            setTimeout(() => {
                onEnrollmentComplete();
            }, 2000);
        } catch (error: unknown) {
            console.error('Error enrolling students:', error);
            const errorMessage = error && typeof error === 'object' && 'response' in error 
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
                : undefined;
            setError(errorMessage || t('enrollment.errorEnroll'));
            setShowConfirmation(false);
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleClose = () => {
        if (!isEnrolling) {
            setPreview(null);
            setEnrollmentResult(null);
            setShowConfirmation(false);
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {t('enrollment.title')}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {t('enrollment.subtitle')} {academicYearName}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isEnrolling}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Loading State */}
                    {isLoadingPreview && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <span className="ml-3 text-gray-600">{t('enrollment.loadingPreview')}</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                                <div>
                                    <p className="text-red-800 font-medium">{t('enrollment.error')}</p>
                                    <p className="text-red-700 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enrollment Result */}
                    {enrollmentResult && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                            <div className="flex items-start">
                                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3" />
                                <div className="flex-1">
                                    <p className="text-green-900 font-bold text-lg">
                                        {t('enrollment.success')}
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <p className="text-sm text-gray-600">{t('enrollment.totalProcessed')}</p>
                                            <p className="text-2xl font-bold text-gray-900">{enrollmentResult.totalProcessed}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <p className="text-sm text-gray-600">{t('enrollment.promoted')}</p>
                                            <p className="text-2xl font-bold text-green-600">{enrollmentResult.promoted}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <p className="text-sm text-gray-600">{t('enrollment.graduated')}</p>
                                            <p className="text-2xl font-bold text-blue-600">{enrollmentResult.graduated}</p>
                                        </div>
                                    </div>
                                    {enrollmentResult.failed > 0 && (
                                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                                            <p className="text-yellow-800 font-medium">
                                                {t('enrollment.failed')}: {enrollmentResult.failed}
                                            </p>
                                            {enrollmentResult.errors.length > 0 && (
                                                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                                                    {enrollmentResult.errors.map((err, idx) => (
                                                        <li key={idx}>{err}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Content */}
                    {preview && !enrollmentResult && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-700">{t('enrollment.totalStudents')}</p>
                                            <p className="text-3xl font-bold text-blue-900">{preview.totalStudents}</p>
                                        </div>
                                        <Users className="w-10 h-10 text-blue-400" />
                                    </div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-700">{t('enrollment.toPromote')}</p>
                                            <p className="text-3xl font-bold text-green-900">{preview.studentsToPromote}</p>
                                        </div>
                                        <ArrowRight className="w-10 h-10 text-green-400" />
                                    </div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-purple-700">{t('enrollment.toGraduate')}</p>
                                            <p className="text-3xl font-bold text-purple-900">{preview.studentsToGraduate}</p>
                                        </div>
                                        <GraduationCap className="w-10 h-10 text-purple-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Year Transition */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">{t('enrollment.currentYear')}</p>
                                        <p className="text-lg font-bold text-gray-900">{preview.currentAcademicYear}</p>
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-gray-400" />
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">{t('enrollment.newYear')}</p>
                                        <p className="text-lg font-bold text-blue-600">{preview.newAcademicYear}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grade Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900">{t('enrollment.gradeDetails')}</h3>
                                {preview.grades.map((grade) => (
                                    <div key={grade.gradeID} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Grade Header */}
                                        <div className={`px-4 py-3 ${grade.isGraduating ? 'bg-purple-50' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${grade.isGraduating ? 'bg-purple-200' : 'bg-blue-200'
                                                        }`}>
                                                        {grade.isGraduating ? (
                                                            <GraduationCap className="w-5 h-5 text-purple-700" />
                                                        ) : (
                                                            <ArrowRight className="w-5 h-5 text-blue-700" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{grade.gradeName}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {grade.studentCount} {t('enrollment.students')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {grade.isGraduating ? (
                                                        <span className="px-3 py-1 bg-purple-200 text-purple-800 text-sm font-semibold rounded-full">
                                                            {t('enrollment.graduating')}
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <ArrowRight className="w-4 h-4 text-gray-400" />
                                                            <span className="font-semibold text-gray-900">{grade.nextGradeName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Classes List */}
                                        {grade.classes.length > 0 && (
                                            <div className="px-4 py-3 bg-white">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-xs text-gray-600 border-b">
                                                            <th className="text-left pb-2">{t('enrollment.currentClass')}</th>
                                                            <th className="text-center pb-2">{t('enrollment.students')}</th>
                                                            <th className="text-center pb-2"></th>
                                                            <th className="text-left pb-2">{t('enrollment.newClass')}</th>
                                                            <th className="text-center pb-2">{t('enrollment.status')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {grade.classes.map((cls) => (
                                                            <tr key={cls.classID} className="border-b last:border-0">
                                                                <td className="py-2">
                                                                    <span className="font-medium text-gray-900">{cls.className}</span>
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <span className="text-gray-600">{cls.studentCount}</span>
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                                                                </td>
                                                                <td className="py-2">
                                                                    {cls.matchedClassName ? (
                                                                        <span className={`font-medium ${grade.isGraduating ? 'text-purple-600' : 'text-blue-600'
                                                                            }`}>
                                                                            {cls.matchedClassName}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm italic">
                                                                            {t('enrollment.noMatch')}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    {grade.isGraduating ? (
                                                                        <GraduationCap className="w-4 h-4 text-purple-500 mx-auto" />
                                                                    ) : cls.hasMatch ? (
                                                                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                                    ) : (
                                                                        <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" />
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Info Note */}
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-medium mb-1">{t('enrollment.infoTitle')}</p>
                                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                                            <li>{t('enrollment.info1')}</li>
                                            <li>{t('enrollment.info2')}</li>
                                            <li>{t('enrollment.info3')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {preview && !enrollmentResult && (
                    <div className="border-t px-6 py-4 bg-gray-50">
                        {showConfirmation ? (
                            <div className="flex items-center justify-between">
                                <p className="text-red-600 font-medium">
                                    {t('enrollment.confirmMessage')}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        disabled={isEnrolling}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        {t('enrollment.cancel')}
                                    </button>
                                    <button
                                        onClick={handleEnroll}
                                        disabled={isEnrolling}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isEnrolling ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {t('enrollment.enrolling')}
                                            </>
                                        ) : (
                                            t('enrollment.confirmEnroll')
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleClose}
                                    disabled={isEnrolling}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                    {t('enrollment.cancel')}
                                </button>
                                <button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={isEnrolling}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    {t('enrollment.enrollStudents')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Success Footer */}
                {enrollmentResult && (
                    <div className="border-t px-6 py-4 bg-gray-50">
                        <div className="flex justify-end">
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {t('enrollment.close')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default EnrollmentPreviewModal;