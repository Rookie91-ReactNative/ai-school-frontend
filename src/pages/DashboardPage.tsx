import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import StatCard from '../components/Common/StatCard';
import { attendanceService } from '../services/attendanceService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import type { AttendanceSummary, RecentDetection } from '../types';

const DashboardPage = () => {
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Overview of today's attendance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={summary?.totalStudents || 0}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Present"
                    value={summary?.totalPresent || 0}
                    icon={UserCheck}
                    color="bg-green-500"
                    subtitle={`${summary?.attendanceRate.toFixed(1) || 0}% attendance`}
                />
                <StatCard
                    title="Late"
                    value={summary?.totalLate || 0}
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Absent"
                    value={summary?.totalAbsent || 0}
                    icon={UserX}
                    color="bg-red-500"
                />
            </div>

            {/* Recent Detections */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Detections</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Camera
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Confidence
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentDetections.map((detection) => (
                                <tr key={detection.logID}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{detection.fullName}</div>
                                        <div className="text-sm text-gray-500">{detection.studentCode}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(detection.detectionTime).toLocaleTimeString()}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;