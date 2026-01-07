import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Calendar, Plus, Search, Filter, Eye, Edit, Trash2,
    MapPin, AlertCircle, /*Clock, Trophy, CheckCircle*/
} from 'lucide-react';
import {
    eventService,
    EventType,
    /*EventStatus,*/
    EventTypeLabels,
    //EventStatusLabels,
    //EventStatusColors,
    type ActivityEvent
} from '../services/eventService';
import { ActivityTypeLabels, ActivityType } from '../services/teamService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import AddEventModal from '../components/Events/AddEventModal';
import EditEventModal from '../components/Events/EditEventModal';
import EventDetailsModal from '../components/Events/EventDetailsModal';
// ✅ Import translation utilities
import { getTranslatedActivityType } from '../utils/activityTypeTranslations';
import { getTranslatedEventType } from '../utils/eventTypeTranslations';

const EventsPage = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventType, setSelectedEventType] = useState<EventType | 'All'>('All');
    /*const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'All'>('All');*/
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [viewEventId, setViewEventId] = useState<number | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [events, searchTerm, selectedEventType]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await eventService.getAllEvents();
            // Sort by date (newest first)
            data.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = [...events];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(event =>
                event.eventName.toLowerCase().includes(search) ||
                event.eventCode.toLowerCase().includes(search) ||
                event.venue.toLowerCase().includes(search) ||
                event.opponentSchool?.toLowerCase().includes(search)
            );
        }

        // Event type filter
        if (selectedEventType !== 'All') {
            filtered = filtered.filter(event => event.eventType === selectedEventType);
        }

        // Status filter
        //if (selectedStatus !== 'All') {
        //    filtered = filtered.filter(event => event.status === selectedStatus);
        //}

        setFilteredEvents(filtered);
        setCurrentPage(1);
    };

    const handleDeleteEvent = async (eventId: number) => {
        if (!confirm(t('events.messages.confirmDelete'))) return;

        try {
            await eventService.deleteEvent(eventId);
            await loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert(t('events.messages.errorDeleting'));
        }
    };

    const handleEditEvent = async (event: ActivityEvent) => {
        try {
            // ✅ Fetch full event details with ALL fields
            const fullEventDetails = await eventService.getEventById(event.eventID);

            // ✅ EventWithDetails extends ActivityEvent, so this is safe
            setSelectedEvent(fullEventDetails);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error loading event details:', error);
            alert(t('events.messages.errorLoadingDetails'));
        }
    };

    const formatDateRange = (startDate: string, endDate?: string) => {
        const start = new Date(startDate).toLocaleDateString('en-MY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        if (!endDate || startDate === endDate) {
            // Single day event
            return start;
        }

        // Multi-day event
        const end = new Date(endDate).toLocaleDateString('en-MY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        return `${start} - ${end}`;
    };

    //const formatDate = (dateString: string) => {
    //    return new Date(dateString).toLocaleDateString('en-MY', {
    //        day: '2-digit',
    //        month: 'short',
    //        year: 'numeric'
    //    });
    //};

    const formatTime = (timeString: string) => {
        // timeString is in format "HH:mm:ss"
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    //const isUpcoming = (eventDate: string) => {
    //    return new Date(eventDate) >= new Date();
    //};

    // Pagination
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    // Statistics
    //const stats = {
    //    total: events.length,
    //    upcoming: events.filter(e => isUpcoming(e.eventDate) && e.status !== EventStatus.Cancelled).length,
    //    completed: events.filter(e => e.status === EventStatus.Completed).length,
    //    confirmed: events.filter(e => e.status === EventStatus.Confirmed).length
    //};

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('events.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{t('events.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    {t('events.addEvent')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('events.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Event Type Filter - ✅ Now Translated */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={selectedEventType}
                            onChange={(e) => setSelectedEventType(e.target.value === 'All' ? 'All' : Number(e.target.value) as EventType)}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="All">{t('events.filters.allEventTypes')}</option>
                            {Object.entries(EventTypeLabels).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {getTranslatedEventType(label, t)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2 sm:col-span-2 md:col-span-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 py-2.5 sm:py-2 px-4 rounded-lg transition-colors ${viewMode === 'list'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                                }`}
                        >
                            {t('events.viewMode.list')}
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 py-2.5 sm:py-2 px-4 rounded-lg transition-colors ${viewMode === 'calendar'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                                }`}
                        >
                            {t('events.viewMode.calendar')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Events List */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {filteredEvents.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
                            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t('events.noEventsFound')}</h3>
                            <p className="text-sm sm:text-base text-gray-600">{t('events.noEventsHint')}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('events.table.event')}
                                            </th>
                                            <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('events.table.type')}
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('events.table.dateTime')}
                                            </th>
                                            <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('events.table.venue')}
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('events.table.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedEvents.map((event) => (
                                            <tr key={event.eventID} className="hover:bg-gray-50">
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-medium text-gray-900 text-sm sm:text-base">{event.eventName}</span>
                                                            {/* ✅ NEW: Multi-day indicator */}
                                                            {event.endDate && event.eventDate !== event.endDate && (
                                                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                    Multi-day
                                                                </span>
                                                            )}
                                                        </div>
                                                        {event.opponentSchool && (
                                                            <div className="text-xs sm:text-sm text-blue-600 mt-1">
                                                                vs {event.opponentSchool}
                                                            </div>
                                                        )}
                                                        {/* Mobile: Show type inline */}
                                                        <div className="sm:hidden text-xs text-gray-500 mt-1">
                                                            {getTranslatedEventType(EventTypeLabels[event.eventType], t)} • {getTranslatedActivityType(ActivityTypeLabels[event.activityType as ActivityType], t)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                                                    <div>
                                                        {/* ✅ Event Type - Now Translated */}
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {getTranslatedEventType(EventTypeLabels[event.eventType], t)}
                                                        </div>
                                                        {/* ✅ Activity Type - Now Translated */}
                                                        <div className="text-sm text-gray-500">
                                                            {getTranslatedActivityType(ActivityTypeLabels[event.activityType as ActivityType], t)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                        <div>
                                                            {/* ✅ UPDATED: Use formatDateRange instead of formatDate */}
                                                            <div className="text-gray-900">
                                                                {formatDateRange(event.eventDate, event.endDate)}
                                                            </div>
                                                            <div className="text-gray-500">
                                                                {formatTime(event.startTime)}
                                                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="text-gray-900">{event.venue}</div>
                                                            {event.venueAddress && (
                                                                <div className="text-gray-500 text-xs">{event.venueAddress}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex items-center gap-1 sm:gap-2">
                                                        <button
                                                            onClick={() => setViewEventId(event.eventID)}
                                                            className="p-1.5 sm:p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('events.actions.viewDetails')}
                                                        >
                                                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditEvent(event)}
                                                            className="p-1.5 sm:p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title={t('events.actions.edit')}
                                                        >
                                                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.eventID)}
                                                            className="p-1.5 sm:p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('events.actions.delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={filteredEvents.length}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {isAddModalOpen && (
                <AddEventModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        loadEvents();
                    }}
                />
            )}

            {isEditModalOpen && selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedEvent(null);
                    }}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedEvent(null);
                        loadEvents();
                    }}
                />
            )}

            {viewEventId && (
                <EventDetailsModal
                    eventId={viewEventId}
                    onClose={() => setViewEventId(null)}
                    onEdit={() => {
                        const event = events.find(e => e.eventID === viewEventId);
                        if (event) {
                            setViewEventId(null);
                            handleEditEvent(event);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default EventsPage;