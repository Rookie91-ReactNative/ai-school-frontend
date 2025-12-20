import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit, Trash2, X, Users, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import axios from 'axios';

interface Grade {
    gradeID: number;
    schoolID: number;
    schoolName: string;
    gradeName: string;
    gradeLevel: number;
    description: string;
    isActive: boolean;
    totalStudents: number;
    totalClasses: number;
}

interface GradeFormData {
    schoolID: number;
    gradeName: string;
    gradeLevel: number;
    description: string;
}

const GradesPage = () => {
    const { t } = useTranslation();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get schoolID from auth context
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const schoolID = user?.schoolID || 1;

    const [formData, setFormData] = useState<GradeFormData>({
        schoolID: schoolID,
        gradeName: '',
        gradeLevel: 1,
        description: ''
    });

    const [editFormData, setEditFormData] = useState({
        gradeName: '',
        gradeLevel: 1,
        description: ''
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchGrades();
    }, [schoolID]);

    const fetchGrades = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/grade`);
            setGrades(response.data.data || []);
        } catch (error) {
            console.error('Error fetching grades:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.gradeName.trim()) {
            errors.gradeName = t('grades.validation.gradeNameRequired');
        }

        if (formData.gradeLevel < 1 || formData.gradeLevel > 12) {
            errors.gradeLevel = t('grades.validation.gradeLevelRange');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.gradeName.trim()) {
            errors.gradeName = t('grades.validation.gradeNameRequired');
        }

        if (editFormData.gradeLevel < 1 || editFormData.gradeLevel > 12) {
            errors.gradeLevel = t('grades.validation.gradeLevelRange');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof GradeFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleEditInputChange = (field: string, value: string | number) => {
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
            await api.post('/grade', formData);

            setShowCreateModal(false);
            resetForm();
            fetchGrades();
            alert(t('grades.successCreate'));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || t('grades.errorCreate');
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (grade: Grade) => {
        setSelectedGrade(grade);
        setEditFormData({
            gradeName: grade.gradeName,
            gradeLevel: grade.gradeLevel,
            description: grade.description || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm() || !selectedGrade) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put(`/grade/${selectedGrade.gradeID}`, editFormData);

            setShowEditModal(false);
            setSelectedGrade(null);
            resetEditForm();
            fetchGrades();
            alert(t('grades.successUpdate'));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || t('grades.errorUpdate');
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (grade: Grade) => {
        if (grade.totalClasses > 0) {
            alert(t('grades.cannotDeleteWithClasses'));
            return;
        }

        const confirmMessage = `${t('grades.confirmDelete')} ${grade.gradeName}?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await api.delete(`/grade/${grade.gradeID}`);
            fetchGrades();
            alert(t('grades.successDelete'));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || t('grades.errorDelete');
                alert(errorMessage);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            schoolID: schoolID,
            gradeName: '',
            gradeLevel: 1,
            description: ''
        });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({
            gradeName: '',
            gradeLevel: 1,
            description: ''
        });
        setFormErrors({});
    };

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
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                        {t('grades.title')}
                    </h1>
                    <p className="text-gray-600 mt-1">{t('grades.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    {t('grades.addGrade')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('grades.totalGrades')}</p>
                            <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('common.totalStudents')}</p>
                            <p className="text-2xl font-bold text-green-900">
                                {grades.reduce((sum, g) => sum + g.totalStudents, 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('common.totalClasses')}</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {grades.reduce((sum, g) => sum + g.totalClasses, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('grades.gradeLevel')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('grades.gradeName')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('grades.description')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('grades.students')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('grades.classes')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t('grades.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {grades.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        {t('grades.noGrades')}
                                    </td>
                                </tr>
                            ) : (
                                grades.map((grade) => (
                                    <tr key={grade.gradeID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {grade.gradeLevel}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-900">
                                                {grade.gradeName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-500">
                                                {grade.description || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{grade.totalStudents}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{grade.totalClasses}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(grade)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                title={t('grades.edit')}
                                            >
                                                <Edit className="w-5 h-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(grade)}
                                                className="text-red-600 hover:text-red-900"
                                                title={t('grades.delete')}
                                            >
                                                <Trash2 className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Grade Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">{t('grades.createGrade')}</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('grades.gradeName')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.gradeName}
                                        onChange={(e) => handleInputChange('gradeName', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.gradeName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Grade 1 / Form 1"
                                    />
                                    {formErrors.gradeName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.gradeName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('grades.gradeLevel')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.gradeLevel}
                                        onChange={(e) => handleInputChange('gradeLevel', parseInt(e.target.value) || 1)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.gradeLevel ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        min="1"
                                        max="12"
                                    />
                                    {formErrors.gradeLevel && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.gradeLevel}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">{t('grades.levelHint')}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('grades.description')}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder={t('grades.descriptionPlaceholder')}
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>{t('grades.examplesTitle')}</strong><br />
                                    {t('grades.examplesPrimary')}<br />
                                    {t('grades.examplesSecondary')}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    {t('grades.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('grades.creating') : t('grades.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Grade Modal */}
            {showEditModal && selectedGrade && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">{t('grades.editGrade')}</h2>
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedGrade(null); resetEditForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('grades.gradeName')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.gradeName}
                                        onChange={(e) => handleEditInputChange('gradeName', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.gradeName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Grade 1 / Form 1"
                                    />
                                    {formErrors.gradeName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.gradeName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('grades.gradeLevel')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={editFormData.gradeLevel}
                                        onChange={(e) => handleEditInputChange('gradeLevel', parseInt(e.target.value) || 1)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.gradeLevel ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        min="1"
                                        max="12"
                                    />
                                    {formErrors.gradeLevel && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.gradeLevel}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">{t('grades.levelHint')}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('grades.description')}
                                </label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder={t('grades.descriptionPlaceholder')}
                                />
                            </div>

                            {selectedGrade.totalClasses > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ {t('grades.warningClasses')} {selectedGrade.totalClasses} {t('grades.warningClassesText')} {selectedGrade.totalStudents} {t('grades.warningStudentsText')}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedGrade(null); resetEditForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    {t('grades.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('grades.updating') : t('grades.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradesPage;