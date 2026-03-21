import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SUBJECTS, getSubjectLabel } from '../utils/subjects';
import {
    ClipboardCheck, Plus, Search, Filter, Download,
    Edit, Trash2, X, Eye, ChevronDown, ChevronUp,
    /*FileText,*/ BarChart2, CheckCircle, AlertTriangle, Lock,
} from 'lucide-react';
import {
    myPdpService,
    STANDARDS,
    CRITERIA_TEXT,
    SCORE4_TEXT,
    buildDefaultScoreItems,
    calcStandardScore,
    calcTotalScore,
    getRating,
    RATING_CONFIG,
    type MyPdpAssessmentList,
    type MyPdpAssessmentDetail,
    type MyPdpScoreItem,
    type SessionType,
    type RatingType,
} from '../services/myPdpService';
import { teacherService, type Teacher } from '../services/teacherService';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// ─── local types ────────────────────────────────────────────────────────────
interface AcademicYear { academicYearID: number; yearName: string; isActive: boolean; }
interface ClassItem { classID: number; className: string; }

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

// Teacher can only create PERTAMA; admin creates KEDUA/KETIGA
const SESSION_TYPES_ADMIN: SessionType[] = ['PENCERAPAN KEDUA', 'PENCERAPAN KETIGA'];
// All session types — used in filter dropdown
const SESSION_TYPES: SessionType[] = ['PENCERAPAN PERTAMA', 'PENCERAPAN KEDUA', 'PENCERAPAN KETIGA'];

