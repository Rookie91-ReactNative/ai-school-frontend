import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveType {
    value: number;
    label: string;
}

interface FormData {
    nama: string;
    leaveType: number;
    tarikhFrom: string;   // date picker → YYYY-MM-DD (browser native)
    tarikhTo: string;     // date picker → YYYY-MM-DD (browser native)
    masa: string;         // free text — Education project had no fixed format
    perkara: string;
    tempat: string;
    anjuran: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-school.azurewebsites.net/api'; //'http://localhost:5001/api';
const AUTH_HEADER = '9B3F7D33-9681-CA49-98B5-465021004D38';

const getTokenFromUrl = () => new URLSearchParams(window.location.search).get('token') ?? '';
const getBotNameFromUrl = () => new URLSearchParams(window.location.search).get('BotName') ?? '';
const getUserNameFromUrl = () => decodeURIComponent(new URLSearchParams(window.location.search).get('u') ?? '');

// ✅ Convert YYYY-MM-DD → YYYY/MM/DD (matching Education daterangepicker format exactly)
const fmt = (d: string) => d.replace(/-/g, '/');

// ─── Component ────────────────────────────────────────────────────────────────

const TelegramLeavePage = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [form, setForm] = useState<FormData>({
        nama: '', leaveType: 1, tarikhFrom: '', tarikhTo: '',
        masa: '', perkara: '', tempat: '', anjuran: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Load leave types + pre-fill name from URL ──────────────────────────────

    useEffect(() => {
        loadLeaveTypes();
        const name = getUserNameFromUrl();
        if (name) setForm(prev => ({ ...prev, nama: name }));
    }, []);

    const loadLeaveTypes = async () => {
        try {
            const res = await fetch(`${API_URL}/leave/leave-types`, {
                headers: { Authorization: `Bearer ${getTokenFromUrl()}` }
            });
            const data = await res.json();
            setLeaveTypes(data.data ?? []);
        } catch {
            setLeaveTypes([
                { value: 1, label: 'Bengkel' },
                { value: 2, label: 'Bertugas Dalam Kokurikulum/Koakademik/Sukan' },
                { value: 3, label: 'Kursus' },
                { value: 4, label: 'Mesyuarat' },
                { value: 5, label: 'Pengawas Peperiksaan' },
                { value: 6, label: 'Taklimat' },
                { value: 7, label: 'Tugasan Rasmi' },
                { value: 8, label: 'Urusan Rasmi' },
                { value: 9, label: 'Cuti Sakit' },
                { value: 10, label: 'Cuti Kuarantin' },
                { value: 11, label: 'Cuti Menjaga Anak (Kuarantin)' },
                { value: 12, label: 'Cuti Rehat' },
                { value: 13, label: 'Cuti Rehat Khas' },
                { value: 14, label: 'Cuti Rehat Berkelompok' },
                { value: 15, label: 'Timeslip' },
            ]);
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!form.nama) { setError('Sila masukkan nama anda.'); return; }
        if (!form.tarikhFrom) { setError('Sila masukkan tarikh mula.'); return; }
        if (!form.tarikhTo) { setError('Sila masukkan tarikh tamat.'); return; }

        try {
            setSubmitting(true);
            setError(null);

            // ✅ Format: YYYY/MM/DD - YYYY/MM/DD (always range format, matching Education project)
            const tarikh = `${fmt(form.tarikhFrom)} - ${fmt(form.tarikhTo)}`;

            const res = await fetch(`${API_URL}/telegram/insert-leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    AuthHeader: AUTH_HEADER,
                    BotName: getBotNameFromUrl(),
                    Nama: form.nama,
                    Tarikh: tarikh,
                    Perkara: form.perkara,
                    Masa: form.masa || '-',
                    Tempat: form.tempat,
                    Anjuran: form.anjuran,
                    LeaveType: form.leaveType,
                    Messages: '',
                    MessagesId: '',
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
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Berjaya Dihantar!</h2>
                    <p className="text-gray-500 text-sm">
                        Permohonan cuti anda telah dihantar kepada pentadbiran sekolah.
                    </p>
                    <button
                        onClick={() => window.close()}
                        className="mt-6 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────

    const textField = (
        label: string,
        key: keyof FormData,
        required = false,
        type: 'text' | 'textarea' = 'text'
    ) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === 'textarea' ? (
                <textarea
                    rows={3}
                    value={form[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            ) : (
                <input
                    type="text"
                    value={form[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-lg mx-auto">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">📋 Permohonan Cuti</h1>
                    <p className="text-sm text-gray-500 mt-1">Sila isi maklumat di bawah</p>
                </div>

                <div className="bg-white rounded-2xl shadow p-5 space-y-4">

                    {/* Nama */}
                    {textField('Nama', 'nama', true)}

                    {/* Jenis Cuti */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Cuti <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.leaveType}
                            onChange={e => setForm(f => ({ ...f, leaveType: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {leaveTypes.map(lt => (
                                <option key={lt.value} value={lt.value}>{lt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tarikh — date picker, output YYYY/MM/DD - YYYY/MM/DD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarikh <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={form.tarikhFrom}
                                onChange={e => setForm(f => ({
                                    ...f,
                                    tarikhFrom: e.target.value,
                                    tarikhTo: f.tarikhTo && f.tarikhTo < e.target.value
                                        ? e.target.value
                                        : f.tarikhTo
                                }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-400 text-sm flex-shrink-0">hingga</span>
                            <input
                                type="date"
                                value={form.tarikhTo}
                                min={form.tarikhFrom}
                                onChange={e => setForm(f => ({ ...f, tarikhTo: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Pilih tarikh yang sama jika cuti sehari.
                        </p>
                    </div>

                    {/* Masa — free text, same as Education project */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Masa</label>
                        <input
                            type="text"
                            placeholder="cth: 08:00 - 17:00"
                            value={form.masa}
                            onChange={e => setForm(f => ({ ...f, masa: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Perkara */}
                    {textField('Perkara', 'perkara', false, 'textarea')}

                    {/* Tempat */}
                    {textField('Tempat', 'tempat', false)}

                    {/* Anjuran */}
                    {textField('Anjuran', 'anjuran', false)}

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
                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting
                            ? <><Loader className="w-4 h-4 animate-spin" /> Menghantar...</>
                            : 'Hantar Permohonan'
                        }
                    </button>

                </div>
            </div>
        </div>
    );
};

export default TelegramLeavePage;