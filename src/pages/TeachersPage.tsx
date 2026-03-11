import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users, Plus, Edit, UserX, Search, Filter,
    Mail, Phone, BookOpen, Award, Calendar, X, Check
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import type { Teacher, UpdateTeacherDto } from '../services/teacherService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import AddTeacherModal from '../components/Teachers/AddTeacherModal';

const TeachersPage = () => {
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadTeachers();
    }, [showActiveOnly]);

    useEffect(() => {
        filterTeachers();
    }, [teachers, searchTerm]);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getAllTeachers(showActiveOnly);
            setTeachers(data);
        } catch (error) {
            console.error('Error loading teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTeachers = () => {
        let filtered = [...teachers];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(teacher =>
                (teacher.fullName ?? '').toLowerCase().includes(search) ||
                (teacher.teacherCode ?? '').toLowerCase().includes(search) ||
                (teacher.email ?? '').toLowerCase().includes(search) ||
                (teacher.subject ?? '').toLowerCase().includes(search) ||
                (teacher.specialization ?? '').toLowerCase().includes(search)
            );
        }

        setFilteredTeachers(filtered);
        setCurrentPage(1);
    };

    const handleAddTeacher = () => {
        setIsAddModalOpen(true);
    };

    const handleEditTeacher = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsEditModalOpen(true);
    };

    const handleDeactivateTeacher = async (teacher: Teacher) => {
        if (window.confirm(t('teachers.confirmDeactivate', { name: teacher.fullName }))) {
            try {
                await teacherService.deactivateTeacher(teacher.teacherID);
                loadTeachers();
            } catch (error) {
                console.error('Error deactivating teacher:', error);
                alert(t('teachers.deactivateError'));
            }
        }
    };

    // Pagination
    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const paginatedTeachers = filteredTeachers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('teachers.title')}</h1>
                    <p className="text-gray-600 mt-1">{t('teachers.subtitle')}</p>
                </div>
                <button
                    onClick={handleAddTeacher}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" />
                    {t('teachers.addTeacher')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{t('teachers.totalTeachers')}</p>
                            <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{t('teachers.activeTeachers')}</p>
                            <p className="text-2xl font-bold text-green-600">
                                {teachers.filter(t => t.isActive).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{t('teachers.inactiveTeachers')}</p>
                            <p className="text-2xl font-bold text-gray-400">
                                {teachers.filter(t => !t.isActive).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <UserX className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('teachers.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Active/Inactive */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={showActiveOnly ? 'active' : 'all'}
                            onChange={(e) => setShowActiveOnly(e.target.value === 'active')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="active">{t('teachers.activeOnly')}</option>
                            <option value="all">{t('teachers.allTeachers')}</option>
                        </select>
                    </div>
                </div>

                {searchTerm && (
                    <div className="mt-3 text-sm text-gray-600">
                        Found {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Teachers Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.teacher')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.contact')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.subject')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.specialization')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.joinDate')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.status')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('teachers.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedTeachers.length > 0 ? (
                                paginatedTeachers.map((teacher) => (
                                    <tr key={teacher.teacherID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {teacher.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {teacher.teacherCode}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                {teacher.email && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4" />
                                                        {teacher.email}
                                                    </div>
                                                )}
                                                {teacher.phoneNumber && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        {teacher.phoneNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">
                                                    {teacher.subject || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">
                                                    {teacher.specialization || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${teacher.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {teacher.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditTeacher(teacher)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title={t('common.edit')}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                {teacher.isActive && (
                                                    <button
                                                        onClick={() => handleDeactivateTeacher(teacher)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title={t('common.deactivate')}
                                                    >
                                                        <UserX className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="w-12 h-12 text-gray-300" />
                                            <p className="text-gray-500">{t('teachers.noTeachersFound')}</p>
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                                >
                                                    {t('common.clearSearch')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredTeachers.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Add Teacher Modal */}
            {isAddModalOpen && (
                <AddTeacherModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        loadTeachers();
                    }}
                />
            )}

            {/* Edit Teacher Modal */}
            {isEditModalOpen && selectedTeacher && (
                <EditTeacherModal
                    teacher={selectedTeacher}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedTeacher(null);
                    }}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedTeacher(null);
                        loadTeachers();
                    }}
                />
            )}
        </div>
    );
};

// Edit Teacher Modal Component
const EditTeacherModal = ({
    teacher,
    onClose,
    onSuccess
}: {
    teacher: Teacher;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [formData, setFormData] = useState<UpdateTeacherDto>({
        fullName: teacher.fullName,
        email: teacher.email,
        phoneNumber: teacher.phoneNumber,
        subject: teacher.subject || '',
        specialization: teacher.specialization || '',
        isActive: teacher.isActive,
        isAdmin: teacher.isAdmin ?? false,
        adminPosition: teacher.adminPosition || '',
    });
    const [submitting, setSubmitting] = useState(false);

    const { t } = useTranslation();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await teacherService.updateTeacher(teacher.teacherID, formData);
            onSuccess();
        } catch (error: unknown) {
            console.error('Error updating teacher:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update teacher';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{t('teachers.editTeacher')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                                {t('teachers.teacherCode')}: <span className="font-medium">{teacher.teacherCode}</span>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('teachers.fullName')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                        <div className="md:col-span-2">
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
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">{t('teachers.active')}</span>
                            </label>
                        </div>

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
                            {submitting ? t('teachers.updating') : t('teachers.updateTeacher')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeachersPage;