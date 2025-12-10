import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle, Lock, Users, Star } from 'lucide-react';
import {
    eventService,
    EventType,
    /*EventStatus,*/
    EventTypeLabels,
    /*EventStatusLabels,*/
    type EventUpdateDto,
    type ActivityEvent
} from '../../services/eventService';
import { ActivityType, ActivityTypeLabels } from '../../services/teamService';
import { teacherService, type Teacher } from '../../services/teacherService';
import { getTranslatedActivityType } from '../../utils/activityTypeTranslations';
import { getTranslatedEventType } from '../../utils/eventTypeTranslations';
import { useAuth } from '../../hooks/useAuth';

interface EditEventModalProps {
    event: ActivityEvent;
    onClose: () => void;
    onSuccess: () => void;
}

// ✅ Define proper types for axios error
interface ApiErrorResponse {
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
}

interface AxiosErrorResponse {
    response?: {
        data?: ApiErrorResponse;
        status?: number;
    };
}

// Helper function to format time from "HH:MM:SS" to "HH:MM"
const formatTimeForInput = (time: string | undefined): string => {
    if (!time) return '';
    // If time is already in HH:MM format, return as is
    if (time.length === 5) return time;
    // If time is in HH:MM:SS format, remove seconds
    if (time.length === 8) return time.substring(0, 5);
    return time;
};

