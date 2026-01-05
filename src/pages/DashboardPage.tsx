import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, Calendar, ClipboardList, BookOpen } from 'lucide-react';
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

    // ✅ Teacher/Staff Dashboard - Simple Welcome Page
    if (isTeacherOrStaff) {
        return (
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">
                        {t('dashboard.welcome', { name: user?.fullName || user?.username })}
                    </h1>
                    <p className="text-blue-100 text-lg">
                        {t('dashboard.teacherSubtitle')}
                    </p>
                </div>

                {/* Quick Actions for Teachers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Events Card */}
                    <div
                        onClick={() => navigate('/events')}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('dashboard.quickActions.events')}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {t('dashboard.quickActions.eventsDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Students Card - Only if they have permission */}
                    <div
                        onClick={() => navigate('/students')}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-green-300 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('dashboard.quickActions.students')}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {t('dashboard.quickActions.studentsDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Card */}
                    <div
                        onClick={() => navigate('/attendance')}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-yellow-300 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <ClipboardList className="w-8 h-8 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('dashboard.quickActions.attendance')}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {t('dashboard.quickActions.attendanceDesc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">
                                {t('dashboard.teacherInfo.title')}
                            </h3>
                            <p className="text-blue-700 text-sm">
                                {t('dashboard.teacherInfo.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Admin Dashboard - Full Statistics View
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {t('dashboard.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                    {t('dashboard.subtitle')}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    subtitle={`${summary?.attendanceRate.toFixed(1) || 0}% ${t('dashboard.attendanceRate')}`}
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

            {/* Recent Detections */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {t('dashboard.recentDetections')}
                </h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.student')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.time')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.camera')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('dashboard.confidence')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentDetections.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        {t('dashboard.noDetections')}
                                    </td>
                                </tr>
                            ) : (
                                recentDetections.map((detection) => (
                                    <tr key={detection.logID}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{detection.fullName}</div>
                                            <div className="text-sm text-gray-500">{detection.studentCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{new Date(detection.detectionTime).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">{new Date(detection.detectionTime).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {detection.cameraName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
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