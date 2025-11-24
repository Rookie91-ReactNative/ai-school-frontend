import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Search, Plus, AlertCircle, Trash2, UserMinus, UserPlus } from 'lucide-react';
import {
    eventService,
    type EventWithDetails
} from '../../services/eventService';
import { studentService, type StudentWithAcademic } from '../../services/studentService';
import { teamService, type TeamWithDetails } from '../../services/teamService';

interface ManageParticipantsModalProps {
    event: EventWithDetails;
    onClose: () => void;
    onSuccess: () => void;
}

interface SelectedParticipant {
    studentID: number;
    studentCode: string;
    fullName: string;
    gradeName?: string;
    className?: string;
    isFromTeam: boolean;
    teamID?: number;
}

const ManageParticipantsModal = ({ event, onClose, onSuccess }: ManageParticipantsModalProps) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [teams, setTeams] = useState<TeamWithDetails[]>([]);
    const [students, setStudents] = useState<StudentWithAcademic[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<StudentWithAcademic[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Selected participants (team + individual)
    const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);

    // Team selection
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);

    // Individual selection
    const [showIndividualAdd, setShowIndividualAdd] = useState(false);
    const [classFilter, setClassFilter] = useState<string>('');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchTerm, selectedParticipants, classFilter]);

    useEffect(() => {
        const loadTeamDetails = async () => {
            if (selectedTeamId) {
                try {
                    const teamDetails = await teamService.getTeamById(selectedTeamId);
                    setSelectedTeam(teamDetails);

                    if (teamDetails && teamDetails.members && teamDetails.members.length > 0) {
                        const teamParticipants: SelectedParticipant[] = teamDetails.members.map(member => ({
                            studentID: member.studentID,
                            studentCode: member.studentCode,
                            fullName: member.studentName,
                            gradeName: member.grade,
                            className: member.class,
                            isFromTeam: true,
                            teamID: teamDetails.teamID
                        }));

                        setSelectedParticipants(prev => {
                            const individualParticipants = prev.filter(p => !p.isFromTeam);
                            return [...teamParticipants, ...individualParticipants];
                        });
                    }
                } catch (error) {
                    console.error('Error loading team details:', error);
                    setError(t('events.participantsModal.messages.errorLoadingTeam'));
                }
            } else {
                setSelectedTeam(null);
                setSelectedParticipants(prev => prev.filter(p => !p.isFromTeam));
            }
        };

        loadTeamDetails();
    }, [selectedTeamId, t]);

    const loadData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const schoolId = userStr ? JSON.parse(userStr).schoolID : null;

            if (!schoolId) {
                console.error('No school ID found');
                setError(t('events.participantsModal.messages.noSchoolInfo'));
                return;
            }

            const [teamsData, studentsData] = await Promise.all([
                teamService.getAllTeams(true),
                studentService.getStudentsBySchool(schoolId)
            ]);

            const filteredTeams = teamsData.filter(t => t.activityType === event.activityType);
            setTeams(filteredTeams);
            setStudents(studentsData);

            if (event.teamID) {
                setSelectedTeamId(event.teamID);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError(t('events.participantsModal.messages.errorLoadingData'));
        }
    };

    const filterStudents = () => {
        let filtered = [...students];

        if (classFilter) {
            filtered = filtered.filter(s => s.className === classFilter);
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.fullName.toLowerCase().includes(search) ||
                s.studentCode.toLowerCase().includes(search) ||
                s.gradeName?.toLowerCase().includes(search) ||
                s.className?.toLowerCase().includes(search)
            );
        }

        const selectedStudentIds = selectedParticipants.map(p => p.studentID);
        filtered = filtered.filter(s => !selectedStudentIds.includes(s.studentID));

        const participantStudentIds = event.participants?.map(p => p.studentID) || [];
        filtered = filtered.filter(s => !participantStudentIds.includes(s.studentID));

        setFilteredStudents(filtered);
    };

    const handleRemoveParticipant = (studentID: number) => {
        setSelectedParticipants(prev => prev.filter(p => p.studentID !== studentID));
    };

    const handleAddIndividualStudent = (student: StudentWithAcademic) => {
        const newParticipant: SelectedParticipant = {
            studentID: student.studentID,
            studentCode: student.studentCode,
            fullName: student.fullName,
            gradeName: student.gradeName,
            className: student.className,
            isFromTeam: false
        };

        setSelectedParticipants(prev => [...prev, newParticipant]);
    };

    const handleSubmit = async () => {
        if (selectedParticipants.length === 0) {
            setError(t('events.participantsModal.validation.selectAtLeastOne'));
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const teamParticipants = selectedParticipants.filter(p => p.isFromTeam);
            const individualParticipants = selectedParticipants.filter(p => !p.isFromTeam);

            if (selectedTeamId && teamParticipants.length > 0) {
                await eventService.addParticipants(event.eventID, {
                    teamID: selectedTeamId,
                    studentIDs: teamParticipants.map(p => p.studentID),
                    isFromTeam: true
                });
            }

            if (individualParticipants.length > 0) {
                await eventService.addParticipants(event.eventID, {
                    studentIDs: individualParticipants.map(p => p.studentID),
                    isFromTeam: false
                });
            }

            onSuccess();
        } catch (error) {
            console.error('Error adding participants:', error);
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : t('events.participantsModal.messages.errorAddingParticipants');
            setError(errorMessage || t('events.participantsModal.messages.errorAddingParticipants'));
        } finally {
            setLoading(false);
        }
    };

    const teamParticipants = selectedParticipants.filter(p => p.isFromTeam);
    const individualParticipants = selectedParticipants.filter(p => !p.isFromTeam);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">{t('events.participantsModal.title')}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Team Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('events.participantsModal.labels.selectTeam')}
                        </label>
                        {teams.length > 0 ? (
                            <select
                                value={selectedTeamId || ''}
                                onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">{t('events.participantsModal.labels.noTeam')}</option>
                                {teams.map(team => (
                                    <option key={team.teamID} value={team.teamID}>
                                        {team.teamName} ({team.currentMemberCount || 0} {t('events.participantsModal.labels.members')})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    {t('events.participantsModal.messages.noTeamsAvailable')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Selected Participants Display */}
                    {selectedParticipants.length > 0 && (
                        <div className="mb-6 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    {t('events.participantsModal.sections.selectedParticipants')} ({selectedParticipants.length})
                                </h3>
                            </div>

                            {/* Team Members Section */}
                            {teamParticipants.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {t('events.participantsModal.labels.fromTeam')}: {selectedTeam?.teamName} ({teamParticipants.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {teamParticipants.map(participant => (
                                            <div
                                                key={participant.studentID}
                                                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{participant.fullName}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {participant.studentCode} • {participant.className || 'N/A'} • {participant.gradeName || 'N/A'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveParticipant(participant.studentID)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title={t('events.participantsModal.actions.removeFromSelection')}
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Individual Participants Section */}
                            {individualParticipants.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        {t('events.participantsModal.labels.individualStudents')} ({individualParticipants.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {individualParticipants.map(participant => (
                                            <div
                                                key={participant.studentID}
                                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{participant.fullName}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {participant.studentCode} • {participant.className || 'N/A'} • {participant.gradeName || 'N/A'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveParticipant(participant.studentID)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title={t('events.participantsModal.actions.removeFromSelection')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Individual Students Section */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('events.participantsModal.sections.addIndividualStudents')}
                            </h3>
                            <button
                                onClick={() => setShowIndividualAdd(!showIndividualAdd)}
                                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {showIndividualAdd ? t('events.participantsModal.buttons.hideList') : t('events.participantsModal.buttons.showList')}
                            </button>
                        </div>

                        {showIndividualAdd && (
                            <>
                                {/* Class Filter */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('events.participantsModal.labels.filterByClass')}
                                    </label>
                                    <select
                                        value={classFilter}
                                        onChange={(e) => setClassFilter(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{t('events.participantsModal.labels.allClasses')}</option>
                                        {Array.from(new Set(students.map(s => s.className).filter(Boolean)))
                                            .sort()
                                            .map(className => (
                                                <option key={className} value={className}>
                                                    {className}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Search */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder={t('events.participantsModal.placeholders.searchStudents')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Student List */}
                                {filteredStudents.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                        {filteredStudents.map(student => (
                                            <div
                                                key={student.studentID}
                                                className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{student.fullName}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.studentCode} • {student.className || 'N/A'} • {student.gradeName || 'N/A'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddIndividualStudent(student)}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t('events.participantsModal.buttons.add')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                        <p>
                                            {searchTerm
                                                ? t('events.participantsModal.messages.noStudentsFound')
                                                : t('events.participantsModal.messages.allStudentsSelected')}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        {t('events.participantsModal.footer.selectedCount', { count: selectedParticipants.length })}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            {t('events.participantsModal.buttons.cancel')}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedParticipants.length === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading
                                ? t('events.participantsModal.buttons.adding')
                                : t('events.participantsModal.buttons.addParticipants', { count: selectedParticipants.length })}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageParticipantsModal;