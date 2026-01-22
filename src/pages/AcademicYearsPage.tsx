import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, X, CheckCircle, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import axios from 'axios';
import EnrollmentPreviewModal from '../components/AcademicYear/EnrollmentPreviewModal';
import { authService } from '../services/authService';  // ✅ ADD THIS IMPORT

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

    // ✅ FIX: Use authService to get user data (reads from correct 'user_data' key)
    const user = authService.getCurrentUser();
    const schoolID = user?.schoolID;

    // Debug logging (can be removed in production)
    useEffect(() => {
        if (!schoolID) {
            console.error('❌ CRITICAL: SchoolID not found in user object!', { user });
        } else {
            console.log('✅ AcademicYearsPage - Current User SchoolID:', schoolID);
        }
    }, [schoolID, user]);

    const [formData, setFormData] = useState<AcademicYearFormData>({
        schoolID: schoolID || 0,
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
        if (schoolID) {
            fetchAcademicYears();
        }
    }, [schoolID]);

    // ✅ ADD: Sync formData.schoolID when schoolID changes
    useEffect(() => {
        if (schoolID) {
            setFormData(prev => ({
                ...prev,
                schoolID: schoolID
            }));
        }
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
            schoolID: schoolID || 0,
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

        // ✅ FIX: Validate schoolID before submitting
        if (!formData.schoolID || formData.schoolID === 0) {
            console.error('❌ Cannot create academic year: Invalid schoolID', formData.schoolID);
            alert(t('academicYears.errors.invalidSchoolId') || 'Error: Invalid school ID. Please log in again.');
            return;
        }

        // ✅ FIX: Log submission data for debugging
        console.log('📤 Submitting academic year:', {
            schoolID: formData.schoolID,
            yearName: formData.yearName,
            startDate: formData.startDate,
            endDate: formData.endDate,
            autoCreateClasses
        });

        try {
            setIsSubmitting(true);
            // Add autoCreateClasses as query parameter
            await api.post(`/academic-year?autoCreateClasses=${autoCreateClasses}`, formData);

            console.log('✅ Academic year created successfully for schoolID:', formData.schoolID);

            await fetchAcademicYears();
            setShowCreateModal(false);
            resetForm();
            setAutoCreateClasses(true); // Reset to default
        } catch (error) {
            console.error('❌ Error creating academic year:', error);
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message;
                alert(t('academicYears.errors.createFailed') || `Error: ${message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
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
            console.error('Error updating academic year:', error);
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message;
                alert(`Error: ${message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('academicYears.confirmDelete') || 'Are you sure you want to delete this academic year?')) {
            return;
        }

        try {
            await api.delete(`/academic-year/${id}`);
            await fetchAcademicYears();
        } catch (error) {
            console.error('Error deleting academic year:', error);
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message;
                alert(`Error: ${message}`);
            }
        }
    };

    const handleSetActive = async (id: number) => {
        try {
            await api.post(`/academic-year/${id}/activate`);
            await fetchAcademicYears();
        } catch (error) {
            console.error('Error activating academic year:', error);
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message;
                alert(`Error: ${message}`);
            }
        }
    };

    const handleEdit = (year: AcademicYear) => {
        setSelectedYear(year);
        setEditFormData({
            yearName: year.yearName,
            startDate: year.startDate.split('T')[0],
            endDate: year.endDate.split('T')[0]
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleCreate = () => {
        resetForm();
        setShowCreateModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('academicYears.title')}</h1>
                    <p className="text-sm text-gray-600 mt-1">{t('academicYears.description')}</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    {t('academicYears.createNew')}
                </button>
            </div>

            {/* Enrollment Banner (if applicable) */}
            {activeYear && futureYear && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                {t('academicYears.enrollment.readyTitle')}
                            </h3>
                            <p className="text-blue-700 mb-4">
                                {t('academicYears.enrollment.readyDescription', {
                                    activeYear: activeYear.yearName,
                                    nextYear: futureYear.yearName
                                })}
                            </p>
                            <button
                                onClick={handleOpenEnrollmentModal}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <GraduationCap className="w-5 h-5" />
                                {t('academicYears.enrollment.previewButton')}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Academic Years List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {academicYears.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">{t('academicYears.noYears')}</p>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus className="w-5 h-5" />
                            {t('academicYears.createFirst')}
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('academicYears.table.yearName')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('academicYears.table.period')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('academicYears.table.status')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('academicYears.table.students')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('academicYears.table.classes')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('academicYears.table.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {academicYears.map((year) => (
                                    <tr key={year.academicYearID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                                                <div className="text-sm font-medium text-gray-900">
                                                    {year.yearName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {year.isActive ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    {t('academicYears.status.active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {t('academicYears.status.inactive')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {year.totalStudents || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {year.totalClasses || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {!year.isActive && (
                                                    <button
                                                        onClick={() => handleSetActive(year.academicYearID)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title={t('academicYears.actions.setActive')}
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(year)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title={t('academicYears.actions.edit')}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(year.academicYearID)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title={t('academicYears.actions.delete')}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {t('academicYears.modal.createTitle')}
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('academicYears.modal.yearName')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.yearName}
                                    onChange={(e) => handleInputChange('yearName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.yearName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="2024/2025"
                                />
                                {formErrors.yearName && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.yearName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('academicYears.modal.startDate')}
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {formErrors.startDate && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('academicYears.modal.endDate')}
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {formErrors.endDate && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="autoCreateClasses"
                                    checked={autoCreateClasses}
                                    onChange={(e) => setAutoCreateClasses(e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="autoCreateClasses" className="ml-2 block text-sm text-gray-900">
                                    {t('academicYears.modal.autoCreateClasses')}
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? t('common.creating') : t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedYear && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {t('academicYears.modal.editTitle')}
                            </h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('academicYears.modal.yearName')}
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.yearName}
                                    onChange={(e) => handleEditInputChange('yearName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.yearName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {formErrors.yearName && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.yearName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('academicYears.modal.startDate')}
                                </label>
                                <input
                                    type="date"
                                    value={editFormData.startDate}
                                    onChange={(e) => handleEditInputChange('startDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {formErrors.startDate && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('academicYears.modal.endDate')}
                                </label>
                                <input
                                    type="date"
                                    value={editFormData.endDate}
                                    onChange={(e) => handleEditInputChange('endDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {formErrors.endDate && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? t('common.updating') : t('common.update')}
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