import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface AttendanceRecord {
    attendanceID: number;
    studentCode: string;
    fullName: string;
    grade: string;
    class: string;
    checkInTime: string;
    checkOutTime?: string;
    status: string;
    cameraName: string;
    cameraLocation?: string;
}

interface AttendanceResponse {
    date: string;
    totalRecords: number;
    present: number;
    late: number;
    records: AttendanceRecord[];
}

const AttendancePage = () => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState({
        totalRecords: 0,
        present: 0,
        late: 0,
        absent: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('All');

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate]);

    const fetchAttendance = async () => {
        try {
            setIsLoading(true);

            console.log('Fetching attendance for date:', selectedDate);

            // Use the existing /attendance/today endpoint
            const response = await api.get(`/attendance/date/${selectedDate}`);

            console.log('Attendance response:', response.data);

            const data: AttendanceResponse = response.data.data;
            const records = data.records || [];

            setAttendanceRecords(records);

            // Use stats from API response
            setStats({
                totalRecords: data.totalRecords || 0,
                present: data.present || 0,
                late: data.late || 0,
                absent: 0 // Will be calculated if needed
            });

        } catch (error) {
            console.error('Error fetching attendance:', error);
            setAttendanceRecords([]);
            setStats({ totalRecords: 0, present: 0, late: 0, absent: 0 });
        } finally {
            setIsLoading(false);
        }
    };

    const exportReport = async () => {
        try {
            alert(t('attendance.exportComingSoon'));
            // TODO: Implement CSV export endpoint
            // const response = await api.get('/attendance/export', {
            //     params: { date: selectedDate },
            //     responseType: 'blob'
            // });

        } catch (error) {
            console.error('Error exporting report:', error);
            alert(t('attendance.exportFailed'));
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800';
            case 'Late':
                return 'bg-yellow-100 text-yellow-800';
            case 'Absent':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredRecords = filterStatus === 'All'
        ? attendanceRecords
        : attendanceRecords.filter(r => r.status === filterStatus);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        {t('attendance.title')}
                    </h1>
                    <p className="text-gray-600 mt-1">{t('attendance.subtitle')}</p>
                </div>
                <button
                    onClick={exportReport}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Download className="w-5 h-5" />
                    {t('attendance.exportReport')}
                </button>
            </div>

            {/* Date Picker and Filter */}
            <div className="card flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input-field"
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-field"
                    >
                        <option value="All">{t('attendance.allStatus')}</option>
                        <option value="Present">{t('attendance.present')}</option>
                        <option value="Late">{t('attendance.late')}</option>
                        <option value="Absent">{t('attendance.absent')}</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('attendance.totalRecords')}</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('attendance.present')}</p>
                            <p className="text-2xl font-bold text-green-900">{stats.present}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('attendance.late')}</p>
                            <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('attendance.absent')}</p>
                            <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card overflow-hidden">
                {filteredRecords.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('attendance.noRecordsFound')}
                        </h3>
                        <p className="text-gray-600">
                            {t('attendance.noRecordsMessage')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('attendance.student')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('attendance.gradeClass')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('attendance.checkInTime')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('attendance.status')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('attendance.camera')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.map((record) => (
                                    <tr key={record.attendanceID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {record.fullName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {record.studentCode}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {record.class || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {record.checkInTime
                                                    ? new Date(record.checkInTime).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : '-'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                                                {t(`attendance.${record.status.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.cameraName || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendancePage;