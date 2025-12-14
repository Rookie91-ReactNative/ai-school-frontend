import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatCard from '../components/Common/StatCard';
import { attendanceService } from '../services/attendanceService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import type { AttendanceSummary, RecentDetection } from '../types';

const DashboardPage = () => {
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        fetchDashboardData();
    }, []);

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