// ─── Rating badge ────────────────────────────────────────────────────────────
const RatingBadge = ({ rating }: { rating: string }) => {
    const cfg = RATING_CONFIG[rating as RatingType] ?? { color: 'text-gray-600', bg: 'bg-gray-100', label: rating };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

// ─── Score pill button (0–4) ─────────────────────────────────────────────────
const ScoreButton = ({
    value, selected, onChange, readonly,
}: { value: number; selected: boolean; onChange: () => void; readonly: boolean; }) => (
    <button
        type="button"
        onClick={readonly ? undefined : onChange}
        disabled={readonly}
        className={`
            w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-bold transition-all
            ${selected
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
            }
            ${readonly ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-95'}
        `}
    >
        {value}
    </button>
);

// ─── Standard accordion section ─────────────────────────────────────────────
const StandardSection = ({
    std, scoreItems, onChange, readonly, defaultOpen,
}: {
    std: typeof STANDARDS[0];
    scoreItems: MyPdpScoreItem[];
    onChange: (itemCode: string, score: number) => void;
    readonly: boolean;
    defaultOpen?: boolean;
}) => {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const stdScore = calcStandardScore(scoreItems, std.code, std.weight);
    const allScored = std.items.every(item =>
        scoreItems.find(s => s.itemCode === item.itemCode)?.score !== undefined
    );

    // Score column headers
    const SCORE_LABELS = [4, 3, 2, 1, 0];

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Accordion header */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex shrink-0 items-center justify-center w-14 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {std.code}
                    </span>
                    <span className="text-sm font-medium text-gray-700 line-clamp-2">{std.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-sm font-bold ${stdScore > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {stdScore.toFixed(2)}%
                    </span>
                    {allScored && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </button>

            {/* Sub-items */}
            {open && (
                <div className="divide-y divide-gray-100">
                    {std.items.map(item => {
                        const current = scoreItems.find(s => s.itemCode === item.itemCode)?.score ?? 0;
                        const criteria = CRITERIA_TEXT[item.criteriaType];
                        // Score 4 text is unique per standard for types A and B
                        const getCriteriaText = (v: number, idx: number): string => {
                            if (v === 4 && (item.criteriaType === 'A' || item.criteriaType === 'B')) {
                                return SCORE4_TEXT[std.code] ?? criteria[0];
                            }
                            return criteria[idx];
                        };

                        return (
                            <div key={item.itemCode} className="px-3 py-3">
                                {/* Sub-item description */}
                                <div className="flex gap-2 mb-3">
                                    <span className="shrink-0 w-5 text-xs font-bold text-gray-400 mt-0.5">{item.letter})</span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                                </div>

                                {/* ── Desktop: criteria columns table ─────────────────── */}
                                <div className="hidden sm:grid sm:grid-cols-5 gap-1 mb-1">
                                    {SCORE_LABELS.map((v, idx) => {
                                        const isSelected = current === v;
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={readonly ? undefined : () => onChange(item.itemCode, v)}
                                                disabled={readonly}
                                                className={`
                                                    flex flex-col items-center gap-1.5 rounded-xl p-2 text-left border transition-all
                                                    ${isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300'
                                                    }
                                                    ${readonly ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                                                `}
                                            >
                                                <span className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{v}</span>
                                                <span className={`text-[10px] leading-tight text-center ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {getCriteriaText(v, idx)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* ── Mobile: score buttons + selected criteria hint ────── */}
                                <div className="sm:hidden">
                                    <div className="flex gap-1.5 mb-2">
                                        {SCORE_LABELS.map(v => (
                                            <ScoreButton
                                                key={v}
                                                value={v}
                                                selected={current === v}
                                                onChange={() => onChange(item.itemCode, v)}
                                                readonly={readonly}
                                            />
                                        ))}
                                    </div>
                                    {/* Show criteria for selected score */}
                                    <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${current > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
                                        }`}>
                                        <span className="font-semibold">Skor {current}: </span>
                                        {getCriteriaText(current, 4 - current)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Score summary bar ────────────────────────────────────────────────────────
const ScoreSummaryBar = ({ scoreItems }: { scoreItems: MyPdpScoreItem[] }) => {
    const total = calcTotalScore(scoreItems);
    const rating = getRating(total);
    const cfg = RATING_CONFIG[rating];

    return (
        <div className={`sticky top-0 z-10 ${cfg.bg} border-b px-4 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
                <BarChart2 className={`w-4 h-4 ${cfg.color}`} />
                <span className={`text-sm font-semibold ${cfg.color}`}>
                    Jumlah: {total.toFixed(2)}%
                </span>
            </div>
            <RatingBadge rating={rating} />
        </div>
    );
};

// ─── Modal overlay ────────────────────────────────────────────────────────────
const ModalOverlay = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
    <div
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
        {children}
    </div>
);

// ─── Form field ───────────────────────────────────────────────────────────────
const FormField = ({ label, required, error, children }: {
    label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyPdpPage() {
    const { t, i18n } = useTranslation();
    const { user, hasPermission } = useAuth();
    const isAdmin = user?.userRole === 'SchoolAdmin' && hasPermission('ViewMyPDP');
    const isTeacher = user?.userRole === 'Teacher' && hasPermission('ViewMyPDP');

    // List state
    const [assessments, setAssessments] = useState<MyPdpAssessmentList[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSession, setFilterSession] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Reference data
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [detailData, setDetailData] = useState<MyPdpAssessmentDetail | null>(null);
    const [exporting, setExporting] = useState<'word' | 'pdf' | null>(null);

    // Form state
    const [formTeacher, setFormTeacher] = useState(0);
    const [formClass, setFormClass] = useState(0);
    const [formSubject, setFormSubject] = useState('');
    const [formYear, setFormYear] = useState(0);
    const [formSession, setFormSession] = useState<SessionType>('PENCERAPAN PERTAMA');
    const [formDate, setFormDate] = useState('');
    const [formUlasan, setFormUlasan] = useState('');
    const [scoreItems, setScoreItems] = useState<MyPdpScoreItem[]>(buildDefaultScoreItems());
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // ── Load list ────────────────────────────────────────────────────────────
    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const params: { academicYearId?: number; sessionType?: string } = {};
            if (filterYear) params.academicYearId = Number(filterYear);
            if (filterSession) params.sessionType = filterSession;
            const data = await myPdpService.getAll(params);
            setAssessments(data.items ?? []);
        } catch {
            showToast(t('mypdp.errors.loadFailed'), 'error');
        } finally {
            setLoading(false);
        }
    }, [filterYear, filterSession, t]);

    useEffect(() => { loadList(); }, [loadList]);

    // ── Load reference data once ─────────────────────────────────────────────
    useEffect(() => {
        const loadRef = async () => {
            try {
                const [tc, yearData] = await Promise.all([
                    teacherService.getAllTeachers(true),
                    api.get('/academic-year').then(r => r.data.data as AcademicYear[]),
                ]);
                setTeachers(Array.isArray(tc) ? tc : []);
                setAcademicYears(Array.isArray(yearData) ? yearData : []);
                const active = (Array.isArray(yearData) ? yearData : [])
                    .find((y: AcademicYear) => y.isActive) ?? null;
                setActiveYear(active);
                if (active) {
                    const classData = await api
                        .get(`/class?academicYearId=${active.academicYearID}`)
                        .then(r => r.data.data as ClassItem[]);
                    setClasses(Array.isArray(classData) ? classData : []);
                }
            } catch { /* non-critical */ }
        };
        loadRef();
    }, []);

    // ── Toast ────────────────────────────────────────────────────────────────
    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Filter list ──────────────────────────────────────────────────────────
    const filtered = assessments.filter(a => {
        const q = search.toLowerCase();
        return !q ||
            (a.teacherName ?? '').toLowerCase().includes(q) ||
            (a.subject ?? '').toLowerCase().includes(q) ||
            (a.className ?? '').toLowerCase().includes(q);
    });

    // ── Open modals ──────────────────────────────────────────────────────────
    const openCreate = () => {
        setFormTeacher(0); setFormClass(0); setFormSubject('');
        setFormYear(activeYear?.academicYearID ?? 0);
        // Teacher always creates PERTAMA; Admin creates KEDUA by default
        setFormSession(isTeacher ? 'PENCERAPAN PERTAMA' : 'PENCERAPAN KEDUA');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormUlasan('');
        setScoreItems(buildDefaultScoreItems());
        setFormErrors({});
        setSelectedId(null);
        setModalMode('create');
    };

    const openEdit = async (id: number) => {
        setSelectedId(id); setModalMode('edit'); setModalLoading(true);
        try {
            const d = await myPdpService.getById(id);
            setDetailData(d);
            setFormTeacher(d.teacherID); setFormClass(d.classID);
            setFormSubject(d.subject); setFormYear(d.academicYearID);
            setFormSession(d.sessionType);
            setFormDate(d.assessmentDate.split('T')[0]);
            setFormUlasan(d.ulasan ?? '');
            setScoreItems(d.scoreItems.length > 0
                ? d.scoreItems
                : buildDefaultScoreItems());
            setFormErrors({});
        } catch {
            showToast(t('mypdp.errors.loadFailed'), 'error');
            setModalMode(null);
        } finally {
            setModalLoading(false);
        }
    };

    const openView = async (id: number) => {
        setSelectedId(id); setModalMode('view'); setModalLoading(true);
        try {
            const d = await myPdpService.getById(id);
            setDetailData(d);
            setScoreItems(d.scoreItems);
        } catch {
            showToast(t('mypdp.errors.loadFailed'), 'error');
            setModalMode(null);
        } finally {
            setModalLoading(false);
        }
    };

    const openDelete = (id: number) => { setSelectedId(id); setModalMode('delete'); };

    const closeModal = () => {
        setModalMode(null); setSelectedId(null);
        setDetailData(null); setExporting(null);
    };

    // ── Validate ─────────────────────────────────────────────────────────────
    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formTeacher) errs.teacher = t('mypdp.errors.teacherRequired');
        if (!formClass) errs.class = t('mypdp.errors.classRequired');
        if (!formSubject) errs.subject = t('mypdp.errors.subjectRequired');
        if (!formYear) errs.year = t('mypdp.errors.yearRequired');
        if (!formDate) errs.date = t('mypdp.errors.dateRequired');
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Score change ─────────────────────────────────────────────────────────
    const handleScoreChange = (itemCode: string, score: number) => {
        setScoreItems(prev => prev.map(s =>
            s.itemCode === itemCode ? { ...s, score } : s
        ));
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const dto = {
                teacherID: formTeacher,
                classID: formClass,
                subject: formSubject,
                academicYearID: formYear,
                sessionType: formSession,
                assessmentDate: formDate,
                ulasan: formUlasan || undefined,
                scoreItems,
            };
            if (modalMode === 'create') {
                await myPdpService.create(dto);
                showToast(t('mypdp.success.created'), 'success');
            } else if (selectedId) {
                await myPdpService.update(selectedId, { ...dto, assessmentID: selectedId });
                showToast(t('mypdp.success.updated'), 'success');
            }
            closeModal();
            loadList();
        } catch {
            showToast(t('mypdp.errors.saveFailed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await myPdpService.delete(selectedId);
            showToast(t('mypdp.success.deleted'), 'success');
            closeModal(); loadList();
        } catch {
            showToast(t('mypdp.errors.deleteFailed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Export ────────────────────────────────────────────────────────────────
    const handleExport = async (format: 'word' | 'pdf') => {
        if (!detailData) return;
        setExporting(format);
        try {
            const name = `MyPDP_${detailData.teacherName?.replace(/\s+/g, '-')}_${detailData.sessionType.replace('PENCERAPAN ', '')}_${detailData.assessmentDate.split('T')[0]}`;
            if (format === 'word') await myPdpService.exportWord(detailData.assessmentID, `${name}.docx`);
            else await myPdpService.exportPdf(detailData.assessmentID, `${name}.pdf`);
            showToast(t('mypdp.success.exported'), 'success');
        } catch {
            showToast(t('mypdp.errors.exportFailed'), 'error');
        } finally {
            setExporting(null);
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-blue-600 shrink-0" />
                        {t('mypdp.title')}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t('mypdp.subtitle')}</p>
                </div>
                {(isAdmin || isTeacher) && (
                    <button onClick={openCreate}
                        className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            {isTeacher ? t('mypdp.selfAssess') : t('mypdp.newAssessment')}
                        </span>
                        <span className="sm:hidden">{t('common.add')}</span>
                    </button>
                )}
            </div>

            {/* Search + Filter bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('mypdp.searchPlaceholder')}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors
                        ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.filter')}</span>
                </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('mypdp.fields.academicYear')}</label>
                        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">{t('common.all')}</option>
                            {academicYears.map(y => <option key={y.academicYearID} value={y.academicYearID}>{y.yearName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('mypdp.fields.sessionType')}</label>
                        <select value={filterSession} onChange={e => setFilterSession(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">{t('common.all')}</option>
                            {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Stats row */}
            {!loading && assessments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {(Object.entries(RATING_CONFIG) as [RatingType, typeof RATING_CONFIG[RatingType]][]).map(([key, cfg]) => {
                        const count = assessments.filter(a => a.rating === key).length;
                        return (
                            <div key={key} className={`${cfg.bg} rounded-xl p-3 flex flex-col gap-0.5`}>
                                <span className={`text-xl font-bold ${cfg.color}`}>{count}</span>
                                <span className={`text-xs font-medium ${cfg.color} opacity-80`}>{cfg.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><LoadingSpinner /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">{t('mypdp.noAssessments')}</p>
                        {(isAdmin || isTeacher) && <p className="text-sm mt-1">{t('mypdp.noAssessmentsHint')}</p>}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {[t('mypdp.fields.teacher'), t('mypdp.fields.sessionType'),
                                        t('mypdp.fields.subject'), t('mypdp.fields.class'),
                                        t('mypdp.fields.academicYear'), t('mypdp.fields.totalScore'),
                                        t('mypdp.fields.rating'), t('common.actions')
                                        ].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(a => (
                                        <tr key={a.assessmentID} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{a.teacherName}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                                    {a.sessionType.replace('PENCERAPAN ', '')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{a.subject}</td>
                                            <td className="px-4 py-3 text-gray-600">{a.className}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                {a.academicYear}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-800">{a.totalScore.toFixed(2)}%</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <RatingBadge rating={a.rating} />
                                                    {a.isLocked && a.sessionType === 'PENCERAPAN PERTAMA' && (
                                                        <span title="Locked"><Lock className="w-3.5 h-3.5 text-gray-400" /></span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openView(a.assessmentID)}
                                                        className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors" title={t('common.view')}>
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {/* Edit: admin edits own records; teacher edits own unlocked PERTAMA */}
                                                    {((isAdmin && a.createdByName === user?.username) ||
                                                        (isTeacher && a.sessionType === 'PENCERAPAN PERTAMA' && !a.isLocked)) && (
                                                            <button onClick={() => openEdit(a.assessmentID)}
                                                                className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors" title={t('common.edit')}>
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    {/* Delete: same rules as edit */}
                                                    {((isAdmin && a.createdByName === user?.username) ||
                                                        (isTeacher && a.sessionType === 'PENCERAPAN PERTAMA' && !a.isLocked)) && (
                                                            <button onClick={() => openDelete(a.assessmentID)}
                                                                className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title={t('common.delete')}>
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

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filtered.map(a => {
                                const canEditDelete =
                                    (isAdmin && a.createdByName === user?.username) ||
                                    (isTeacher && a.sessionType === 'PENCERAPAN PERTAMA' && !a.isLocked);
                                return (
                                    <div key={a.assessmentID} className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{a.teacherName}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{a.subject} · {a.className}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <RatingBadge rating={a.rating} />
                                                {a.isLocked && a.sessionType === 'PENCERAPAN PERTAMA' && (
                                                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                {a.sessionType.replace('PENCERAPAN ', '')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {a.academicYear}
                                            </span>
                                            <span className="text-xs font-bold text-gray-800 ml-auto">
                                                {a.totalScore.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <button onClick={() => openView(a.assessmentID)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                                <Eye className="w-3.5 h-3.5" />{t('common.view')}
                                            </button>
                                            {canEditDelete && <>
                                                <button onClick={() => openEdit(a.assessmentID)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors">
                                                    <Edit className="w-3.5 h-3.5" />{t('common.edit')}
                                                </button>
                                                <button onClick={() => openDelete(a.assessmentID)}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ── CREATE / EDIT MODAL ───────────────────────────────────────── */}
            {(modalMode === 'create' || modalMode === 'edit') && (
                <ModalOverlay onClose={closeModal}>
                    <div className="bg-white w-full sm:rounded-2xl sm:max-w-4xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-semibold text-gray-900">
                                {modalMode === 'create' ? t('mypdp.createTitle') : t('mypdp.editTitle')}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {modalLoading ? (
                            <div className="flex justify-center py-16"><LoadingSpinner /></div>
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                {/* Score summary (sticky) */}
                                <ScoreSummaryBar scoreItems={scoreItems} />

                                <div className="p-5 space-y-4">
                                    {/* Basic info grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Teacher field: Admin selects any teacher; Teacher sees own name (read-only) */}
                                        <div className="sm:col-span-2">
                                            {isAdmin ? (
                                                <FormField label={t('mypdp.fields.teacher')} required error={formErrors.teacher}>
                                                    <select value={formTeacher || ''}
                                                        onChange={e => setFormTeacher(Number(e.target.value))}
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                        <option value="">{t('mypdp.placeholders.teacher')}</option>
                                                        {teachers.map(tc => (
                                                            <option key={tc.teacherID} value={tc.teacherID}>
                                                                {tc.fullName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormField>
                                            ) : (
                                                <FormField label={t('mypdp.fields.teacher')} required>
                                                    <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 flex items-center gap-2 text-gray-700">
                                                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                        <span className="font-medium">{user?.fullName ?? user?.username}</span>
                                                    </div>
                                                </FormField>
                                            )}
                                        </div>

                                        {/* Subject — SUBJECTS dropdown, trilingual */}
                                        <FormField label={t('mypdp.fields.subject')} required error={formErrors.subject}>
                                            <select value={formSubject}
                                                onChange={e => setFormSubject(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">{t('mypdp.placeholders.subject')}</option>
                                                {SUBJECTS.map(s => (
                                                    <option key={s.value} value={s.value}>
                                                        {getSubjectLabel(s, i18n.language)}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>

                                        {/* Class — active year only */}
                                        <FormField label={t('mypdp.fields.class')} required error={formErrors.class}>
                                            <select value={formClass || ''}
                                                onChange={e => setFormClass(Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">{t('mypdp.placeholders.class')}</option>
                                                {classes.map(c => <option key={c.classID} value={c.classID}>{c.className}</option>)}
                                            </select>
                                        </FormField>

                                        {/* Academic Year — read-only badge (same as PencerapanPage) */}
                                        <FormField label={t('mypdp.fields.academicYear')} required>
                                            <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 flex items-center gap-2 text-gray-700">
                                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                <span className="font-medium">
                                                    {modalMode === 'create'
                                                        ? (activeYear?.yearName ?? '-')
                                                        : (academicYears.find(y => y.academicYearID === formYear)?.yearName ?? '-')}
                                                </span>
                                            </div>
                                        </FormField>

                                        {/* Session Type — Teacher: fixed PERTAMA; Admin: KEDUA/KETIGA */}
                                        <FormField label={t('mypdp.fields.sessionType')} required>
                                            {isTeacher ? (
                                                <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 flex items-center gap-2 text-gray-700">
                                                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                                                    <span className="font-medium">PENCERAPAN PERTAMA</span>
                                                </div>
                                            ) : (
                                                <select value={formSession}
                                                    onChange={e => setFormSession(e.target.value as SessionType)}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                    {SESSION_TYPES_ADMIN.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            )}
                                        </FormField>

                                        <FormField label={t('mypdp.fields.date')} required error={formErrors.date}>
                                            <input type="date" value={formDate}
                                                onChange={e => setFormDate(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </FormField>
                                    </div>

                                    {/* Scoring sections */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">{t('mypdp.scoring')}</p>
                                        <div className="space-y-2">
                                            {STANDARDS.map((std, i) => (
                                                <StandardSection
                                                    key={std.code}
                                                    std={std}
                                                    scoreItems={scoreItems}
                                                    onChange={handleScoreChange}
                                                    readonly={false}
                                                    defaultOpen={i === 0}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ulasan */}
                                    <FormField label={t('mypdp.fields.ulasan')}>
                                        <textarea value={formUlasan}
                                            onChange={e => setFormUlasan(e.target.value)}
                                            rows={3}
                                            placeholder={t('mypdp.placeholders.ulasan')}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                            <button onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving ? <><LoadingSpinner />{t('common.saving')}</> : t('common.save')}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ── VIEW MODAL ─────────────────────────────────────────────────── */}
            {modalMode === 'view' && (
                <ModalOverlay onClose={closeModal}>
                    <div className="bg-white w-full sm:rounded-2xl sm:max-w-4xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-semibold text-gray-900">{t('mypdp.viewTitle')}</h2>
                            <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {modalLoading ? (
                            <div className="flex justify-center py-16"><LoadingSpinner /></div>
                        ) : detailData && (
                            <>
                                <div className="flex-1 overflow-y-auto">
                                    {/* Score summary */}
                                    <ScoreSummaryBar scoreItems={scoreItems} />

                                    <div className="p-5 space-y-4">
                                        {/* Info cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: t('mypdp.fields.teacher'), value: detailData.teacherName },
                                                { label: t('mypdp.fields.subject'), value: detailData.subject },
                                                { label: t('mypdp.fields.class'), value: detailData.className },
                                                { label: t('mypdp.fields.sessionType'), value: detailData.sessionType.replace('PENCERAPAN ', '') },
                                                { label: t('mypdp.fields.date'), value: new Date(detailData.assessmentDate).toLocaleDateString('en-GB') },
                                                { label: t('mypdp.fields.academicYear'), value: detailData.academicYear },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="bg-gray-50 rounded-xl p-3">
                                                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                                    <p className="text-sm font-medium text-gray-900 truncate">{value ?? '—'}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Standard scores summary */}
                                        <div className="space-y-1.5">
                                            {STANDARDS.map(std => {
                                                const score = calcStandardScore(scoreItems, std.code, std.weight);
                                                return (
                                                    <div key={std.code} className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-500 w-10 shrink-0">{std.code}</span>
                                                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="h-2 rounded-full bg-blue-500 transition-all"
                                                                style={{ width: `${(score / std.weight) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-700 w-14 text-right shrink-0">
                                                            {score.toFixed(2)}%/{std.weight}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Scoring detail (read-only) */}
                                        <div className="space-y-2">
                                            {STANDARDS.map(std => (
                                                <StandardSection
                                                    key={std.code}
                                                    std={std}
                                                    scoreItems={scoreItems}
                                                    onChange={() => { }}
                                                    readonly
                                                />
                                            ))}
                                        </div>

                                        {/* Ulasan */}
                                        {detailData.ulasan && (
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-xs font-semibold text-gray-500 mb-1">{t('mypdp.fields.ulasan')}</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailData.ulasan}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Export PDF button — SchoolAdmin + Teacher */}
                                {(isAdmin || isTeacher) && (
                                    <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                                        <button onClick={() => handleExport('pdf')} disabled={!!exporting}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-60">
                                            {exporting === 'pdf' ? <LoadingSpinner /> : <Download className="w-4 h-4" />}
                                            {t('mypdp.exportPdf')}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {/* ── DELETE MODAL ───────────────────────────────────────────────── */}
            {modalMode === 'delete' && (
                <ModalOverlay onClose={closeModal}>
                    <div className="bg-white w-full sm:rounded-2xl sm:max-w-md rounded-t-2xl shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('mypdp.deleteTitle')}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{t('mypdp.deleteConfirm')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={closeModal}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleDelete} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving ? <LoadingSpinner /> : <Trash2 className="w-4 h-4" />}
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}