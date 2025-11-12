import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { authService } from './services/authService';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import TrainingPage from './pages/TrainingPage';
import CamerasPage from './pages/CamerasPage';
import SettingsPage from './pages/SettingsPage';
import SchoolsPage from './pages/SchoolsPage';
import SchoolAdminsPage from './pages/SchoolAdminsPage';
import AcademicYearsPage from './pages/AcademicYearsPage';
import GradesPage from './pages/GradesPage';
import ClassesPage from './pages/ClassesPage';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Session Monitor Component
const SessionMonitor = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Check session expiry every minute
        const checkSession = () => {
            if (authService.isTokenExpired()) {
                authService.logout();
                navigate('/login', { replace: true });
                alert('Your session has expired. Please log in again.');
            }
        };

        // Check immediately
        checkSession();

        // Set up interval to check every minute
        const interval = setInterval(checkSession, 60000); // Check every 1 minute

        // Extend session on user activity
        const handleActivity = () => {
            authService.extendSession();
        };

        // Listen for user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, [navigate]);

    return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            <SessionMonitor />
            {children}
        </>
    );
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="schools" element={<SchoolsPage />} />
                        <Route path="school-admins" element={<SchoolAdminsPage />} />
                        <Route path="academic-years" element={<AcademicYearsPage />} />
                        <Route path="grades" element={<GradesPage />} />
                        <Route path="classes" element={<ClassesPage />} />
                        <Route path="students" element={<StudentsPage />} />
                        <Route path="attendance" element={<AttendancePage />} />
                        <Route path="training" element={<TrainingPage />} />
                        <Route path="cameras" element={<CamerasPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* 404 Route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;