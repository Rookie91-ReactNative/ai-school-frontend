import { useState, useEffect } from 'react';
/*import { useTranslation } from 'react-i18next';*/
import { SUBJECTS, getSubjectLabel } from '../../utils/subjects';
import { CheckCircle, AlertCircle, Loader, Image } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
    className: string;
    subject: string;
    content: string;
    photoUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-school.azurewebsites.net/api'; //'http://localhost:5001/api';
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
                        }}
                        className="mt-4 w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        Tambah Lagi
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="mt-2 w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Tutup
                    </button>
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

                    {/* URL Foto (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Image className="w-3.5 h-3.5 inline mr-1" />
                            URL Foto <span className="text-gray-400 font-normal">(pilihan)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={form.photoUrl}
                            onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Tampal pautan foto dari Telegram jika ada.
                        </p>
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