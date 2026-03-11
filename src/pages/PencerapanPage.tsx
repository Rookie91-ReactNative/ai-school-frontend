import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileText, Plus, Search, Filter, Download, Edit, Trash2,
    X, Upload, Image, Eye, CheckCircle,
    Clock, AlertCircle, Camera
} from 'lucide-react';
import {
    pencerapanService,
    type PencerapanSummary,
    type PencerapanDetail,
    type PencerapanPhoto,
    type PencerapanCreateDto,
    type PencerapanUpdateDto,
} from '../services/pencerapanService';
import { teacherService, type Teacher } from '../services/teacherService';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';

interface AcademicYear {
    academicYearID: number;
    yearName: string;
    isActive: boolean;
}

interface ClassItem {
    classID: number;
    className: string;
    isActive?: boolean;
}

type ModalMode = 'create' | 'edit' | 'detail' | 'delete' | null;

// ─── Subject list ──────────────────────────────────────────────────────────────
// value = Malay name  → saved to DB, printed in Word doc
// en/zh/ms = display label per UI language

interface SubjectOption { value: string; en: string; zh: string; ms: string; }

const SUBJECTS: SubjectOption[] = [
    { value: 'Bahasa Malaysia', en: 'Malay Language', zh: '国语', ms: 'Bahasa Malaysia' },
    { value: 'Bahasa Cina', en: 'Chinese Language', zh: '华文', ms: 'Bahasa Cina' },
    { value: 'Bahasa Inggeris', en: 'English Language', zh: '英文', ms: 'Bahasa Inggeris' },
    { value: 'Matematik', en: 'Mathematics', zh: '数学', ms: 'Matematik' },
    { value: 'Sains', en: 'Science', zh: '科学', ms: 'Sains' },
    { value: 'Pendidikan Islam', en: 'Islamic Education', zh: '伊斯兰教育', ms: 'Pendidikan Islam' },
    { value: 'Pendidikan Moral', en: 'Moral Education', zh: '道德教育', ms: 'Pendidikan Moral' },
    { value: 'Sejarah', en: 'History', zh: '历史', ms: 'Sejarah' },
    { value: 'Geografi', en: 'Geography', zh: '地理', ms: 'Geografi' },
    { value: 'Pendidikan Jasmani & Kesihatan', en: 'Physical & Health Education', zh: '体育与健康', ms: 'Pendidikan Jasmani & Kesihatan' },
    { value: 'Pendidikan Seni Visual', en: 'Visual Art Education', zh: '美术教育', ms: 'Pendidikan Seni Visual' },
    { value: 'Muzik', en: 'Music', zh: '音乐', ms: 'Muzik' },
    { value: 'Reka Bentuk & Teknologi', en: 'Design & Technology', zh: '设计与技术', ms: 'Reka Bentuk & Teknologi' },
    { value: 'Pendidikan Kesenian', en: 'Arts Education', zh: '艺术教育', ms: 'Pendidikan Kesenian' },
    { value: 'Teknologi Maklumat & Komunikasi', en: 'ICT', zh: '信息科技', ms: 'Teknologi Maklumat & Komunikasi' },
    { value: 'Sivik', en: 'Civic Studies', zh: '公民教育', ms: 'Sivik' },
];

// ─── 6 Fixed photo sections (matches Word report layout) ──────────────────────
// sortBase: photos in this section use sortOrder range [sortBase .. sortBase+99]
interface PhotoSection { key: string; label: string; sortBase: number; }

const PHOTO_SECTIONS: PhotoSection[] = [
    { key: 'erph', label: 'E RPH Guru', sortBase: 100 },
    { key: 'opem', label: 'Sudut OPEM', sortBase: 200 },
    { key: 'set_induksi', label: 'Set induksi – Power Point & I think', sortBase: 300 },
    { key: 'fasilitator', label: 'Guru sebagai fasilitator', sortBase: 400 },
    { key: 'aktiviti', label: 'Aktiviti kumpulan – perbincangan murid', sortBase: 500 },
    { key: 'pembentangan', label: 'Pembentangan murid', sortBase: 600 },
];

