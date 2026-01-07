import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, Calendar, ClipboardList, BookOpen, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/Common/StatCard';
import { attendanceService } from '../services/attendanceService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import type { AttendanceSummary, RecentDetection } from '../types';

const DashboardPage = () => {
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Check if user is Teacher or Staff role
    const isTeacherOrStaff = user?.userRole === 'Teacher' || user?.userRole === 'Staff';

    useEffect(() => {
        // Only fetch dashboard data for non-Teacher/Staff roles
        if (!isTeacherOrStaff) {
            fetchDashboardData();
        } else {
            setIsLoading(false);
        }
    }, [isTeacherOrStaff]);

    const fetchDashboardData = async () => {
        try {
            const [summaryData, detectionsData] = await Promise.all([
                attendanceService.getTodaySummary(),
                attendanceService.getRecentDetections(10),
            ]);
            setSummary(summaryData);
            setRecentDetections(detectionsData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // ========================================
    // ✅ TEACHER/STAFF DASHBOARD (Mobile Optimized)
    // ========================================
    if (isTeacherOrStaff) {
        return (
            <div className="space-y-4 sm:space-y-6">
                {/* Welcome Header - Responsive */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                        {t('dashboard.welcome', { name: user?.fullName || user?.username })}
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                        {t('dashboard.teacherSubtitle')}
                    </p>
                </div>

                {/* Quick Actions - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {/* Events Card */}
                    <button
                        onClick={() => navigate('/events')}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 
                                 text-left w-full
                                 hover:shadow-lg hover:border-blue-300 
                                 active:bg-gray-50 transition-all duration-200
                                 touch-manipulation"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl flex-shrink-0">
                                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {t('dashboard.quickActions.events')}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {t('dashboard.quickActions.eventsDesc')}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                    </button>

                    {/* Students Card */}
                    <button
                        onClick={() => navigate('/students')}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 
                                 text-left w-full
                                 hover:shadow-lg hover:border-green-300 
                                 active:bg-gray-50 transition-all duration-200
                                 touch-manipulation"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 bg-green-100 rounded-xl flex-shrink-0">
                                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {t('dashboard.quickActions.students')}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {t('dashboard.quickActions.studentsDesc')}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                    </button>

                    {/* Attendance Card */}
                    <button
                        onClick={() => navigate('/attendance')}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 
                                 text-left w-full
                                 hover:shadow-lg hover:border-yellow-300 
                                 active:bg-gray-50 transition-all duration-200
                                 touch-manipulation
                                 sm:col-span-2 lg:col-span-1"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 bg-yellow-100 rounded-xl flex-shrink-0">
                                <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {t('dashboard.quickActions.attendance')}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {t('dashboard.quickActions.attendanceDesc')}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                    </button>
                </div>

                {/* Info Card - Responsive */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">
                                {t('dashboard.teacherInfo.title')}
                            </h3>
                            <p className="text-blue-700 text-xs sm:text-sm">
                                {t('dashboard.teacherInfo.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // ✅ ADMIN DASHBOARD (Mobile Optimized)
    // ========================================
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Responsive */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {t('dashboard.title')}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {t('dashboard.subtitle')}
                </p>
            </div>

            {/* Stats Cards - Responsive Grid (2 columns on mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <StatCard
                    title={t('dashboard.totalStudents')}
                    value={summary?.totalStudents || 0}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('dashboard.present')}
                    value={summary?.totalPresent || 0}
                    icon={UserCheck}
                    color="bg-green-500"
                    subtitle={`${summary?.attendanceRate.toFixed(1) || 0}%`}
                />
                <StatCard
                    title={t('dashboard.late')}
                    value={summary?.totalLate || 0}
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title={t('dashboard.absent')}
                    value={summary?.totalAbsent || 0}
                    icon={UserX}
                    color="bg-red-500"
                />
            </div>

            {/* Recent Detections - Responsive */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        {t('dashboard.recentDetections')}
                    </h2>
                </div>

                {/* Mobile Card View (< 640px) */}
                <div className="sm:hidden">
                    {recentDetections.length === 0 ? (
                        <div className="px-4 py-12 text-center text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>{t('dashboard.noDetections')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentDetections.map((detection) => (
                                <div key={detection.logID} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {detection.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {detection.studentCode}
                                            </p>
                                        </div>
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex-shrink-0">
                                            {detection.confidence.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                        <span className="truncate">{detection.cameraName}</span>
                                        <span className="flex-shrink-0 ml-2">
                                            {new Date(detection.detectionTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View (≥ 640px) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.student')}
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.time')}
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.camera')}
                                </th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.confidence')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentDetections.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>{t('dashboard.noDetections')}</p>
                                    </td>
                                </tr>
                            ) : (
                                recentDetections.map((detection) => (
                                    <tr key={detection.logID} className="hover:bg-gray-50">
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {detection.fullName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {detection.studentCode}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{new Date(detection.detectionTime).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(detection.detectionTime).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {detection.cameraName}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {detection.confidence.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;