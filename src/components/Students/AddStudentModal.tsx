import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import type { CreateStudentDto } from '../../types';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddStudentModal = ({ isOpen, onClose, onSuccess }: AddStudentModalProps) => {
    const { t } = useTranslation();

    // Get current user's school ID immediately
    const currentUser = authService.getCurrentUser();
    const userSchoolId = currentUser?.schoolID ?? 1;

    const [formData, setFormData] = useState({
        schoolID: userSchoolId,
        studentCode: '',
        fullName: '',
        otherName: '',  // NEW: Other Name field
        email: '',
        phoneNumber: '',
        parentName: '',
        parentContact: '',
        parentEmail: '',
        dateOfBirth: '',
        gender: 'Male',
        address: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Update schoolID if user changes
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser?.schoolID !== undefined) {
            setFormData(prev => ({
                ...prev,
                schoolID: currentUser.schoolID ?? 1
            }));
        }
    }, []);

    if (!isOpen) return null;

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
                ...(formData.otherName && { otherName: formData.otherName }),  // NEW
                ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
                ...(formData.email && { email: formData.email }),
                ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
                ...(formData.parentName && { parentName: formData.parentName }),
                ...(formData.parentContact && { parentContact: formData.parentContact }),
                ...(formData.parentEmail && { parentEmail: formData.parentEmail }),
                ...(formData.address && { address: formData.address }),
            };

            await studentService.createStudent(submitData);

            onSuccess();
            onClose();

            // Reset form
            const currentUser = authService.getCurrentUser();
            const userSchoolId = currentUser?.schoolID ?? 1;

            setFormData({
                schoolID: userSchoolId,
                studentCode: '',
                fullName: '',
                otherName: '',  // NEW
                email: '',
                phoneNumber: '',
                parentName: '',
                parentContact: '',
                parentEmail: '',
                dateOfBirth: '',
                gender: 'Male',
                address: '',
            });
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
                errorList.push(t('students.errors.createFailed'));
            }

            setErrors(errorList);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{t('students.addModal.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Messages */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {errors.length === 1 ? t('students.errors.errorOccurred') : t('students.errors.errorsOccurred')}
                                    </h3>
                                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.studentCode')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="studentCode"
                                value={formData.studentCode}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="STU006"
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.fullName')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('students.placeholders.fullName')}
                            />
                        </div>

                        {/* Other Name - NEW */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.otherName')}
                            </label>
                            <input
                                type="text"
                                name="otherName"
                                value={formData.otherName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('students.fields.otherNameHint')}</p>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.gender')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Male">{t('students.gender.male')}</option>
                                <option value="Female">{t('students.gender.female')}</option>
                            </select>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.dateOfBirth')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.email')}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="student@email.com"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.phoneNumber')}
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0123456789"
                            />
                        </div>

                        {/* Address - Full Width */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('students.fields.address')}
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('students.placeholders.address')}
                            />
                        </div>
                    </div>

                    {/* Parent Information Section */}
                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('students.sections.parentInformation')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Parent Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('students.fields.parentName')}
                                </label>
                                <input
                                    type="text"
                                    name="parentName"
                                    value={formData.parentName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('students.placeholders.parentName')}
                                />
                            </div>

                            {/* Parent Contact */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('students.fields.parentContact')}
                                </label>
                                <input
                                    type="tel"
                                    name="parentContact"
                                    value={formData.parentContact}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0198765432"
                                />
                            </div>

                            {/* Parent Email */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('students.fields.parentEmail')}
                                </label>
                                <input
                                    type="email"
                                    name="parentEmail"
                                    value={formData.parentEmail}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="parent@email.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? t('common.creating') : t('students.addModal.createStudent')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;