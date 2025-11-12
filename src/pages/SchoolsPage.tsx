import { useState, useEffect } from 'react';
import { Building, Plus, Edit, Trash2, X, Mail, Phone, MapPin, User, Hash } from 'lucide-react';
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
            errors.schoolCode = 'School code is required';
        } else if (formData.schoolCode.length < 2) {
            errors.schoolCode = 'School code must be at least 2 characters';
        }

        if (!formData.schoolName.trim()) {
            errors.schoolName = 'School name is required';
        } else if (formData.schoolName.length < 3) {
            errors.schoolName = 'School name must be at least 3 characters';
        }

        if (!formData.address.trim()) {
            errors.address = 'Address is required';
        }

        if (!formData.city.trim()) {
            errors.city = 'City is required';
        }

        if (!formData.state) {
            errors.state = 'State is required';
        }

        if (!formData.postalCode.trim()) {
            errors.postalCode = 'Postal code is required';
        } else if (!/^\d{5}$/.test(formData.postalCode)) {
            errors.postalCode = 'Postal code must be 5 digits';
        }

        if (!formData.phoneNumber.trim()) {
            errors.phoneNumber = 'Phone number is required';
        } else if (!/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
            errors.phoneNumber = 'Invalid Malaysian phone number format';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!formData.principalName.trim()) {
            errors.principalName = 'Principal name is required';
        }

        if (formData.maxStudents < 50) {
            errors.maxStudents = 'Maximum students must be at least 50';
        } else if (formData.maxStudents > 10000) {
            errors.maxStudents = 'Maximum students cannot exceed 10,000';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.schoolName.trim()) {
            errors.schoolName = 'School name is required';
        } else if (editFormData.schoolName.length < 3) {
            errors.schoolName = 'School name must be at least 3 characters';
        }

        if (!editFormData.address.trim()) {
            errors.address = 'Address is required';
        }

        if (!editFormData.city.trim()) {
            errors.city = 'City is required';
        }

        if (!editFormData.state) {
            errors.state = 'State is required';
        }

        if (!editFormData.postalCode.trim()) {
            errors.postalCode = 'Postal code is required';
        } else if (!/^\d{5}$/.test(editFormData.postalCode)) {
            errors.postalCode = 'Postal code must be 5 digits';
        }

        if (!editFormData.phoneNumber.trim()) {
            errors.phoneNumber = 'Phone number is required';
        } else if (!/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/.test(editFormData.phoneNumber.replace(/\s/g, ''))) {
            errors.phoneNumber = 'Invalid Malaysian phone number format';
        }

        if (!editFormData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!editFormData.principalName.trim()) {
            errors.principalName = 'Principal name is required';
        }

        if (editFormData.maxStudents < 50) {
            errors.maxStudents = 'Maximum students must be at least 50';
        } else if (editFormData.maxStudents > 10000) {
            errors.maxStudents = 'Maximum students cannot exceed 10,000';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/school', formData);

            setShowCreateModal(false);
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
            fetchSchools();
            alert('School created successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to create school';
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (school: School) => {
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

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm() || !selectedSchool) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put(`/school/${selectedSchool.schoolID}`, editFormData);

            setShowEditModal(false);
            setSelectedSchool(null);
            resetEditForm();
            fetchSchools();
            alert('School updated successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to update school';
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (school: School) => {
        const confirmMessage = school.isActive
            ? `Are you sure you want to deactivate ${school.schoolName}?`
            : `Are you sure you want to activate ${school.schoolName}?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await api.delete(`/school/${school.schoolID}`);
            fetchSchools();
            alert(`School ${school.isActive ? 'deactivated' : 'activated'} successfully!`);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to update school status';
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
                        <Building className="w-8 h-8 text-blue-600" />
                        Schools Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage schools in the system</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add School
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Schools</p>
                            <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Building className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Schools</p>
                            <p className="text-2xl font-bold text-green-900">
                                {schools.filter(s => s.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <Building className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Inactive Schools</p>
                            <p className="text-2xl font-bold text-red-900">
                                {schools.filter(s => !s.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    School Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    School Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Contact
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
                            {schools.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No schools found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                schools.map((school) => (
                                    <tr key={school.schoolID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {school.schoolCode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{school.schoolName}</div>
                                            <div className="text-sm text-gray-500">
                                                {school.city}, {school.state}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{school.phoneNumber}</div>
                                            <div className="text-sm text-gray-500">{school.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${school.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {school.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => handleEditClick(school)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                title="Edit school">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleToggleStatus(school)}
                                                className={school.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                                title={school.isActive ? "Deactivate school" : "Activate school"}>
                                                <Trash2 className="w-4 h-4" />
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add New School</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Hash className="w-4 h-4 inline mr-1" />School Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.schoolCode}
                                            onChange={(e) => handleInputChange('schoolCode', e.target.value.toUpperCase())}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="SK001"
                                        />
                                        {formErrors.schoolCode && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Building className="w-4 h-4 inline mr-1" />School Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.schoolName}
                                            onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="SJKC JIT SIN A"
                                        />
                                        {formErrors.schoolName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.address ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="123, Jalan Sekolah"
                                        />
                                        {formErrors.address && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Kuala Lumpur"
                                        />
                                        {formErrors.city && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                        <select
                                            value={formData.state}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.state ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select State</option>
                                            {malaysianStates.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                        {formErrors.state && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                                        <input
                                            type="text"
                                            value={formData.postalCode}
                                            onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.postalCode ? 'border-red-500' : 'border-gray-300'
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

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Phone className="w-4 h-4 inline mr-1" />Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="012-3456789"
                                        />
                                        {formErrors.phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Mail className="w-4 h-4 inline mr-1" />Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <User className="w-4 h-4 inline mr-1" />Principal Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.principalName}
                                            onChange={(e) => handleInputChange('principalName', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.principalName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Dr. Ahmad bin Abdullah"
                                        />
                                        {formErrors.principalName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.principalName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Maximum Students *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxStudents}
                                            onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.maxStudents ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="1000"
                                            min="50"
                                            max="10000"
                                        />
                                        {formErrors.maxStudents && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.maxStudents}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">Capacity: 50 - 10,000 students</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4 border-t">
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
                                    {isSubmitting ? 'Creating...' : 'Create School'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit School Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Edit School</h2>
                            <button
                                onClick={() => { setShowEditModal(false); resetEditForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Hash className="w-4 h-4 inline mr-1" />School Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.schoolCode} disabled
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {formErrors.schoolCode && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Building className="w-4 h-4 inline mr-1" />School Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.schoolName}
                                            onChange={(e) => handleEditInputChange('schoolName', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="SJKC JIT SIN A"
                                        />
                                        {formErrors.schoolName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.address}
                                            onChange={(e) => handleEditInputChange('address', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.address ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="123, Jalan Sekolah"
                                        />
                                        {formErrors.address && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            value={editFormData.city}
                                            onChange={(e) => handleEditInputChange('city', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Kuala Lumpur"
                                        />
                                        {formErrors.city && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                        <select
                                            value={editFormData.state}
                                            onChange={(e) => handleEditInputChange('state', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.state ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select State</option>
                                            {malaysianStates.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                        {formErrors.state && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                                        <input
                                            type="text"
                                            value={editFormData.postalCode}
                                            onChange={(e) => handleEditInputChange('postalCode', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.postalCode ? 'border-red-500' : 'border-gray-300'
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

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Phone className="w-4 h-4 inline mr-1" />Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={editFormData.phoneNumber}
                                            onChange={(e) => handleEditInputChange('phoneNumber', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="012-3456789"
                                        />
                                        {formErrors.phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Mail className="w-4 h-4 inline mr-1" />Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => handleEditInputChange('email', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <User className="w-4 h-4 inline mr-1" />Principal Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.principalName}
                                            onChange={(e) => handleEditInputChange('principalName', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.principalName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Dr. Ahmad bin Abdullah"
                                        />
                                        {formErrors.principalName && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.principalName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Maximum Students *
                                        </label>
                                        <input
                                            type="number"
                                            value={editFormData.maxStudents}
                                            onChange={(e) => handleEditInputChange('maxStudents', parseInt(e.target.value) || 0)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.maxStudents ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="1000"
                                            min="50"
                                            max="10000"
                                        />
                                        {formErrors.maxStudents && (
                                            <p className="text-red-500 text-xs mt-1">{formErrors.maxStudents}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">Capacity: 50 - 10,000 students</p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); resetEditForm(); }}
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
                                    {isSubmitting ? 'Updating...' : 'Edit School'}
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