const EditEventModal = ({ event, onClose, onSuccess }: EditEventModalProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // ✅ NEW: State for multiple teachers
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
    const [primaryTeacherId, setPrimaryTeacherId] = useState<number | null>(null);
    const [isLoadingEventDetails, setIsLoadingEventDetails] = useState(true);

    // Track if the current user is a teacher
    const [currentUserTeacherId, setCurrentUserTeacherId] = useState<number | null>(null);
    const isTeacherRole = user?.userRole === 'Teacher';

    // Format times properly for HTML time inputs
    const [formData, setFormData] = useState<EventUpdateDto>({
        eventName: event.eventName,
        eventCode: event.eventCode,
        eventType: event.eventType,
        activityType: event.activityType,
        status: event.status,
        eventDate: event.eventDate.split('T')[0],
        startTime: formatTimeForInput(event.startTime),
        endTime: formatTimeForInput(event.endTime),
        venue: event.venue,
        venueAddress: event.venueAddress,
        organizer: event.organizer,
        opponentSchool: event.opponentSchool,
        transportationDetails: event.transportationDetails,
        uniformRequirements: event.uniformRequirements,
        description: event.description,
        specialInstructions: event.specialInstructions,
        requiresParentConsent: event.requiresParentConsent,  // ✅ IMPORTANT: Required field!
        teamID: event.teamID,
        result: event.result,
        awardsReceived: event.awardsReceived,
        remarks: event.remarks
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                onSuccess();
            }, 2000);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [success, onSuccess]);

    const loadData = async () => {
        try {
            setIsLoadingEventDetails(true);

            // ✅ Load teachers list
            const teachersData = await teacherService.getAllTeachers(true);
            setTeachers(teachersData);

            // ✅ Get current user's teacher ID if they are a teacher
            if (isTeacherRole && user?.userId) {
                const currentTeacher = teachersData.find(
                    (teacher) => teacher.userID === user.userId
                );
                if (currentTeacher) {
                    setCurrentUserTeacherId(currentTeacher.teacherID);
                }
            }

            // ✅ NEW: Load event details to get assigned teachers
            const eventDetails = await eventService.getEventById(event.eventID);

            if (eventDetails.teachers && eventDetails.teachers.length > 0) {
                // Load existing teacher assignments
                const teacherIds = eventDetails.teachers.map(t => t.teacherID);
                setSelectedTeacherIds(teacherIds);

                // Find primary teacher
                const primary = eventDetails.teachers.find(t => t.isPrimary);
                if (primary) {
                    setPrimaryTeacherId(primary.teacherID);
                } else if (teacherIds.length > 0) {
                    // If no primary marked, use first teacher
                    setPrimaryTeacherId(teacherIds[0]);
                }
            } else if (event.leadingTeacherID) {
                // ✅ Fallback: Use old leadingTeacherID if no teachers array
                setSelectedTeacherIds([event.leadingTeacherID]);
                setPrimaryTeacherId(event.leadingTeacherID);
            }

            setIsLoadingEventDetails(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setIsLoadingEventDetails(false);
            // If loading event details fails, try to use the event prop data
            if (event.leadingTeacherID) {
                setSelectedTeacherIds([event.leadingTeacherID]);
                setPrimaryTeacherId(event.leadingTeacherID);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.eventName?.trim()) {
            setError(t('events.editModal.validation.eventNameRequired'));
            return;
        }

        if (!formData.eventCode?.trim()) {
            setError(t('events.editModal.validation.eventCodeRequired'));
            return;
        }

        if (!formData.venue?.trim()) {
            setError(t('events.editModal.validation.venueRequired'));
            return;
        }

        // ✅ NEW: Validate at least one teacher is selected
        if (selectedTeacherIds.length === 0) {
            setError(t('events.editModal.validation.teacherRequired') || 'Please select at least one teacher');
            return;
        }

        try {
            setLoading(true);

            // ✅ CRITICAL: Clean empty strings to undefined for optional fields
            const cleanedFormData = { ...formData };

            // Convert empty strings to undefined for optional time fields
            if (cleanedFormData.endTime === '') {
                cleanedFormData.endTime = undefined;
            }

            // Convert empty strings to undefined for optional text fields
            if (cleanedFormData.venueAddress === '') cleanedFormData.venueAddress = undefined;
            if (cleanedFormData.organizer === '') cleanedFormData.organizer = undefined;
            if (cleanedFormData.opponentSchool === '') cleanedFormData.opponentSchool = undefined;
            if (cleanedFormData.transportationDetails === '') cleanedFormData.transportationDetails = undefined;
            if (cleanedFormData.uniformRequirements === '') cleanedFormData.uniformRequirements = undefined;
            if (cleanedFormData.description === '') cleanedFormData.description = undefined;
            if (cleanedFormData.specialInstructions === '') cleanedFormData.specialInstructions = undefined;
            if (cleanedFormData.result === '') cleanedFormData.result = undefined;
            if (cleanedFormData.awardsReceived === '') cleanedFormData.awardsReceived = undefined;
            if (cleanedFormData.remarks === '') cleanedFormData.remarks = undefined;

            // ✅ NEW: Include teacher assignments in update
            const submitData: EventUpdateDto = {
                ...cleanedFormData,
                teacherIDs: selectedTeacherIds,
                primaryTeacherID: primaryTeacherId || selectedTeacherIds[0]
            };

            // Debug logging
            console.log('📤 Submitting update:', {
                eventID: event.eventID,
                teacherCount: selectedTeacherIds.length,
                primaryTeacherId: primaryTeacherId,
                hasRequiresParentConsent: submitData.requiresParentConsent !== undefined,
                hasEndTime: submitData.endTime !== undefined && submitData.endTime !== ''
            });

            await eventService.updateEvent(event.eventID, submitData);
            setLoading(false);
            setSuccess(true);
        } catch (error) {
            setLoading(false);
            console.error('❌ Error updating event:', error);

            // ✅ FIXED: Proper type casting for axios error
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as AxiosErrorResponse;
                console.error('Response status:', axiosError.response?.status);
                console.error('Response data:', axiosError.response?.data);

                // Log validation errors if present
                if (axiosError.response?.data?.errors) {
                    console.error('Validation errors:', axiosError.response.data.errors);

                    // Show first validation error to user
                    const errors = axiosError.response.data.errors;
                    const firstErrorKey = Object.keys(errors)[0];
                    const firstError = errors[firstErrorKey]?.[0];
                    if (firstError) {
                        setError(`Validation error: ${firstError}`);
                        return;
                    }
                }
            }

            const errorMessage = error instanceof Error && 'response' in error
                ? (error as AxiosErrorResponse).response?.data?.message ||
                (error as AxiosErrorResponse).response?.data?.title
                : t('events.editModal.messages.errorUpdating');
            setError(errorMessage || t('events.editModal.messages.errorUpdating'));
        }
    };

    const handleChange = <K extends keyof EventUpdateDto>(field: K, value: EventUpdateDto[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ✅ NEW: Toggle teacher selection
    const toggleTeacherSelection = (teacherId: number) => {
        // ✅ Teacher role logic: If they're assigned, they cannot remove themselves
        if (isTeacherRole && teacherId === currentUserTeacherId) {
            // If trying to deselect themselves, don't allow it if they're already assigned
            if (selectedTeacherIds.includes(teacherId)) {
                return; // Cannot deselect yourself
            }
        }

        setSelectedTeacherIds(prev => {
            if (prev.includes(teacherId)) {
                // Remove teacher
                const newSelection = prev.filter(id => id !== teacherId);
                // If removing the primary teacher, set a new primary
                if (primaryTeacherId === teacherId) {
                    setPrimaryTeacherId(newSelection.length > 0 ? newSelection[0] : null);
                }
                return newSelection;
            } else {
                // Add teacher
                const newSelection = [...prev, teacherId];
                // If this is the first teacher, make them primary
                if (newSelection.length === 1) {
                    setPrimaryTeacherId(teacherId);
                }
                return newSelection;
            }
        });
    };

    // ✅ NEW: Set primary teacher
    const handleSetPrimaryTeacher = (teacherId: number) => {
        if (selectedTeacherIds.includes(teacherId)) {
            setPrimaryTeacherId(teacherId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header with Success Alert */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 flex-shrink-0">{t('events.editModal.title')}</h2>

                        {/* Success Alert in Header */}
                        {success && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg shadow-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-green-900 whitespace-nowrap">{t('events.editModal.messages.successUpdated')}</p>
                                    <p className="text-xs text-green-700 whitespace-nowrap">{t('events.editModal.messages.closingIn')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4"
                        disabled={loading || success}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Error Alert */}
                    {error && !success && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('events.editModal.sections.basicInfo')}</h3>
                        </div>

                        {/* Event Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.eventName')} *
                            </label>
                            <input
                                type="text"
                                value={formData.eventName || ''}
                                onChange={(e) => handleChange('eventName', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.eventName')}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        {/* Event Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.eventCode')} *
                            </label>
                            <input
                                type="text"
                                value={formData.eventCode || ''}
                                onChange={(e) => handleChange('eventCode', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.eventCode')}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        {/* Event Type - Now Translated */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.eventType')} *
                            </label>
                            <select
                                value={formData.eventType ?? EventType.Training}
                                onChange={(e) => handleChange('eventType', Number(e.target.value) as EventType)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            >
                                {Object.entries(EventTypeLabels).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {getTranslatedEventType(label, t)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Activity Type - Now Translated */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.activityType')} *
                            </label>
                            <select
                                value={formData.activityType ?? ActivityType.Football}
                                onChange={(e) => handleChange('activityType', Number(e.target.value) as ActivityType)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            >
                                {Object.entries(ActivityTypeLabels).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {getTranslatedActivityType(label, t)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ UPDATED: Multiple Teachers Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Users className="w-4 h-4 inline mr-2" />
                                {t('events.editModal.fields.leadingTeacher') || 'Assigned Teachers'} *
                                {isTeacherRole && currentUserTeacherId && selectedTeacherIds.includes(currentUserTeacherId) && (
                                    <Lock className="w-4 h-4 inline ml-2 text-gray-400" />
                                )}
                            </label>

                            {isLoadingEventDetails ? (
                                // Loading state
                                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-center">
                                    <p className="text-sm text-gray-500">
                                        {t('events.editModal.messages.loadingTeachers') || 'Loading teachers...'}
                                    </p>
                                </div>
                            ) : (
                                /* Multiple teacher selection */
                                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                                    {teachers.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            {t('events.editModal.messages.noTeachers') || 'No teachers available'}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {teachers.map((teacher) => {
                                                const isSelected = selectedTeacherIds.includes(teacher.teacherID);
                                                const isPrimary = primaryTeacherId === teacher.teacherID;
                                                const isCurrentUser = currentUserTeacherId === teacher.teacherID;
                                                const isLockedForCurrentUser = isTeacherRole && isCurrentUser && isSelected;

                                                return (
                                                    <div
                                                        key={teacher.teacherID}
                                                        className={`p-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Checkbox for selection */}
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleTeacherSelection(teacher.teacherID)}
                                                                disabled={loading || success || isLockedForCurrentUser}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                title={isLockedForCurrentUser ?
                                                                    (t('events.editModal.messages.cannotRemoveSelf') || 'You cannot remove yourself') :
                                                                    undefined
                                                                }
                                                            />

                                                            {/* Teacher info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                        }`}>
                                                                        {teacher.fullName}
                                                                        {isLockedForCurrentUser && (
                                                                            <Lock className="w-3 h-3 inline ml-1 text-gray-400" />
                                                                        )}
                                                                    </span>
                                                                    {isPrimary && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                                            <Star className="w-3 h-3 fill-yellow-500" />
                                                                            {t('events.editModal.labels.primary') || 'Primary'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {teacher.email && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {teacher.email}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Set as primary button */}
                                                            {isSelected && !isPrimary && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrimaryTeacher(teacher.teacherID)}
                                                                    disabled={loading || success}
                                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                                    title={t('events.editModal.buttons.setPrimary') || 'Set as primary'}
                                                                >
                                                                    {t('events.editModal.buttons.setPrimary') || 'Set Primary'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected teachers summary */}
                            {selectedTeacherIds.length > 0 && !isLoadingEventDetails && (
                                <p className="mt-2 text-sm text-gray-600">
                                    {t('events.editModal.messages.teachersSelected') || 'Selected'}: {selectedTeacherIds.length} {t('events.editModal.labels.teachers') || 'teacher(s)'}
                                </p>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">{t('events.editModal.sections.dateTime')}</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                {t('events.editModal.fields.eventDate')} *
                            </label>
                            <input
                                type="date"
                                value={formData.eventDate || ''}
                                onChange={(e) => handleChange('eventDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            />
                        </div>

                        {/* Start Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                {t('events.editModal.fields.startTime')} *
                            </label>
                            <input
                                type="time"
                                value={formData.startTime || ''}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            />
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                {t('events.editModal.fields.endTime')}
                            </label>
                            <input
                                type="time"
                                value={formData.endTime || ''}
                                onChange={(e) => handleChange('endTime', e.target.value || undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading || success}
                            />
                        </div>

                        {/* Location */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">{t('events.editModal.sections.location')}</h3>
                        </div>

                        {/* Venue */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                {t('events.editModal.fields.venue')} *
                            </label>
                            <input
                                type="text"
                                value={formData.venue || ''}
                                onChange={(e) => handleChange('venue', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.venue')}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        {/* Venue Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.venueAddress')}
                            </label>
                            <input
                                type="text"
                                value={formData.venueAddress || ''}
                                onChange={(e) => handleChange('venueAddress', e.target.value || undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.venueAddress')}
                                disabled={loading || success}
                            />
                        </div>

                        {/* Additional Information */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">{t('events.editModal.sections.additionalInfo')}</h3>
                        </div>

                        {/* Result */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.result')}
                            </label>
                            <input
                                type="text"
                                value={formData.result || ''}
                                onChange={(e) => handleChange('result', e.target.value || undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.result')}
                                disabled={loading || success}
                            />
                        </div>

                        {/* Awards Received */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.awardsReceived')}
                            </label>
                            <textarea
                                value={formData.awardsReceived || ''}
                                onChange={(e) => handleChange('awardsReceived', e.target.value || undefined)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.awardsReceived')}
                                disabled={loading || success}
                            />
                        </div>

                        {/* Remarks / Suggestions */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.editModal.fields.remarks')}
                            </label>
                            <textarea
                                value={formData.remarks || ''}
                                onChange={(e) => handleChange('remarks', e.target.value || undefined)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.editModal.placeholders.remarks')}
                                disabled={loading || success}
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading || success}
                        >
                            {t('events.editModal.buttons.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            disabled={loading || success}
                        >
                            {loading ? t('events.editModal.buttons.updating') : success ? t('events.editModal.buttons.updated') : t('events.editModal.buttons.update')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEventModal;