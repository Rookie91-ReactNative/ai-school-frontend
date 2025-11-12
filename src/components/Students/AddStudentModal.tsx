import { useState, useEffect } from 'react';
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
    // Get current user's school ID immediately
    const currentUser = authService.getCurrentUser();
    const userSchoolId = currentUser?.schoolID ?? 1; // ✅ Use nullish coalescing, defaults to 1

    const [formData, setFormData] = useState({
        schoolID: userSchoolId,
        studentCode: '',
        fullName: '',
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

    // Update schoolID if user changes (shouldn't happen, but good practice)
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
        // Clear errors when user starts typing
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors([]);

        try {
            // Prepare the data - convert empty strings to undefined (omit them)
            const submitData: CreateStudentDto = {
                schoolID: formData.schoolID,
                studentCode: formData.studentCode,
                fullName: formData.fullName,
                gender: formData.gender,
                // Only include optional fields if they have values
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

            // Reset form but keep the correct SchoolID
            const currentUser = authService.getCurrentUser();
            const userSchoolId = currentUser?.schoolID ?? 1;

            setFormData({
                schoolID: userSchoolId,
                studentCode: '',
                fullName: '',
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

            // Better error handling with proper typing
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

                    // Handle different error formats
                    if (errorData.errors) {
                        if (Array.isArray(errorData.errors)) {
                            errorList.push(...errorData.errors);
                        } else if (typeof errorData.errors === 'string') {
                            errorList.push(errorData.errors);
                        } else if (typeof errorData.errors === 'object') {
                            // Handle validation errors object like { "Email": ["Invalid email"], "Phone": ["Required"] }
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

            // Fallback error message
            if (errorList.length === 0) {
                errorList.push('Failed to create student. Please try again.');
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
                    <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
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
                                        {errors.length === 1 ? 'There was an error:' : 'There were errors:'}
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
                                Student Code <span className="text-red-500">*</span>
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
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
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
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="012-3456789"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Birth <span className="text-red-500">*</span>
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

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        {/* Parent Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Parent Name
                            </label>
                            <input
                                type="text"
                                name="parentName"
                                value={formData.parentName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Parent Name"
                            />
                        </div>

                        {/* Parent Contact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Parent Contact
                            </label>
                            <input
                                type="tel"
                                name="parentContact"
                                value={formData.parentContact}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="012-9876543"
                            />
                        </div>

                        {/* Parent Email */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Parent Email
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

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Student Address"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                'Create Student'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;