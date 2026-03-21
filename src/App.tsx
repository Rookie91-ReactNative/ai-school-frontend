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
import PencerapanPage from './pages/PencerapanPage';
import MyPdpPage from './pages/MyPdpPage';
import HomeWorkPage from './pages/HomeWorkPage';
import LeavePage from './pages/LeavePage';
import LaporanPage from './pages/LaporanPage';
import LaporanListPage from './pages/LaporanListPage';
import LeaveReportPage from './pages/LeaveReportPage';
import GalleryPage from './pages/GalleryPage';
import TelegramLeavePage from './pages/TelegramWebApp/TelegramLeavePage';
import TelegramHomeWorkPage from './pages/TelegramWebApp/TelegramHomeWorkPage';
import TelegramUploadLaporanPage from './pages/TelegramWebApp/TelegramUploadLaporanPage';
import TelegramViewLaporanPage from './pages/TelegramWebApp/TelegramViewLaporanPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected Routes */}
                <Route element={<Layout />}>

                    {/* Dashboard — Accessible to all authenticated users */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── SuperAdmin Only ─────────────────────────────── */}
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

                    {/* ── School Management ───────────────────────────── */}
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

                    {/* ── Reports ─────────────────────────────────────── */}
                    <Route
                        path="/event-report"
                        element={
                            <ProtectedRoute
                                requiredPermission="EventReports"
                                requiredRole={['SchoolAdmin']}
                            >
                                <EventReportPage />
                            </ProtectedRoute>
                        }
                    />
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
                    <Route
                        path="/pencerapan"
                        element={
                            <ProtectedRoute
                                requiredPermission="ViewReports"
                                requiredRole={['SchoolAdmin']}
                            >
                                <PencerapanPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ NEW — MyPDP / SKPM Standard 4 PdPc Assessment */}
                    <Route
                        path="/mypdp"
                        element={
                            <ProtectedRoute
                                requiredPermission="ViewMyPDP"
                                requiredRole={['SchoolAdmin', 'Teacher']}
                            >
                                <MyPdpPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── General ─────────────────────────────────────── */}
                    {/* Leave — SchoolAdmin + Teacher with ViewLeave permission */}
                    <Route
                        path="/leave"
                        element={
                            <ProtectedRoute
                                requiredPermission="ViewLeave"
                                requiredRole={['SchoolAdmin', 'Teacher']}
                            >
                                <LeavePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Homework — SchoolAdmin + Teacher with ViewHomework permission */}
                    <Route
                        path="/homework"
                        element={
                            <ProtectedRoute
                                requiredPermission="ViewHomework"
                                requiredRole={['SchoolAdmin', 'Teacher']}
                            >
                                <HomeWorkPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/events"
                        element={
                            <ProtectedRoute>
                                <EventsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/late-check-in"
                        element={
                            <ProtectedRoute>
                                <LateCheckInPage />
                            </ProtectedRoute>
                        }
                    />
                    {/* ✅ NEW — Laporan upload (all authenticated users) */}
                    <Route
                        path="/laporan"
                        element={
                            <ProtectedRoute>
                                <LaporanPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ NEW — Laporan list/view */}
                    <Route
                        path="/laporan-list"
                        element={
                            <ProtectedRoute>
                                <LaporanListPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ NEW — Leave report */}
                    <Route
                        path="/leave-report"
                        element={
                            <ProtectedRoute>
                                <LeaveReportPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ NEW — Photo Gallery */}
                    <Route
                        path="/gallery"
                        element={
                            <ProtectedRoute>
                                <GalleryPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        }
                    />

                </Route>

                {/* ── Telegram Web App Routes — no Layout, no auth redirect ── */}
                <Route path="/telegram/leave" element={<TelegramLeavePage />} />
                <Route path="/telegram/homework" element={<TelegramHomeWorkPage />} />

                <Route path="/telegram/upload-laporan" element={<TelegramUploadLaporanPage />} />
                <Route path="/telegram/view-laporan" element={<TelegramViewLaporanPage />} />

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 — fallback to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;