import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, X, Users, User, DoorOpen, Filter } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

interface Class {
    classID: number;
    schoolID: number;
    gradeID: number;
    gradeName: string;
    gradeLevel: number;
    academicYearID: number;
    academicYear: string;
    className: string;
    classTeacherID: number | null;
    classTeacherName: string | null;
    room: string;
    maxStudents: number;
    currentStudents: number;
    isActive: boolean;
}

interface Grade {
    gradeID: number;
    gradeName: string;
    gradeLevel: number;
}

interface AcademicYear {
    academicYearID: number;
    yearName: string;
    isActive: boolean;
}

interface Teacher {
    userID: number;
    fullName: string;
    email: string;
}

interface ClassFormData {
    schoolID: number;
    gradeID: number;
    academicYearID: number;
    className: string;
    classTeacherID: number | null;
    room: string;
    maxStudents: number;
}

const ClassesPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [filterAcademicYearId, setFilterAcademicYearId] = useState<number | null>(null);
    const [filterGradeId, setFilterGradeId] = useState<number | null>(null);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const schoolID = user?.schoolID || 1;

    const [formData, setFormData] = useState<ClassFormData>({
        schoolID: schoolID,
        gradeID: 0,
        academicYearID: 0,
        className: '',
        classTeacherID: null,
        room: '',
        maxStudents: 40
    });

    const [editFormData, setEditFormData] = useState({
        className: '',
        classTeacherID: null as number | null,
        room: '',
        maxStudents: 40
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchInitialData();
    }, [schoolID]);

    useEffect(() => {
        fetchClasses();
    }, [filterAcademicYearId, filterGradeId]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [gradesRes, yearsRes, teachersRes] = await Promise.all([
                api.get(`/grade/school/${schoolID}`),
                api.get(`/academic-year/school/${schoolID}`),
                api.get(`/class/school/${schoolID}/teachers`)
            ]);

            setGrades(gradesRes.data.data || []);
            setAcademicYears(yearsRes.data.data || []);
            setTeachers(teachersRes.data.data || []);

            // Set default filter to active academic year
            const activeYear = yearsRes.data.data?.find((y: AcademicYear) => y.isActive);
            if (activeYear) {
                setFilterAcademicYearId(activeYear.academicYearID);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            let url = `/class/school/${schoolID}`;
            const params = new URLSearchParams();
            if (filterAcademicYearId) params.append('academicYearId', filterAcademicYearId.toString());
            if (filterGradeId) params.append('gradeId', filterGradeId.toString());
            if (params.toString()) url += `?${params.toString()}`;

            const response = await api.get(url);
            setClasses(response.data.data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.className.trim()) errors.className = 'Class name is required';
        if (formData.gradeID === 0) errors.gradeID = 'Please select a grade';
        if (formData.academicYearID === 0) errors.academicYearID = 'Please select an academic year';
        if (formData.maxStudents < 1 || formData.maxStudents > 50) {
            errors.maxStudents = 'Max students must be between 1 and 50';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await api.post('/class', formData);
            setShowCreateModal(false);
            resetForm();
            fetchClasses();
            alert('Class created successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Failed to create class');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (classData: Class) => {
        setSelectedClass(classData);
        setEditFormData({
            className: classData.className,
            classTeacherID: classData.classTeacherID,
            room: classData.room || '',
            maxStudents: classData.maxStudents
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;

        setIsSubmitting(true);
        try {
            await api.put(`/class/${selectedClass.classID}`, editFormData);
            setShowEditModal(false);
            setSelectedClass(null);
            fetchClasses();
            alert('Class updated successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Failed to update class');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (classData: Class) => {
        if (classData.currentStudents > 0) {
            alert(`Cannot delete ${classData.className}. ${classData.currentStudents} students are enrolled.`);
            return;
        }

        if (!window.confirm(`Delete ${classData.className}?`)) return;

        try {
            await api.delete(`/class/${classData.classID}`);
            fetchClasses();
            alert('Class deleted successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Failed to delete class');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            schoolID: schoolID,
            gradeID: 0,
            academicYearID: filterAcademicYearId || 0,
            className: '',
            classTeacherID: null,
            room: '',
            maxStudents: 40
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        Classes Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage school classes and assignments</p>
                </div>
                <button onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Plus className="w-5 h-5" />Add Class
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select value={filterAcademicYearId || ''}
                            onChange={(e) => setFilterAcademicYearId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Years</option>
                            {academicYears.map(year => (
                                <option key={year.academicYearID} value={year.academicYearID}>
                                    {year.yearName} {year.isActive && '(Active)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                        <select value={filterGradeId || ''}
                            onChange={(e) => setFilterGradeId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Grades</option>
                            {grades.map(grade => (
                                <option key={grade.gradeID} value={grade.gradeID}>{grade.gradeName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Classes Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {classes.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No classes found. Create one to get started.
                                </td></tr>
                            ) : (
                                classes.map((cls) => (
                                    <tr key={cls.classID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-900">{cls.className}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">{cls.gradeName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{cls.classTeacherName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <DoorOpen className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{cls.room || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className={`text-sm font-medium ${cls.currentStudents >= cls.maxStudents ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {cls.currentStudents}/{cls.maxStudents}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleEditClick(cls)}
                                                    className="text-blue-600 hover:text-blue-900" title="Edit class">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(cls)}
                                                    className="text-red-600 hover:text-red-900" title="Delete class"
                                                    disabled={cls.currentStudents > 0}>
                                                    <Trash2 className={`w-4 h-4 ${cls.currentStudents > 0 ? 'opacity-30 cursor-not-allowed' : ''}`} />
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Add New Class</h2>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                    <select value={formData.academicYearID}
                                        onChange={(e) => setFormData(prev => ({ ...prev, academicYearID: parseInt(e.target.value) }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.academicYearID ? 'border-red-500' : 'border-gray-300'}`}>
                                        <option value={0}>Select Year</option>
                                        {academicYears.map(year => (
                                            <option key={year.academicYearID} value={year.academicYearID}>
                                                {year.yearName}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.academicYearID && <p className="text-red-500 text-xs mt-1">{formErrors.academicYearID}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                                    <select value={formData.gradeID}
                                        onChange={(e) => setFormData(prev => ({ ...prev, gradeID: parseInt(e.target.value) }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.gradeID ? 'border-red-500' : 'border-gray-300'}`}>
                                        <option value={0}>Select Grade</option>
                                        {grades.map(grade => (
                                            <option key={grade.gradeID} value={grade.gradeID}>{grade.gradeName}</option>
                                        ))}
                                    </select>
                                    {formErrors.gradeID && <p className="text-red-500 text-xs mt-1">{formErrors.gradeID}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                                    <input type="text" value={formData.className}
                                        onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.className ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="4A, 5 Science 1" />
                                    {formErrors.className && <p className="text-red-500 text-xs mt-1">{formErrors.className}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                    <input type="text" value={formData.room}
                                        onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="A101" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
                                    <select value={formData.classTeacherID || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, classTeacherID: e.target.value ? parseInt(e.target.value) : null }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">No Teacher</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.userID} value={teacher.userID}>{teacher.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students *</label>
                                    <input type="number" value={formData.maxStudents}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 40 }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${formErrors.maxStudents ? 'border-red-500' : 'border-gray-300'}`}
                                        min="1" max="50" />
                                    {formErrors.maxStudents && <p className="text-red-500 text-xs mt-1">{formErrors.maxStudents}</p>}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}>Cancel</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedClass && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Edit Class</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedClass(null); }}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Class:</strong> {selectedClass.className} |
                                    <strong> Grade:</strong> {selectedClass.gradeName} |
                                    <strong> Year:</strong> {selectedClass.academicYear}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                                    <input type="text" value={editFormData.className}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, className: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="4A, 5 Science 1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                    <input type="text" value={editFormData.room}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, room: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="A101" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
                                    <select value={editFormData.classTeacherID || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, classTeacherID: e.target.value ? parseInt(e.target.value) : null }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">No Teacher</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.userID} value={teacher.userID}>{teacher.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students *</label>
                                    <input type="number" value={editFormData.maxStudents}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 40 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        min="1" max="50" />
                                </div>
                            </div>
                            {selectedClass.currentStudents > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ This class has {selectedClass.currentStudents} student(s) enrolled.
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowEditModal(false); setSelectedClass(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}>Cancel</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Update Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesPage;