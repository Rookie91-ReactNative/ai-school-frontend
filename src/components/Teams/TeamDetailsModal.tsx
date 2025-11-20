import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Users, Mail, Phone, Calendar, MapPin, Award, UserPlus, Edit,
    Trash2, Shield, Star, Hash, User, Filter
} from 'lucide-react';
import { teamService, type TeamWithDetails, type TeamMemberDto, type UpdateTeamMemberRequest } from '../../services/teamService';
import { getTranslatedActivityType } from '../../utils/activityTypeTranslations';
import api from '../../services/api';

interface TeamDetailsModalProps {
    teamId: number;
    onClose: () => void;
    onEdit: () => void;
}

interface Student {
    studentID: number;
    studentCode: string;
    fullName: string;
    grade: string;
    gradeName: string;
    class: string;
    className: string;
}

interface StudentApiResponse {
    studentID: number;
    studentCode: string;
    fullName: string;
    grade?: string;
    gradeName?: string;
    class?: string;
    className?: string;
}

const TeamDetailsModal = ({ teamId, onClose, onEdit }: TeamDetailsModalProps) => {
    const { t } = useTranslation();
    const [team, setTeam] = useState<TeamWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [position, setPosition] = useState('');
    const [editingMember, setEditingMember] = useState<TeamMemberDto | null>(null);

    // Class filter state
    const [selectedClass, setSelectedClass] = useState<string>('All');
    // Search filter state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadTeamDetails();
    }, [teamId]);

    const loadTeamDetails = async () => {
        try {
            setLoading(true);
            const data = await teamService.getTeamById(teamId);
            setTeam(data);
        } catch (error) {
            console.error('Error loading team details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            // ✅ FIXED: Get students with their active academic history
            const response = await api.get('/student/with-academic-info');

            // Process the data to include grade and class names
            const studentsData = response.data.data || [];

            // Map students with their class information
            const processedStudents = studentsData.map((student: StudentApiResponse): Student => {
                return {
                    studentID: student.studentID,
                    studentCode: student.studentCode,
                    fullName: student.fullName,
                    grade: student.grade || '',
                    gradeName: student.gradeName || '',
                    class: student.class || '',
                    className: student.className || ''
                };
            });

            setStudents(processedStudents);
        } catch (error) {
            console.error('Error loading students:', error);
            // Fallback: try the regular endpoint
            try {
                const response = await api.get('/student');
                const studentsData = response.data.data || [];
                setStudents(studentsData);
            } catch (fallbackError) {
                console.error('Error loading students (fallback):', fallbackError);
            }
        }
    };

    const handleAddMembers = async () => {
        if (selectedStudents.length === 0) {
            alert(t('teams.members.selectAtLeastOne'));
            return;
        }

        try {
            await teamService.addTeamMembers(teamId, {
                teamID: teamId,
                studentIDs: selectedStudents,
                position: position
            });
            setShowAddMember(false);
            setSelectedStudents([]);
            setPosition('');
            setSelectedClass('All');
            setSearchTerm('');
            await loadTeamDetails();
        } catch (error) {
            console.error('Error adding members:', error);
            alert(t('teams.members.addFailed'));
        }
    };

    const handleUpdateMember = async (memberId: number, updates: UpdateTeamMemberRequest) => {
        try {
            await teamService.updateTeamMember(memberId, updates);
            setEditingMember(null);
            await loadTeamDetails();
        } catch (error) {
            console.error('Error updating member:', error);
            alert(t('teams.members.updateFailed'));
        }
    };

    const handleRemoveMember = async (memberId: number, studentName: string) => {
        if (!confirm(t('teams.members.confirmRemove', { name: studentName }))) {
            return;
        }

        try {
            await teamService.removeTeamMember(memberId);
            await loadTeamDetails();
        } catch (error) {
            console.error('Error removing member:', error);
            alert(t('teams.members.removeFailed'));
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-center mt-4 text-gray-600">{t('teams.loading')}</p>
                </div>
            </div>
        );
    }

    if (!team) {
        return null;
    }

    const availableStudents = students.filter(
        s => !team.members.some(m => m.studentID === s.studentID)
    );

    // ✅ Get unique class names (GradeName + ClassName)
    const uniqueClasses = Array.from(new Set(
        availableStudents
            .map(s => {
                const gradeName = s.gradeName || s.grade || '';
                const className = s.className || s.class || '';
                if (!gradeName && !className) return '';
                return `${gradeName} ${className}`.trim();
            })
            .filter(c => c !== '')
    )).sort();

    // ✅ Filter students by class AND search term
    let filteredStudents = availableStudents;

    // Filter by class
    if (selectedClass !== 'All') {
        filteredStudents = filteredStudents.filter(s => {
            const gradeName = s.gradeName || s.grade || '';
            const className = s.className || s.class || '';
            const fullClass = `${gradeName} ${className}`.trim();
            return fullClass === selectedClass;
        });
    }

    // Filter by search term (name)
    if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredStudents = filteredStudents.filter(s =>
            s.fullName.toLowerCase().includes(searchLower) ||
            s.studentCode.toLowerCase().includes(searchLower)
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{team.teamName}</h2>
                                <p className="text-sm text-gray-500">
                                    {team.teamCode} • {getTranslatedActivityType(team.activityTypeName, t)} • {team.activityCategory}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                {t('teams.actions.edit')}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label={t('teams.actions.close')}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Team Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('teams.details.members')}</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                                {team.currentMemberCount}/{team.maxMembers}
                            </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('teams.details.established')}</span>
                            </div>
                            <p className="text-lg font-semibold text-green-900">
                                {new Date(team.establishedDate).toLocaleDateString()}
                            </p>
                        </div>

                        <div className={`${team.isActive ? 'bg-green-50' : 'bg-gray-50'} p-4 rounded-lg`}>
                            <div className={`flex items-center gap-2 ${team.isActive ? 'text-green-700' : 'text-gray-700'} mb-1`}>
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('teams.details.status')}</span>
                            </div>
                            <p className={`text-lg font-semibold ${team.isActive ? 'text-green-900' : 'text-gray-900'}`}>
                                {team.isActive ? t('teams.status.active') : t('teams.status.inactive')}
                            </p>
                        </div>
                    </div>

                    {/* Coaching Staff */}
                    {(team.coach || team.assistantCoach) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                                {t('teams.modal.sections.coachingStaff')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {team.coach && (
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">{t('teams.details.mainCoach')}</p>
                                        <p className="font-semibold text-gray-900">{team.coach.fullName}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {team.coach.email}
                                            </span>
                                            {team.coach.phoneNumber && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {team.coach.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {team.assistantCoach && (
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">{t('teams.details.assistantCoach')}</p>
                                        <p className="font-semibold text-gray-900">{team.assistantCoach.fullName}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {team.assistantCoach.email}
                                            </span>
                                            {team.assistantCoach.phoneNumber && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {team.assistantCoach.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Team Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {team.ageGroup && (
                            <div>
                                <p className="text-sm text-gray-500">{t('teams.fields.ageGroup')}</p>
                                <p className="font-medium text-gray-900">{team.ageGroup}</p>
                            </div>
                        )}
                        {team.division && (
                            <div>
                                <p className="text-sm text-gray-500">{t('teams.fields.division')}</p>
                                <p className="font-medium text-gray-900">{team.division}</p>
                            </div>
                        )}
                        {team.trainingSchedule && (
                            <div>
                                <p className="text-sm text-gray-500">{t('teams.fields.trainingSchedule')}</p>
                                <p className="font-medium text-gray-900">{team.trainingSchedule}</p>
                            </div>
                        )}
                        {team.trainingVenue && (
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {t('teams.fields.trainingVenue')}
                                </p>
                                <p className="font-medium text-gray-900">{team.trainingVenue}</p>
                            </div>
                        )}
                    </div>

                    {team.description && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">{t('teams.fields.description')}</p>
                            <p className="text-gray-900">{team.description}</p>
                        </div>
                    )}

                    {team.achievements && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                <Award className="w-4 h-4" />
                                <h3 className="text-sm font-semibold uppercase tracking-wide">
                                    {t('teams.modal.sections.achievements')}
                                </h3>
                            </div>
                            <p className="text-gray-900">{team.achievements}</p>
                        </div>
                    )}

                    {/* Team Members */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('teams.members.title')} ({team.members.length})
                            </h3>
                            <button
                                onClick={() => {
                                    loadStudents();
                                    setShowAddMember(true);
                                    setSelectedClass('All');
                                    setSearchTerm('');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                {t('teams.members.addMembers')}
                            </button>
                        </div>

                        {showAddMember && (
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-blue-900">{t('teams.members.addNew')}</h4>
                                    <button
                                        onClick={() => {
                                            setShowAddMember(false);
                                            setSelectedStudents([]);
                                            setPosition('');
                                            setSelectedClass('All');
                                            setSearchTerm('');
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/*<div>*/}
                                    {/*    <label className="block text-sm font-medium text-gray-700 mb-1">*/}
                                    {/*        {t('teams.members.position')}*/}
                                    {/*    </label>*/}
                                    {/*    <input*/}
                                    {/*        type="text"*/}
                                    {/*        value={position}*/}
                                    {/*        onChange={(e) => setPosition(e.target.value)}*/}
                                    {/*        className="w-full px-3 py-2 border border-gray-300 rounded-lg"*/}
                                    {/*        placeholder={t('teams.members.positionPlaceholder')}*/}
                                    {/*    />*/}
                                    {/*</div>*/}

                                    {/* ✅ Filters Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Class Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <Filter className="w-4 h-4" />
                                                {t('teams.members.filterByClass')}
                                            </label>
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="All">{t('teams.members.allClasses')}</option>
                                                {uniqueClasses.map((className) => (
                                                    <option key={className} value={className}>
                                                        {className}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* ✅ Name Search */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('teams.members.searchByName')}
                                            </label>
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder={t('teams.members.searchPlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('teams.members.selectStudents')}
                                            <span className="text-gray-500 ml-2">
                                                ({filteredStudents.length} {t('teams.members.available')})
                                            </span>
                                        </label>
                                        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                                            {filteredStudents.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500 text-sm">
                                                    {t('teams.members.noStudentsFound')}
                                                </div>
                                            ) : (
                                                filteredStudents.map((student) => {
                                                    const gradeName = student.gradeName || student.grade || '';
                                                    const className = student.className || student.class || '';
                                                    const fullClass = `${gradeName} ${className}`.trim();

                                                    return (
                                                        <label
                                                            key={student.studentID}
                                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.includes(student.studentID)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedStudents([...selectedStudents, student.studentID]);
                                                                    } else {
                                                                        setSelectedStudents(selectedStudents.filter(id => id !== student.studentID));
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <span className="text-sm">
                                                                {student.fullName} ({student.studentCode})
                                                                {fullClass && <span className="text-gray-500"> - {fullClass}</span>}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddMembers}
                                        disabled={selectedStudents.length === 0}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {t('teams.members.addCount', { count: selectedStudents.length })}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Members List */}
                        <div className="space-y-2">
                            {team.members.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>{t('teams.members.noMembers')}</p>
                                </div>
                            ) : (
                                team.members.map((member) => (
                                    <div
                                        key={member.teamMemberID}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg">
                                                <User className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{member.studentName}</p>
                                                    {member.isCaptain && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                                            <Star className="w-3 h-3 inline mr-1" />
                                                            {t('teams.members.captain')}
                                                        </span>
                                                    )}
                                                    {member.isViceCaptain && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                                            {t('teams.members.viceCaptain')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>{member.studentCode}</span>
                                                    <span>{member.grade} {member.class}</span>
                                                    {member.position && <span>• {member.position}</span>}
                                                    {member.jerseyNumber && (
                                                        <span className="flex items-center gap-1">
                                                            <Hash className="w-3 h-3" />
                                                            {member.jerseyNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/*<button*/}
                                            {/*    onClick={() => setEditingMember(member)}*/}
                                            {/*    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"*/}
                                            {/*    title={t('teams.actions.edit')}*/}
                                            {/*>*/}
                                            {/*    <Edit className="w-4 h-4" />*/}
                                            {/*</button>*/}
                                            <button
                                                onClick={() => handleRemoveMember(member.teamMemberID, member.studentName)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title={t('teams.members.remove')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Member Modal */}
                {editingMember && (
                    <EditMemberModal
                        member={editingMember}
                        onClose={() => setEditingMember(null)}
                        onSave={(updates) => handleUpdateMember(editingMember.teamMemberID, updates)}
                    />
                )}
            </div>
        </div>
    );
};

// Edit Member Modal Component
const EditMemberModal = ({
    member,
    onClose,
    onSave
}: {
    member: TeamMemberDto;
    onClose: () => void;
    onSave: (updates: UpdateTeamMemberRequest) => void;
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UpdateTeamMemberRequest>({
        position: member.position || '',
        jerseyNumber: member.jerseyNumber || '',
        isCaptain: member.isCaptain,
        isViceCaptain: member.isViceCaptain
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('teams.members.editDetails')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            {t('teams.members.editing')}: <strong>{member.studentName}</strong> ({member.studentCode})
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('teams.members.position')}
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder={t('teams.members.positionPlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('teams.members.jerseyNumber')}
                        </label>
                        <input
                            type="text"
                            value={formData.jerseyNumber}
                            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder={t('teams.members.jerseyPlaceholder')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isCaptain}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    isCaptain: e.target.checked,
                                    isViceCaptain: e.target.checked ? false : formData.isViceCaptain
                                })}
                                className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">{t('teams.members.captain')}</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isViceCaptain}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    isViceCaptain: e.target.checked,
                                    isCaptain: e.target.checked ? false : formData.isCaptain
                                })}
                                className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">{t('teams.members.viceCaptain')}</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {t('teams.actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {t('teams.actions.saveChanges')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamDetailsModal;