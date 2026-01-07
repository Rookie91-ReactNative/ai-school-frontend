import { useState, useEffect } from 'react';
import { UserPlus, Users, Edit, Trash2, X, Building, Mail, User, Lock, Phone, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import api from '../services/api';
import PermissionsModal from '../components/SchoolAdmins/PermissionsModal';

interface School {
    schoolID: number;
    schoolCode: string;
    schoolName: string;
}

interface SchoolAdmin {
    userID: number;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    schoolID: number;
    schoolName: string;
    isActive: boolean;
    createdDate: string;
}

interface CreateAdminForm {
    username: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    schoolID: number;
}

interface EditAdminForm {
    fullName: string;
    email: string;
    phoneNumber: string;
    newPassword: string;
    confirmNewPassword: string;
}

interface UpdatePayload {
    fullName: string;
    email: string;
    phoneNumber: string;
    password?: string;
}

const SchoolAdminsPage = () => {
    const { t } = useTranslation();
    const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);

    const [formData, setFormData] = useState<CreateAdminForm>({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        schoolID: 0
    });

    const [editFormData, setEditFormData] = useState<EditAdminForm>({
        fullName: '',
        email: '',
        phoneNumber: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [adminsRes, schoolsRes] = await Promise.all([
                api.get('/user/school-admins'),
                api.get('/school')
            ]);
            setAdmins(adminsRes.data.data || []);
            setSchools(schoolsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.username.trim()) {
            errors.username = t('schoolAdmins.validation.usernameRequired');
        } else if (formData.username.length < 3) {
            errors.username = t('schoolAdmins.validation.usernameMin');
        }

        if (!formData.password) {
            errors.password = t('schoolAdmins.validation.passwordRequired');
        } else if (formData.password.length < 6) {
            errors.password = t('schoolAdmins.validation.passwordMin');
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = t('schoolAdmins.validation.passwordMismatch');
        }

        if (!formData.fullName.trim()) {
            errors.fullName = t('schoolAdmins.validation.fullNameRequired');
        }

        if (!formData.email.trim()) {
            errors.email = t('schoolAdmins.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t('schoolAdmins.validation.emailFormat');
        }

        if (!formData.schoolID || formData.schoolID === 0) {
            errors.schoolID = t('schoolAdmins.validation.schoolRequired');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.fullName.trim()) {
            errors.fullName = t('schoolAdmins.validation.fullNameRequired');
        }

        if (!editFormData.email.trim()) {
            errors.email = t('schoolAdmins.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
            errors.email = t('schoolAdmins.validation.emailFormat');
        }

        if (editFormData.newPassword || editFormData.confirmNewPassword) {
            if (editFormData.newPassword.length < 6) {
                errors.newPassword = t('schoolAdmins.validation.passwordMin');
            }
            if (editFormData.newPassword !== editFormData.confirmNewPassword) {
                errors.confirmNewPassword = t('schoolAdmins.validation.passwordMismatch');
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof CreateAdminForm, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleEditInputChange = (field: keyof EditAdminForm, value: string) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post('/auth/create-school-admin', formData);
            alert(t('schoolAdmins.successCreate'));
            setShowCreateModal(false);
            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                schoolID: 0
            });
            setFormErrors({});
            fetchData();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error creating admin:', error);
                alert(error.response?.data?.message || t('students.messages.errorCreating'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (admin: SchoolAdmin) => {
        setSelectedAdmin(admin);
        setEditFormData({
            fullName: admin.fullName,
            email: admin.email,
            phoneNumber: admin.phoneNumber || '',
            newPassword: '',
            confirmNewPassword: ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        if (!validateEditForm() || !selectedAdmin) return;

        try {
            setIsSubmitting(true);
            const payload: UpdatePayload = {
                fullName: editFormData.fullName,
                email: editFormData.email,
                phoneNumber: editFormData.phoneNumber
            };

            if (editFormData.newPassword) {
                payload.password = editFormData.newPassword;
            }

            await api.put(`/user/${selectedAdmin.userID}`, payload);
            alert(t('schoolAdmins.successUpdate'));
            setShowEditModal(false);
            setSelectedAdmin(null);
            setFormErrors({});
            fetchData();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error updating admin:', error);
                alert(error.response?.data?.message || t('schoolAdmins.errorUpdate'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async (admin: SchoolAdmin) => {
        if (!window.confirm(`${t('schoolAdmins.confirmDeactivate')} ${admin.fullName}?`)) {
            return;
        }

        try {
            await api.delete(`/user/${admin.userID}`);
            alert(t('schoolAdmins.successDeactivate'));
            fetchData();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error deactivating admin:', error);
                alert(error.response?.data?.message || t('schoolAdmins.errorStatusUpdate'));
            }
        }
    };

    const handleManagePermissions = (admin: SchoolAdmin) => {
        setSelectedAdmin(admin);
        setShowPermissionsModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="text-gray-500">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('schoolAdmins.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">{t('schoolAdmins.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 w-full sm:w-auto"
                >
                    <UserPlus className="w-5 h-5" />
                    {t('schoolAdmins.addAdmin')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">{t('common.totalAdmins')}</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{admins.length}</p>
                        </div>
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">{t('common.activeAdmins')}</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {admins.filter(a => a.isActive).length}
                            </p>
                        </div>
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">{t('common.schoolsCovered')}</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{schools.length}</p>
                        </div>
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
                    </div>
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Mobile scroll hint */}
                <div className="sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex items-center justify-center gap-1">
                    <span>←</span>
                    {t('schoolAdmins.swipeHint') || 'Scroll horizontally to see all columns'}
                    <span>→</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schoolAdmins.username')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schoolAdmins.fullName')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schoolAdmins.email')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schoolAdmins.school')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schoolAdmins.status')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schoolAdmins.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm">
                                        {t('schoolAdmins.noAdmins')}
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.userID} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm font-medium text-gray-900">{admin.username}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-900">{admin.fullName}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-500">{admin.email}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-900">{admin.schoolName}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {admin.isActive ? t('schoolAdmins.active') : t('schoolAdmins.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => handleManagePermissions(admin)}
                                                    className="text-purple-600 hover:text-purple-900 active:text-purple-950 p-1"
                                                    title={t('schoolAdmins.managePermissions')}
                                                >
                                                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(admin)}
                                                    className="text-blue-600 hover:text-blue-900 active:text-blue-950 p-1"
                                                    title={t('schoolAdmins.edit')}
                                                >
                                                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(admin)}
                                                    className="text-red-600 hover:text-red-900 active:text-red-950 p-1"
                                                    title={t('schoolAdmins.deactivate')}
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('schoolAdmins.createAdmin')}</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); setFormErrors({}); }}
                                className="text-gray-400 hover:text-gray-600 active:text-gray-800 p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                                    {t('schoolAdmins.accountInformation')}
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <User className="w-4 h-4 inline mr-1" />{t('schoolAdmins.username')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.username ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="admin.john"
                                    />
                                    {formErrors.username && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Lock className="w-4 h-4 inline mr-1" />{t('schoolAdmins.password')} *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="��������"
                                    />
                                    {formErrors.password && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Lock className="w-4 h-4 inline mr-1" />{t('schoolAdmins.confirmPassword')} *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="��������"
                                    />
                                    {formErrors.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4 pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                                    {t('schoolAdmins.personalInformation')}
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('schoolAdmins.fullName')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="John Doe"
                                    />
                                    {formErrors.fullName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Mail className="w-4 h-4 inline mr-1" />{t('schoolAdmins.email')} *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="admin@school.com"
                                    />
                                    {formErrors.email && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Phone className="w-4 h-4 inline mr-1" />{t('schoolAdmins.phoneNumber')}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="+60123456789"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4 pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                                    {t('schoolAdmins.schoolAssignment')}
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Building className="w-4 h-4 inline mr-1" />{t('schoolAdmins.school')} *
                                    </label>
                                    <select
                                        value={formData.schoolID}
                                        onChange={(e) => handleInputChange('schoolID', parseInt(e.target.value))}
                                        className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolID ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value={0}>{t('schoolAdmins.selectSchool')}</option>
                                        {schools.map((school) => (
                                            <option key={school.schoolID} value={school.schoolID}>
                                                {school.schoolName} ({school.schoolCode})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.schoolID && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.schoolID}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setFormErrors({}); }}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 order-2 sm:order-1"
                                    disabled={isSubmitting}
                                >
                                    {t('schoolAdmins.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('schoolAdmins.creating') : t('schoolAdmins.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedAdmin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('schoolAdmins.editAdmin')}</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedAdmin(null); setFormErrors({}); }}
                                className="text-gray-400 hover:text-gray-600 active:text-gray-800 p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User className="w-4 h-4 inline mr-1" />{t('schoolAdmins.username')}
                                </label>
                                <input
                                    type="text"
                                    value={selectedAdmin.username}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('common.usernameCannotChange')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Building className="w-4 h-4 inline mr-1" />{t('schoolAdmins.school')}
                                </label>
                                <input
                                    type="text"
                                    value={selectedAdmin.schoolName}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('common.schoolCannotChange')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('schoolAdmins.fullName')} *
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.fullName}
                                    onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                                    className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="John Doe"
                                />
                                {formErrors.fullName && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />{t('schoolAdmins.email')} *
                                </label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="admin@school.com"
                                />
                                {formErrors.email && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />{t('schoolAdmins.phoneNumber')}
                                </label>
                                <input
                                    type="tel"
                                    value={editFormData.phoneNumber}
                                    onChange={(e) => handleEditInputChange('phoneNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="+60123456789"
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    {t('schoolAdmins.changePassword')}
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">{t('schoolAdmins.passwordOptional')}</p>

                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Lock className="w-4 h-4 inline mr-1" />{t('schoolAdmins.newPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            value={editFormData.newPassword}
                                            onChange={(e) => handleEditInputChange('newPassword', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="��������"
                                        />
                                        {formErrors.newPassword && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Lock className="w-4 h-4 inline mr-1" />{t('schoolAdmins.confirmNewPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            value={editFormData.confirmNewPassword}
                                            onChange={(e) => handleEditInputChange('confirmNewPassword', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="��������"
                                        />
                                        {formErrors.confirmNewPassword && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.confirmNewPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedAdmin(null); setFormErrors({}); }}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 order-2 sm:order-1"
                                    disabled={isSubmitting}
                                >
                                    {t('schoolAdmins.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEditSubmit}
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('schoolAdmins.updating') : t('schoolAdmins.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {selectedAdmin && (
                <PermissionsModal
                    userId={selectedAdmin.userID}
                    userName={selectedAdmin.fullName}
                    userRole="SchoolAdmin"
                    isOpen={showPermissionsModal}
                    onClose={() => {
                        setShowPermissionsModal(false);
                        setSelectedAdmin(null);
                    }}
                    onSave={() => {
                        console.log('Permissions saved successfully');
                    }}
                />
            )}
        </div>
    );
};

export default SchoolAdminsPage;