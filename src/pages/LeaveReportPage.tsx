import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Search, AlertCircle, ChevronDown } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRecord {
    id: number;
    nama: string;
    tarikh: string;
    perkara: string;
    masa: string;
    tempat: string;
    anjuran: string;
    applyDate: string;
    leaveType: number;
    leaveTypeName: string;
}

interface LeaveType {
    value: number;
    label: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LeaveReportPage = () => {
    const { t } = useTranslation();

    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [filtered, setFiltered] = useState<LeaveRecord[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<number | 'All'>('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => { loadLeaveTypes(); loadRecords(); }, []);
    useEffect(() => { applyFilters(); }, [records, searchTerm, filterType, startDate, endDate]);

    const loadLeaveTypes = async () => {
        try {
            const res = await api.get('/leave/leave-types');
            setLeaveTypes(res.data.data ?? []);
        } catch { /* non-critical */ }
    };

    const loadRecords = async () => {
        try {
            setLoading(true); setError(null);
            const res = await api.get('/leave');
            setRecords(res.data.data ?? []);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? t('common.error'));
            else setError(t('common.error'));
        } finally { setLoading(false); }
    };

    const applyFilters = () => {
        let result = [...records];

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.nama?.toLowerCase().includes(s) ||
                r.perkara?.toLowerCase().includes(s)
            );
        }
        if (filterType !== 'All') result = result.filter(r => r.leaveType === filterType);
        if (startDate) result = result.filter(r => new Date(r.applyDate) >= new Date(startDate));
        if (endDate) result = result.filter(r => new Date(r.applyDate) <= new Date(endDate + 'T23:59:59'));

        setFiltered(result);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Summary counts by leave type
    const summary = leaveTypes.map(lt => ({
        ...lt,
        count: filtered.filter(r => r.leaveType === lt.value).length
    })).filter(s => s.count > 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('leaveReport.title')}</h1>
                    <p className="text-sm text-gray-500">{t('leaveReport.subtitle')}</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder={t('leaveReport.searchPlaceholder')} value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                {/* Leave type */}
                <div className="relative">
                    <select value={filterType} onChange={e => setFilterType(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                        className="w-full appearance-none px-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                        <option value="All">{t('leave.allTypes')}</option>
                        {leaveTypes.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {/* Start date */}
                <div>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                {/* End date */}
                <div>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>

            {/* Summary badges */}
            {summary.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {summary.map(s => (
                        <span key={s.value} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                            {s.label} <span className="bg-teal-200 rounded-full px-1.5">{s.count}</span>
                        </span>
                    ))}
                </div>
            )}

            <p className="text-sm text-gray-500 mb-3">
                {t('leaveReport.showing', { count: filtered.length, total: records.length })}
            </p>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['leave.nama', 'leave.tarikh', 'leave.perkara', 'leave.masa',
                                    'leave.tempat', 'leave.leaveType', 'leave.applyDate'].map(k => (
                                        <th key={k} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(k)}</th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">{t('leaveReport.noRecords')}</td></tr>
                            ) : paginated.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.nama}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{record.tarikh}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={record.perkara}>{record.perkara}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{record.masa}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{record.tempat}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                            {record.leaveTypeName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(record.applyDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filtered.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveReportPage;