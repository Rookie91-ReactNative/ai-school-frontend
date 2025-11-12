import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X, Upload, Filter, GraduationCap, BookOpen, RefreshCw, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import PhotoManagementModal from '../components/Students/PhotoManagementModal';
import PhotoUploadModal from '../components/Students/PhotoUploadModal';

interface Student {
    studentID: number;
    schoolID: number;
    studentCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    parentContact: string;
    parentEmail: string;
    parentName: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    isActive: boolean;
    enrollmentDate: string;

    // Academic info
    academicYearID: number | null;
    academicYear: string | null;
    gradeID: number | null;
    gradeName: string | null;
    classID: number | null;
    className: string | null;
    classTeacherName: string | null;
    enrollmentStatus: string | null;
    photoCount: number;
}

interface Grade {
    gradeID: number;
    gradeName: string;
}

interface AcademicYear {
    academicYearID: number;
    yearName: string;
    isActive: boolean;
}

interface Class {
    classID: number;
    className: string;
    gradeID: number;
    academicYearID: number;
}

const StudentsPage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [filterAcademicYearId, setFilterAcademicYearId] = useState<number | null>(null);
    const [filterGradeId, setFilterGradeId] = useState<number | null>(null);
    const [filterClassId, setFilterClassId] = useState<number | null>(null);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const schoolID = user?.schoolID || 1;

    // Photo Management Modal State
    const [photoManagementModal, setPhotoManagementModal] = useState<{
        isOpen: boolean;
        studentCode: string;
        studentName: string;
    }>({
        isOpen: false,
        studentCode: '',
        studentName: '',
    });

    const [formData, setFormData] = useState({
        student: {
            schoolID: schoolID,
            studentCode: '',
            fullName: '',
            email: '',
            phoneNumber: '',
            parentContact: '',
            parentEmail: '',
            parentName: '',
            dateOfBirth: '',
            gender: 'Male',
            address: '',
            enrollmentDate: new Date().toISOString().split('T')[0]
        },
        enrollment: null as {
            academicYearID: number;
            classID: number;
            gradeID: number;
            startDate: string;
            remarks: string;
        } | null
    });

    const [enrollFormData, setEnrollFormData] = useState({
        academicYearID: 0,
        gradeID: 0,
        classID: 0,
        startDate: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    const [editFormData, setEditFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        parentContact: '',
        parentEmail: '',
        parentName: '',
        dateOfBirth: '',
        gender: 'Male',
        address: ''
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchInitialData();
    }, [schoolID]);

    useEffect(() => {
        fetchStudents();
    }, [filterAcademicYearId, filterGradeId, filterClassId]);

    // Filter classes when grade changes in create form
    useEffect(() => {
        if (formData.enrollment?.gradeID) {
            const filtered = allClasses.filter(
                c => c.gradeID === formData.enrollment?.gradeID &&
                    c.academicYearID === formData.enrollment?.academicYearID
            );
            setFilteredClasses(filtered);
        }
    }, [formData.enrollment?.gradeID, formData.enrollment?.academicYearID, allClasses]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [gradesRes, yearsRes, classesRes] = await Promise.all([
                api.get(`/grade/school/${schoolID}`),
                api.get(`/academic-year/school/${schoolID}`),
                api.get(`/class/school/${schoolID}`)
            ]);

            setGrades(gradesRes.data.data || []);
            setAcademicYears(yearsRes.data.data || []);
            setAllClasses(classesRes.data.data || []);

            // Set default academic year to active one
            const activeYear = (yearsRes.data.data || []).find((y: AcademicYear) => y.isActive);
            if (activeYear) {
                setFilterAcademicYearId(activeYear.academicYearID);
                setFormData(prev => ({
                    ...prev,
                    enrollment: prev.enrollment ? { ...prev.enrollment, academicYearID: activeYear.academicYearID } : null
                }));
                setEnrollFormData(prev => ({ ...prev, academicYearID: activeYear.academicYearID }));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            let url = `/student/school/${schoolID}`;
            const params = new URLSearchParams();
            if (filterAcademicYearId) params.append('academicYearId', filterAcademicYearId.toString());
            if (filterGradeId) params.append('gradeId', filterGradeId.toString());
            if (filterClassId) params.append('classId', filterClassId.toString());
            if (params.toString()) url += `?${params.toString()}`;

            const response = await api.get(url);
            setStudents(response.data.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        const { student } = formData;

        if (!student.studentCode.trim()) errors.studentCode = 'Student code is required';
        if (!student.fullName.trim()) errors.fullName = 'Full name is required';
        if (!student.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            await api.post('/student', formData);
            await fetchStudents();
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Error creating student');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        try {
            setIsSubmitting(true);
            await api.put(`/student/${selectedStudent.studentID}`, editFormData);
            await fetchStudents();
            setShowEditModal(false);
            setSelectedStudent(null);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Error updating student');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEnrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        if (!enrollFormData.academicYearID || !enrollFormData.gradeID || !enrollFormData.classID) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post(`/student/${selectedStudent.studentID}/enroll`, {
                ...enrollFormData,
                studentID: selectedStudent.studentID
            });
            await fetchStudents();
            setShowEnrollModal(false);
            setSelectedStudent(null);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Error enrolling student');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (studentId: number) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;

        try {
            await api.delete(`/student/${studentId}`);
            await fetchStudents();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || 'Error deleting student');
            }
        }
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setEditFormData({
            fullName: student.fullName,
            email: student.email || '',
            phoneNumber: student.phoneNumber || '',
            parentContact: student.parentContact || '',
            parentEmail: student.parentEmail || '',
            parentName: student.parentName || '',
            dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
            gender: student.gender || 'Male',
            address: student.address || ''
        });
        setShowEditModal(true);
    };

    const handleEnroll = (student: Student) => {
        setSelectedStudent(student);
        setEnrollFormData({
            academicYearID: student.academicYearID || enrollFormData.academicYearID,
            gradeID: student.gradeID || 0,
            classID: student.classID || 0,
            startDate: new Date().toISOString().split('T')[0],
            remarks: ''
        });
        setShowEnrollModal(true);
    };

    const handleOpenPhotoUpload = (student: Student) => {
        setSelectedStudent(student);
        setShowPhotoUploadModal(true);
    };

    // NEW: Photo Management Handlers
    const handleOpenPhotoManagement = (student: Student) => {
        setPhotoManagementModal({
            isOpen: true,
            studentCode: student.studentCode,
            studentName: student.fullName,
        });
    };

    const handleClosePhotoManagement = () => {
        setPhotoManagementModal({
            isOpen: false,
            studentCode: '',
            studentName: '',
        });
        // Refresh students to update photo count
        fetchStudents();
    };

    const resetForm = () => {
        setFormData({
            student: {
                schoolID: schoolID,
                studentCode: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                parentContact: '',
                parentEmail: '',
                parentName: '',
                dateOfBirth: '',
                gender: 'Male',
                address: '',
                enrollmentDate: new Date().toISOString().split('T')[0]
            },
            enrollment: null
        });
        setFormErrors({});
    };

    const clearFilters = () => {
        setFilterAcademicYearId(null);
        setFilterGradeId(null);
        setFilterClassId(null);
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
                        <Users className="w-8 h-8 text-blue-600" />
                        Students Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage student information and enrollment</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Student
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    {(filterAcademicYearId || filterGradeId || filterClassId) && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                        <select
                            value={filterAcademicYearId || ''}
                            onChange={(e) => setFilterAcademicYearId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Years</option>
                            {academicYears.map(year => (
                                <option key={year.academicYearID} value={year.academicYearID}>
                                    {year.yearName} {year.isActive && '(Active)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                        <select
                            value={filterGradeId || ''}
                            onChange={(e) => setFilterGradeId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Grades</option>
                            {grades.map(grade => (
                                <option key={grade.gradeID} value={grade.gradeID}>{grade.gradeName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                        <select
                            value={filterClassId || ''}
                            onChange={(e) => setFilterClassId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!filterGradeId}
                        >
                            <option value="">All Classes</option>
                            {allClasses
                                .filter(c => !filterGradeId || c.gradeID === filterGradeId)
                                .map(cls => (
                                    <option key={cls.classID} value={cls.classID}>{cls.className}</option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Total Students: <strong className="text-gray-900">{students.length}</strong></span>
                </div>
                <div className="flex items-end">
                    <button onClick={() => { setFilterAcademicYearId(null); setFilterGradeId(null); setFilterClassId(null); }}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" />Clear Filters
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Full Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Academic Year
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Class
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Photos
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No students found</p>
                                        <p className="text-sm mt-1">Add a new student or adjust your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.studentID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{student.studentCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                            <div className="text-sm text-gray-500">{student.gender}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.academicYear || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.gradeName || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.className || '-'}</div>
                                            {student.classTeacherName && (
                                                <div className="text-xs text-gray-500">{student.classTeacherName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.photoCount > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {student.photoCount} photo{student.photoCount !== 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Upload Photos Button */}
                                                <button
                                                    onClick={() => handleOpenPhotoUpload(student)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Upload Photos"
                                                >
                                                    <Upload className="w-5 h-5" />
                                                </button>

                                                {/* NEW: Manage Photos Button */}
                                                <button
                                                    onClick={() => handleOpenPhotoManagement(student)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="Manage Photos"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>

                                                {/* Enroll/Transfer Button */}
                                                <button
                                                    onClick={() => handleEnroll(student)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Enroll/Transfer"
                                                >
                                                    <GraduationCap className="w-5 h-5" />
                                                </button>

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Edit Student"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDelete(student.studentID)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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

            {/* Create Student Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
                            {/* Student Information Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Student Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Student Code * {formErrors.studentCode && <span className="text-red-500 text-xs">({formErrors.studentCode})</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.student.studentCode}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, studentCode: e.target.value }
                                            }))}
                                            className={`w-full px-3 py-2 border rounded-lg ${formErrors.studentCode ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="e.g., STU001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name * {formErrors.fullName && <span className="text-red-500 text-xs">({formErrors.fullName})</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.student.fullName}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, fullName: e.target.value }
                                            }))}
                                            className={`w-full px-3 py-2 border rounded-lg ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of Birth * {formErrors.dateOfBirth && <span className="text-red-500 text-xs">({formErrors.dateOfBirth})</span>}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.student.dateOfBirth}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, dateOfBirth: e.target.value }
                                            }))}
                                            className={`w-full px-3 py-2 border rounded-lg ${formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            value={formData.student.gender}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, gender: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.student.email}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, email: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={formData.student.phoneNumber}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, phoneNumber: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Information Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                                        <input
                                            type="text"
                                            value={formData.student.parentName}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, parentName: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
                                        <input
                                            type="text"
                                            value={formData.student.parentContact}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, parentContact: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                                        <input
                                            type="email"
                                            value={formData.student.parentEmail}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, parentEmail: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                                        <input
                                            type="date"
                                            value={formData.student.enrollmentDate}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                student: { ...prev.student, enrollmentDate: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        value={formData.student.address}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            student: { ...prev.student, address: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Optional Enrollment Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-green-600" />
                                        Enrollment (Optional)
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.enrollment !== null}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const activeYear = academicYears.find(y => y.isActive);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        enrollment: {
                                                            academicYearID: activeYear?.academicYearID || 0,
                                                            classID: 0,
                                                            gradeID: 0,
                                                            startDate: new Date().toISOString().split('T')[0],
                                                            remarks: ''
                                                        }
                                                    }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, enrollment: null }));
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700">Enroll student now</span>
                                    </label>
                                </div>

                                {formData.enrollment && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                            <select
                                                value={formData.enrollment.academicYearID}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    enrollment: prev.enrollment ? {
                                                        ...prev.enrollment,
                                                        academicYearID: parseInt(e.target.value),
                                                        classID: 0
                                                    } : null
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value={0}>Select Year</option>
                                                {academicYears.map(year => (
                                                    <option key={year.academicYearID} value={year.academicYearID}>
                                                        {year.yearName} {year.isActive && '(Active)'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                                            <select
                                                value={formData.enrollment.gradeID}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    enrollment: prev.enrollment ? {
                                                        ...prev.enrollment,
                                                        gradeID: parseInt(e.target.value),
                                                        classID: 0
                                                    } : null
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value={0}>Select Grade</option>
                                                {grades.map(grade => (
                                                    <option key={grade.gradeID} value={grade.gradeID}>{grade.gradeName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                            <select
                                                value={formData.enrollment.classID}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    enrollment: prev.enrollment ? {
                                                        ...prev.enrollment,
                                                        classID: parseInt(e.target.value)
                                                    } : null
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                disabled={!formData.enrollment.gradeID}
                                            >
                                                <option value={0}>Select Class</option>
                                                {filteredClasses.map(cls => (
                                                    <option key={cls.classID} value={cls.classID}>{cls.className}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.enrollment.startDate}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    enrollment: prev.enrollment ? {
                                                        ...prev.enrollment,
                                                        startDate: e.target.value
                                                    } : null
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                            <textarea
                                                value={formData.enrollment.remarks}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    enrollment: prev.enrollment ? {
                                                        ...prev.enrollment,
                                                        remarks: e.target.value
                                                    } : null
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
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
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Edit Student</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedStudent(null); }}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Student Code:</strong> {selectedStudent.studentCode}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input type="text" value={editFormData.fullName}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                    <input type="date" value={editFormData.dateOfBirth}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select value={editFormData.gender}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={editFormData.email}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="text" value={editFormData.phoneNumber}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
                                    <input type="text" value={editFormData.parentContact}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, parentContact: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                                    <input type="text" value={editFormData.parentName}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, parentName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                                    <input type="email" value={editFormData.parentEmail}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea value={editFormData.address}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    rows={2} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowEditModal(false); setSelectedStudent(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}>Cancel</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Update Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enroll/Transfer Modal */}
            {showEnrollModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Enroll / Transfer Student</h2>
                            <button onClick={() => { setShowEnrollModal(false); setSelectedStudent(null); }}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 font-medium mb-2">Student: {selectedStudent.fullName}</p>
                                <p className="text-sm text-blue-700">
                                    Current: {selectedStudent.className ? `${selectedStudent.gradeName} - ${selectedStudent.className}` : 'Not enrolled'}
                                </p>
                            </div>

                            {selectedStudent.className && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ This will transfer the student to a new class. Previous enrollment will be marked as "Transferred".
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                    <select value={enrollFormData.academicYearID}
                                        onChange={(e) => setEnrollFormData(prev => ({ ...prev, academicYearID: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value={0}>Select Year</option>
                                        {academicYears.map(year => (
                                            <option key={year.academicYearID} value={year.academicYearID}>
                                                {year.yearName} {year.isActive && '(Active)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                                    <select value={enrollFormData.gradeID}
                                        onChange={(e) => {
                                            const gradeId = parseInt(e.target.value);
                                            setEnrollFormData(prev => ({ ...prev, gradeID: gradeId, classID: 0 }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value={0}>Select Grade</option>
                                        {grades.map(grade => (
                                            <option key={grade.gradeID} value={grade.gradeID}>{grade.gradeName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                    <select value={enrollFormData.classID}
                                        onChange={(e) => setEnrollFormData(prev => ({ ...prev, classID: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        disabled={!enrollFormData.gradeID}>
                                        <option value={0}>Select Class</option>
                                        {allClasses
                                            .filter(c => c.gradeID === enrollFormData.gradeID && c.academicYearID === enrollFormData.academicYearID)
                                            .map(cls => (
                                                <option key={cls.classID} value={cls.classID}>{cls.className}</option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date" value={enrollFormData.startDate}
                                        onChange={(e) => setEnrollFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                    <textarea value={enrollFormData.remarks}
                                        onChange={(e) => setEnrollFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        rows={2}
                                        placeholder="Optional notes about enrollment/transfer" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowEnrollModal(false); setSelectedStudent(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}>Cancel</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    disabled={isSubmitting}>
                                    {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Photo Upload Modal */}
            {showPhotoUploadModal && selectedStudent && (
                <PhotoUploadModal
                    studentCode={selectedStudent.studentCode}
                    studentName={selectedStudent.fullName}
                    isOpen={showPhotoUploadModal}
                    onClose={() => {
                        setShowPhotoUploadModal(false);
                        setSelectedStudent(null);
                    }}
                    onSuccess={() => {
                        fetchStudents();
                        setShowPhotoUploadModal(false);
                        setSelectedStudent(null);
                    }}
                />
            )}

            {/* Photo Management Modal */}
            <PhotoManagementModal
                studentCode={photoManagementModal.studentCode}
                studentName={photoManagementModal.studentName}
                isOpen={photoManagementModal.isOpen}
                onClose={handleClosePhotoManagement}
                onPhotoUpdated={fetchStudents}
            />
        </div>
    );
};

export default StudentsPage;