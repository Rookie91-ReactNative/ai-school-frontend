import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, /*Printer,*/ Calendar, Filter, X } from 'lucide-react';
import {
    eventService,
    EventTypeLabels,
    EventStatusLabels,
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

    // Sorting
    type SortField = 'leadingTeacher' | 'studentName' | 'gender' | 'class' | 'eventName' | 'eventType' | 'remarks' | 'result' | 'achievement' | 'eventDate';
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
                case 'leadingTeacher':
                    aValue = a.leadingTeacher?.fullName || '';
                    bValue = b.leadingTeacher?.fullName || '';
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
                case 'eventDate':
                    aValue = new Date(a.eventDate).getTime();
                    bValue = new Date(b.eventDate).getTime();
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

    const exportToExcel = () => {
        interface ExcelRow {
            [key: string]: string;
        }
        const excelData: ExcelRow[] = [];

        // Use translated headers
        const headers = {
            leadingTeacher: t('eventReport.excel.leadingTeacher'),
            students: t('eventReport.excel.students'),
            gender: t('eventReport.excel.gender'),
            className: t('eventReport.excel.className'),
            eventName: t('eventReport.excel.eventName'),
            eventType: t('eventReport.excel.eventType'),
            remarks: t('eventReport.excel.remarks'),
            results: t('eventReport.excel.results'),
            achievement: t('eventReport.excel.achievement'),
            eventDate: t('eventReport.excel.eventDate')
        };

        filteredEvents.forEach(event => {
            event.participants.forEach((participant) => {
                const participantWithGender = participant as ParticipantWithGender;
                const row: ExcelRow = {};
                row[headers.leadingTeacher] = event.leadingTeacher?.fullName || '-';
                row[headers.students] = participant.studentName;
                row[headers.gender] = participantWithGender.gender || '-';
                row[headers.className] = participant.class;
                row[headers.eventName] = event.eventName;
                row[headers.eventType] = getTranslatedEventType(EventTypeLabels[event.eventType], t);
                row[headers.remarks] = event.remarks || '-';
                row[headers.results] = event.result || '-';
                row[headers.achievement] = event.awardsReceived || '-';
                row[headers.eventDate] = new Date(event.eventDate).toLocaleDateString();
                excelData.push(row);
            });
        });

        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // Leading Teacher
            { wch: 25 }, // Students
            { wch: 10 }, // Gender
            { wch: 15 }, // Class Name
            { wch: 30 }, // Event Name
            { wch: 20 }, // Event Type
            { wch: 30 }, // Remarks
            { wch: 20 }, // Results
            { wch: 25 }, // Achievement
            { wch: 15 }, // Event Date
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t('eventReport.excel.sheetName'));

        // Generate filename with date
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${t('eventReport.excel.filename')}_${dateStr}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    //const handlePrint = () => {
    //    window.print();
    //};

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('eventReport.title')}</h1>
                    <p className="text-gray-600 mt-1">
                        {t('eventReport.subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? t('eventReport.buttons.hideFilters') : t('eventReport.buttons.showFilters')}
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FileDown className="w-4 h-4" />
                        {t('eventReport.buttons.exportExcel')}
                    </button>
                    {/*<button*/}
                    {/*    onClick={handlePrint}*/}
                    {/*    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 print:hidden"*/}
                    {/*>*/}
                    {/*    <Printer className="w-4 h-4" />*/}
                    {/*    {t('eventReport.buttons.print')}*/}
                    {/*</button>*/}
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('eventReport.filters.startDate')}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('eventReport.filters.endDate')}
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('eventReport.filters.eventType')}
                            </label>
                            <select
                                value={selectedEventType}
                                onChange={(e) => setSelectedEventType(e.target.value === '' ? '' : Number(e.target.value) as EventType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('eventReport.filters.allTypes')}</option>
                                {Object.entries(EventTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {getTranslatedEventType(label, t)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('eventReport.filters.status')}
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value === '' ? '' : Number(e.target.value) as EventStatus)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('eventReport.filters.allStatus')}</option>
                                {Object.entries(EventStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                            {t('eventReport.buttons.clearFilters')}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">{t('eventReport.summary.totalEvents')}</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredEvents.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">{t('eventReport.summary.totalParticipants')}</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {filteredEvents.reduce((sum, e) => sum + e.totalParticipants, 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">{t('eventReport.summary.dateRange')}</p>
                        <p className="text-sm font-medium text-gray-900">
                            {startDate && endDate
                                ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                                : t('eventReport.summary.allDates')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('leadingTeacher')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.leadingTeacher')} {getSortIcon('leadingTeacher')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('studentName')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.students')} {getSortIcon('studentName')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('gender')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.gender')} {getSortIcon('gender')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('class')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.className')} {getSortIcon('class')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('eventName')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.eventName')} {getSortIcon('eventName')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('eventType')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.eventType')} {getSortIcon('eventType')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('remarks')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.remarks')} {getSortIcon('remarks')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('result')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.results')} {getSortIcon('result')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('achievement')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.achievement')} {getSortIcon('achievement')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('eventDate')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('eventReport.table.eventDate')} {getSortIcon('eventDate')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                        <p>{t('eventReport.noEventsFound')}</p>
                                    </td>
                                </tr>
                            ) : (
                                getSortedEvents().map(event => (
                                    event.participants.map((participant, index) => {
                                        const participantWithGender = participant as ParticipantWithGender;
                                        return (
                                            <tr key={`${event.eventID}-${participant.studentID}-${index}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {event.leadingTeacher?.fullName || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {participant.studentName}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {participantWithGender.gender || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {participant.class}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {event.eventName}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {getTranslatedEventType(EventTypeLabels[event.eventType], t)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {event.remarks || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {event.result || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {event.awardsReceived || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                    {new Date(event.eventDate).toLocaleDateString()}
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