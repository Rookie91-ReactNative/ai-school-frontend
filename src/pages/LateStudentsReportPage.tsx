import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Clock,
    Search,
    Download,
    Filter,
    Calendar,
    Users,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCw,
    Building2
} from 'lucide-react';
import axios from 'axios';
import api from '../services/api';

interface LateRecord {
    attendanceId: number;
    studentCode: string;
    studentName: string;
    gradeName: string;
    className: string;
    attendanceDate: string;
    checkInTime: string;
    snapshotPath: string;
    remarks: string;
}

interface LateSummary {
    date: string;
    totalLate: number;
    totalPresent: number;
    totalAbsent: number;
    latePercentage: number;
    lateByGrade: { gradeId: number; gradeName: string; lateCount: number }[];
    lateByClass: { classId: number; className: string; gradeName: string; lateCount: number }[];
}

interface Grade {
    gradeID: number;
    gradeName: string;
}

interface Class {
    classID: number;
    className: string;
    gradeID: number;
}

const LateStudentsReportPage = () => {
    const { t } = useTranslation();
    const [records, setRecords] = useState<LateRecord[]>([]);
    const [summary, setSummary] = useState<LateSummary | null>(null);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Modal for snapshot preview
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchGrades();
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchReport();
        fetchSummary();
    }, [startDate, endDate, selectedGradeId, selectedClassId]);

    useEffect(() => {
        if (selectedGradeId) {
            setFilteredClasses(classes.filter(c => c.gradeID === selectedGradeId));
        } else {
            setFilteredClasses(classes);
        }
        setSelectedClassId(null);
    }, [selectedGradeId, classes]);

    const fetchGrades = async () => {
        try {
            const response = await api.get('/grade');
            if (response.data.success) {
                setGrades(response.data.data || []);
            }
        } catch {
            // Silent fail for grades
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('/class');
            if (response.data.success) {
                setClasses(response.data.data || []);
                setFilteredClasses(response.data.data || []);
            }
        } catch {
            // Silent fail for classes
        }
    };

    const fetchReport = async () => {
        setIsLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            if (selectedGradeId) params.append('gradeId', selectedGradeId.toString());
            if (selectedClassId) params.append('classId', selectedClassId.toString());

            const response = await api.get(`/laterecognition/report?${params.toString()}`);
            if (response.data.success) {
                setRecords(response.data.data.records || []);
            } else {
                setError(response.data.message || 'Failed to fetch report');
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Failed to fetch report');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to fetch report');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            // Use date range for summary (supports monthly reports)
            const response = await api.get(`/laterecognition/summary?startDate=${startDate}&endDate=${endDate}`);
            if (response.data.success) {
                setSummary(response.data.data);
            }
        } catch {
            // Silent fail for summary
        }
    };

    const getFilteredRecords = () => {
        if (!searchTerm.trim()) return records;
        const term = searchTerm.toLowerCase();
        return records.filter(record =>
            record.studentCode.toLowerCase().includes(term) ||
            record.studentName.toLowerCase().includes(term) ||
            record.className?.toLowerCase().includes(term) ||
            record.gradeName?.toLowerCase().includes(term)
        );
    };

    const filteredRecords = getFilteredRecords();
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

    const formatTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return '-';
        const date = new Date(dateTimeStr);
        return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Time', 'Student Code', 'Student Name', 'Grade', 'Class', 'Remarks'];
        const rows = filteredRecords.map(r => [
            formatDate(r.attendanceDate), formatTime(r.checkInTime), r.studentCode, r.studentName,
            r.gradeName || '-', r.className || '-', r.remarks || ''
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

        // Add UTF-8 BOM for Excel to correctly display Chinese characters
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `late_students_report_${startDate}_to_${endDate}.csv`;
        link.click();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        {t('lateReport.title', 'Late Students Report')}
                    </h1>
                    <p className="text-gray-500 mt-1">{t('lateReport.subtitle', 'View and manage late attendance records')}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchReport} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors">
                        <RefreshCw className="w-4 h-4" />{t('common.refresh', 'Refresh')}
                    </button>
                    <button onClick={exportToCSV} disabled={filteredRecords.length === 0} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download className="w-4 h-4" />{t('common.export', 'Export CSV')}
                    </button>
                </div>
            </div>

            {/* Summary Card - Only Total Late */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Late Card */}
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm font-medium">{t('lateReport.totalLate', 'Total Late')}</p>
                                <p className="text-4xl font-bold mt-1">{summary.totalLate}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl"><AlertTriangle className="w-8 h-8" /></div>
                        </div>
                        <p className="text-amber-100 text-sm mt-3">{summary.latePercentage}% {t('lateReport.ofTotal', 'of total students')}</p>
                    </div>

                    {/* Late by Grade */}
                    {summary.lateByGrade.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border p-5">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-gray-500" />{t('lateReport.byGrade', 'Late by Grade')}
                            </h3>
                            <div className="space-y-3 max-h-32 overflow-y-auto">
                                {summary.lateByGrade.map(item => (
                                    <div key={item.gradeId} className="flex items-center justify-between">
                                        <span className="text-gray-700">{item.gradeName}</span>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">{item.lateCount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Late by Class */}
                    {summary.lateByClass.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border p-5">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-500" />{t('lateReport.byClass', 'Late by Class')}
                            </h3>
                            <div className="space-y-3 max-h-32 overflow-y-auto">
                                {summary.lateByClass.map(item => (
                                    <div key={item.classId} className="flex items-center justify-between">
                                        <span className="text-gray-700">{item.gradeName} - {item.className}</span>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">{item.lateCount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">{t('common.filters', 'Filters')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('lateReport.startDate', 'Start Date')}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('lateReport.endDate', 'End Date')}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.grade', 'Grade')}</label>
                        <select value={selectedGradeId || ''} onChange={(e) => setSelectedGradeId(e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                            <option value="">{t('common.allGrades', 'All Grades')}</option>
                            {grades.map(grade => (<option key={grade.gradeID} value={grade.gradeID}>{grade.gradeName}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.class', 'Class')}</label>
                        <select value={selectedClassId || ''} onChange={(e) => setSelectedClassId(e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                            <option value="">{t('common.allClasses', 'All Classes')}</option>
                            {filteredClasses.map(cls => (<option key={cls.classID} value={cls.classID}>{cls.className}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search', 'Search')}</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('lateReport.searchPlaceholder', 'Search student...')} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">{t('lateReport.noRecords', 'No late records found')}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.date', 'Date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.checkInTime', 'Check-in Time')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.studentCode', 'Student Code')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.studentName', 'Student Name')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.grade', 'Grade')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.class', 'Class')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.remarks', 'Remarks')}</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('lateReport.snapshot', 'Snapshot')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedRecords.map((record) => (
                                        <tr key={record.attendanceId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.attendanceDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                                    <Clock className="w-3.5 h-3.5" />{formatTime(record.checkInTime)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{record.studentCode}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.studentName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.gradeName || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.className || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{record.remarks || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {record.snapshotPath ? (
                                                    <button onClick={() => setPreviewImage(record.snapshotPath)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('lateReport.viewSnapshot', 'View Snapshot')}>
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                ) : (<span className="text-gray-300">-</span>)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">{t('common.showing', 'Showing')} {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRecords.length)} {t('common.of', 'of')} {filteredRecords.length}</div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></button>
                                    <span className="px-4 py-2 text-sm font-medium">{currentPage} / {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
                    <div className="max-w-2xl max-h-[80vh] relative">
                        <img src={previewImage} alt="Late check-in snapshot" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                        <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors">×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LateStudentsReportPage;