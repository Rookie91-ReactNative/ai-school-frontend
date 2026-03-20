import { useState, useEffect } from 'react';
import { X, Shield, Check, Info, Users, BookOpen, BarChart2, Settings, Brain, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
//  FRONTEND GROUPING DEFINITION
//  Groups related permissions together regardless of backend category.
//  Any permission not listed here falls into "Other".
// ─────────────────────────────────────────────────────────────

interface FrontendGroup {
    label: string;
    icon: React.ElementType;
    color: string;         // Tailwind bg color for group header
    textColor: string;     // Tailwind text color for group header
    permissions: string[]; // permissionType values, in display order
}

const FRONTEND_GROUPS: FrontendGroup[] = [
    {
        label: 'Student Management',
        icon: Users,
        color: 'bg-blue-50',
        textColor: 'text-blue-800',
        permissions: [
            'ManageStudents',
            'ViewStudents',
            'BulkOperations',
            'ImportData',
            'ViewAttendance',
            'ViewAttendanceRecords',
        ],
    },
    {
        label: 'Academic Structure',
        icon: BookOpen,
        color: 'bg-green-50',
        textColor: 'text-green-800',
        permissions: [
            'ManageAcademicYears',
            'ManageGrades',
            'ManageClasses',
        ],
    },
    {
        label: 'Staff Management',
        icon: Users,
        color: 'bg-purple-50',
        textColor: 'text-purple-800',
        permissions: [
            'ManageTeachers',
            'ManageSchoolStaff',
            'ManageTeams',
            'ManageUsers',
        ],
    },
    {
        label: 'Leave & Homework',
        icon: FileText,
        color: 'bg-teal-50',
        textColor: 'text-teal-800',
        permissions: [
            'ViewLeave',
            'ViewHomework',
        ],
    },
    {
        label: 'Reports',
        icon: BarChart2,
        color: 'bg-amber-50',
        textColor: 'text-amber-800',
        permissions: [
            'EventReports',
            'ViewPencerapan',
            'ViewLeaveReport',
        ],
    },
    {
        label: 'System & Configuration',
        icon: Settings,
        color: 'bg-gray-50',
        textColor: 'text-gray-800',
        permissions: [
            'ManageCameras',
            'TrainFaceRecognition',
            'ManageNotifications',
            'SystemConfiguration',
            'ManageSchools',
        ],
    },
    {
        label: 'Advanced',
        icon: Brain,
        color: 'bg-red-50',
        textColor: 'text-red-800',
        permissions: [
            'ManageData',
            'ManagePermissions',
            'CanEdit',
        ],
    },
];

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

const PermissionsModal = ({
    userId, userName, userRole, isOpen, onClose, onSave,
}: PermissionsModalProps) => {
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
                api.get(`/user/${userId}/permissions`),
            ]);
            setAvailablePermissions(permissionsRes.data.data || {});
            setUserPermissions(userPermissionsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Permission state helpers ─────────────────────────────

    const handlePermissionChange = (
        permissionType: string,
        field: 'canView' | 'canEdit' | 'canDelete',
        value: boolean,
    ) => {
        setUserPermissions(prev => {
            const existing = prev.find(p => p.permissionType === permissionType);
            if (existing) {
                return prev.map(p => {
                    if (p.permissionType !== permissionType) return p;
                    const updated = { ...p, [field]: value };
                    if (field === 'canView' && !value) {
                        updated.canEdit = false;
                        updated.canDelete = false;
                    }
                    return updated;
                });
            }
            return [...prev, {
                permissionType,
                canView: field === 'canView' ? value : false,
                canEdit: field === 'canEdit' ? value : false,
                canDelete: field === 'canDelete' ? value : false,
            }];
        });
    };

    const isPermissionEnabled = (
        permissionType: string,
        field: 'canView' | 'canEdit' | 'canDelete',
    ): boolean => {
        const p = userPermissions.find(p => p.permissionType === permissionType);
        return p ? p[field] : false;
    };

    // ── Build flat map of all available permissions ──────────
    const allPermissionsMap = new Map<string, PermissionInfo>();
    Object.values(availablePermissions).forEach(group =>
        group.forEach(p => allPermissionsMap.set(p.permissionType, p))
    );

    // ── Build grouped structure for rendering ────────────────
    const assignedPermTypes = new Set<string>();

    const groupedForRender = FRONTEND_GROUPS.map(group => {
        const perms = group.permissions
            .map(pt => allPermissionsMap.get(pt))
            .filter((p): p is PermissionInfo => p !== undefined);
        perms.forEach(p => assignedPermTypes.add(p.permissionType));
        return { ...group, perms };
    }).filter(g => g.perms.length > 0);

    // Anything not in any group goes into "Other"
    const otherPerms = [...allPermissionsMap.values()].filter(
        p => !assignedPermTypes.has(p.permissionType)
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const permissionsToSave = userPermissions.filter(
                p => p.canView || p.canEdit || p.canDelete
            );
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

    // ─────────────────────────────────────────────────────────
    //  PERMISSION ROW
    // ─────────────────────────────────────────────────────────

    const PermissionRow = ({ permission }: { permission: PermissionInfo }) => {
        const isViewChecked = isPermissionEnabled(permission.permissionType, 'canView');
        const isEditChecked = isPermissionEnabled(permission.permissionType, 'canEdit');
        const isDeleteChecked = isPermissionEnabled(permission.permissionType, 'canDelete');

        return (
            <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
                {/* Main checkbox (View) */}
                <input
                    type="checkbox"
                    id={`perm-${permission.permissionType}`}
                    checked={isViewChecked}
                    onChange={e => handlePermissionChange(permission.permissionType, 'canView', e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                    <label
                        htmlFor={`perm-${permission.permissionType}`}
                        className="block text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                        {permission.displayName}
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>

                    {/* Sub-permissions */}
                    {isViewChecked && (permission.allowsEdit || permission.allowsDelete) && (
                        <div className="flex flex-wrap gap-4 mt-2">
                            {permission.allowsEdit && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isEditChecked}
                                        onChange={e => handlePermissionChange(permission.permissionType, 'canEdit', e.target.checked)}
                                        className="h-4 w-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <span className="text-xs text-gray-600 group-hover:text-green-600 transition-colors">
                                        {t('permissions.canEdit')}
                                    </span>
                                </label>
                            )}
                            {permission.allowsDelete && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isDeleteChecked}
                                        onChange={e => handlePermissionChange(permission.permissionType, 'canDelete', e.target.checked)}
                                        className="h-4 w-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                    />
                                    <span className="text-xs text-gray-600 group-hover:text-red-600 transition-colors">
                                        {t('permissions.canDelete')}
                                    </span>
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">

                {/* ── Header ──────────────────────────────────── */}
                <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center rounded-t-2xl flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                {t('permissions.title')}
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {userName}{userRole && <span className="text-gray-400"> ({userRole})</span>}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* ── Content (scrollable) ─────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                            <p className="text-gray-500 mt-4 text-sm">{t('common.loading')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {/* Info banner */}
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

                            {/* ── Grouped permissions ─────────────── */}
                            {groupedForRender.map(group => (
                                <div key={group.label} className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Group header */}
                                    <div className={`flex items-center gap-2 px-4 py-2.5 ${group.color}`}>
                                        <group.icon className={`w-4 h-4 ${group.textColor}`} />
                                        <h3 className={`text-sm font-semibold ${group.textColor}`}>
                                            {group.label}
                                        </h3>
                                        {/* Checked count badge */}
                                        {(() => {
                                            const count = group.perms.filter(p =>
                                                isPermissionEnabled(p.permissionType, 'canView')
                                            ).length;
                                            return count > 0 ? (
                                                <span className="ml-auto text-xs bg-white/70 rounded-full px-2 py-0.5 font-medium text-gray-600">
                                                    {count}/{group.perms.length} enabled
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* Permissions list */}
                                    <div className="px-4 py-1">
                                        {group.perms.map(permission => (
                                            <PermissionRow key={permission.permissionType} permission={permission} />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* ── Other (ungrouped) ────────────────── */}
                            {otherPerms.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50">
                                        <Settings className="w-4 h-4 text-gray-600" />
                                        <h3 className="text-sm font-semibold text-gray-700">Other</h3>
                                    </div>
                                    <div className="px-4 py-1">
                                        {otherPerms.map(permission => (
                                            <PermissionRow key={permission.permissionType} permission={permission} />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────────── */}
                <div className="bg-gray-50 border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 rounded-b-2xl flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium order-2 sm:order-1"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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