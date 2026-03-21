import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Search, Edit, Trash2, AlertCircle, X, Image, Upload, Loader } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import { useAuth } from '../hooks/useAuth';
import { SUBJECTS, getSubjectLabel } from '../utils/subjects';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeWork {
    id: number;
    content: string;
    class: string;
    date: string;
    subject: string;
    photoUrl: string | null;
}

interface HomeWorkFormData {
    content: string;
    class: string;
    date: string;
    subject: string;
    photoUrl: string;
}

const emptyForm: HomeWorkFormData = {
    content: '', class: '', date: new Date().toISOString().split('T')[0],
    subject: '', photoUrl: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const HomeWorkPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.userRole === 'SuperAdmin' || user?.userRole === 'SchoolAdmin';

    const [records, setRecords] = useState<HomeWork[]>([]);
    const [filtered, setFiltered] = useState<HomeWork[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<HomeWork | null>(null);
    const [formData, setFormData] = useState<HomeWorkFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    useEffect(() => { loadClasses(); loadRecords(); }, []);
    useEffect(() => { applyFilters(); }, [records, searchTerm, filterClass]);

    const loadClasses = async () => {
        try {
            const res = await api.get('/homework/classes');
            setClasses(res.data.data ?? []);
        } catch { /* non-critical */ }
    };

    const loadRecords = async () => {
        try {
            setLoading(true); setError(null);
            const res = await api.get('/homework');
            setRecords(res.data.data ?? []);
        } catch (err) {
            setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? t('common.error')) : t('common.error'));
        } finally { setLoading(false); }
    };

    const applyFilters = () => {
        let result = [...records];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(r => r.content?.toLowerCase().includes(s) || r.subject?.toLowerCase().includes(s));
        }
        if (filterClass !== 'All') result = result.filter(r => r.class === filterClass);
        setFiltered(result);
        setCurrentPage(1);
    };

    const openAdd = () => {
        setEditingRecord(null);
        setFormData({ ...emptyForm, class: classes[0] ?? '' });
        setFormError(null); setIsModalOpen(true);
    };

    const openEdit = (record: HomeWork) => {
        setEditingRecord(record);
        setFormData({
            content: record.content ?? '', class: record.class ?? '',
            date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
            subject: record.subject ?? '', photoUrl: record.photoUrl ?? '',
        });
        setFormError(null); setIsModalOpen(true);
    };

    const handlePhotoUpload = async (file: File) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) { setFormError(t('homework.photoTypeError')); return; }
        if (file.size > 10 * 1024 * 1024) { setFormError(t('homework.photoSizeError')); return; }
        try {
            setUploadingPhoto(true);
            setFormError(null);
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.post('/homework/upload-photo', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, photoUrl: res.data.data.url }));
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message ?? t('common.error'));
            else setFormError(t('common.error'));
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!formData.content || !formData.class || !formData.subject) {
            setFormError(t('homework.validationRequired')); return;
        }
        try {
            setSaving(true); setFormError(null);
            const payload = { ...formData, date: new Date(formData.date).toISOString() };
            if (editingRecord) await api.put(`/homework/${editingRecord.id}`, payload);
            else await api.post('/homework', payload);
            setIsModalOpen(false); loadRecords();
        } catch (err) {
            setFormError(axios.isAxiosError(err) ? (err.response?.data?.message ?? t('common.error')) : t('common.error'));
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/homework/${id}`);
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
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('homework.title')}</h1>
                        <p className="text-sm text-gray-500">{t('homework.subtitle')}</p>
                    </div>
                </div>
                {isAdmin && (
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Plus className="w-4 h-4" /> {t('homework.addRecord')}
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
                    <input type="text" placeholder={t('homework.searchPlaceholder')} value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="All">{t('homework.allClasses')}</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <p className="text-sm text-gray-500 mb-3">{t('homework.showing', { count: filtered.length, total: records.length })}</p>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['homework.class', 'homework.subject', 'homework.content', 'homework.date', 'homework.photo'].map(k => (
                                    <th key={k} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(k)}</th>
                                ))}
                                {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-gray-400">{t('homework.noRecords')}</td></tr>
                            ) : paginated.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{record.class}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.subject}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={record.content}>{record.content}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        {record.photoUrl ? (
                                            <button onClick={() => setPreviewPhoto(record.photoUrl!)}
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                                <Image className="w-4 h-4" /> {t('homework.viewPhoto')}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => setDeletingId(record.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
                            <h2 className="text-lg font-semibold text-gray-900">{editingRecord ? t('homework.editRecord') : t('homework.addRecord')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                                </div>
                            )}
                            {/* Class */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.class')} *</label>
                                <select value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                                    <option value="">{t('homework.selectClass')}</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.subject')} *</label>
                                <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                                    <option value="">{t('homework.selectSubject')}</option>
                                    {SUBJECTS.map(s => (
                                        <option key={s.value} value={s.value}>{getSubjectLabel(s, i18n.language)}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.date')} *</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.content')} *</label>
                                <textarea rows={4} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                            </div>
                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.photo')}</label>
                                <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                                {formData.photoUrl ? (
                                    <div className="relative">
                                        <img src={formData.photoUrl} alt="preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                                        <button type="button" onClick={() => { setFormData(prev => ({ ...prev, photoUrl: '' })); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-6 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50">
                                        {uploadingPhoto
                                            ? <><Loader className="w-4 h-4 animate-spin" /> {t('common.loading')}...</>
                                            : <><Upload className="w-4 h-4" /> {t('homework.uploadPhoto')}</>
                                        }
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 mt-1">{t('homework.photoHint')}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>
                            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('homework.confirmDelete')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('homework.confirmDeleteMsg')}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>
                            <button onClick={() => handleDelete(deletingId!)} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">{t('common.delete')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Preview */}
            {previewPhoto && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewPhoto(null)}>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPreviewPhoto(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300"><X className="w-6 h-6" /></button>
                        <img src={previewPhoto} alt="Homework" className="w-full rounded-lg shadow-xl object-contain max-h-[80vh]" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeWorkPage;