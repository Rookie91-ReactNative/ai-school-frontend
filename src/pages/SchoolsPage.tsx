import { useState, useEffect } from 'react';
import { Building, Plus, Edit, Trash2, X, Mail, Phone, MapPin, User, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import axios from 'axios';

interface School {
    schoolID: number;
    schoolCode: string;
    schoolName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    principalName: string;
    maxStudents: number;
    isActive: boolean;
    createdDate: string;
    currentStudents?: number;
    totalUsers?: number;
}

interface SchoolFormData {
    schoolCode: string;
    schoolName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    principalName: string;
    maxStudents: number;
}

interface SchoolEditFormData {
    schoolCode: string;
    schoolName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phoneNumber: string;
    email: string;
    principalName: string;
    maxStudents: number;
}

const SchoolsPage = () => {
    const { t } = useTranslation();
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<SchoolFormData>({
        schoolCode: '',
        schoolName: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        principalName: '',
        maxStudents: 1000
    });

    const [editFormData, setEditFormData] = useState<SchoolEditFormData>({
        schoolCode: '',
        schoolName: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        principalName: '',
        maxStudents: 1000
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Malaysian states for dropdown
    const malaysianStates = [
        'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
        'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah',
        'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur',
        'Labuan', 'Putrajaya'
    ];

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/school');
            setSchools(response.data.data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.schoolCode.trim()) {
            errors.schoolCode = t('schools.validation.schoolCodeRequired');
        } else if (formData.schoolCode.length < 2) {
            errors.schoolCode = t('schools.validation.schoolCodeMin');
        }

        if (!formData.schoolName.trim()) {
            errors.schoolName = t('schools.validation.schoolNameRequired');
        } else if (formData.schoolName.length < 3) {
            errors.schoolName = t('schools.validation.schoolNameMin');
        }

        if (!formData.address.trim()) {
            errors.address = t('schools.validation.addressRequired');
        }

        if (!formData.city.trim()) {
            errors.city = t('schools.validation.cityRequired');
        }

        if (!formData.state) {
            errors.state = t('schools.validation.stateRequired');
        }

        if (!formData.postalCode.trim()) {
            errors.postalCode = t('schools.validation.postalCodeRequired');
        } else if (!/^\d{5}$/.test(formData.postalCode)) {
            errors.postalCode = t('schools.validation.postalCodeFormat');
        }

        if (!formData.phoneNumber.trim()) {
            errors.phoneNumber = t('schools.validation.phoneRequired');
        }

        if (!formData.email.trim()) {
            errors.email = t('schools.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t('schools.validation.emailFormat');
        }

        if (!formData.principalName.trim()) {
            errors.principalName = t('schools.validation.principalRequired');
        }

        if (formData.maxStudents < 50) {
            errors.maxStudents = t('schools.validation.maxStudentsMin');
        } else if (formData.maxStudents > 10000) {
            errors.maxStudents = t('schools.validation.maxStudentsMax');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.schoolCode.trim()) {
            errors.schoolCode = t('schools.validation.schoolCodeRequired');
        } else if (editFormData.schoolCode.length < 2) {
            errors.schoolCode = t('schools.validation.schoolCodeMin');
        }

        if (!editFormData.schoolName.trim()) {
            errors.schoolName = t('schools.validation.schoolNameRequired');
        } else if (editFormData.schoolName.length < 3) {
            errors.schoolName = t('schools.validation.schoolNameMin');
        }

        if (!editFormData.address.trim()) {
            errors.address = t('schools.validation.addressRequired');
        }

        if (!editFormData.city.trim()) {
            errors.city = t('schools.validation.cityRequired');
        }

        if (!editFormData.state) {
            errors.state = t('schools.validation.stateRequired');
        }

        if (!editFormData.postalCode.trim()) {
            errors.postalCode = t('schools.validation.postalCodeRequired');
        } else if (!/^\d{5}$/.test(editFormData.postalCode)) {
            errors.postalCode = t('schools.validation.postalCodeFormat');
        }

        if (!editFormData.phoneNumber.trim()) {
            errors.phoneNumber = t('schools.validation.phoneRequired');
        }

        if (!editFormData.email.trim()) {
            errors.email = t('schools.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
            errors.email = t('schools.validation.emailFormat');
        }

        if (!editFormData.principalName.trim()) {
            errors.principalName = t('schools.validation.principalRequired');
        }

        if (editFormData.maxStudents < 50) {
            errors.maxStudents = t('schools.validation.maxStudentsMin');
        } else if (editFormData.maxStudents > 10000) {
            errors.maxStudents = t('schools.validation.maxStudentsMax');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof SchoolFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleEditInputChange = (field: keyof SchoolEditFormData, value: string | number) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/school', formData);
            if (response.data.success) {
                alert(t('schools.successCreate'));
                setShowCreateModal(false);
                resetForm();
                fetchSchools();
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || t('schools.errorCreate');
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSchool = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm() || !selectedSchool) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.put(`/school/${selectedSchool.schoolID}`, editFormData);
            if (response.data.success) {
                alert(t('schools.successUpdate'));
                setShowEditModal(false);
                resetEditForm();
                fetchSchools();
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || t('schools.errorUpdate');
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSchool = async (school: School) => {
        const confirmMessage = school.isActive
            ? `${t('schools.confirmDeactivate')} ${school.schoolName}?`
            : `${t('schools.confirmActivate')} ${school.schoolName}?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await api.delete(`/school/${school.schoolID}`);
            fetchSchools();
            alert(school.isActive ? t('schools.successDeactivate') : t('schools.successActivate'));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || t('schools.errorUpdate');
                alert(errorMessage);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            schoolCode: '',
            schoolName: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            phoneNumber: '',
            email: '',
            principalName: '',
            maxStudents: 1000
        });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({
            schoolCode: '',
            schoolName: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            phoneNumber: '',
            email: '',
            principalName: '',
            maxStudents: 1000
        });
        setFormErrors({});
    };

    const openEditModal = (school: School) => {
        setSelectedSchool(school);
        setEditFormData({
            schoolCode: school.schoolCode,
            schoolName: school.schoolName,
            address: school.address,
            city: school.city,
            state: school.state,
            postalCode: school.postalCode,
            phoneNumber: school.phoneNumber,
            email: school.email,
            principalName: school.principalName,
            maxStudents: school.maxStudents
        });
        setShowEditModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        {t('schools.title')}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{t('schools.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto py-2.5 sm:py-2"
                >
                    <Plus className="w-5 h-5" />
                    {t('schools.addSchool')}
                </button>
            </div>

            {/* Schools Table */}
            <div className="card overflow-hidden">
                {/* Mobile scroll hint */}
                <div className="sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex items-center justify-center gap-1">
                    <span>←</span>
                    {t('schools.swipeHint') || 'Scroll horizontally to see all columns'}
                    <span>→</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.schoolCode')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.schoolName')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.city')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.state')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.currentStudents')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.status')}
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {t('schools.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {schools.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                                        {t('schools.noSchools')}
                                    </td>
                                </tr>
                            ) : (
                                schools.map((school) => (
                                    <tr key={school.schoolID} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm font-medium text-gray-900">{school.schoolCode}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="text-xs sm:text-sm font-medium text-gray-900">{school.schoolName}</div>
                                            <div className="text-xs sm:text-sm text-gray-500">{school.principalName}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-900">{school.city}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-900">{school.state}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-900">
                                                {school.currentStudents || 0} / {school.maxStudents}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${school.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {school.isActive ? t('schools.active') : t('schools.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(school)}
                                                className="text-blue-600 hover:text-blue-900 active:text-blue-950 mr-3 sm:mr-4 p-1"
                                            >
                                                <Edit className="w-4 h-4 sm:w-5 sm:h-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSchool(school)}
                                                className={`p-1 ${school.isActive
                                                    ? 'text-red-600 hover:text-red-900 active:text-red-950'
                                                    : 'text-green-600 hover:text-green-900 active:text-green-950'
                                                    }`}
                                            >
                                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create School Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('schools.createSchool')}</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600 active:text-gray-800 p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSchool} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* School Information */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.schoolInformation')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Hash className="w-4 h-4 inline mr-1" />{t('schools.schoolCode')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.schoolCode}
                                            onChange={(e) => handleInputChange('schoolCode', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="SCH001"
                                        />
                                        {formErrors.schoolCode && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('schools.schoolName')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.schoolName}
                                            onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Sekolah Kebangsaan Example"
                                        />
                                        {formErrors.schoolName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Location Information */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.locationInformation')}</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />{t('schools.address')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.address ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Jalan Example 123"
                                        />
                                        {formErrors.address && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('schools.city')} *</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Kuala Lumpur"
                                            />
                                            {formErrors.city && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('schools.state')} *</label>
                                            <select
                                                value={formData.state}
                                                onChange={(e) => handleInputChange('state', e.target.value)}
                                                className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.state ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            >
                                                <option value="">{t('schools.selectState')}</option>
                                                {malaysianStates.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                            {formErrors.state && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('schools.postalCode')} *</label>
                                            <input
                                                type="text"
                                                value={formData.postalCode}
                                                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                                className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="50000"
                                                maxLength={5}
                                            />
                                            {formErrors.postalCode && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.postalCode}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.contactInformation')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Phone className="w-4 h-4 inline mr-1" />{t('schools.phoneNumber')} *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="012-3456789"
                                        />
                                        {formErrors.phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Mail className="w-4 h-4 inline mr-1" />{t('schools.email')} *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="school@example.com"
                                        />
                                        {formErrors.email && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Administrative Details */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.administrativeDetails')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <User className="w-4 h-4 inline mr-1" />{t('schools.principalName')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.principalName}
                                            onChange={(e) => handleInputChange('principalName', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.principalName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Dr. Ahmad bin Abdullah"
                                        />
                                        {formErrors.principalName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.principalName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('schools.maxStudents')} *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxStudents}
                                            onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.maxStudents ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="1000"
                                            min="50"
                                            max="10000"
                                        />
                                        {formErrors.maxStudents && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.maxStudents}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">{t('schools.capacity')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 order-2 sm:order-1"
                                    disabled={isSubmitting}
                                >
                                    {t('schools.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('schools.creating') : t('schools.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit School Modal */}
            {showEditModal && selectedSchool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('schools.editSchool')}</h2>
                            <button
                                onClick={() => { setShowEditModal(false); resetEditForm(); }}
                                className="text-gray-400 hover:text-gray-600 active:text-gray-800 p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSchool} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* School Information */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.schoolInformation')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Hash className="w-4 h-4 inline mr-1" />{t('schools.schoolCode')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.schoolCode}
                                            onChange={(e) => handleEditInputChange('schoolCode', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="SCH001"
                                        />
                                        {formErrors.schoolCode && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('schools.schoolName')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.schoolName}
                                            onChange={(e) => handleEditInputChange('schoolName', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Sekolah Kebangsaan Example"
                                        />
                                        {formErrors.schoolName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Location Information */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.locationInformation')}</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />{t('schools.address')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.address}
                                            onChange={(e) => handleEditInputChange('address', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.address ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Jalan Example 123"
                                        />
                                        {formErrors.address && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('schools.city')} *</label>
                                            <input
                                                type="text"
                                                value={editFormData.city}
                                                onChange={(e) => handleEditInputChange('city', e.target.value)}
                                                className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Kuala Lumpur"
                                            />
                                            {formErrors.city && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('schools.state')} *</label>
                                            <select
                                                value={editFormData.state}
                                                onChange={(e) => handleEditInputChange('state', e.target.value)}
                                                className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.state ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            >
                                                <option value="">{t('schools.selectState')}</option>
                                                {malaysianStates.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                            {formErrors.state && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('schools.postalCode')} *</label>
                                            <input
                                                type="text"
                                                value={editFormData.postalCode}
                                                onChange={(e) => handleEditInputChange('postalCode', e.target.value)}
                                                className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="50000"
                                                maxLength={5}
                                            />
                                            {formErrors.postalCode && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.postalCode}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.contactInformation')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Phone className="w-4 h-4 inline mr-1" />{t('schools.phoneNumber')} *
                                        </label>
                                        <input
                                            type="tel"
                                            value={editFormData.phoneNumber}
                                            onChange={(e) => handleEditInputChange('phoneNumber', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="012-3456789"
                                        />
                                        {formErrors.phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Mail className="w-4 h-4 inline mr-1" />{t('schools.email')} *
                                        </label>
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => handleEditInputChange('email', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="school@example.com"
                                        />
                                        {formErrors.email && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Administrative Details */}
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schools.administrativeDetails')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <User className="w-4 h-4 inline mr-1" />{t('schools.principalName')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.principalName}
                                            onChange={(e) => handleEditInputChange('principalName', e.target.value)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.principalName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Dr. Ahmad bin Abdullah"
                                        />
                                        {formErrors.principalName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.principalName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('schools.maxStudents')} *
                                        </label>
                                        <input
                                            type="number"
                                            value={editFormData.maxStudents}
                                            onChange={(e) => handleEditInputChange('maxStudents', parseInt(e.target.value) || 0)}
                                            className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.maxStudents ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="1000"
                                            min="50"
                                            max="10000"
                                        />
                                        {formErrors.maxStudents && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.maxStudents}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">{t('schools.capacity')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); resetEditForm(); }}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 order-2 sm:order-1"
                                    disabled={isSubmitting}
                                >
                                    {t('schools.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('schools.updating') : t('schools.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolsPage;