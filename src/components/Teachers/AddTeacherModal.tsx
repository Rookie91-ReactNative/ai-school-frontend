import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Lock, Eye, EyeOff } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import type { CreateTeacherWithUserDto, CreateTeacherResponse } from '../../services/teacherService';

interface AddTeacherModalProps {
    onClose: () => void;
    onSuccess: (result?: CreateTeacherResponse) => void;
}

const AddTeacherModal = ({ onClose, onSuccess }: AddTeacherModalProps) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<CreateTeacherWithUserDto>({
        teacherCode: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        subject: '', // Optional now
        specialization: '', // Optional now
        joinDate: new Date().toISOString().split('T')[0],
        isAdmin: false,
        adminPosition: '',
        createUserAccount: true,
        username: '',
        password: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

    const generateUsername = (fullName: string) => {
        if (!fullName) return '';
        const parts = fullName.toLowerCase().split(' ').filter(p => p !== 'bin' && p !== 'binti');
        return parts.length > 1
            ? `${parts[0]}.${parts[parts.length - 1]}`
            : parts[0];
    };

    const handleFullNameChange = (name: string) => {
        setFormData({
            ...formData,
            fullName: name,
            username: formData.createUserAccount ? generateUsername(name) : formData.username
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const result = await teacherService.createTeacher(formData);

            if (result.generatedPassword) {
                setGeneratedPassword(result.generatedPassword);
            } else {
                onSuccess(result);
            }
        } catch (error: unknown) {
            console.error('Error creating teacher:', error);
            // Extract server-side error message if available
            const axiosError = error as { response?: { data?: { errors?: string[], message?: string } } };
            const serverErrors = axiosError?.response?.data?.errors;
            const errorMessage = serverErrors && serverErrors.length > 0
                ? serverErrors[0]
                : axiosError?.response?.data?.message
                ?? (error instanceof Error ? error.message : t('teachers.createError'));
            alert(errorMessage);
            setSubmitting(false);
        }
    };

    if (generatedPassword) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{t('teachers.teacherCreatedSuccess')}</h2>
                        <p className="text-gray-600 mt-2">{t('teachers.userAccountCreated')}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-yellow-800 mb-2">{t('teachers.savePasswordWarning')}</p>
                        <div className="bg-white rounded p-3 border border-yellow-300">
                            <p className="text-xs text-gray-600 mb-1">{t('teachers.username')}:</p>
                            <p className="font-mono font-bold text-gray-900">{formData.username}</p>
                            <p className="text-xs text-gray-600 mt-3 mb-1">{t('teachers.password')}:</p>
                            <p className="font-mono font-bold text-lg text-blue-600">{generatedPassword}</p>
                        </div>
                        <p className="text-xs text-yellow-700 mt-2">
                            This password will not be shown again. Please save it and share with the teacher.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`Username: ${formData.username}\nPassword: ${generatedPassword}`);
                            alert('Credentials copied to clipboard!');
                        }}
                        className="w-full mb-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Copy Credentials
                    </button>
                    <button
                        onClick={() => {
                            setGeneratedPassword(null);
                            onSuccess();
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{t('teachers.addTeacher')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Teacher Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            {t('teachers.teacherInformation')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.teacherCode')} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.teacherCode}
                                    onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="TCH001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.fullName')} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => handleFullNameChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ahmad bin Ali"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.email')} *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="ahmad@school.edu.my"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.phoneNumber')} *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="012-3456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.subjectOptional')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mathematics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.specializationOptional')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Basketball Coach"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teachers.joinDate')} *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.joinDate}
                                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Admin flag */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAdmin}
                                        onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked, adminPosition: e.target.checked ? formData.adminPosition : '' })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{t('teachers.isAdmin')}</span>
                                </label>
                            </div>

                            {formData.isAdmin && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('teachers.adminPosition')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminPosition}
                                        onChange={(e) => setFormData({ ...formData, adminPosition: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder={t('teachers.adminPositionPlaceholder')}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Account Settings */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                {t('teachers.userAccountLoginAccess')}
                            </h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.createUserAccount}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        createUserAccount: e.target.checked,
                                        username: e.target.checked ? generateUsername(formData.fullName) : ''
                                    })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Create login account</span>
                            </label>
                        </div>

                        {formData.createUserAccount && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                                <p className="text-sm text-blue-700">
                                    {t('teachers.userAccountMsg1')}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('login.Username')} *
                                        </label>
                                        <input
                                            type="text"
                                            required={formData.createUserAccount}
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="ahmad.ali"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('teachers.usernameHint')}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('login.password')} *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {t('teachers.usingCustomPassword')}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white border border-blue-300 rounded p-3">
                                    <p className="text-xs text-gray-600">
                                        <strong>{t('teachers.note')}:</strong> {t('teachers.userAccountMsg2')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!formData.createUserAccount && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    {t('teachers.userAccountMsg3')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            disabled={submitting}
                        >
                            {t('teachers.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={submitting}
                        >
                            {submitting ? t('teachers.creating') : formData.createUserAccount ? t('teachers.createTeacherUserAcct') : t('teachers.createTeacher')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeacherModal;