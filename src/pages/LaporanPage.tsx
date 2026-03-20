import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertCircle, CheckCircle, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
    value: string;
    label: string;
}

interface UploadResult {
    uploaded: number;
    replaced: number;
    errors: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const LaporanPage = () => {
    const { t } = useTranslation();

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg',
        '.xlsx', '.xls', '.ppt', '.pptx', '.txt', '.zip', '.mp4'];
    const maxSizeMB = 30;

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            const res = await api.get('/laporan/categories');
            setCategories(res.data.data ?? []);
        } catch { /* non-critical */ }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setSelectedFiles(files);
        setResult(null);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setSelectedFiles(prev => [...prev, ...files]);
        setResult(null);
        setError(null);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

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

    const validateFiles = (): string[] => {
        const errs: string[] = [];
        selectedFiles.forEach(f => {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            if (!allowedExtensions.includes(ext))
                errs.push(`${f.name}: ${t('laporan.errorFileType')}`);
            else if (f.size > maxSizeMB * 1024 * 1024)
                errs.push(`${f.name}: ${t('laporan.errorFileSize', { max: maxSizeMB })}`);
        });
        return errs;
    };

    const handleUpload = async () => {
        if (!selectedCategory) { setError(t('laporan.selectCategoryFirst')); return; }
        if (selectedFiles.length === 0) { setError(t('laporan.selectFilesFirst')); return; }

        const validationErrors = validateFiles();
        if (validationErrors.length > 0) { setError(validationErrors.join('\n')); return; }

        try {
            setUploading(true);
            setError(null);
            setResult(null);

            const formData = new FormData();
            formData.append('categoryKey', selectedCategory);
            selectedFiles.forEach(f => formData.append('files', f));

            const res = await api.post('/laporan/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(res.data.data);
            if (res.data.data.errors?.length === 0) {
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (err) {
            if (axios.isAxiosError(err))
                setError(err.response?.data?.message ?? t('common.error'));
            else
                setError(t('common.error'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('laporan.uploadTitle')}</h1>
                    <p className="text-sm text-gray-500">{t('laporan.uploadSubtitle')}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-5">

                {/* Category selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('laporan.category')} *
                    </label>
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={e => { setSelectedCategory(e.target.value); setError(null); }}
                            className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                            <option value="">{t('laporan.selectCategory')}</option>
                            {categories.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700">{t('laporan.dropZoneTitle')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('laporan.dropZoneHint', { max: maxSizeMB })}</p>
                    <p className="text-xs text-gray-400">{allowedExtensions.join(', ')}</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={allowedExtensions.join(',')}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                            {t('laporan.selectedFiles', { count: selectedFiles.length })}
                        </p>
                        {selectedFiles.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xl">{getFileIcon(file.name)}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(i)} className="ml-2 text-gray-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                    </div>
                )}

                {/* Upload result */}
                {result && (
                    <div className={`p-4 rounded-lg border ${result.errors.length === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                        <div className="flex items-center gap-2 font-medium mb-1">
                            <CheckCircle className="w-4 h-4" />
                            {t('laporan.uploadComplete')}
                        </div>
                        {result.uploaded > 0 && <p className="text-sm">✅ {t('laporan.filesUploaded', { count: result.uploaded })}</p>}
                        {result.replaced > 0 && <p className="text-sm">🔄 {t('laporan.filesReplaced', { count: result.replaced })}</p>}
                        {result.errors.map((e, i) => <p key={i} className="text-sm">⚠️ {e}</p>)}
                    </div>
                )}

                {/* Upload button */}
                <button
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.length === 0 || !selectedCategory}
                    className="w-full py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <><span className="animate-spin">⏳</span> {t('laporan.uploading')}</>
                    ) : (
                        <><Upload className="w-4 h-4" /> {t('laporan.uploadButton')}</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LaporanPage;