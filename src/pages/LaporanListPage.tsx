import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Trash2, Download, AlertCircle, Search, /*X,*/ ChevronDown } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import { useAuth } from '../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LaporanFile {
    blobName: string;
    fileName: string;
    extension: string;
    fileSize: number;
    blobUrl: string;
    uploadedOn: string;
    categoryKey: string;
    categoryName: string;
    year: string;
}

interface Category {
    value: string;
    label: string;
    count?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const badgeColor = (ext: string) => {
    switch (ext) {
        case '.pdf': return 'bg-red-100 text-red-700';
        case '.docx': case '.doc': return 'bg-blue-100 text-blue-700';
        case '.xlsx': case '.xls': return 'bg-green-100 text-green-700';
        case '.ppt': case '.pptx': return 'bg-orange-100 text-orange-700';
        case '.png': case '.jpg': case '.jpeg': return 'bg-pink-100 text-pink-700';
        case '.mp4': return 'bg-purple-100 text-purple-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

const LaporanListPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.userRole === 'SuperAdmin' || user?.userRole === 'SchoolAdmin';

    const [files, setFiles] = useState<LaporanFile[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedYear, setSelectedYear] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Delete confirm
    const [deletingBlob, setDeletingBlob] = useState<string | null>(null);

    useEffect(() => { loadCategories(); loadFiles(); }, []);

    const loadCategories = async () => {
        try {
            const res = await api.get('/laporan/categories');
            setCategories(res.data.data ?? []);
        } catch { /* non-critical */ }
    };

    const loadFiles = async (catKey?: string) => {
        try {
            setLoading(true); setError(null);
            const params: Record<string, string> = {};
            if (catKey) params.categoryKey = catKey;
            const res = await api.get('/laporan', { params });
            setFiles(res.data.data ?? []);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? t('common.error'));
            else setError(t('common.error'));
        } finally { setLoading(false); }
    };

    // Derive years from current files for selected category
    const years = ['All', ...Array.from(new Set(
        files
            .filter(f => !selectedCategory || f.categoryKey === selectedCategory)
            .map(f => f.year)
            .filter(Boolean)
    )).sort().reverse()];

    // Apply client-side filters
    const filtered = files.filter(f => {
        if (selectedCategory && f.categoryKey !== selectedCategory) return false;
        if (selectedYear !== 'All' && f.year !== selectedYear) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            if (!f.fileName.toLowerCase().includes(s) &&
                !f.categoryName.toLowerCase().includes(s)) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        setSelectedYear('All');
        setCurrentPage(1);
    };

    const handleDelete = async (blobName: string) => {
        try {
            await api.delete('/laporan', { params: { blobName } });
            setDeletingBlob(null);
            setFiles(prev => prev.filter(f => f.blobName !== blobName));
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? t('common.error'));
            else setError(t('common.error'));
            setDeletingBlob(null);
        }
    };

    // Category cards with file counts
    const categoryStats = categories.map(c => ({
        ...c,
        count: files.filter(f => f.categoryKey === c.value).length
    })).filter(c => c.count > 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('laporanList.title')}</h1>
                    <p className="text-sm text-gray-500">{t('laporanList.subtitle')}</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {/* Category cards */}
            {categoryStats.length > 0 && (
                <div className="mb-5">
                    <p className="text-sm font-medium text-gray-600 mb-2">{t('laporanList.selectCategory')}</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleCategoryChange('')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {t('laporanList.allCategories')} ({files.length})
                        </button>
                        {categoryStats.map(c => (
                            <button
                                key={c.value}
                                onClick={() => handleCategoryChange(c.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === c.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {c.label} ({c.count})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Year + Search filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('laporanList.searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {years.length > 2 && (
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={e => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                            className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {years.map(y => <option key={y} value={y}>{y === 'All' ? t('laporanList.allYears') : y}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Stats bar */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                        { label: t('laporanList.statsFiles'), value: filtered.length },
                        { label: t('laporanList.statsTotalSize'), value: formatSize(filtered.reduce((acc, f) => acc + f.fileSize, 0)) },
                        { label: t('laporanList.statsYear'), value: selectedYear === 'All' ? t('laporanList.allYears') : selectedYear },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-lg shadow-sm p-3 text-center border border-gray-100">
                            <p className="text-xs text-gray-400 font-medium uppercase">{s.label}</p>
                            <p className="text-lg font-bold text-gray-900 mt-0.5">{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-sm text-gray-500 mb-3">
                {t('laporanList.showing', { count: filtered.length, total: files.length })}
            </p>

            {/* Files table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['laporanList.fileName', 'laporanList.category', 'laporanList.year',
                                    'laporanList.fileSize', 'laporanList.uploadedOn', 'common.actions'].map(k => (
                                        <th key={k} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(k)}</th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">{t('laporanList.noFiles')}</td></tr>
                            ) : paginated.map(file => (
                                <tr key={file.blobName} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${badgeColor(file.extension)}`}>
                                                {file.extension.replace('.', '').toUpperCase()}
                                            </span>
                                            <a href={file.blobUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 hover:underline truncate max-w-xs">
                                                {file.fileName}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{file.categoryName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{file.year}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatSize(file.fileSize)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(file.uploadedOn).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <a href={file.blobUrl} target="_blank" rel="noopener noreferrer"
                                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title={t('laporanList.download')}>
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {isAdmin && (
                                                <button onClick={() => setDeletingBlob(file.blobName)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded" title={t('common.delete')}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
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

            {/* Delete confirm */}
            {deletingBlob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('laporanList.confirmDelete')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('laporanList.confirmDeleteMsg')}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeletingBlob(null)}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">{t('common.cancel')}</button>
                            <button onClick={() => handleDelete(deletingBlob)}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">{t('common.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LaporanListPage;