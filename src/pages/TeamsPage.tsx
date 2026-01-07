import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslatedActivityType } from '../utils/activityTypeTranslations';
import {
    Users, Plus, Search, Filter, Eye, Edit, Calendar,
    MapPin, User, Trophy, Star
} from 'lucide-react';
import { teamService, ActivityType, ActivityTypeLabels, ActivityCategories, type TeamWithDetails } from '../services/teamService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Pagination from '../components/Common/Pagination';
import AddTeamModal from '../components/Teams/AddTeamModal';
import EditTeamModal from '../components/Teams/EditTeamModal';
import TeamDetailsModal from '../components/Teams/TeamDetailsModal';

const TeamsPage = () => {
    const { t } = useTranslation();
    const [teams, setTeams] = useState<TeamWithDetails[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<TeamWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | 'All'>('All');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
    const [viewTeamId, setViewTeamId] = useState<number | null>(null);
    const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        loadTeams();
    }, [showActiveOnly]);

    useEffect(() => {
        filterTeams();
    }, [teams, searchTerm, selectedCategory, selectedActivityType]);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const data = await teamService.getAllTeams(showActiveOnly);
            setTeams(data);
        } catch (error) {
            console.error('Error loading teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTeams = () => {
        let filtered = [...teams];

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(team =>
                team.teamName.toLowerCase().includes(searchLower) ||
                team.teamCode.toLowerCase().includes(searchLower) ||
                team.activityTypeName.toLowerCase().includes(searchLower) ||
                team.coach?.fullName.toLowerCase().includes(searchLower)
            );
        }

        // Category filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(team => team.activityCategory === selectedCategory);
        }

        // Activity Type filter
        if (selectedActivityType !== 'All') {
            filtered = filtered.filter(team => team.activityType === selectedActivityType);
        }

        setFilteredTeams(filtered);
        setCurrentPage(1);
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTeams = filteredTeams.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

    const handleViewTeam = (teamId: number) => {
        setViewTeamId(teamId);
    };

    const handleEditTeam = async (team: TeamWithDetails) => {
        try {
            setLoadingTeamDetails(true);
            const fullTeamDetails = await teamService.getTeamById(team.teamID);
            setSelectedTeam(fullTeamDetails);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error loading team details:', error);
            alert(t('teams.errors.loadFailed'));
        } finally {
            setLoadingTeamDetails(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                            {t('teams.title')}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                            {t('teams.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        {t('teams.actions.createTeam')}
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="sm:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('teams.search.placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="All">{t('teams.filters.allCategories')}</option>
                                {Object.keys(ActivityCategories).map((category) => (
                                    <option key={category} value={category}>
                                        {t(`teams.categories.${category.toLowerCase().replace(/\s+/g, '')}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Activity Type Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={selectedActivityType}
                                onChange={(e) => setSelectedActivityType(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="All">{t('teams.filters.allTypes')}</option>
                                {Object.entries(ActivityCategories).map(([category, types]) => (
                                    <optgroup key={category} label={t(`teams.categories.${category.toLowerCase().replace(/\s+/g, '')}`)}>
                                        {types.map((type) => (
                                            <option key={type} value={type}>
                                                {ActivityTypeLabels[type]}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active/Inactive Toggle */}
                    <div className="mt-3 sm:mt-4 flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showActiveOnly}
                                onChange={(e) => setShowActiveOnly(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{t('teams.filters.showActiveOnly')}</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-600">
                    {t('teams.results.showing', {
                        count: filteredTeams.length,
                        total: teams.length
                    })}
                </p>
            </div>

            {/* Empty State */}
            {filteredTeams.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        {t('teams.empty.title')}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                        {searchTerm || selectedCategory !== 'All' || selectedActivityType !== 'All'
                            ? t('teams.empty.noResults')
                            : t('teams.empty.noTeams')}
                    </p>
                    {!searchTerm && selectedCategory === 'All' && selectedActivityType === 'All' && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            {t('teams.actions.createTeam')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Teams Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {currentTeams.map((team) => (
                            <div
                                key={team.teamID}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                                                {team.teamName}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-600 font-mono">
                                                {team.teamCode}
                                            </p>
                                        </div>
                                        {team.isActive ? (
                                            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full flex-shrink-0">
                                                {t('teams.status.active')}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full flex-shrink-0">
                                                {t('teams.status.inactive')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            {t(`teams.categories.${team.activityCategory.toLowerCase().replace(/\s+/g, '')}`)}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {getTranslatedActivityType(team.activityTypeName, t)}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                    {/* Coach */}
                                    {team.coach && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600">{t('teams.fields.coach')}:</span>
                                            <span className="font-medium text-gray-900 truncate">
                                                {team.coach.fullName}
                                            </span>
                                        </div>
                                    )}

                                    {/* Members */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-600">
                                            {t('teams.fields.members', {
                                                current: team.currentMemberCount,
                                                max: team.maxMembers
                                            })}
                                        </span>
                                    </div>

                                    {/* Training Schedule */}
                                    {team.trainingSchedule && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600 truncate">
                                                {team.trainingSchedule}
                                            </span>
                                        </div>
                                    )}

                                    {/* Training Venue */}
                                    {team.trainingVenue && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600 truncate">
                                                {team.trainingVenue}
                                            </span>
                                        </div>
                                    )}

                                    {/* Achievements */}
                                    {team.achievements && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <Trophy className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-600 text-xs line-clamp-2">
                                                {team.achievements}
                                            </span>
                                        </div>
                                    )}

                                    {/* Division/Age Group */}
                                    {(team.division || team.ageGroup) && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Star className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                {[team.division, team.ageGroup].filter(Boolean).join(' • ')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Actions */}
                                <div className="p-3 sm:p-4 border-t bg-gray-50 flex gap-2">
                                    <button
                                        onClick={() => handleViewTeam(team.teamID)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        {t('teams.actions.view')}
                                    </button>
                                    <button
                                        onClick={() => handleEditTeam(team)}
                                        disabled={loadingTeamDetails}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Edit className="w-4 h-4" />
                                        {loadingTeamDetails ? t('teams.actions.loading') : t('teams.actions.edit')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 mt-4 sm:mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredTeams.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {isAddModalOpen && (
                <AddTeamModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        loadTeams();
                    }}
                />
            )}

            {isEditModalOpen && selectedTeam && (
                <EditTeamModal
                    team={selectedTeam}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedTeam(null);
                    }}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedTeam(null);
                        loadTeams();
                    }}
                />
            )}

            {viewTeamId && (
                <TeamDetailsModal
                    teamId={viewTeamId}
                    onClose={() => setViewTeamId(null)}
                    onEdit={() => {
                        const team = teams.find(t => t.teamID === viewTeamId);
                        if (team) {
                            setViewTeamId(null);
                            handleEditTeam(team);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default TeamsPage;