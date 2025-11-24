import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, Users, ClipboardList, Video,
    Brain, Settings, Building, UserPlus, Calendar, GraduationCap,
    BookOpen, UserCircle, Proportions
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import LanguageSwitcher from '../LanguageSwitcher';

const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getCurrentUser();
    const userPermissions = currentUser?.permissions || [];
    //console.log('currentUser?.permissions:', currentUser?.permissions);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper function to check if user has permission
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Define navigation items with their required permissions
    const allNavigationItems = [
        // Dashboard - always visible for authenticated users
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: t('nav.dashboard'),
            permission: null, // No specific permission required
            roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Staff']
        },
        // SuperAdmin specific
        {
            path: '/schools',
            icon: Building,
            label: t('nav.schools'),
            permission: 'ManageSchools',
            roles: ['SuperAdmin']
        },
        {
            path: '/school-admins',
            icon: UserPlus,
            label: t('nav.users'),
            permission: 'ManageUsers',
            roles: ['SuperAdmin']
        },
        // School Management
        {
            path: '/teachers',
            icon: UserCircle,  
            label: t('nav.teachers'),
            permission: 'ManageTeachers',
            roles: ['SchoolAdmin']
        },
        {
            path: '/teams',
            icon: Users,
            label: t('nav.teams'),
            permission: 'ManageTeams',
            roles: ['SchoolAdmin', 'Teacher']
        },
        {
            path: '/academic-years',
            icon: Calendar,
            label: t('nav.academicYears'),
            permission: 'ManageAcademicYears',
            roles: ['SchoolAdmin']
        },
        {
            path: '/grades',
            icon: GraduationCap,
            label: t('nav.grades'),
            permission: 'ManageGrades',
            roles: ['SchoolAdmin']
        },
        {
            path: '/classes',
            icon: BookOpen,
            label: t('nav.classes'),
            permission: 'ManageClasses',
            roles: ['SchoolAdmin']
        },
        {
            path: '/students',
            icon: Users,
            label: t('nav.students'),
            permission: 'ManageStudents', // SchoolAdmin needs this
            alternativePermission: 'ViewStudents', // Teacher/Staff can view
            roles: ['SchoolAdmin', 'Teacher', 'Staff']
        },
        {
            path: '/attendance',
            icon: ClipboardList,
            label: t('nav.attendance'),
            permission: 'ViewAttendance',
            alternativePermission: 'ViewAttendanceRecords',
            roles: ['SchoolAdmin', 'Teacher', 'Staff']
        },
        {
            path: '/cameras',
            icon: Video,
            label: t('nav.cameras'),
            permission: 'ManageCameras',
            roles: ['SchoolAdmin']
        },
        {
            path: '/training',
            icon: Brain,
            label: t('nav.training'),
            permission: 'TrainFaceRecognition',
            roles: ['SchoolAdmin']
        },
        {
            path: '/import-students',
            icon: Users,
            label: t('nav.importStudents'),
            permission: 'ImportData', // SchoolAdmin needs this
            roles: ['SchoolAdmin']
        },
        {
            path: '/events',
            icon: Calendar,
            label: t('nav.events'),
            permission: null,
            roles: ['SchoolAdmin', 'Teacher']
        },
        {
            path: '/event-report',
            icon: Proportions,
            label: t('nav.eventsReport'),
            permission: 'EventReports',
            roles: ['SchoolAdmin', 'Teacher']
        },
        {
            path: '/settings',
            icon: Settings,
            label: t('nav.settings'),
            permission: 'SystemConfiguration',
            roles: ['SchoolAdmin']
        },
    ];

    // Filter navigation items based on:
    // 1. User's role
    // 2. User's permissions
    const getFilteredNavigation = () => {
        return allNavigationItems.filter(item => {
            // Check if user's role is in the allowed roles
            const hasRole = item.roles.includes(currentUser?.userRole || '');
            if (!hasRole) return false;

            // If no specific permission required, show the item
            if (!item.permission) return true;

            // Check if user has the required permission or alternative permission
            const hasPrimaryPermission = hasPermission(item.permission);
            const hasAlternativePermission = item.alternativePermission
                ? hasPermission(item.alternativePermission)
                : false;

            return hasPrimaryPermission || hasAlternativePermission;
        });
    };

    const navigationItems = getFilteredNavigation();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-blue-600">
                        {t('login.title')}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {t('login.subtitle')}
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigationItems.length > 0 ? (
                        navigationItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-4">
                            {t('nav.noAccess')}
                        </div>
                    )}
                </nav>

                {/* User Info, Language Switcher & Logout */}
                <div className="p-4 border-t border-gray-200 space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {currentUser?.fullName || currentUser?.username || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {currentUser?.userRole || 'Role'}
                            </p>
                        </div>
                    </div>

                    {/* Language Switcher */}
                    <div className="pt-2 border-t border-gray-200">
                        <LanguageSwitcher />
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">{t('nav.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;