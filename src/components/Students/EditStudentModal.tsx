import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Users, Edit } from 'lucide-react';
import { studentService } from '../../services/studentService';
import type { CreateStudentDto, Student } from '../../types';

interface EditStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student: Student | null;
}

const EditStudentModal = ({ isOpen, onClose, onSuccess, student }: EditStudentModalProps) => {
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        schoolID: student?.schoolID || 1,
        studentCode: student?.studentCode || '',
        fullName: student?.fullName || '',
        otherName: student?.otherName || '',
        email: student?.email || '',
        phoneNumber: student?.phoneNumber || '',
        parentName: student?.parentName || '',
        parentContact: student?.parentContact || '',
        parentEmail: student?.parentEmail || '',
        dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
        gender: student?.gender || 'Male',
        address: student?.address || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Update form data when student prop changes
    useEffect(() => {
        if (student) {
            setFormData({
                schoolID: student.schoolID,
                studentCode: student.studentCode,
                fullName: student.fullName,
                otherName: student.otherName || '',
                email: student.email || '',
                phoneNumber: student.phoneNumber || '',
                parentName: student.parentName || '',
                parentContact: student.parentContact || '',
                parentEmail: student.parentEmail || '',
                dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
                gender: student.gender || 'Male',
                address: student.address || '',
            });
        }
    }, [student]);

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

    if (!isOpen || !student) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors([]);

        try {
            const submitData: CreateStudentDto = {
                schoolID: formData.schoolID,
                studentCode: formData.studentCode,
                fullName: formData.fullName,
                gender: formData.gender,
                ...(formData.otherName && { otherName: formData.otherName }),
                ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
                ...(formData.email && { email: formData.email }),
                ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
                ...(formData.parentName && { parentName: formData.parentName }),
                ...(formData.parentContact && { parentContact: formData.parentContact }),
                ...(formData.parentEmail && { parentEmail: formData.parentEmail }),
                ...(formData.address && { address: formData.address }),
            };

            await studentService.updateStudent(student.studentID, submitData);

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Full error:', err);

            const errorList: string[] = [];

            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as {
                    response?: {
                        data?: {
                            message?: string;
                            errors?: string[] | string | Record<string, string[]>;
                        };
                    };
                    message?: string;
                };

                if (axiosError.response?.data) {
                    const errorData = axiosError.response.data;

                    if (errorData.errors) {
                        if (Array.isArray(errorData.errors)) {
                            errorList.push(...errorData.errors);
                        } else if (typeof errorData.errors === 'string') {
                            errorList.push(errorData.errors);
                        } else if (typeof errorData.errors === 'object') {
                            Object.entries(errorData.errors).forEach(([field, messages]) => {
                                if (Array.isArray(messages)) {
                                    messages.forEach(msg => errorList.push(`${field}: ${msg}`));
                                } else {
                                    errorList.push(`${field}: ${messages}`);
                                }
                            });
                        }
                    } else if (errorData.message) {
                        errorList.push(errorData.message);
                    }
                } else if (axiosError.message) {
                    errorList.push(axiosError.message);
                }
            } else if (err instanceof Error) {
                errorList.push(err.message);
            }

            if (errorList.length === 0) {
                errorList.push(t('students.errors.updateFailed'));
            }

            setErrors(errorList);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="min-h-full flex items-start justify-center py-4 sm:py-8 px-0 sm:px-4">
                <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl 
                              sm:max-h-[90vh] overflow-hidden flex flex-col">

                    {/* Header - Sticky */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                    {t('students.editModal.title')}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {student.studentCode} - {student.fullName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Form - Scrollable */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-4 sm:p-6 space-y-5">

                            {/* Error Messages */}
                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {errors.map((error, idx) => (
                                                <p key={idx} className="text-sm text-red-800">{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Student Information Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        {t('students.sections.studentInformation')}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Student Code - Read Only */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.studentCode')}
                                        </label>
                                        <input
                                            type="text"
                                            name="studentCode"
                                            value={formData.studentCode}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-200 rounded-lg bg-gray-50
                                                     text-gray-500 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.fullName')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>

                                    {/* Other Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.otherName')}
                                        </label>
                                        <input
                                            type="text"
                                            name="otherName"
                                            value={formData.otherName}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                            placeholder={t('students.placeholders.otherName')}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('students.fields.otherNameHint')}
                                        </p>
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.gender')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     bg-white transition-colors"
                                        >
                                            <option value="Male">{t('students.gender.male')}</option>
                                            <option value="Female">{t('students.gender.female')}</option>
                                        </select>
                                    </div>

                                    {/* Date of Birth */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.dateOfBirth')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.email')}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.phoneNumber')}
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>

                                    {/* Address - Full Width */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.address')}
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Information Section */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                                    {t('students.sections.parentInformation')}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Parent Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.parentName')}
                                        </label>
                                        <input
                                            type="text"
                                            name="parentName"
                                            value={formData.parentName}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>

                                    {/* Parent Contact */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.parentContact')}
                                        </label>
                                        <input
                                            type="tel"
                                            name="parentContact"
                                            value={formData.parentContact}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>

                                    {/* Parent Email - Full Width */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('students.fields.parentEmail')}
                                        </label>
                                        <input
                                            type="email"
                                            name="parentEmail"
                                            value={formData.parentEmail}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm 
                                                     border border-gray-300 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Sticky */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 
                                      flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-base sm:text-sm
                                         text-gray-700 bg-white border border-gray-300 rounded-lg 
                                         hover:bg-gray-50 active:bg-gray-100
                                         transition-colors font-medium"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-base sm:text-sm
                                         bg-indigo-600 text-white rounded-lg 
                                         hover:bg-indigo-700 active:bg-indigo-800
                                         disabled:bg-indigo-400 disabled:cursor-not-allowed 
                                         transition-colors font-medium
                                         flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t('common.saving')}
                                    </>
                                ) : (
                                    t('students.editModal.saveChanges')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditStudentModal;