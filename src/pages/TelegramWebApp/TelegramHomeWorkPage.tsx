import { useState, useEffect, useRef } from 'react';
/*import { useTranslation } from 'react-i18next';*/
import { SUBJECTS, getSubjectLabel } from '../../utils/subjects';
import { CheckCircle, AlertCircle, Loader, Upload, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
    className: string;
    subject: string;
    content: string;
    photoUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const AUTH_HEADER = '9B3F7D33-9681-CA49-98B5-465021004D38';

const getTokenFromUrl = () => new URLSearchParams(window.location.search).get('token') ?? '';


// ─── Component ────────────────────────────────────────────────────────────────

const TelegramHomeWorkPage = () => {
    /*const { i18n } = useTranslation();*/
    const [classes, setClasses] = useState<string[]>([]);
    const [form, setForm] = useState<FormData>({
        className: '', subject: '', content: '', photoUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // ── Load classes ───────────────────────────────────────────────────────────

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const res = await fetch(`${API_URL}/homework/classes`, {
                headers: { Authorization: `Bearer ${getTokenFromUrl()}` }
            });
            const data = await res.json();
            const list: string[] = data.data ?? [];
            setClasses(list);
            if (list.length > 0) setForm(f => ({ ...f, className: list[0] }));
        } catch {
            // leave empty — user can type manually
        }
    };

    // ── Photo upload ───────────────────────────────────────────────────────────

    const handlePhotoUpload = async (file: File) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) { setError('Jenis fail tidak dibenarkan. Sila pilih imej.'); return; }
        if (file.size > 10 * 1024 * 1024) { setError('Saiz fail melebihi had 10MB.'); return; }
        try {
            setUploadingPhoto(true);
            setError(null);
            const fd = new FormData();
            fd.append('file', file);
            fd.append('authHeader', AUTH_HEADER);  // ✅ use AuthHeader — no JWT needed
            const res = await fetch(`${API_URL}/telegram/homework/upload-photo`, {
                method: 'POST',
                body: fd,
            });
            const data = await res.json();
            if (res.ok) {
                setForm(f => ({ ...f, photoUrl: data.data.url }));
            } else {
                setError(data.message ?? 'Gagal muat naik foto.');
            }
        } catch {
            setError('Tiada sambungan. Sila cuba lagi.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!form.className) { setError('Sila pilih kelas.'); return; }
        if (!form.subject) { setError('Sila pilih mata pelajaran.'); return; }
        if (!form.content) { setError('Sila masukkan kandungan kerja rumah.'); return; }

        try {
            setSubmitting(true);
            setError(null);

            const res = await fetch(`${API_URL}/telegram/desktop/homework`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    AuthHeader: AUTH_HEADER,
                    Content: form.content,
                    Class: form.className,
                    Subject: form.subject,
                    PhotoUrl: form.photoUrl || null,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.message ?? 'Ralat semasa menghantar. Sila cuba lagi.');
            }
        } catch {
            setError('Tiada sambungan. Sila cuba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Berjaya Disimpan!</h2>
                    <p className="text-gray-500 text-sm">
                        Kerja rumah telah berjaya direkodkan.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setForm(f => ({ ...f, subject: '', content: '', photoUrl: '' }));
                            if (photoInputRef.current) photoInputRef.current.value = '';
                        }}
                        className="mt-4 w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        Tambah Lagi
                    </button>
                    {/*<button*/}
                    {/*    onClick={() => window.close()}*/}
                    {/*    className="mt-2 w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"*/}
                    {/*>*/}
                    {/*    Tutup*/}
                    {/*</button>*/}
                </div>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-lg mx-auto">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">📚 Kerja Rumah</h1>
                    <p className="text-sm text-gray-500 mt-1">Rekod kerja rumah untuk kelas anda</p>
                </div>

                <div className="bg-white rounded-2xl shadow p-5 space-y-4">

                    {/* Kelas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kelas <span className="text-red-500">*</span>
                        </label>
                        {classes.length > 0 ? (
                            <select
                                value={form.className}
                                onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder="cth: 3J"
                                value={form.className}
                                onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        )}
                    </div>

                    {/* Mata Pelajaran */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mata Pelajaran <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                            <option value="">-- Pilih Mata Pelajaran --</option>
                            {SUBJECTS.map(s => (
                                <option key={s.value} value={s.value}>{getSubjectLabel(s, 'ms')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kandungan Kerja Rumah */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kandungan Kerja Rumah <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Huraikan kerja rumah..."
                            value={form.content}
                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                    </div>

                    {/* Foto (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Foto <span className="text-gray-400 font-normal">(pilihan)</span>
                        </label>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                        {form.photoUrl ? (
                            <div className="relative">
                                <img src={form.photoUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                                <button type="button"
                                    onClick={() => { setForm(f => ({ ...f, photoUrl: '' })); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                                className="w-full flex items-center justify-center gap-2 px-3 py-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50">
                                {uploadingPhoto
                                    ? <><Loader className="w-4 h-4 animate-spin" /> Memuat naik...</>
                                    : <><Upload className="w-4 h-4" /> Pilih Foto</>
                                }
                            </button>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting
                            ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            : 'Simpan Kerja Rumah'
                        }
                    </button>

                </div>
            </div>
        </div>
    );
};

export default TelegramHomeWorkPage;