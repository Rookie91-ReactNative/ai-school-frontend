import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, Users, ClipboardList, Video,
    Brain, Settings, Building, UserPlus, Calendar, GraduationCap,
    BookOpen, UserCircle, Proportions, Clock, KeyRound,
    Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import LanguageSwitcher from '../LanguageSwitcher';
import ChangePasswordModal from '../modals/ChangePasswordModal';

const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const currentUser = authService.getCurrentUser();
    const userPermissions = currentUser?.permissions || [];

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Change Password Modal state
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

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
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: t('nav.dashboard'),
            permission: null,
            roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Staff']
        },
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
            permission: 'ManageStudents',
            alternativePermission: 'ViewStudents',
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
            path: '/late-report',
            icon: Clock,
            label: t('nav.lateReport', 'Late Report'),
            permission: 'ViewAttendance',
            alternativePermission: 'ViewAttendanceRecords',
            roles: ['SchoolAdmin', 'Teacher', 'Staff'],
            activeClassName: 'bg-amber-500'
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
            permission: 'ImportData',
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

    // Filter navigation items based on role and permissions
    const getFilteredNavigation = () => {
        return allNavigationItems.filter(item => {
            const hasRole = item.roles.includes(currentUser?.userRole || '');
            if (!hasRole) return false;
            if (!item.permission) return true;
            const hasPrimaryPermission = hasPermission(item.permission);
            const hasAlternativePermission = item.alternativePermission
                ? hasPermission(item.alternativePermission)
                : false;
            return hasPrimaryPermission || hasAlternativePermission;
        });
    };

    const navigationItems = getFilteredNavigation();

    // Navigation Item Component
    const NavItem = ({ item, isMobile = false }: { item: typeof allNavigationItems[0], isMobile?: boolean }) => (
        <NavLink
            to={item.path}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${isActive
                    ? item.path === '/late-report'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }`
            }
        >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base flex-1">{item.label}</span>
            {isMobile && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </NavLink>
    );

    return (
        <div className="flex h-screen h-[100dvh] bg-gray-50">
            {/* ==================== DESKTOP SIDEBAR ==================== */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0">
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
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
                    {navigationItems.length > 0 ? (
                        navigationItems.map((item) => (
                            <NavItem key={item.path} item={item} />
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
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                        <button
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group flex-shrink-0"
                            title={t('changePassword.title', 'Change Password')}
                        >
                            <KeyRound className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        </button>
                    </div>

                    {/* Language Switcher */}
                    <div className="pt-2 border-t border-gray-200">
                        <LanguageSwitcher />
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 
                                 text-red-600 hover:bg-red-50 active:bg-red-100 
                                 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">{t('nav.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* ==================== MOBILE HEADER ==================== */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-area-top">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-blue-600">
                        {t('login.title')}
                    </h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* ==================== MOBILE SIDEBAR OVERLAY ==================== */}
            <div
                className={`lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* ==================== MOBILE SIDEBAR ==================== */}
            <aside
                className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white
                           transform transition-transform duration-300 ease-out flex flex-col
                           safe-area-top safe-area-bottom
                           ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Mobile Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-blue-600">
                            {t('login.title')}
                        </h1>
                        <p className="text-xs text-gray-600 mt-0.5">
                            {t('login.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navigationItems.length > 0 ? (
                        navigationItems.map((item) => (
                            <NavItem key={item.path} item={item} isMobile={true} />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-4">
                            {t('nav.noAccess')}
                        </div>
                    )}
                </nav>

                {/* Mobile User Info & Actions */}
                <div className="p-3 border-t border-gray-200 space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                        <button
                            onClick={() => {
                                setIsChangePasswordOpen(true);
                                setIsMobileMenuOpen(false);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title={t('changePassword.title', 'Change Password')}
                        >
                            <KeyRound className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Language Switcher */}
                    <div className="pt-2 border-t border-gray-200">
                        <LanguageSwitcher />
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3
                                 text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200
                                 rounded-lg transition-colors font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>{t('nav.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* ==================== MAIN CONTENT ==================== */}
            <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </div>
    );
};

export default Layout;