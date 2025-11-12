import { useState, useEffect } from 'react';
import { UserPlus, Users, Edit, Trash2, X, Building, Mail, User, Lock, Phone } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

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
    const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
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
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!formData.schoolID || formData.schoolID === 0) {
            errors.schoolID = 'Please select a school';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editFormData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!editFormData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
            errors.email = 'Invalid email format';
        }

        // Password validation (optional - only if password is entered)
        if (editFormData.newPassword || editFormData.confirmNewPassword) {
            if (editFormData.newPassword.length < 6) {
                errors.newPassword = 'Password must be at least 6 characters';
            }
            if (editFormData.newPassword !== editFormData.confirmNewPassword) {
                errors.confirmNewPassword = 'Passwords do not match';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                schoolID: formData.schoolID,
                userRole: 'SchoolAdmin'
            };

            await api.post('/auth/register', payload);

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
            alert('School admin created successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to create school admin';
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (admin: SchoolAdmin) => {
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

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm() || !selectedAdmin) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepare payload - only include password if it's being changed
            const payload: UpdatePayload = {
                fullName: editFormData.fullName,
                email: editFormData.email,
                phoneNumber: editFormData.phoneNumber
            };

            // Add password to payload if provided
            if (editFormData.newPassword && editFormData.newPassword.trim() !== '') {
                payload.password = editFormData.newPassword;
            }

            await api.put(`/user/${selectedAdmin.userID}`, payload);

            setShowEditModal(false);
            setSelectedAdmin(null);
            setEditFormData({
                fullName: '',
                email: '',
                phoneNumber: '',
                newPassword: '',
                confirmNewPassword: ''
            });
            setFormErrors({});
            fetchData();
            alert('School admin updated successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to update school admin';
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async (admin: SchoolAdmin) => {
        const confirmMessage = admin.isActive
            ? `Are you sure you want to deactivate ${admin.fullName}?`
            : `Are you sure you want to activate ${admin.fullName}?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await api.delete(`/user/${admin.userID}`);
            fetchData();
            alert(`School admin ${admin.isActive ? 'deactivated' : 'activated'} successfully!`);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to update school admin status';
                alert(errorMessage);
            }
        }
    };

    const handleInputChange = (field: keyof CreateAdminForm, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleEditInputChange = (field: keyof EditAdminForm, value: string) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
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
                        <Users className="w-8 h-8 text-blue-600" />
                        School Admins Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage school administrator accounts</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Add School Admin
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Admins</p>
                            <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Admins</p>
                            <p className="text-2xl font-bold text-green-900">
                                {admins.filter(a => a.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Building className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Schools Covered</p>
                            <p className="text-2xl font-bold text-purple-900">{schools.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No school admins found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.userID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{admin.fullName}</div>
                                                    <div className="text-sm text-gray-500">@{admin.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{admin.email}</div>
                                            <div className="text-sm text-gray-500">{admin.phoneNumber || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{admin.schoolName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(admin)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                                title="Edit admin"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeactivate(admin)}
                                                className={admin.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                                title={admin.isActive ? "Deactivate admin" : "Activate admin"}
                                            >
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

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Create School Admin</h2>
                            <button onClick={() => { setShowCreateModal(false); setFormErrors({}); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Building className="w-4 h-4 inline mr-1" />School *
                                </label>
                                <select value={formData.schoolID} onChange={(e) => handleInputChange('schoolID', Number(e.target.value))}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.schoolID ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value={0}>Select a school</option>
                                    {schools.map(school => (
                                        <option key={school.schoolID} value={school.schoolID}>{school.schoolName} ({school.schoolCode})</option>
                                    ))}
                                </select>
                                {formErrors.schoolID && <p className="text-red-500 text-xs mt-1">{formErrors.schoolID}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User className="w-4 h-4 inline mr-1" />Username *
                                </label>
                                <input type="text" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="admin_username" />
                                {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input type="text" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="John Doe" />
                                {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />Email *
                                </label>
                                <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="admin@school.com" />
                                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />Phone Number
                                </label>
                                <input type="tel" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+60123456789" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Lock className="w-4 h-4 inline mr-1" />Password *
                                </label>
                                <input type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="••••••••" />
                                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Lock className="w-4 h-4 inline mr-1" />Confirm Password *
                                </label>
                                <input type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="••••••••" />
                                {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowCreateModal(false); setFormErrors({}); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" disabled={isSubmitting}>Cancel</button>
                                <button type="button" onClick={handleSubmit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && selectedAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Edit School Admin</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedAdmin(null); setFormErrors({}); }}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User className="w-4 h-4 inline mr-1" />Username
                                </label>
                                <input type="text" value={selectedAdmin.username} disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" />
                                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Building className="w-4 h-4 inline mr-1" />School
                                </label>
                                <input type="text" value={selectedAdmin.schoolName} disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" />
                                <p className="text-xs text-gray-500 mt-1">School assignment cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input type="text" value={editFormData.fullName} onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="John Doe" />
                                {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />Email *
                                </label>
                                <input type="email" value={editFormData.email} onChange={(e) => handleEditInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="admin@school.com" />
                                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />Phone Number
                                </label>
                                <input type="tel" value={editFormData.phoneNumber} onChange={(e) => handleEditInputChange('phoneNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+60123456789" />
                            </div>

                            {/* Password Change Section */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Change Password (Optional)</h3>
                                <p className="text-xs text-gray-500 mb-3">Leave blank to keep current password</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Lock className="w-4 h-4 inline mr-1" />New Password
                                        </label>
                                        <input type="password" value={editFormData.newPassword}
                                            onChange={(e) => handleEditInputChange('newPassword', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="••••••••" />
                                        {formErrors.newPassword && <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Lock className="w-4 h-4 inline mr-1" />Confirm New Password
                                        </label>
                                        <input type="password" value={editFormData.confirmNewPassword}
                                            onChange={(e) => handleEditInputChange('confirmNewPassword', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="••••••••" />
                                        {formErrors.confirmNewPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmNewPassword}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowEditModal(false); setSelectedAdmin(null); setFormErrors({}); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" disabled={isSubmitting}>Cancel</button>
                                <button type="button" onClick={handleEditSubmit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Update Admin'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolAdminsPage;