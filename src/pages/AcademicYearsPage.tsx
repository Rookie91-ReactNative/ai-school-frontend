import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, X, CheckCircle, Users, GraduationCap } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

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
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    useEffect(() => {
        fetchAcademicYears();
    }, [schoolID]);

    const fetchAcademicYears = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/academic-year/school/${schoolID}`);
            setAcademicYears(response.data.data || []);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.yearName.trim()) {
            errors.yearName = 'Year name is required';
        } else if (!/^\d{4}\/\d{4}$/.test(formData.yearName)) {
            errors.yearName = 'Format must be YYYY/YYYY (e.g., 2024/2025)';
        }

        if (!formData.startDate) {
            errors.startDate = 'Start date is required';
        }

        if (!formData.endDate) {
            errors.endDate = 'End date is required';
        }

        if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
            errors.endDate = 'End date must be after start date';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.yearName.trim()) {
            errors.yearName = 'Year name is required';
        } else if (!/^\d{4}\/\d{4}$/.test(editFormData.yearName)) {
            errors.yearName = 'Format must be YYYY/YYYY (e.g., 2024/2025)';
        }

        if (!editFormData.startDate) {
            errors.startDate = 'Start date is required';
        }

        if (!editFormData.endDate) {
            errors.endDate = 'End date is required';
        }

        if (editFormData.startDate && editFormData.endDate && editFormData.startDate >= editFormData.endDate) {
            errors.endDate = 'End date must be after start date';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof AcademicYearFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleEditInputChange = (field: string, value: string) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/academic-year', formData);

            setShowCreateModal(false);
            resetForm();
            fetchAcademicYears();
            alert('Academic year created successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to create academic year';
                alert(errorMessage);
            }
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
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm() || !selectedYear) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put(`/academic-year/${selectedYear.academicYearID}`, editFormData);

            setShowEditModal(false);
            setSelectedYear(null);
            resetEditForm();
            fetchAcademicYears();
            alert('Academic year updated successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to update academic year';
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetActive = async (year: AcademicYear) => {
        if (year.isActive) {
            alert('This academic year is already active.');
            return;
        }

        if (!window.confirm(`Set ${year.yearName} as the active academic year?`)) {
            return;
        }

        try {
            await api.put(`/academic-year/${year.academicYearID}/activate`);
            fetchAcademicYears();
            alert(`${year.yearName} is now the active academic year!`);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to activate academic year';
                alert(errorMessage);
            }
        }
    };

    const handleDelete = async (year: AcademicYear) => {
        if (year.isActive) {
            alert('Cannot delete the active academic year. Please activate another year first.');
            return;
        }

        if (year.totalStudents > 0) {
            alert(`Cannot delete ${year.yearName}. ${year.totalStudents} students are enrolled in this year.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${year.yearName}?`)) {
            return;
        }

        try {
            await api.delete(`/academic-year/${year.academicYearID}`);
            fetchAcademicYears();
            alert('Academic year deleted successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to delete academic year';
                alert(errorMessage);
            }
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

    const resetEditForm = () => {
        setEditFormData({
            yearName: '',
            startDate: '',
            endDate: ''
        });
        setFormErrors({});
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const activeYear = academicYears.find(y => y.isActive);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        Academic Years Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage school academic years and terms</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Academic Year
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Academic Years</p>
                            <p className="text-2xl font-bold text-gray-900">{academicYears.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Year</p>
                            <p className="text-2xl font-bold text-green-900">
                                {activeYear ? activeYear.yearName : 'None'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Students (Active Year)</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {activeYear ? activeYear.totalStudents : 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Academic Years Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Academic Year
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Students
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Classes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {academicYears.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No academic years found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                academicYears.map((year) => (
                                    <tr key={year.academicYearID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {year.yearName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(year.startDate)} - {formatDate(year.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{year.totalStudents}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{year.totalClasses}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {year.isActive ? (
                                                <span className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                {!year.isActive && (
                                                    <button
                                                        onClick={() => handleSetActive(year)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Set as active year"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(year)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit year"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(year)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete year"
                                                    disabled={year.isActive || year.totalStudents > 0}
                                                >
                                                    <Trash2 className={`w-4 h-4 ${(year.isActive || year.totalStudents > 0) ? 'opacity-30 cursor-not-allowed' : ''}`} />
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

            {/* Create Academic Year Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add New Academic Year</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />Academic Year Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.yearName}
                                    onChange={(e) => handleInputChange('yearName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.yearName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="2024/2025"
                                />
                                {formErrors.yearName && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.yearName}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Format: YYYY/YYYY (e.g., 2024/2025)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.startDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.endDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Tip:</strong> The new academic year will be created as inactive.
                                    You can set it as active later using the "Set Active" button.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Academic Year'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Academic Year Modal */}
            {showEditModal && selectedYear && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Edit Academic Year</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedYear(null); resetEditForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />Academic Year Name *
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.yearName}
                                    onChange={(e) => handleEditInputChange('yearName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.yearName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="2024/2025"
                                />
                                {formErrors.yearName && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.yearName}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Format: YYYY/YYYY (e.g., 2024/2025)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        value={editFormData.startDate}
                                        onChange={(e) => handleEditInputChange('startDate', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.startDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        value={editFormData.endDate}
                                        onChange={(e) => handleEditInputChange('endDate', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.endDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                                    )}
                                </div>
                            </div>

                            {selectedYear.isActive && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-800">
                                        ✓ This is the currently active academic year
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedYear(null); resetEditForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Academic Year'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicYearsPage;