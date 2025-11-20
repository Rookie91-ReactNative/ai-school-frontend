import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Calendar, MapPin, Hash, Target } from 'lucide-react';
import { teamService, ActivityType, ActivityTypeLabels, ActivityCategories, type TeamCreateDto } from '../../services/teamService';
import { teacherService, type Teacher } from '../../services/teacherService';
import { getTranslatedActivityType } from '../../utils/activityTypeTranslations';

interface AddTeamModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddTeamModal = ({ onClose, onSuccess }: AddTeamModalProps) => {
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TeamCreateDto>({
        teamName: '',
        teamCode: '',
        activityType: ActivityType.Football,
        coachTeacherID: undefined,
        assistantCoachID: undefined,
        ageGroup: '',
        division: '',
        description: '',
        trainingSchedule: '',
        trainingVenue: '',
        maxMembers: 30,
        establishedDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            const data = await teacherService.getAllTeachers(true);
            setTeachers(data);
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await teamService.createTeam(formData);
            onSuccess();
        } catch (error) {
            console.error('Error creating team:', error);
            alert(t('teams.errors.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof TeamCreateDto, value: string | number | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{t('teams.modal.add.title')}</h2>
                            <p className="text-sm text-gray-500">{t('teams.modal.add.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={t('teams.actions.close')}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            {t('teams.modal.sections.basicInfo')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Team Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teams.fields.teamName')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.teamName}
                                    onChange={(e) => handleChange('teamName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('teams.placeholders.teamName')}
                                />
                            </div>

                            {/* Team Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teams.fields.teamCode')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.teamCode}
                                    onChange={(e) => handleChange('teamCode', e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('teams.placeholders.teamCode')}
                                />
                            </div>

                            {/* Activity Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teams.fields.activityType')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.activityType}
                                    onChange={(e) => handleChange('activityType', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {Object.entries(ActivityCategories).map(([category, types]) => (
                                        <optgroup
                                            key={category}
                                            label={t(`teams.categories.${category.toLowerCase().replace(/\s+/g, '')}`)}
                                        >
                                            {types.map((type) => (
                                                <option key={type} value={type}>
                                                    {getTranslatedActivityType(ActivityTypeLabels[type], t)}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Coaching Staff */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            {t('teams.modal.sections.coachingStaff')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Main Coach */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teams.fields.coach')}
                                </label>
                                <select
                                    value={formData.coachTeacherID || ''}
                                    onChange={(e) => handleChange('coachTeacherID', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">{t('teams.placeholders.selectCoach')}</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.teacherID} value={teacher.teacherID}>
                                            {teacher.fullName} ({teacher.teacherCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assistant Coach */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teams.fields.assistantCoach')}
                                </label>
                                <select
                                    value={formData.assistantCoachID || ''}
                                    onChange={(e) => handleChange('assistantCoachID', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">{t('teams.placeholders.selectAssistant')}</option>
                                    {teachers.filter(t => t.teacherID !== formData.coachTeacherID).map((teacher) => (
                                        <option key={teacher.teacherID} value={teacher.teacherID}>
                                            {teacher.fullName} ({teacher.teacherCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Team Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            {t('teams.modal.sections.teamDetails')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Age Group */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Target className="w-4 h-4 inline mr-1" />
                                    {t('teams.fields.ageGroup')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.ageGroup || ''}
                                    onChange={(e) => handleChange('ageGroup', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('teams.placeholders.ageGroup')}
                                />
                            </div>

                            {/* Division */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    {t('teams.fields.division')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.division || ''}
                                    onChange={(e) => handleChange('division', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('teams.placeholders.division')}
                                />
                            </div>

                            {/* Max Members */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    {t('teams.fields.maxMembers')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.maxMembers}
                                    onChange={(e) => handleChange('maxMembers', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Established Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    {t('teams.fields.establishedDate')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.establishedDate}
                                    onChange={(e) => handleChange('establishedDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Training Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            {t('teams.modal.sections.trainingInfo')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Training Schedule */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teams.fields.trainingSchedule')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.trainingSchedule || ''}
                                    onChange={(e) => handleChange('trainingSchedule', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('teams.placeholders.trainingSchedule')}
                                />
                            </div>

                            {/* Training Venue */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {t('teams.fields.trainingVenue')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.trainingVenue || ''}
                                    onChange={(e) => handleChange('trainingVenue', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('teams.placeholders.trainingVenue')}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('teams.fields.description')}
                            </label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('teams.placeholders.description')}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {t('teams.actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('teams.actions.loading') : t('teams.actions.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeamModal;