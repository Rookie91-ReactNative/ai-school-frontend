import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, Calendar, Filter, X, Globe, Building } from 'lucide-react';
import {
    eventService,
    EventTypeLabels,
    EventStatusLabels,
    EventMode,
    EventModeLabels,
    type EventWithDetails,
    type EventType,
    type EventStatus
} from '../services/eventService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import * as XLSX from 'xlsx';
import { getTranslatedEventType } from '../utils/eventTypeTranslations';

// Extended participant type to include gender
interface ParticipantWithGender {
    participantID: number;
    eventID: number;
    studentID: number;
    studentCode: string;
    studentName: string;
    gender?: string;
    grade: string;
    class: string;
    isFromTeam: boolean;
    teamName?: string;
    role: string;
    position?: string;
    attendanceConfirmed: boolean;
    parentConsentReceived: boolean;
    attended: boolean;
    performance?: string;
    remarks?: string;
}

const EventReportPage = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<EventWithDetails[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<EventWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedEventType, setSelectedEventType] = useState<EventType | ''>('');
    const [selectedStatus, setSelectedStatus] = useState<EventStatus | ''>('');
    const [showFilters, setShowFilters] = useState(false);

    // Sorting - ✅ UPDATED: Added new sort fields
    type SortField = 'primaryTeacher' | 'allTeachers' | 'studentName' | 'gender' | 'class' | 'eventName' | 'eventType' | 'eventMode' | 'remarks' | 'result' | 'achievement' | 'eventStartDate' | 'eventEndDate';
    type SortDirection = 'asc' | 'desc' | null;
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [events, startDate, endDate, selectedEventType, selectedStatus]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await eventService.getAllEvents();

            const eventsWithDetails = await Promise.all(
                data.map(event => eventService.getEventById(event.eventID))
            );

            setEvents(eventsWithDetails);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...events];

        if (startDate) {
            filtered = filtered.filter(e => new Date(e.eventDate) >= new Date(startDate));
        }

        if (endDate) {
            filtered = filtered.filter(e => new Date(e.eventDate) <= new Date(endDate));
        }

        if (selectedEventType !== '') {
            filtered = filtered.filter(e => e.eventType === selectedEventType);
        }

        if (selectedStatus !== '') {
            filtered = filtered.filter(e => e.status === selectedStatus);
        }

        setFilteredEvents(filtered);
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedEventType('');
        setSelectedStatus('');
    };

    // ✅ Helper function to get primary teacher name
    const getPrimaryTeacherName = (event: EventWithDetails): string => {
        const primaryTeacher = event.teachers?.find(t => t.isPrimary);
        if (primaryTeacher) return primaryTeacher.teacherName;
        if (event.teachers?.length > 0) return event.teachers[0].teacherName;
        return event.leadingTeacher?.fullName || '-';
    };

    // ✅ Helper function to get all teachers as comma-separated string
    const getAllTeachersString = (event: EventWithDetails): string => {
        if (event.teachers?.length > 0) {
            return event.teachers.map(t => t.teacherName).join(', ');
        }
        return event.leadingTeacher?.fullName || '-';
    };

    // ✅ Helper function to get translated event mode
    const getEventModeDisplay = (eventMode: EventMode): string => {
        const key = eventMode === EventMode.Online ? 'online' : 'offline';
        return t(`events.eventMode.${key}`) || EventModeLabels[eventMode] || (eventMode === EventMode.Online ? 'Online' : 'Offline');
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortDirection(null);
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortedEvents = () => {
        if (!sortField || !sortDirection) {
            return filteredEvents;
        }

        return [...filteredEvents].sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortField) {
                case 'primaryTeacher':
                    aValue = getPrimaryTeacherName(a);
                    bValue = getPrimaryTeacherName(b);
                    break;
                case 'allTeachers':
                    aValue = getAllTeachersString(a);
                    bValue = getAllTeachersString(b);
                    break;
                case 'studentName':
                    aValue = a.participants[0]?.studentName || '';
                    bValue = b.participants[0]?.studentName || '';
                    break;
                case 'gender':
                    aValue = (a.participants[0] as ParticipantWithGender)?.gender || '';
                    bValue = (b.participants[0] as ParticipantWithGender)?.gender || '';
                    break;
                case 'class':
                    aValue = a.participants[0]?.class || '';
                    bValue = b.participants[0]?.class || '';
                    break;
                case 'eventName':
                    aValue = a.eventName;
                    bValue = b.eventName;
                    break;
                case 'eventType':
                    aValue = EventTypeLabels[a.eventType];
                    bValue = EventTypeLabels[b.eventType];
                    break;
                case 'eventMode':
                    aValue = a.eventMode ?? 0;
                    bValue = b.eventMode ?? 0;
                    break;
                case 'remarks':
                    aValue = a.remarks || '';
                    bValue = b.remarks || '';
                    break;
                case 'result':
                    aValue = a.result || '';
                    bValue = b.result || '';
                    break;
                case 'achievement':
                    aValue = a.awardsReceived || '';
                    bValue = b.awardsReceived || '';
                    break;
                case 'eventStartDate':
                    aValue = new Date(a.eventDate).getTime();
                    bValue = new Date(b.eventDate).getTime();
                    break;
                case 'eventEndDate':
                    aValue = a.endDate ? new Date(a.endDate).getTime() : new Date(a.eventDate).getTime();
                    bValue = b.endDate ? new Date(b.endDate).getTime() : new Date(b.eventDate).getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <span className="text-gray-400">⇅</span>;
        }
        return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
    };

    // ✅ UPDATED: Excel export with new columns
    const exportToExcel = () => {
        interface ExcelRow {
            [key: string]: string;
        }
        const excelData: ExcelRow[] = [];

        // ✅ UPDATED: Use translated headers with new columns
        const headers = {
            primaryTeacher: t('eventReport.excel.primaryTeacher') || 'Primary Teacher',
            allTeachers: t('eventReport.excel.allTeachers') || 'All Teachers',
            students: t('eventReport.excel.students'),
            gender: t('eventReport.excel.gender'),
            className: t('eventReport.excel.className'),
            eventName: t('eventReport.excel.eventName'),
            eventType: t('eventReport.excel.eventType'),
            eventMode: t('eventReport.excel.eventMode') || 'Event Mode',
            remarks: t('eventReport.excel.remarks'),
            results: t('eventReport.excel.results'),
            achievement: t('eventReport.excel.achievement'),
            eventStartDate: t('eventReport.excel.eventStartDate') || 'Event Start Date',
            eventEndDate: t('eventReport.excel.eventEndDate') || 'Event End Date'
        };

        filteredEvents.forEach(event => {
            event.participants.forEach((participant) => {
                const participantWithGender = participant as ParticipantWithGender;
                const row: ExcelRow = {};

                // ✅ NEW: Primary Teacher (for filtering)
                row[headers.primaryTeacher] = getPrimaryTeacherName(event);

                // ✅ NEW: All Teachers (for reference)
                row[headers.allTeachers] = getAllTeachersString(event);

                row[headers.students] = participant.studentName;
                row[headers.gender] = participantWithGender.gender || '-';
                row[headers.className] = participant.class;
                row[headers.eventName] = event.eventName;
                row[headers.eventType] = getTranslatedEventType(EventTypeLabels[event.eventType], t);

                // ✅ NEW: Event Mode
                row[headers.eventMode] = getEventModeDisplay(event.eventMode);

                row[headers.remarks] = event.remarks || '-';
                row[headers.results] = event.result || '-';
                row[headers.achievement] = event.awardsReceived || '-';

                // ✅ UPDATED: Event Start Date (renamed from Event Date)
                row[headers.eventStartDate] = new Date(event.eventDate).toLocaleDateString();

                // ✅ NEW: Event End Date
                row[headers.eventEndDate] = event.endDate
                    ? new Date(event.endDate).toLocaleDateString()
                    : new Date(event.eventDate).toLocaleDateString();

                excelData.push(row);
            });
        });

        const ws = XLSX.utils.json_to_sheet(excelData);

        // ✅ UPDATED: Set column widths for new columns
        ws['!cols'] = [
            { wch: 20 }, // Primary Teacher
            { wch: 35 }, // All Teachers
            { wch: 25 }, // Students
            { wch: 10 }, // Gender
            { wch: 15 }, // Class Name
            { wch: 30 }, // Event Name
            { wch: 20 }, // Event Type
            { wch: 12 }, // Event Mode
            { wch: 30 }, // Remarks
            { wch: 20 }, // Results
            { wch: 25 }, // Achievement
            { wch: 15 }, // Event Start Date
            { wch: 15 }, // Event End Date
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t('eventReport.excel.sheetName'));

        // Generate filename with date
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${t('eventReport.excel.filename')}_${dateStr}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 sm:h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('eventReport.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {t('eventReport.subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">{showFilters ? t('eventReport.buttons.hideFilters') : t('eventReport.buttons.showFilters')}</span>
                        <span className="sm:hidden">{showFilters ? t('eventReport.buttons.hideFilters') : t('eventReport.buttons.showFilters')}</span>
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('eventReport.buttons.exportExcel')}</span>
                        <span className="sm:hidden">{t('eventReport.buttons.exportExcel') || 'Export'}</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {t('eventReport.filters.startDate')}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {t('eventReport.filters.endDate')}
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {t('eventReport.filters.eventType')}
                            </label>
                            <select
                                value={selectedEventType}
                                onChange={(e) => setSelectedEventType(e.target.value === '' ? '' : Number(e.target.value) as EventType)}
                                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('eventReport.filters.allTypes')}</option>
                                {Object.entries(EventTypeLabels).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {getTranslatedEventType(label, t)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {t('eventReport.filters.status')}
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value === '' ? '' : Number(e.target.value) as EventStatus)}
                                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('eventReport.filters.allStatus')}</option>
                                {Object.entries(EventStatusLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 sm:mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 active:text-gray-900 text-sm"
                        >
                            <X className="w-4 h-4" />
                            {t('eventReport.buttons.clearFilters')}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-600">{t('eventReport.summary.totalEvents')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredEvents.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-600">{t('eventReport.summary.totalParticipants')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {filteredEvents.reduce((sum, e) => sum + e.participants.length, 0)}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-600">{t('eventReport.summary.dateRange')}</p>
                    <p className="text-sm sm:text-lg font-medium text-gray-900">
                        {startDate && endDate
                            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                            : t('eventReport.summary.allDates')}
                    </p>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Mobile hint */}
                <div className="sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex items-center gap-1">
                    <span>←</span>
                    {t('eventReport.swipeHint') || 'Scroll horizontally to see all columns'}
                    <span>→</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* ✅ NEW: Primary Teacher Column */}
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('primaryTeacher')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.primaryTeacher') || 'Primary Teacher'} {getSortIcon('primaryTeacher')}
                                    </div>
                                </th>
                                {/* ✅ NEW: All Teachers Column */}
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('allTeachers')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.allTeachers') || 'All Teachers'} {getSortIcon('allTeachers')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('studentName')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.students')} {getSortIcon('studentName')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('gender')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.gender')} {getSortIcon('gender')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('class')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.className')} {getSortIcon('class')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('eventName')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.eventName')} {getSortIcon('eventName')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('eventType')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.eventType')} {getSortIcon('eventType')}
                                    </div>
                                </th>
                                {/* ✅ NEW: Event Mode Column */}
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('eventMode')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.eventMode') || 'Event Mode'} {getSortIcon('eventMode')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('remarks')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.remarks')} {getSortIcon('remarks')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('result')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.results')} {getSortIcon('result')}
                                    </div>
                                </th>
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('achievement')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.achievement')} {getSortIcon('achievement')}
                                    </div>
                                </th>
                                {/* ✅ UPDATED: Event Start Date (renamed from Event Date) */}
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('eventStartDate')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.eventStartDate') || 'Start Date'} {getSortIcon('eventStartDate')}
                                    </div>
                                </th>
                                {/* ✅ NEW: Event End Date Column */}
                                <th
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 active:bg-gray-200 whitespace-nowrap"
                                    onClick={() => handleSort('eventEndDate')}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {t('eventReport.table.eventEndDate') || 'End Date'} {getSortIcon('eventEndDate')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-6 sm:py-8 text-center text-gray-500">
                                        <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm sm:text-base">{t('eventReport.noEventsFound')}</p>
                                    </td>
                                </tr>
                            ) : (
                                getSortedEvents().map(event => (
                                    event.participants.map((participant, index) => {
                                        const participantWithGender = participant as ParticipantWithGender;
                                        return (
                                            <tr key={`${event.eventID}-${participant.studentID}-${index}`} className="hover:bg-gray-50">
                                                {/* ✅ NEW: Primary Teacher */}
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {getPrimaryTeacherName(event)}
                                                </td>
                                                {/* ✅ NEW: All Teachers */}
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                                    <span className="max-w-xs truncate block" title={getAllTeachersString(event)}>
                                                        {getAllTeachersString(event)}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {participant.studentName}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {participantWithGender.gender || '-'}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {participant.class}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                                                    {event.eventName}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {getTranslatedEventType(EventTypeLabels[event.eventType], t)}
                                                </td>
                                                {/* ✅ NEW: Event Mode with badge */}
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${event.eventMode === EventMode.Online
                                                        ? 'bg-cyan-100 text-cyan-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {event.eventMode === EventMode.Online ? (
                                                            <Globe className="w-3 h-3" />
                                                        ) : (
                                                            <Building className="w-3 h-3" />
                                                        )}
                                                        <span className="hidden sm:inline">{getEventModeDisplay(event.eventMode)}</span>
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                                    {event.remarks || '-'}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                                                    {event.result || '-'}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                                                    {event.awardsReceived || '-'}
                                                </td>
                                                {/* ✅ UPDATED: Event Start Date */}
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {new Date(event.eventDate).toLocaleDateString()}
                                                </td>
                                                {/* ✅ NEW: Event End Date */}
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                    {event.endDate
                                                        ? new Date(event.endDate).toLocaleDateString()
                                                        : new Date(event.eventDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    table, table * {
                        visibility: visible;
                    }
                    table {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        size: landscape;
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    );
};

export default EventReportPage;