// Returns photos that belong to a given section (matched by caption)
const getSectionPhotos = (photos: PencerapanPhoto[], section: PhotoSection): PencerapanPhoto[] =>
    photos
        .filter(p => p.caption === section.label)
        .sort((a, b) => a.sortOrder - b.sortOrder);

const getSubjectLabel = (s: SubjectOption, lang: string): string => {
    if (lang.startsWith('zh')) return s.zh;
    if (lang.startsWith('ms') || lang.startsWith('my')) return s.ms;
    return s.en;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    Draft: 'bg-yellow-100 text-yellow-800',
    Finalized: 'bg-green-100 text-green-800',
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'}`}>
        {status === 'Finalized' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {status}
    </span>
);

const EMPTY_FORM: PencerapanCreateDto = {
    teacherID: 0,
    academicYearID: 0,
    classID: undefined,
    pencerapanNo: 1,
    subject: '',
    dateOfObservation: new Date().toISOString().split('T')[0],
    timeStart: '07:30',
    timeEnd: '08:30',
    preparedBy: '',
    status: 'Draft',
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PencerapanPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isTeacherRole = user?.userRole === 'Teacher';

    const [reports, setReports] = useState<PencerapanSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAcadYear, setFilterAcadYear] = useState<number | ''>('');
    const [filterTeacher, setFilterTeacher] = useState<number | ''>('');
    const [filterStatus, setFilterStatus] = useState<'Draft' | 'Finalized' | ''>('');
    const [showFilters, setShowFilters] = useState(false);

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedReport, setSelectedReport] = useState<PencerapanDetail | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<PencerapanCreateDto>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // Per-section uploading state: key = section.key, value = true while uploading
    const [sectionUploading, setSectionUploading] = useState<Record<string, boolean>>({});
    const [downloading, setDownloading] = useState(false);
    // One hidden file input per section, keyed by section.key
    const sectionFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => { loadDropdownData(); }, []);
    // loadReports is NOT called on mount here — loadDropdownData calls it directly
    // to ensure Teacher role's filterTeacher is resolved before the first fetch.
    useEffect(() => { loadReports(); }, [currentPage, filterAcadYear, filterTeacher, filterStatus]);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const loadDropdownData = async () => {
        try {
            const [teacherData, yearData] = await Promise.all([
                teacherService.getAllTeachers(true),
                api.get('/academic-year').then(r => r.data.data as AcademicYear[]),
            ]);
            setTeachers(teacherData);
            setAcademicYears(yearData);

            // Auto-filter by logged-in teacher's ID for Teacher role
            if (user?.userRole === 'Teacher') {
                const myTeacher = teacherData.find((tc: Teacher) => tc.userID === user.userId);
                if (myTeacher) {
                    // Set state for UI (filter display) and call loadReports directly
                    // with the resolved ID — avoids stale state race condition
                    setFilterTeacher(myTeacher.teacherID);
                    await loadReports(myTeacher.teacherID);
                    return; // loadReports already called, skip the call below
                }
            }
            // Non-teacher roles (or teacher with no linked account): load all
            await loadReports();

            // Find active year, then load classes for that year only
            // Backend ClassService already enforces IsActive=1 on the classes rows
            const active = yearData.find((y: AcademicYear) => y.isActive) ?? null;
            setActiveYear(active);
            if (active) {
                const classData = await api
                    .get(`/class?academicYearId=${active.academicYearID}`)
                    .then(r => r.data.data as ClassItem[]);
                setClasses(classData);
            }
        } catch (err) {
            console.error('Failed to load dropdown data', err);
        }
    };

    const loadReports = async (overrideTeacherID?: number) => {
        try {
            setLoading(true);
            const result = await pencerapanService.getReports({
                page: currentPage,
                pageSize: PAGE_SIZE,
                academicYearID: filterAcadYear || undefined,
                // Use override when called directly from loadDropdownData (avoids stale state)
                teacherID: overrideTeacherID ?? (filterTeacher || undefined),
                status: filterStatus || undefined,
            });
            setReports(result.items);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        } catch {
            showToast('error', t('pencerapan.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = searchTerm
        ? reports.filter(r =>
            (r.teacherName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.teacherFullName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.subject ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.className ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
        : reports;

    const clearFilters = () => { setFilterAcadYear(''); setFilterTeacher(''); setFilterStatus(''); setSearchTerm(''); setCurrentPage(1); };
    const hasActiveFilters = filterAcadYear !== '' || filterTeacher !== '' || filterStatus !== '';

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const openCreate = () => {
        setFormData({ ...EMPTY_FORM, academicYearID: activeYear?.academicYearID ?? 0 });
        setFormErrors({});
        setModalMode('create');
    };

    const openEdit = async (id: number) => {
        setModalLoading(true);
        setModalMode('edit');
        try {
            const detail = await pencerapanService.getReportById(id);
            setSelectedReport(detail);
            setFormData({
                teacherID: detail.teacherID,
                academicYearID: detail.academicYearID,
                classID: detail.classID,
                pencerapanNo: detail.pencerapanNo,
                subject: detail.subject,
                dateOfObservation: detail.dateOfObservation.split('T')[0],
                timeStart: detail.timeStart ?? '',
                timeEnd: detail.timeEnd ?? '',
                preparedBy: detail.preparedBy ?? '',
                status: detail.status,
            });
            setFormErrors({});
        } catch { showToast('error', t('pencerapan.errors.loadFailed')); setModalMode(null); }
        finally { setModalLoading(false); }
    };

    const openDetail = async (id: number) => {
        setModalLoading(true);
        setModalMode('detail');
        try {
            const detail = await pencerapanService.getReportById(id);
            setSelectedReport(detail);
        } catch { showToast('error', t('pencerapan.errors.loadFailed')); setModalMode(null); }
        finally { setModalLoading(false); }
    };

    const openDelete = (id: number) => { setDeletingId(id); setModalMode('delete'); };
    const closeModal = () => { setModalMode(null); setSelectedReport(null); setDeletingId(null); setFormErrors({}); };

    // ── Validation ────────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.teacherID) errors.teacherID = t('pencerapan.errors.teacherRequired');
        if (!formData.academicYearID) errors.academicYearID = t('pencerapan.errors.yearRequired');
        if (!formData.subject.trim()) errors.subject = t('pencerapan.errors.subjectRequired');
        if (!formData.dateOfObservation) errors.dateOfObservation = t('pencerapan.errors.dateRequired');
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (modalMode === 'create') {
                await pencerapanService.createReport(formData);
                showToast('success', t('pencerapan.success.created'));
            } else if (modalMode === 'edit' && selectedReport) {
                await pencerapanService.updateReport(selectedReport.reportID, { ...formData } as PencerapanUpdateDto);
                showToast('success', t('pencerapan.success.updated'));
            }
            closeModal(); loadReports();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast('error', msg ?? t('pencerapan.errors.saveFailed'));
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setDeleting(true);
        try {
            await pencerapanService.deleteReport(deletingId);
            showToast('success', t('pencerapan.success.deleted'));
            closeModal(); loadReports();
        } catch { showToast('error', t('pencerapan.errors.deleteFailed')); }
        finally { setDeleting(false); }
    };

    const handleDownload = async (report: PencerapanDetail) => {
        setDownloading(true);
        try {
            const safeName = (report.teacherName ?? 'report').replace(/\s+/g, '_');
            const dateStr = report.dateOfObservation.split('T')[0].replace(/-/g, '');
            await pencerapanService.downloadReport(report.reportID, `Pencerapan_${report.pencerapanLabel}_${safeName}_${dateStr}.docx`);
            showToast('success', t('pencerapan.success.downloaded'));
        } catch { showToast('error', t('pencerapan.errors.downloadFailed')); }
        finally { setDownloading(false); }
    };

    // ── Photos ────────────────────────────────────────────────────────────────

    const handlePhotoUpload = async (file: File, section: PhotoSection) => {
        if (!selectedReport) return;
        setSectionUploading(prev => ({ ...prev, [section.key]: true }));
        try {
            // sortOrder = sectionBase + number of photos already in this section
            const existing = getSectionPhotos(selectedReport.photos, section).length;
            const sortOrder = section.sortBase + existing;
            await pencerapanService.uploadPhoto(
                selectedReport.reportID, file, section.label, sortOrder
            );
            setSelectedReport(await pencerapanService.getReportById(selectedReport.reportID));
            showToast('success', t('pencerapan.success.photoUploaded'));
        } catch { showToast('error', t('pencerapan.errors.photoUploadFailed')); }
        finally { setSectionUploading(prev => ({ ...prev, [section.key]: false })); }
    };

    const handlePhotoDelete = async (photoId: number) => {
        if (!selectedReport) return;
        try {
            await pencerapanService.deletePhoto(selectedReport.reportID, photoId);
            setSelectedReport(await pencerapanService.getReportById(selectedReport.reportID));
            showToast('success', t('pencerapan.success.photoDeleted'));
        } catch { showToast('error', t('pencerapan.errors.photoDeleteFailed')); }
    };


    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-6">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                    ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-blue-600" />
                        {t('pencerapan.title')}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{t('pencerapan.subtitle')}</p>
                    {activeYear && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('pencerapan.fields.academicYear')}: <strong className="ml-0.5">{activeYear.yearName}</strong>
                        </p>
                    )}
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> {t('pencerapan.newReport')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: t('pencerapan.stats.total'), value: totalCount, color: 'blue' },
                    { label: t('pencerapan.stats.draft'), value: reports.filter(r => r.status === 'Draft').length, color: 'yellow' },
                    { label: t('pencerapan.stats.finalized'), value: reports.filter(r => r.status === 'Finalized').length, color: 'green' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                            <FileText className={`w-5 h-5 text-${stat.color}-600`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder={t('pencerapan.searchPlaceholder')} value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                            ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <Filter className="w-4 h-4" /> {t('common.filter')}
                        {hasActiveFilters && <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
                    </button>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                            <X className="w-4 h-4" /> {t('common.clear')}
                        </button>
                    )}
                </div>
                {showFilters && (
                    <div className={`grid gap-3 pt-2 border-t border-gray-100 ${isTeacherRole ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('pencerapan.fields.academicYear')}</label>
                            <select value={filterAcadYear}
                                onChange={e => { setFilterAcadYear(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">{t('common.all')}</option>
                                {academicYears.map(y => <option key={y.academicYearID} value={y.academicYearID}>{y.yearName}</option>)}
                            </select>
                        </div>
                        {!isTeacherRole && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('pencerapan.fields.teacher')}</label>
                                <select value={filterTeacher}
                                    onChange={e => { setFilterTeacher(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">{t('common.all')}</option>
                                    {teachers.map(tc => <option key={tc.teacherID} value={tc.teacherID}>{tc.fullName}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('pencerapan.fields.status')}</label>
                            <select value={filterStatus}
                                onChange={e => { setFilterStatus(e.target.value as 'Draft' | 'Finalized' | ''); setCurrentPage(1); }}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">{t('common.all')}</option>
                                <option value="Draft">Draft</option>
                                <option value="Finalized">Finalized</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><LoadingSpinner /></div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t('pencerapan.noReports')}</p>
                        <p className="text-sm mt-1">{t('pencerapan.noReportsHint')}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {[t('pencerapan.fields.teacher'), t('pencerapan.fields.academicYear'),
                                t('pencerapan.fields.pencerapanNo'), t('pencerapan.fields.subject'),
                                t('pencerapan.fields.date'), t('pencerapan.fields.class'),
                                t('pencerapan.fields.photos'), t('pencerapan.fields.status'), t('common.actions')
                                ].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredReports.map(report => (
                                <tr key={report.reportID} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{report.teacherFullName ?? report.teacherName ?? '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{report.academicYearName ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                            {report.pencerapanLabel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{report.subject}</td>
                                    <td className="px-4 py-3 text-gray-600">{new Date(report.dateOfObservation).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-3 text-gray-600">{report.className ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1 text-gray-600"><Camera className="w-3.5 h-3.5" />{report.photoCount}</span>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openDetail(report.reportID)} title={t('common.view')}
                                                className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => openEdit(report.reportID)} title={t('common.edit')}
                                                className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => openDelete(report.reportID)} title={t('common.delete')}
                                                className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && totalPages > 1 && (
                    <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                        <p className="text-xs text-gray-500">{t('pencerapan.showing', { count: filteredReports.length, total: totalCount })}</p>
                        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalCount} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
            {(modalMode === 'create' || modalMode === 'edit') && (
                <ModalOverlay onClose={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {modalMode === 'create' ? t('pencerapan.createTitle') : t('pencerapan.editTitle')}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                        {modalLoading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : (
                            <>
                                <div className="p-6 grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">

                                    {/* Teacher */}
                                    <div className="col-span-2">
                                        <FormField label={t('pencerapan.fields.teacher')} required error={formErrors.teacherID}>
                                            <select value={formData.teacherID || ''}
                                                onChange={e => setFormData(p => ({ ...p, teacherID: Number(e.target.value) }))}
                                                className={inputCls(!!formErrors.teacherID)}>
                                                <option value="">{t('pencerapan.placeholders.teacher')}</option>
                                                {teachers.map(tc => <option key={tc.teacherID} value={tc.teacherID}>{tc.fullName}</option>)}
                                            </select>
                                        </FormField>
                                    </div>

                                    {/* Academic Year — read-only badge (auto = active year) */}
                                    <FormField label={t('pencerapan.fields.academicYear')} required>
                                        <div className={`${inputCls(false)} bg-gray-50 flex items-center gap-2 text-gray-700`}>
                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="font-medium">
                                                {modalMode === 'create'
                                                    ? (activeYear?.yearName ?? '-')
                                                    : (academicYears.find(y => y.academicYearID === formData.academicYearID)?.yearName ?? '-')}
                                            </span>
                                        </div>
                                    </FormField>

                                    {/* Pencerapan No */}
                                    <FormField label={t('pencerapan.fields.pencerapanNo')} required>
                                        <select value={formData.pencerapanNo}
                                            onChange={e => setFormData(p => ({ ...p, pencerapanNo: Number(e.target.value) as 1 | 2 }))}
                                            className={inputCls(false)}>
                                            <option value={1}>Pertama (1)</option>
                                            <option value={2}>Kedua (2)</option>
                                        </select>
                                    </FormField>

                                    {/* Subject — trilingual dropdown */}
                                    <div className="col-span-2">
                                        <FormField label={t('pencerapan.fields.subject')} required error={formErrors.subject}>
                                            <select value={formData.subject}
                                                onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                                                className={inputCls(!!formErrors.subject)}>
                                                <option value="">{t('pencerapan.placeholders.subject')}</option>
                                                {SUBJECTS.map(s => (
                                                    <option key={s.value} value={s.value}>{getSubjectLabel(s, i18n.language)}</option>
                                                ))}
                                            </select>
                                        </FormField>
                                    </div>

                                    {/* Class — active year only, IsActive=1 enforced by backend */}
                                    <FormField label={t('pencerapan.fields.class')}>
                                        <select value={formData.classID || ''}
                                            onChange={e => setFormData(p => ({ ...p, classID: e.target.value ? Number(e.target.value) : undefined }))}
                                            className={inputCls(false)}>
                                            <option value="">{t('pencerapan.placeholders.class')}</option>
                                            {classes.map(c => <option key={c.classID} value={c.classID}>{c.className}</option>)}
                                        </select>
                                    </FormField>

                                    {/* Date */}
                                    <FormField label={t('pencerapan.fields.date')} required error={formErrors.dateOfObservation}>
                                        <input type="date" value={formData.dateOfObservation}
                                            onChange={e => setFormData(p => ({ ...p, dateOfObservation: e.target.value }))}
                                            className={inputCls(!!formErrors.dateOfObservation)} />
                                    </FormField>

                                    {/* Time Start */}
                                    <FormField label={t('pencerapan.fields.timeStart')}>
                                        <input type="time" value={formData.timeStart ?? ''}
                                            onChange={e => setFormData(p => ({ ...p, timeStart: e.target.value }))}
                                            className={inputCls(false)} />
                                    </FormField>

                                    {/* Time End */}
                                    <FormField label={t('pencerapan.fields.timeEnd')}>
                                        <input type="time" value={formData.timeEnd ?? ''}
                                            onChange={e => setFormData(p => ({ ...p, timeEnd: e.target.value }))}
                                            className={inputCls(false)} />
                                    </FormField>

                                    {/* Prepared By */}
                                    <FormField label={t('pencerapan.fields.preparedBy')}>
                                        <select value={formData.preparedBy ?? ''}
                                            onChange={e => setFormData(p => ({ ...p, preparedBy: e.target.value }))}
                                            className={inputCls(false)}>
                                            <option value="">{t('pencerapan.placeholders.preparedBy')}</option>
                                            {teachers.filter(tc => tc.isAdmin).map(tc => (
                                                <option key={tc.teacherID} value={tc.adminPosition ? `${tc.fullName} (${tc.adminPosition})` : tc.fullName}>
                                                    {tc.fullName}{tc.adminPosition ? ` (${tc.adminPosition})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>

                                    {/* Status */}
                                    <FormField label={t('pencerapan.fields.status')}>
                                        <select value={formData.status}
                                            onChange={e => setFormData(p => ({ ...p, status: e.target.value as 'Draft' | 'Finalized' }))}
                                            className={inputCls(false)}>
                                            <option value="Draft">Draft</option>
                                            <option value="Finalized">Finalized</option>
                                        </select>
                                    </FormField>
                                </div>

                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">{t('common.cancel')}</button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                                        {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
                                        {saving ? t('common.saving') : t('common.save')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {/* ── Detail Modal ─────────────────────────────────────────────────── */}
            {modalMode === 'detail' && (
                <ModalOverlay onClose={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {selectedReport ? `${t('pencerapan.detailTitle')} — ${selectedReport.pencerapanLabel}` : t('pencerapan.detailTitle')}
                                </h2>
                                {selectedReport && (
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {selectedReport.teacherFullName ?? selectedReport.teacherName}
                                        {selectedReport.academicYearName && ` · ${selectedReport.academicYearName}`}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedReport && (
                                    <button onClick={() => handleDownload(selectedReport)} disabled={downloading}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        <Download className="w-4 h-4" />
                                        {downloading ? t('pencerapan.downloading') : t('pencerapan.downloadWord')}
                                    </button>
                                )}
                                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        {modalLoading || !selectedReport ? (
                            <div className="flex justify-center py-16"><LoadingSpinner /></div>
                        ) : (
                            <div className="overflow-y-auto flex-1 p-6 space-y-6">
                                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
                                    <InfoItem label={t('pencerapan.fields.teacher')} value={selectedReport.teacherFullName ?? selectedReport.teacherName ?? '-'} />
                                    <InfoItem label={t('pencerapan.fields.subject')} value={selectedReport.subject} />
                                    <InfoItem label={t('pencerapan.fields.pencerapanNo')} value={selectedReport.pencerapanLabel} />
                                    <InfoItem label={t('pencerapan.fields.date')} value={new Date(selectedReport.dateOfObservation).toLocaleDateString('en-GB')} />
                                    <InfoItem label={t('pencerapan.fields.time')} value={selectedReport.timeRange ?? '-'} />
                                    <InfoItem label={t('pencerapan.fields.class')} value={selectedReport.className ?? '-'} />
                                    <InfoItem label={t('pencerapan.fields.academicYear')} value={selectedReport.academicYearName ?? '-'} />
                                    <InfoItem label={t('pencerapan.fields.preparedBy')} value={selectedReport.preparedBy ?? '-'} />
                                    <InfoItem label={t('pencerapan.fields.status')} value={<StatusBadge status={selectedReport.status} />} />
                                </div>

                                {/* ── 6 Fixed Photo Sections ────────────────── */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Image className="w-4 h-4 text-blue-500" />
                                        {t('pencerapan.photos.title')}
                                        <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
                                            {selectedReport.photos.length}
                                        </span>
                                    </h3>

                                    {PHOTO_SECTIONS.map((section, sIdx) => {
                                        const sectionPhotos = getSectionPhotos(selectedReport.photos, section);
                                        const isUploading = !!sectionUploading[section.key];
                                        return (
                                            <div key={section.key} className="border border-gray-200 rounded-xl overflow-hidden">
                                                {/* Section header */}
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                                                            {sIdx + 1}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-800">{section.label}</span>
                                                        {sectionPhotos.length > 0 && (
                                                            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5">
                                                                {sectionPhotos.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Upload button */}
                                                    <button
                                                        onClick={() => sectionFileRefs.current[section.key]?.click()}
                                                        disabled={isUploading}
                                                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                                    >
                                                        {isUploading
                                                            ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                                            : <Upload className="w-3 h-3" />}
                                                        {isUploading ? t('pencerapan.photos.uploading') : t('pencerapan.photos.upload')}
                                                    </button>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                                        className="hidden"
                                                        ref={el => { sectionFileRefs.current[section.key] = el; }}
                                                        onChange={e => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handlePhotoUpload(f, section);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </div>

                                                {/* Section photos */}
                                                <div className="p-3">
                                                    {sectionPhotos.length === 0 ? (
                                                        <div className="flex items-center gap-2 text-gray-400 py-3 justify-center text-sm">
                                                            <Camera className="w-4 h-4 opacity-40" />
                                                            <span>{t('pencerapan.photos.noPhotos')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {sectionPhotos.map(photo => (
                                                                <div key={photo.photoID} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                                                                    <img
                                                                        src={photo.blobStorageUrl}
                                                                        alt={section.label}
                                                                        className="w-full h-full object-cover"
                                                                        onError={e => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
                                                                    />
                                                                    {/* Delete overlay */}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <button
                                                                            onClick={() => handlePhotoDelete(photo.photoID)}
                                                                            className="p-1.5 bg-white rounded-lg hover:bg-red-50 transition-colors"
                                                                            title={t('common.delete')}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <p className="text-xs text-gray-400">{t('pencerapan.photos.hint')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
            {modalMode === 'delete' && (
                <ModalOverlay onClose={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('pencerapan.deleteTitle')}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{t('pencerapan.deleteConfirm')}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium">
                                {deleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Trash2 className="w-4 h-4" />}
                                {deleting ? t('common.deleting') : t('common.delete')}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        {children}
    </div>
);

const FormField = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="font-medium text-gray-800">{value ?? '-'}</p>
    </div>
);

const inputCls = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

export default PencerapanPage;