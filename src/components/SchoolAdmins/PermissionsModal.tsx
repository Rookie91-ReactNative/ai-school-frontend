import { useState, useEffect } from 'react';
import { X, Shield, Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface PermissionInfo {
    permissionType: string;
    displayName: string;
    description: string;
    category: string;
    allowsView: boolean;
    allowsEdit: boolean;
    allowsDelete: boolean;
}

interface UserPermission {
    permissionType: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

interface PermissionsModalProps {
    userId: number;
    userName: string;
    userRole?: string;
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const PermissionsModal = ({ userId, userName, userRole, isOpen, onClose, onSave }: PermissionsModalProps) => {
    const { t } = useTranslation();
    const [availablePermissions, setAvailablePermissions] = useState<Record<string, PermissionInfo[]>>({});
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchData();
        }
    }, [isOpen, userId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [permissionsRes, userPermissionsRes] = await Promise.all([
                api.get('/user/permissions/by-category'),
                api.get(`/user/${userId}/permissions`)
            ]);
            setAvailablePermissions(permissionsRes.data.data || {});
            setUserPermissions(userPermissionsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePermissionChange = (
        permissionType: string,
        field: 'canView' | 'canEdit' | 'canDelete',
        value: boolean
    ) => {
        setUserPermissions(prev => {
            const existing = prev.find(p => p.permissionType === permissionType);

            if (existing) {
                return prev.map(p => {
                    if (p.permissionType === permissionType) {
                        const updated = { ...p, [field]: value };

                        // If unchecking View, also uncheck Edit and Delete
                        if (field === 'canView' && !value) {
                            updated.canEdit = false;
                            updated.canDelete = false;
                        }

                        return updated;
                    }
                    return p;
                });
            } else {
                return [...prev, {
                    permissionType,
                    canView: field === 'canView' ? value : false,
                    canEdit: field === 'canEdit' ? value : false,
                    canDelete: field === 'canDelete' ? value : false
                }];
            }
        });
    };

    const isPermissionEnabled = (permissionType: string, field: 'canView' | 'canEdit' | 'canDelete'): boolean => {
        const permission = userPermissions.find(p => p.permissionType === permissionType);
        return permission ? permission[field] : false;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const permissionsToSave = userPermissions.filter(p => p.canView || p.canEdit || p.canDelete);

            await api.put(`/user/${userId}/permissions`, permissionsToSave);
            alert(t('permissions.successUpdate'));
            onSave?.();
            onClose();
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert(t('permissions.errorUpdate'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('permissions.title')}</h2>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {userName} {userRole && <span className="text-gray-400">({userRole})</span>}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors p-1"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                            <p className="text-gray-500 mt-3 sm:mt-4 text-sm">{t('common.loading')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Info Banner */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <div className="flex gap-2 sm:gap-3">
                                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm text-blue-900">
                                        <p className="font-medium mb-1">{t('permissions.infoTitle')}</p>
                                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                                            <li><strong>{t('permissions.viewLabel')}:</strong> {t('permissions.viewDesc')}</li>
                                            <li><strong>{t('permissions.editLabel')}:</strong> {t('permissions.editDesc')}</li>
                                            <li><strong>{t('permissions.deleteLabel')}:</strong> {t('permissions.deleteDesc')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions by Category */}
                            {Object.entries(availablePermissions).map(([category, permissions]) => (
                                <div key={category} className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{category}</h3>
                                    </div>
                                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                        {permissions.map((permission) => {
                                            const isViewChecked = isPermissionEnabled(permission.permissionType, 'canView');
                                            const isEditChecked = isPermissionEnabled(permission.permissionType, 'canEdit');
                                            const isDeleteChecked = isPermissionEnabled(permission.permissionType, 'canDelete');

                                            return (
                                                <div key={permission.permissionType} className="border-b pb-3 sm:pb-4 last:border-b-0 last:pb-0">
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        {/* Main Checkbox (View) */}
                                                        <div className="pt-0.5">
                                                            <input
                                                                type="checkbox"
                                                                id={`perm-${permission.permissionType}`}
                                                                checked={isViewChecked}
                                                                onChange={(e) => handlePermissionChange(
                                                                    permission.permissionType,
                                                                    'canView',
                                                                    e.target.checked
                                                                )}
                                                                className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Permission Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <label
                                                                htmlFor={`perm-${permission.permissionType}`}
                                                                className="block text-sm sm:text-base font-medium text-gray-900 cursor-pointer hover:text-blue-600 active:text-blue-700 transition-colors"
                                                            >
                                                                {permission.displayName}
                                                            </label>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">{permission.description}</p>

                                                            {/* Sub-permissions (Edit/Delete) */}
                                                            {isViewChecked && (permission.allowsEdit || permission.allowsDelete) && (
                                                                <div className="flex flex-wrap gap-4 sm:gap-6 mt-2 sm:mt-3 ml-0 sm:ml-1">
                                                                    {permission.allowsEdit && (
                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isEditChecked}
                                                                                onChange={(e) => handlePermissionChange(
                                                                                    permission.permissionType,
                                                                                    'canEdit',
                                                                                    e.target.checked
                                                                                )}
                                                                                className="h-4 w-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                                                            />
                                                                            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-green-600 transition-colors">
                                                                                {t('permissions.canEdit')}
                                                                            </span>
                                                                        </label>
                                                                    )}
                                                                    {permission.allowsDelete && (
                                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isDeleteChecked}
                                                                                onChange={(e) => handlePermissionChange(
                                                                                    permission.permissionType,
                                                                                    'canDelete',
                                                                                    e.target.checked
                                                                                )}
                                                                                className="h-4 w-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                                                            />
                                                                            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-red-600 transition-colors">
                                                                                {t('permissions.canDelete')}
                                                                            </span>
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-medium order-2 sm:order-1"
                        disabled={isSaving}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 order-1 sm:order-2"
                        disabled={isSaving || isLoading}
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="text-sm sm:text-base">{t('permissions.saving')}</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">{t('permissions.savePermissions')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionsModal;