import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SchoolsPage from './pages/SchoolsPage';
import SchoolAdminsPage from './pages/SchoolAdminsPage';
import AcademicYearsPage from './pages/AcademicYearsPage';
import GradesPage from './pages/GradesPage';
import ClassesPage from './pages/ClassesPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import CamerasPage from './pages/CamerasPage';
import TrainingPage from './pages/TrainingPage';
import SettingsPage from './pages/SettingsPage';
import TeachersPage from './pages/TeachersPage';
import TeamsPage from './pages/TeamsPage';
import EventsPage from './pages/EventsPage';
import EventReportPage from './pages/EventReportPage';
import ImportStudentsPage from './pages/ImportStudentsPage';
import LateStudentsReportPage from './pages/LateStudentsReportPage';
import LateCheckInPage from './pages/LateCheckInPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected Routes */}
                <Route element={<Layout />}>
                    {/* Dashboard - Accessible to all authenticated users */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* SuperAdmin Only Routes */}
                    <Route
                        path="/schools"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageSchools"
                                requiredRole={['SuperAdmin']}
                            >
                                <SchoolsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/school-admins"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageUsers"
                                requiredRole={['SuperAdmin']}
                            >
                                <SchoolAdminsPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* School Management Routes */}
                    <Route
                        path="/teachers"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageTeachers"
                                requiredRole={['SchoolAdmin']}
                            >
                                <TeachersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teams"
                        element={
                            <ProtectedRoute requiredPermission="ManageTeams">
                                <TeamsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/event-report"
                        element={
                            <ProtectedRoute
                                requiredPermission="EventReports"
                                requiredRole={['SchoolAdmin']}>
                                <EventReportPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/academic-years"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageAcademicYears"
                                requiredRole={['SchoolAdmin']}
                            >
                                <AcademicYearsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/grades"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageGrades"
                                requiredRole={['SchoolAdmin']}
                            >
                                <GradesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/classes"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageClasses"
                                requiredRole={['SchoolAdmin']}
                            >
                                <ClassesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/students"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageStudents"
                                alternativePermission="ViewStudents"
                                requiredRole={['SchoolAdmin', 'Teacher', 'Staff']}
                            >
                                <StudentsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/attendance"
                        element={
                            <ProtectedRoute
                                requiredPermission="ViewAttendance"
                                alternativePermission="ViewAttendanceRecords"
                                requiredRole={['SchoolAdmin', 'Teacher', 'Staff']}
                            >
                                <AttendancePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/cameras"
                        element={
                            <ProtectedRoute
                                requiredPermission="ManageCameras"
                                requiredRole={['SchoolAdmin']}
                            >
                                <CamerasPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/training"
                        element={
                            <ProtectedRoute
                                requiredPermission="TrainFaceRecognition"
                                requiredRole={['SchoolAdmin']}
                            >
                                <TrainingPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Late Students Report */}
                    <Route
                        path="/late-report"
                        element={
                            <ProtectedRoute
                                requiredPermission="ViewAttendance"
                                alternativePermission="ViewAttendanceRecords"
                                requiredRole={['SchoolAdmin', 'Teacher', 'Staff']}
                            >
                                <LateStudentsReportPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Late Students check in */}
                    <Route
                        path="/late-check-in"
                        element={
                            <ProtectedRoute>
                                <LateCheckInPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Page can access by all users. */}
                    <Route
                        path="/events"
                        element={
                            <ProtectedRoute>
                                <EventsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/import-students"
                        element={
                            <ProtectedRoute
                                requiredPermission="ImportData"
                                requiredRole={['SchoolAdmin']}
                            >
                                <ImportStudentsPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Settings - Accessible to all authenticated users */}
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        }
                    />
                </Route>

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 - Not Found */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;