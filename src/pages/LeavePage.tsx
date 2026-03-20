import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Edit, Trash2, AlertCircle, X, ChevronDown } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import { useAuth } from '../hooks/useAuth';

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

interface Teacher {
    id: number;
    fullName: string;
}

interface LeaveFormData {
    nama: string;
    tarikh: string;
    perkara: string;
    masa: string;
    tempat: string;
    anjuran: string;
    leaveType: number;
}

const emptyForm: LeaveFormData = {
    nama: '', tarikh: '', perkara: '',
    masa: '', tempat: '', anjuran: '', leaveType: 1,
};

// ─── Component ────────────────────────────────────────────────────────────────

const LeavePage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.userRole === 'SuperAdmin' || user?.userRole === 'SchoolAdmin';

    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [filtered, setFiltered] = useState<LeaveRecord[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterLeaveType, setFilterLeaveType] = useState<number | 'All'>('All');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);
    const [formData, setFormData] = useState<LeaveFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => { loadLeaveTypes(); loadTeachers(); loadRecords(); }, []);
    useEffect(() => { applyFilters(); }, [records, searchTerm, filterLeaveType]);

    const loadLeaveTypes = async () => {
        try {
            const res = await api.get('/leave/leave-types');
            setLeaveTypes(res.data.data ?? []);
        } catch { /* non-critical */ }
    };

    const loadTeachers = async () => {
        try {
            const res = await api.get('/teacher?activeOnly=true');
            setTeachers(res.data.data ?? []);
        } catch { /* non-critical */ }
    };

    const loadRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/leave');
            setRecords(res.data.data ?? []);
        } catch (err) {
            setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? t('common.error')) : t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...records];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.nama?.toLowerCase().includes(s) ||
                r.perkara?.toLowerCase().includes(s) ||
                r.tempat?.toLowerCase().includes(s)
            );
        }
        if (filterLeaveType !== 'All') result = result.filter(r => r.leaveType === filterLeaveType);
        setFiltered(result);
        setCurrentPage(1);
    };

    const openAdd = () => {
        setEditingRecord(null); setFormData(emptyForm); setFormError(null); setIsModalOpen(true);
    };

    const openEdit = (record: LeaveRecord) => {
        setEditingRecord(record);
        setFormData({
            nama: record.nama ?? '', tarikh: record.tarikh ?? '', perkara: record.perkara ?? '',
            masa: record.masa ?? '', tempat: record.tempat ?? '', anjuran: record.anjuran ?? '', leaveType: record.leaveType ?? 1
        });
        setFormError(null); setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.nama || !formData.tarikh || !formData.perkara) {
            setFormError(t('leave.validationRequired')); return;
        }
        try {
            setSaving(true); setFormError(null);
            if (editingRecord) await api.put(`/leave/${editingRecord.id}`, formData);
            else await api.post('/leave', formData);
            setIsModalOpen(false); loadRecords();
        } catch (err) {
            setFormError(axios.isAxiosError(err) ? (err.response?.data?.message ?? t('common.error')) : t('common.error'));
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/leave/${id}`);
            setDeletingId(null); loadRecords();
        } catch (err) {
            setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? t('common.error')) : t('common.error')); setDeletingId(null);
        }
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('leave.title')}</h1>
                        <p className="text-sm text-gray-500">{t('leave.subtitle')}</p>
                    </div>
                </div>
                {isAdmin && (
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4" /> {t('leave.addRecord')}
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder={t('leave.searchPlaceholder')} value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="relative">
                    <select value={filterLeaveType}
                        onChange={e => setFilterLeaveType(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                        className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="All">{t('leave.allTypes')}</option>
                        {leaveTypes.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">{t('leave.showing', { count: filtered.length, total: records.length })}</p>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['leave.nama', 'leave.tarikh', 'leave.perkara', 'leave.masa', 'leave.leaveType', 'leave.applyDate'].map(k => (
                                    <th key={k} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(k)}</th>
                                ))}
                                {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-10 text-center text-gray-400">{t('leave.noRecords')}</td></tr>
                            ) : paginated.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.nama}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{record.tarikh}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={record.perkara}>{record.perkara}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{record.masa}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {record.leaveTypeName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(record.applyDate).toLocaleDateString()}</td>
                                    {isAdmin && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title={t('common.edit')}><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => setDeletingId(record.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200">
                        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">{editingRecord ? t('leave.editRecord') : t('leave.addRecord')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                                </div>
                            )}
                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.nama')} *</label>
                                <select value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="">{t('leave.selectName')}</option>
                                    {teachers.map(tc => (
                                        <option key={tc.id} value={tc.fullName}>{tc.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Leave Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.leaveType')} *</label>
                                <select value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    {leaveTypes.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                                </select>
                            </div>
                            {/* Tarikh */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.tarikh')} *</label>
                                <input type="text" placeholder="e.g. 01/01/2025 - 02/01/2025" value={formData.tarikh}
                                    onChange={e => setFormData({ ...formData, tarikh: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            {/* Masa */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.masa')}</label>
                                <input type="text" placeholder="e.g. 8:00am - 5:00pm" value={formData.masa}
                                    onChange={e => setFormData({ ...formData, masa: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            {/* Perkara */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.perkara')} *</label>
                                <textarea rows={3} value={formData.perkara} onChange={e => setFormData({ ...formData, perkara: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>
                            {/* Tempat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.tempat')}</label>
                                <input type="text" value={formData.tempat} onChange={e => setFormData({ ...formData, tempat: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            {/* Anjuran */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leave.anjuran')}</label>
                                <input type="text" value={formData.anjuran} onChange={e => setFormData({ ...formData, anjuran: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>
                            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                {saving ? t('common.loading') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deletingId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('leave.confirmDelete')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('leave.confirmDeleteMsg')}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>
                            <button onClick={() => handleDelete(deletingId!)} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">{t('common.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavePage;