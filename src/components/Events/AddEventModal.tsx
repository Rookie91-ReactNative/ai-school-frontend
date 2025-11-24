import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import {
    eventService,
    EventType,
    EventStatus,
    EventTypeLabels,
    type EventCreateDto
} from '../../services/eventService';
import { ActivityType, ActivityTypeLabels } from '../../services/teamService';
import { teacherService, type Teacher } from '../../services/teacherService';
import { getTranslatedActivityType } from '../../utils/activityTypeTranslations';
import { getTranslatedEventType } from '../../utils/eventTypeTranslations';

interface AddEventModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddEventModal = ({ onClose, onSuccess }: AddEventModalProps) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<EventCreateDto>({
        eventName: '',
        eventCode: '',
        eventType: EventType.Training,
        activityType: ActivityType.Football,
        status: EventStatus.Planned,
        eventDate: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        venue: '',
        requiresParentConsent: false,
        result: '',
        awardsReceived: '',
        remarks: ''
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
            const teachersData = await teacherService.getAllTeachers(true);
            setTeachers(teachersData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.eventName.trim()) {
            setError(t('events.addModal.validation.eventNameRequired'));
            return;
        }

        if (!formData.eventCode.trim()) {
            setError(t('events.addModal.validation.eventCodeRequired'));
            return;
        }

        if (!formData.venue.trim()) {
            setError(t('events.addModal.validation.venueRequired'));
            return;
        }

        try {
            setLoading(true);
            await eventService.createEvent(formData);
            setLoading(false);
            setSuccess(true);

        } catch (error) {
            setLoading(false);
            console.error('Error creating event:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: unknown; status?: number } };
                console.error('Response data:', axiosError.response?.data);
                console.error('Response status:', axiosError.response?.status);
            }

            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : t('events.addModal.messages.errorCreating');
            setError(errorMessage || t('events.addModal.messages.errorCreating'));
        }
    };

    const handleChange = <K extends keyof EventCreateDto>(field: K, value: EventCreateDto[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header with Success Alert */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 flex-shrink-0">{t('events.addModal.title')}</h2>

                        {/* Success Alert in Header */}
                        {success && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg shadow-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-green-900 whitespace-nowrap">{t('events.addModal.messages.successCreated')}</p>
                                    <p className="text-xs text-green-700 whitespace-nowrap">{t('events.addModal.messages.closingIn')}</p>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('events.addModal.sections.basicInfo')}</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.eventName')} *
                            </label>
                            <input
                                type="text"
                                value={formData.eventName}
                                onChange={(e) => handleChange('eventName', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.eventName')}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.eventCode')} *
                            </label>
                            <input
                                type="text"
                                value={formData.eventCode}
                                onChange={(e) => handleChange('eventCode', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.eventCode')}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        {/* ✅ Event Type - Now Translated */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.eventType')} *
                            </label>
                            <select
                                value={formData.eventType}
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

                        {/* ✅ Activity Type - Now Translated */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.activityType')} *
                            </label>
                            <select
                                value={formData.activityType}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.leadingTeacher')} *
                            </label>
                            <select
                                value={formData.leadingTeacherID || ''}
                                onChange={(e) => handleChange('leadingTeacherID', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            >
                                <option value="">{t('events.addModal.placeholders.selectTeacher')}</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.teacherID} value={teacher.teacherID}>
                                        {teacher.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">{t('events.addModal.sections.dateTime')}</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                {t('events.addModal.fields.eventDate')} *
                            </label>
                            <input
                                type="date"
                                value={formData.eventDate}
                                onChange={(e) => handleChange('eventDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                {t('events.addModal.fields.startTime')} *
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                {t('events.addModal.fields.endTime')}
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">{t('events.addModal.sections.location')}</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                {t('events.addModal.fields.venue')} *
                            </label>
                            <input
                                type="text"
                                value={formData.venue}
                                onChange={(e) => handleChange('venue', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.venue')}
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.venueAddress')}
                            </label>
                            <input
                                type="text"
                                value={formData.venueAddress || ''}
                                onChange={(e) => handleChange('venueAddress', e.target.value || undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.venueAddress')}
                                disabled={loading || success}
                            />
                        </div>

                        {/* Additional Information */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">{t('events.addModal.sections.additionalInfo')}</h3>
                        </div>

                        {/* Result */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.result')}
                            </label>
                            <input
                                type="text"
                                value={formData.result || ''}
                                onChange={(e) => handleChange('result', e.target.value || undefined)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.result')}
                                disabled={loading || success}
                            />
                        </div>

                        {/* Awards Received */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.awardsReceived')}
                            </label>
                            <textarea
                                value={formData.awardsReceived || ''}
                                onChange={(e) => handleChange('awardsReceived', e.target.value || undefined)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.awardsReceived')}
                                disabled={loading || success}
                            />
                        </div>

                        {/* Remarks / Suggestions */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('events.addModal.fields.remarks')}
                            </label>
                            <textarea
                                value={formData.remarks || ''}
                                onChange={(e) => handleChange('remarks', e.target.value || undefined)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('events.addModal.placeholders.remarks')}
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
                            {t('events.addModal.buttons.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            disabled={loading || success}
                        >
                            {loading ? t('events.addModal.buttons.creating') : success ? t('events.addModal.buttons.created') : t('events.addModal.buttons.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEventModal;