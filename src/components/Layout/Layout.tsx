import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, Users, ClipboardList, Video,
    Brain, Settings, Building, UserPlus, Calendar, GraduationCap,
    BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
/*import UserDebug from '../UserDebug';*/

const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Define navigation items based on role
    const getSuperAdminNavigation = () => [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/schools', icon: Building, label: 'Schools' },
        { path: '/school-admins', icon: UserPlus, label: 'School Admins' },
    ];

    const getSchoolAdminNavigation = () => [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/academic-years', icon: Calendar, label: 'Academic Years' },
        { path: '/grades', icon: GraduationCap, label: 'Grades' },
        { path: '/classes', icon: BookOpen, label: 'Classes' },
        { path: '/students', icon: Users, label: 'Students' },
        { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { path: '/cameras', icon: Video, label: 'Cameras' },
        { path: '/training', icon: Brain, label: 'Training' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const navigationItems = currentUser?.userRole === 'SuperAdmin'
        ? getSuperAdminNavigation()
        : getSchoolAdminNavigation();

    return (
        <div className="flex h-screen bg-gray-50">
            {/*<UserDebug />*/}
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-blue-600">AI Attendance System</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigationItems.map((item) => (
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
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
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
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Logout</span>
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