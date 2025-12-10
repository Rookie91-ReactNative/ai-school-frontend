import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Calendar, /*Clock,*/ MapPin, Users, User, Mail, Phone,
    Edit, Trash2, /*Plus, CheckCircle, XCircle,*/ Award, /*AlertCircle,*/ Bell
} from 'lucide-react';
import {
    eventService,
    EventTypeLabels,
    EventStatusLabels,
    EventStatusColors,
    type EventWithDetails
} from '../../services/eventService';
import { ActivityTypeLabels, ActivityType } from '../../services/teamService';
import LoadingSpinner from '../Common/LoadingSpinner';
import ManageParticipantsModal from './ManageParticipantsModal';
import { getTranslatedActivityType } from '../../utils/activityTypeTranslations';
import { getTranslatedEventType } from '../../utils/eventTypeTranslations';

interface EventDetailsModalProps {
    eventId: number;
    onClose: () => void;
    onEdit: () => void;
}

const EventDetailsModal = ({ eventId, onClose, onEdit }: EventDetailsModalProps) => {
    const { t } = useTranslation();
    const [event, setEvent] = useState<EventWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isManageParticipantsOpen, setIsManageParticipantsOpen] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);

    useEffect(() => {
        loadEventDetails();
    }, [eventId]);

    const loadEventDetails = async () => {
        try {
            setLoading(true);
            const data = await eventService.getEventById(eventId);
            setEvent(data);
        } catch (error) {
            console.error('Error loading event details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveParticipant = async (participantId: number) => {
        if (!confirm(t('events.detailsModal.messages.confirmRemoveParticipant'))) return;

        try {
            await eventService.removeParticipant(participantId);
            await loadEventDetails();
        } catch (error) {
            console.error('Error removing participant:', error);
            alert(t('events.detailsModal.messages.errorRemovingParticipant'));
        }
    };

    const handleSendNotifications = async () => {
        if (!event) return;

        if (!confirm(t('events.detailsModal.messages.confirmSendNotifications', { count: event.totalParticipants }))) return;

        try {
            setSendingNotification(true);
            await eventService.sendParentNotifications(eventId);
            alert(t('events.detailsModal.messages.notificationsSent'));
            await loadEventDetails();
        } catch (error) {
            console.error('Error sending notifications:', error);
            alert(t('events.detailsModal.messages.errorSendingNotifications'));
        } finally {
            setSendingNotification(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-MY', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <p className="text-gray-600">{t('events.detailsModal.eventNotFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{event.eventName}</h2>
                                <p className="text-sm text-gray-500 mt-1">{event.eventCode}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={onEdit}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                {t('events.detailsModal.buttons.editEvent')}
                            </button>
                            <button
                                onClick={() => setIsManageParticipantsOpen(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                {t('events.detailsModal.buttons.manageParticipants')}
                            </button>
                            {event.requiresParentConsent && !event.parentNotificationSent && (
                                <button
                                    onClick={handleSendNotifications}
                                    disabled={sendingNotification}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:bg-orange-300"
                                >
                                    <Bell className="w-4 h-4" />
                                    {sendingNotification ? t('events.detailsModal.buttons.sending') : t('events.detailsModal.buttons.sendNotifications')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Status Badge */}
                        <div className="mb-6">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${EventStatusColors[event.status]}`}>
                                {EventStatusLabels[event.status]}
                            </span>
                        </div>

                        {/* Event Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.eventType')}</h3>
                                    <p className="text-gray-900">
                                        {getTranslatedEventType(EventTypeLabels[event.eventType], t) || `Unknown (${event.eventType})`}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.activityType')}</h3>
                                    <p className="text-gray-900">
                                        {getTranslatedActivityType(ActivityTypeLabels[event.activityType as ActivityType], t) || `Unknown Activity (${event.activityType})`}
                                    </p>
                                </div>

                                {event.team && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.team')}</h3>
                                        <p className="text-gray-900">{event.team.teamName}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t('events.detailsModal.labels.dateTime')}
                                    </h3>
                                    <p className="text-gray-900">{formatDate(event.eventDate)}</p>
                                    <p className="text-gray-600 text-sm">
                                        {formatTime(event.startTime)}
                                        {event.endTime && ` - ${formatTime(event.endTime)}`}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {t('events.detailsModal.labels.venue')}
                                    </h3>
                                    <p className="text-gray-900">{event.venue}</p>
                                    {event.venueAddress && (
                                        <p className="text-gray-600 text-sm">{event.venueAddress}</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {event.opponentSchool && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.opponentSchool')}</h3>
                                        <p className="text-gray-900">{event.opponentSchool}</p>
                                    </div>
                                )}

                                {event.organizer && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.organizer')}</h3>
                                        <p className="text-gray-900">{event.organizer}</p>
                                    </div>
                                )}

                                {/* ✅ UPDATED: Display multiple teachers */}
                                {event.teachers && event.teachers.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {event.teachers.length === 1
                                                ? t('events.detailsModal.labels.leadingTeacher')
                                                : `${t('events.detailsModal.labels.leadingTeacher')} (${event.teachers.length})`
                                            }
                                        </h3>
                                        <div className="space-y-3">
                                            {event.teachers.map((teacher) => (
                                                <div
                                                    key={teacher.teacherID}
                                                    className={`p-3 rounded-lg border ${teacher.isPrimary
                                                        ? 'bg-yellow-50 border-yellow-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-gray-900 font-medium">
                                                            {teacher.teacherName}
                                                        </p>
                                                        {teacher.isPrimary && (
                                                            <span
                                                                className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-medium"
                                                                title={t('events.detailsModal.labels.primaryTeacher') || 'Primary Teacher'}
                                                            >
                                                                ⭐ {t('events.detailsModal.labels.primary') || 'Primary'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        {teacher.teacherEmail && (
                                                            <a
                                                                href={`mailto:${teacher.teacherEmail}`}
                                                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                                            >
                                                                <Mail className="w-3 h-3" />
                                                                {teacher.teacherEmail}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ FALLBACK: Keep backward compatibility with old leadingTeacher field */}
                                {!event.teachers && event.leadingTeacher && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {t('events.detailsModal.labels.leadingTeacher')}
                                        </h3>
                                        <p className="text-gray-900">{event.leadingTeacher.fullName}</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <a href={`mailto:${event.leadingTeacher.email}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {event.leadingTeacher.email}
                                            </a>
                                            <a href={`tel:${event.leadingTeacher.phoneNumber}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {event.leadingTeacher.phoneNumber}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {event.requiresParentConsent && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.parentConsent')}</h3>
                                        <p className="text-gray-900">{t('events.detailsModal.labels.required')}</p>
                                        {event.parentNotificationSent && (
                                            <p className="text-green-600 text-sm mt-1">
                                                ✓ {t('events.detailsModal.labels.notificationsSentOn', { date: new Date(event.notificationSentDate!).toLocaleDateString() })}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Information */}
                        {(event.description || event.specialInstructions || event.transportationDetails || event.uniformRequirements) && (
                            <div className="border-t border-gray-200 pt-6 mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('events.detailsModal.sections.additionalInfo')}</h3>
                                <div className="space-y-4">
                                    {event.description && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.description')}</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                                        </div>
                                    )}

                                    {event.specialInstructions && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.specialInstructions')}</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{event.specialInstructions}</p>
                                        </div>
                                    )}

                                    {event.transportationDetails && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.transportation')}</h4>
                                            <p className="text-gray-700">{event.transportationDetails}</p>
                                        </div>
                                    )}

                                    {event.uniformRequirements && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.uniform')}</h4>
                                            <p className="text-gray-700">{event.uniformRequirements}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Results Section - Only show for completed events */}
                        {event.status === 3 && (event.result || event.awardsReceived) && (
                            <div className="border-t border-gray-200 pt-6 mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    {t('events.detailsModal.sections.results')}
                                </h3>
                                <div className="space-y-4">
                                    {event.result && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.result')}</h4>
                                            <p className="text-gray-900">{event.result}</p>
                                        </div>
                                    )}

                                    {event.awardsReceived && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('events.detailsModal.labels.awardsReceived')}</h4>
                                            <p className="text-gray-900">{event.awardsReceived}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Participants Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('events.detailsModal.sections.participants')} ({event.totalParticipants})
                                </h3>
                                <div className="flex gap-4 text-sm">
                                    {/*<span className="text-green-600">*/}
                                    {/*    <CheckCircle className="w-4 h-4 inline mr-1" />*/}
                                    {/*    {t('events.detailsModal.participantStats.attended')}: {event.attendedParticipants}*/}
                                    {/*</span>*/}
                                    {/*<span className="text-blue-600">*/}
                                    {/*    <CheckCircle className="w-4 h-4 inline mr-1" />*/}
                                    {/*    {t('events.detailsModal.participantStats.confirmed')}: {event.confirmedParticipants}*/}
                                    {/*</span>*/}
                                </div>
                            </div>

                            {event.participants && event.participants.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('events.detailsModal.table.student')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{/*{t('events.detailsModal.table.role')}*/}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{/*{t('events.detailsModal.table.status')}*/}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{/*{t('events.detailsModal.table.performance')}*/}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('events.detailsModal.table.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {event.participants.map((participant) => (
                                                <tr key={participant.participantID} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{participant.studentName}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {participant.studentCode} • {participant.grade} {participant.class}
                                                            </div>
                                                            {participant.isFromTeam && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    {t('events.detailsModal.table.team')}: {participant.teamName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {/*<div>*/}
                                                        {/*    <div className="text-sm text-gray-900">{participant.role}</div>*/}
                                                        {/*    {participant.position && (*/}
                                                        {/*        <div className="text-xs text-gray-500">{participant.position}</div>*/}
                                                        {/*    )}*/}
                                                        {/*</div>*/}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            {/*{participant.attendanceConfirmed ? (*/}
                                                            {/*    <span className="text-xs text-blue-600">✓ {t('events.detailsModal.status.confirmed')}</span>*/}
                                                            {/*) : (*/}
                                                            {/*    <span className="text-xs text-gray-400">○ {t('events.detailsModal.status.pending')}</span>*/}
                                                            {/*)}*/}
                                                            {/*{participant.parentConsentReceived ? (*/}
                                                            {/*    <span className="text-xs text-green-600">✓ {t('events.detailsModal.status.consent')}</span>*/}
                                                            {/*) : event.requiresParentConsent ? (*/}
                                                            {/*    <span className="text-xs text-orange-500">○ {t('events.detailsModal.status.noConsent')}</span>*/}
                                                            {/*) : null}*/}
                                                            {/*{participant.attended && (*/}
                                                            {/*    <span className="text-xs text-green-600 font-medium">✓ {t('events.detailsModal.status.attended')}</span>*/}
                                                            {/*)}*/}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {/*{participant.performance ? (*/}
                                                        {/*    <p className="text-sm text-gray-700">{participant.performance}</p>*/}
                                                        {/*) : (*/}
                                                        {/*    <span className="text-sm text-gray-400">-</span>*/}
                                                        {/*)}*/}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleRemoveParticipant(participant.participantID)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title={t('events.detailsModal.actions.remove')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <p>{t('events.detailsModal.noParticipants')}</p>
                                    <button
                                        onClick={() => setIsManageParticipantsOpen(true)}
                                        className="mt-4 text-blue-600 hover:text-blue-800"
                                    >
                                        {t('events.detailsModal.buttons.addParticipants')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Manage Participants Modal */}
            {isManageParticipantsOpen && (
                <ManageParticipantsModal
                    event={event}
                    onClose={() => setIsManageParticipantsOpen(false)}
                    onSuccess={() => {
                        setIsManageParticipantsOpen(false);
                        loadEventDetails();
                    }}
                />
            )}
        </>
    );
};

export default EventDetailsModal;