import { useState, useEffect } from 'react';
import { AlertCircle, Search, FolderOpen } from 'lucide-react';

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-school.azurewebsites.net/api'; //'http://localhost:5001/api';
const AUTH_HEADER = '9B3F7D33-9681-CA49-98B5-465021004D38';

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
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

const TelegramViewLaporanPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [allFiles, setAllFiles] = useState<LaporanFile[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            // ✅ No auth needed for viewing — public read access on laporan container
            const [catRes, fileRes] = await Promise.all([
                fetch(`${API_URL}/telegram/laporan/categories?authHeader=${encodeURIComponent(AUTH_HEADER)}`),
                fetch(`${API_URL}/telegram/laporan/files?authHeader=${encodeURIComponent(AUTH_HEADER)}`),
            ]);
            const catData = await catRes.json();
            const fileData = await fileRes.json();
            setCategories(catData.data ?? []);
            setAllFiles(fileData.data ?? []);
        } catch {
            setError('Gagal memuatkan fail. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    };

    // Categories that have files
    const activeCategories = categories.filter(c =>
        allFiles.some(f => f.categoryKey === c.value)
    );

    // Filter files
    const filteredFiles = allFiles.filter(f => {
        if (selectedCategory && f.categoryKey !== selectedCategory) return false;
        if (searchTerm && !f.fileName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const totalSize = filteredFiles.reduce((acc, f) => acc + f.fileSize, 0);
    const years = [...new Set(filteredFiles.map(f => f.year).filter(Boolean))].sort().reverse();

    return (
        <div className="min-h-screen bg-gray-50 pb-8">

            {/* Header */}
            <div className="bg-white px-4 pt-6 pb-4 shadow-sm">
                <h1 className="text-xl font-bold text-gray-900 text-center">📋 Fail Laporan</h1>

                {/* Category pills */}
                {activeCategories.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Select Position</p>
                        <div className="flex flex-wrap gap-2">
                            {activeCategories.map(c => {
                                const count = allFiles.filter(f => f.categoryKey === c.value).length;
                                const isActive = selectedCategory === c.value;
                                return (
                                    <button
                                        key={c.value}
                                        onClick={() => {
                                            setSelectedCategory(prev => prev === c.value ? '' : c.value);
                                            setSearchTerm('');
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isActive
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {c.label}
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white text-gray-900' : 'bg-gray-300 text-gray-600'
                                            }`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 mt-4 space-y-3">

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-10 text-gray-400 text-sm">Memuatkan...</div>
                )}

                {!loading && selectedCategory && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'FILES', value: filteredFiles.length },
                                { label: 'TOTAL SIZE', value: formatSize(totalSize) },
                                { label: 'SHOWING YEAR', value: years[0] ?? 'All' },
                            ].map(s => (
                                <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
                                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                                    <p className="text-sm font-bold text-gray-900 mt-1">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search filename..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                        </div>

                        {/* File list */}
                        {filteredFiles.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">Tiada fail dijumpai.</div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow overflow-hidden">
                                {/* Table header */}
                                <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-7">FILE NAME</div>
                                    <div className="col-span-2 text-center">YEAR</div>
                                    <div className="col-span-2 text-right">SIZE</div>
                                </div>
                                {filteredFiles.map((file, i) => (
                                    <a
                                        key={file.blobName}
                                        href={file.blobUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="grid grid-cols-12 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 items-center"
                                    >
                                        <div className="col-span-1 text-xs text-gray-400">{i + 1}</div>
                                        <div className="col-span-7 flex items-center gap-2 min-w-0">
                                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${badgeColor(file.extension)}`}>
                                                {file.extension.replace('.', '').toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-800 truncate">{file.fileName}</span>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className="text-xs font-medium text-blue-600">{file.year}</span>
                                        </div>
                                        <div className="col-span-2 text-right text-xs text-gray-500">
                                            {formatSize(file.fileSize)}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* No category selected */}
                {!loading && !selectedCategory && (
                    <div className="text-center py-16 text-gray-400">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">Select a position above</p>
                        <p className="text-xs mt-1">Files will appear here once you pick a position</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TelegramViewLaporanPage;