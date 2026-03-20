import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader, Upload, X } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const AUTH_HEADER = '9B3F7D33-9681-CA49-98B5-465021004D38';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg',
    '.xlsx', '.xls', '.ppt', '.pptx', '.txt', '.zip', '.mp4'];
const MAX_SIZE_MB = 30;

interface Category { value: string; label: string; }

const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return '📄';
        case 'docx': case 'doc': return '📝';
        case 'xlsx': case 'xls': return '📊';
        case 'ppt': case 'pptx': return '📑';
        case 'png': case 'jpg': case 'jpeg': return '🖼️';
        case 'mp4': return '🎬';
        case 'zip': return '🗜️';
        default: return '📁';
    }
};

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const TelegramUploadLaporanPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/telegram/laporan/categories?authHeader=${encodeURIComponent(AUTH_HEADER)}`);
            const data = await res.json();
            setCategories(data.data ?? []);
        } catch { /* non-critical */ }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(e.target.files ?? []));
    };

    const addFiles = (files: File[]) => {
        setSelectedFiles(prev => {
            const existing = new Set(prev.map(f => f.name));
            return [...prev, ...files.filter(f => !existing.has(f.name))];
        });
        setError(null);
        setUploaded(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        addFiles(Array.from(e.dataTransfer.files));
    };

    const removeFile = (index: number) =>
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    const handleUpload = async () => {
        if (!selectedCategory) { setError('Sila pilih jawatan terlebih dahulu.'); return; }
        if (selectedFiles.length === 0) { setError('Sila pilih sekurang-kurangnya satu fail.'); return; }

        for (const f of selectedFiles) {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                setError(`${f.name}: jenis fail tidak dibenarkan.`); return;
            }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) {
                setError(`${f.name}: melebihi had ${MAX_SIZE_MB}MB.`); return;
            }
        }

        try {
            setUploading(true);
            setError(null);

            // ✅ Use AuthHeader via multipart form — same pattern as TelegramLeavePage
            const formData = new FormData();
            formData.append('categoryKey', selectedCategory);
            formData.append('authHeader', AUTH_HEADER);
            selectedFiles.forEach(f => formData.append('files', f));

            const res = await fetch(`${API_URL}/telegram/laporan/upload`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setUploaded(true);
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                const data = await res.json();
                setError(data.message ?? 'Ralat semasa memuat naik. Sila cuba lagi.');
            }
        } catch {
            setError('Tiada sambungan. Sila cuba lagi.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-lg mx-auto space-y-4">

                {/* Header */}
                <div className="text-center mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">📂 Muat Naik Laporan</h1>
                    <p className="text-sm text-gray-500 mt-1">Pilih jawatan dan muat naik fail anda</p>
                </div>

                {/* Success banner */}
                {uploaded && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">Berjaya dimuat naik!</p>
                            <p className="text-xs mt-0.5">Fail anda telah disimpan dengan jayanya.</p>
                        </div>
                    </div>
                )}

                {/* Position selector */}
                <div className="bg-white rounded-2xl shadow p-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                    <select
                        value={selectedCategory}
                        onChange={e => { setSelectedCategory(e.target.value); setError(null); setUploaded(false); }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="">-- Pilih Jawatan --</option>
                        {categories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Drop zone */}
                <div className="bg-white rounded-2xl shadow p-5">
                    <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">Drop files here</p>
                        <p className="text-xs text-gray-400 mt-1">or browse from your device</p>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-3 px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Choose files
                        </button>
                        <p className="text-xs text-gray-400 mt-3">
                            Max {MAX_SIZE_MB} MB per file · {ALLOWED_EXTENSIONS.join(', ')}
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ALLOWED_EXTENSIONS.join(',')}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Selected files list */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {selectedFiles.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xl">{getFileIcon(file.name)}</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFile(i)} className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.length === 0 || !selectedCategory}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {uploading
                        ? <><Loader className="w-4 h-4 animate-spin" /> Memuat naik...</>
                        : <><Upload className="w-4 h-4" /> Muat Naik</>
                    }
                </button>

            </div>
        </div>
    );
};

export default TelegramUploadLaporanPage;