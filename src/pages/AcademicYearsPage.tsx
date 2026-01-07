import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, X, CheckCircle, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import axios from 'axios';
import EnrollmentPreviewModal from '../components/AcademicYear/EnrollmentPreviewModal';

interface AcademicYear {
    academicYearID: number;
    schoolID: number;
    schoolName: string;
    yearName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    totalStudents: number;
    totalClasses: number;
    createdDate: string;
}

interface AcademicYearFormData {
    schoolID: number;
    yearName: string;
    startDate: string;
    endDate: string;
}

const AcademicYearsPage = () => {
    const { t } = useTranslation();
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-create classes toggle
    const [autoCreateClasses, setAutoCreateClasses] = useState(true);

    // Enrollment modal state
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [enrollmentTargetYear, setEnrollmentTargetYear] = useState<AcademicYear | null>(null);

    // Get schoolID from auth context (assuming user is logged in)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const schoolID = user?.schoolID || 1; // Default to 1 for testing

    const [formData, setFormData] = useState<AcademicYearFormData>({
        schoolID: schoolID,
        yearName: '',
        startDate: '',
        endDate: ''
    });

    const [editFormData, setEditFormData] = useState({
        yearName: '',
        startDate: '',
        endDate: ''
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const activeYear = academicYears.find(year => year.isActive);

    // Get the next inactive year for enrollment
    const futureYear = academicYears.find(year => !year.isActive && year.yearName > (activeYear?.yearName || ''));

    useEffect(() => {
        fetchAcademicYears();
    }, [schoolID]);

    const fetchAcademicYears = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/academic-year`);
            setAcademicYears(response.data.data || []);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEnrollmentModal = () => {
        if (futureYear) {
            setEnrollmentTargetYear(futureYear);
            setShowEnrollmentModal(true);
        }
    };

    const handleEnrollmentComplete = () => {
        fetchAcademicYears();
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.yearName.trim()) {
            errors.yearName = t('academicYears.validation.yearNameRequired');
        } else if (!/^\d{4}\/\d{4}$/.test(formData.yearName)) {
            errors.yearName = t('academicYears.validation.yearNameFormat');
        }

        if (!formData.startDate) {
            errors.startDate = t('academicYears.validation.startDateRequired');
        }

        if (!formData.endDate) {
            errors.endDate = t('academicYears.validation.endDateRequired');
        }

        if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
            errors.endDate = t('academicYears.validation.endDateAfterStart');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.yearName.trim()) {
            errors.yearName = t('academicYears.validation.yearNameRequired');
        } else if (!/^\d{4}\/\d{4}$/.test(editFormData.yearName)) {
            errors.yearName = t('academicYears.validation.yearNameFormat');
        }

        if (!editFormData.startDate) {
            errors.startDate = t('academicYears.validation.startDateRequired');
        }

        if (!editFormData.endDate) {
            errors.endDate = t('academicYears.validation.endDateRequired');
        }

        if (editFormData.startDate && editFormData.endDate && editFormData.startDate >= editFormData.endDate) {
            errors.endDate = t('academicYears.validation.endDateAfterStart');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof AcademicYearFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleEditInputChange = (field: string, value: string) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const resetForm = () => {
        setFormData({
            schoolID: schoolID,
            yearName: '',
            startDate: '',
            endDate: ''
        });
        setFormErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            // Add autoCreateClasses as query parameter
            await api.post(`/academic-year?autoCreateClasses=${autoCreateClasses}`, formData);
            await fetchAcademicYears();
            setShowCreateModal(false);
            resetForm();
            setAutoCreateClasses(true); // Reset to default
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data.message || t('academicYears.errorCreate'));
            } else {
                alert(t('academicYears.errorCreate'));
            }
            console.error('Error creating academic year:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (year: AcademicYear) => {
        setSelectedYear(year);
        setEditFormData({
            yearName: year.yearName,
            startDate: year.startDate.split('T')[0],
            endDate: year.endDate.split('T')[0]
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm() || !selectedYear) {
            return;
        }

        try {
            setIsSubmitting(true);
            await api.put(`/academic-year/${selectedYear.academicYearID}`, editFormData);
            await fetchAcademicYears();
            setShowEditModal(false);
            setSelectedYear(null);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data.message || t('academicYears.errorUpdate'));
            } else {
                alert(t('academicYears.errorUpdate'));
            }
            console.error('Error updating academic year:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetActive = async (year: AcademicYear) => {
        if (year.isActive) {
            alert(t('academicYears.alreadyActive'));
            return;
        }

        if (window.confirm(t('academicYears.confirmSetActive') + ' ' + year.yearName + ' ' + t('academicYears.asActive'))) {
            try {
                await api.put(`/academic-year/${year.academicYearID}/activate`);
                await fetchAcademicYears();
            } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                    alert(error.response.data.message || t('academicYears.errorSetActive'));
                } else {
                    alert(t('academicYears.errorSetActive'));
                }
                console.error('Error setting active academic year:', error);
            }
        }
    };

    const handleDelete = async (year: AcademicYear) => {
        if (year.isActive) {
            alert(t('academicYears.cannotDeleteActive'));
            return;
        }

        // Soft delete confirmation - no longer checking for students since we're not permanently deleting
        if (window.confirm(t('academicYears.confirmDelete') + ' ' + year.yearName + '?')) {
            try {
                await api.delete(`/academic-year/${year.academicYearID}`);
                await fetchAcademicYears();
            } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                    alert(error.response.data.message || t('academicYears.errorDelete'));
                } else {
                    alert(t('academicYears.errorDelete'));
                }
                console.error('Error deleting academic year:', error);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        {t('academicYears.title')}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{t('academicYears.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    {t('academicYears.addYear')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600">{t('academicYears.totalYears')}</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{academicYears.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600">{t('academicYears.activeYear')}</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-900">
                                {activeYear ? activeYear.yearName : t('common.none')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-purple-100 rounded-lg">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600">{t('academicYears.totalEnrollment')}</p>
                            <p className="text-xl sm:text-2xl font-bold text-purple-900">
                                {activeYear ? activeYear.totalStudents : 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enrollment Banner - Shows when active year exists and future year has no students yet */}
            {activeYear && activeYear.totalStudents > 0 && futureYear && futureYear.totalStudents === 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                <div className="p-3 sm:p-4 bg-blue-500 rounded-full flex-shrink-0">
                                    <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                        {t('enrollment.enrollButton')}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                                        {t('enrollment.enrollButtonSubtitle', { year: futureYear.yearName })}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-700">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {activeYear.totalStudents} {t('enrollment.students')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ArrowRight className="w-4 h-4" />
                                            {t('enrollment.toPromote')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleOpenEnrollmentModal}
                                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
                            >
                                <Users className="w-5 h-5" />
                                {t('enrollment.enrollStudents')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Already Completed Message */}
            {activeYear && activeYear.totalStudents > 0 && futureYear && futureYear.totalStudents > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start sm:items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                            <p className="text-sm sm:text-base text-green-900 font-semibold">
                                {t('enrollment.alreadyCompleted')}
                            </p>
                            <p className="text-green-700 text-xs sm:text-sm mt-1">
                                {t('enrollment.alreadyCompletedMessage', {
                                    from: activeYear.yearName,
                                    to: futureYear.yearName,
                                    count: futureYear.totalStudents
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Academic Years Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('academicYears.yearName')}
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('academicYears.dateRange')}
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('academicYears.students')}
                                </th>
                                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('academicYears.classes')}
                                </th>
                                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('academicYears.status')}
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('academicYears.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {academicYears.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                                        <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm sm:text-base text-gray-500">{t('academicYears.noYears')}</p>
                                    </td>
                                </tr>
                            ) : (
                                academicYears.map((year) => (
                                    <tr key={year.academicYearID} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{year.yearName}</span>
                                                {year.isActive && (
                                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                                                        {t('academicYears.active')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="text-xs sm:text-sm text-gray-900">
                                                {formatDate(year.startDate)} - {formatDate(year.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{year.totalStudents}</span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{year.totalClasses}</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${year.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {year.isActive ? t('academicYears.active') : t('academicYears.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-1 sm:gap-3">
                                                <button
                                                    onClick={() => handleEditClick(year)}
                                                    className="p-1.5 sm:p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('academicYears.edit')}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                {!year.isActive && (
                                                    <>
                                                        <button
                                                            onClick={() => handleSetActive(year)}
                                                            className="p-1.5 sm:p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                                            title={t('academicYears.setActive')}
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(year)}
                                                            className="p-1.5 sm:p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('academicYears.delete')}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Academic Year Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full rounded-2xl shadow-xl max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="border-b px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('academicYears.createYear')}</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />{t('academicYears.yearName')} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.yearName}
                                    onChange={(e) => handleInputChange('yearName', e.target.value)}
                                    className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${formErrors.yearName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="2024/2025"
                                />
                                {formErrors.yearName && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.yearName}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{t('academicYears.formatHint')}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('academicYears.startDate')} *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.startDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('academicYears.endDate')} *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.endDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                                    )}
                                </div>
                            </div>

                            {/* Auto-Create Classes Toggle */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoCreateClasses}
                                        onChange={(e) => setAutoCreateClasses(e.target.checked)}
                                        className="mt-1 w-5 h-5 sm:w-4 sm:h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-green-900">
                                            {t('academicYears.autoCreateClasses')}
                                        </p>
                                        <p className="text-xs text-green-700 mt-1">
                                            {t('academicYears.autoCreateClassesHint')}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                            {t('academicYears.autoCreateClassesExample')}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-blue-800">
                                    <strong>{t('academicYears.tipTitle')}</strong> {t('academicYears.tipMessage')}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {t('academicYears.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('academicYears.creating') : t('academicYears.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Academic Year Modal */}
            {showEditModal && selectedYear && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full rounded-2xl shadow-xl max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="border-b px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('academicYears.editYear')}</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedYear(null); }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />{t('academicYears.yearName')} *
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.yearName}
                                    onChange={(e) => handleEditInputChange('yearName', e.target.value)}
                                    className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${formErrors.yearName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="2024/2025"
                                />
                                {formErrors.yearName && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.yearName}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('academicYears.startDate')} *
                                    </label>
                                    <input
                                        type="date"
                                        value={editFormData.startDate}
                                        onChange={(e) => handleEditInputChange('startDate', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.startDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('academicYears.endDate')} *
                                    </label>
                                    <input
                                        type="date"
                                        value={editFormData.endDate}
                                        onChange={(e) => handleEditInputChange('endDate', e.target.value)}
                                        className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.endDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                                    )}
                                </div>
                            </div>

                            {selectedYear.isActive && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-green-800">
                                        <strong>ℹ️</strong> {t('academicYears.currentlyActive')}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedYear(null); }}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {t('academicYears.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('academicYears.updating') : t('academicYears.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enrollment Preview Modal */}
            {enrollmentTargetYear && (
                <EnrollmentPreviewModal
                    isOpen={showEnrollmentModal}
                    onClose={() => setShowEnrollmentModal(false)}
                    academicYearId={enrollmentTargetYear.academicYearID}
                    academicYearName={enrollmentTargetYear.yearName}
                    onEnrollmentComplete={handleEnrollmentComplete}
                />
            )}
        </div>
    );
};

export default AcademicYearsPage;