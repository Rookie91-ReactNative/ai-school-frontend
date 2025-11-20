import api from './api';

// ============================================
// ENUMS
// ============================================
export enum ActivityType {
    // Sports
    Football = 0,
    Basketball = 1,
    Badminton = 2,
    TableTennis = 3,
    Volleyball = 4,
    Netball = 5,
    Athletics = 6,
    Swimming = 7,
    Cricket = 8,
    Rugby = 9,
    Hockey = 10,
    SepakTakraw = 11,
    MartialArts = 12,
    Gymnastics = 13,
    // Performing Arts
    _24FestiveDrums = 14,
    Choir = 15,
    Orchestra = 16,
    Dance = 17,
    Drama = 18,
    TraditionalMusic = 19,
    // Academic & Cultural
    Debate = 20,
    ScienceClub = 21,
    MathematicsClub = 22,
    LanguageClub = 23,
    HistoryClub = 24,
    GeographyClub = 25,
    RoboticsClub = 26,
    ITClub = 27,
    PhotographyClub = 28,
    Chess = 29,
    // Creative & Visual Arts
    ArtAndCraft = 30,
    Painting = 31,
    Sculpture = 32,
    Calligraphy = 33,
    // Uniformed Bodies
    Scouts = 34,
    GirlGuides = 35,
    Cadet = 36,
    StJohnAmbulance = 37,
    RedCrescent = 38,
    // Service & Leadership
    Prefect = 39,
    StudentCouncil = 40,
    LibraryClub = 41,
    EnvironmentalClub = 42,
    // Other
    Other = 43
}

export const ActivityTypeLabels: Record<ActivityType, string> = {
    [ActivityType.Football]: 'Football/Soccer',
    [ActivityType.Basketball]: 'Basketball',
    [ActivityType.Badminton]: 'Badminton',
    [ActivityType.TableTennis]: 'Table Tennis',
    [ActivityType.Volleyball]: 'Volleyball',
    [ActivityType.Netball]: 'Netball',
    [ActivityType.Athletics]: 'Athletics',
    [ActivityType.Swimming]: 'Swimming',
    [ActivityType.Cricket]: 'Cricket',
    [ActivityType.Rugby]: 'Rugby',
    [ActivityType.Hockey]: 'Hockey',
    [ActivityType.SepakTakraw]: 'Sepak Takraw',
    [ActivityType.MartialArts]: 'Martial Arts',
    [ActivityType.Gymnastics]: 'Gymnastics',
    [ActivityType._24FestiveDrums]: '24 Festive Drums',
    [ActivityType.Choir]: 'Choir',
    [ActivityType.Orchestra]: 'Orchestra',
    [ActivityType.Dance]: 'Dance',
    [ActivityType.Drama]: 'Drama',
    [ActivityType.TraditionalMusic]: 'Traditional Music',
    [ActivityType.Debate]: 'Debate',
    [ActivityType.ScienceClub]: 'Science Club',
    [ActivityType.MathematicsClub]: 'Mathematics Club',
    [ActivityType.LanguageClub]: 'Language Club',
    [ActivityType.HistoryClub]: 'History Club',
    [ActivityType.GeographyClub]: 'Geography Club',
    [ActivityType.RoboticsClub]: 'Robotics Club',
    [ActivityType.ITClub]: 'IT Club',
    [ActivityType.PhotographyClub]: 'Photography Club',
    [ActivityType.Chess]: 'Chess',
    [ActivityType.ArtAndCraft]: 'Art & Craft',
    [ActivityType.Painting]: 'Painting',
    [ActivityType.Sculpture]: 'Sculpture',
    [ActivityType.Calligraphy]: 'Calligraphy',
    [ActivityType.Scouts]: 'Scouts',
    [ActivityType.GirlGuides]: 'Girl Guides',
    [ActivityType.Cadet]: 'Cadet',
    [ActivityType.StJohnAmbulance]: 'St. John Ambulance',
    [ActivityType.RedCrescent]: 'Red Crescent',
    [ActivityType.Prefect]: 'Prefect',
    [ActivityType.StudentCouncil]: 'Student Council',
    [ActivityType.LibraryClub]: 'Library Club',
    [ActivityType.EnvironmentalClub]: 'Environmental Club',
    [ActivityType.Other]: 'Other'
};

// Category groupings
export const ActivityCategories = {
    'Sports': [
        ActivityType.Football, ActivityType.Basketball, ActivityType.Badminton,
        ActivityType.TableTennis, ActivityType.Volleyball, ActivityType.Netball,
        ActivityType.Athletics, ActivityType.Swimming, ActivityType.Cricket,
        ActivityType.Rugby, ActivityType.Hockey, ActivityType.SepakTakraw,
        ActivityType.MartialArts, ActivityType.Gymnastics
    ],
    'Performing Arts': [
        ActivityType.Choir, ActivityType.Orchestra, ActivityType.Dance,
        ActivityType.Drama, ActivityType.TraditionalMusic
    ],
    'Academic & Cultural': [
        ActivityType.Debate, ActivityType.ScienceClub, ActivityType.MathematicsClub,
        ActivityType.LanguageClub, ActivityType.HistoryClub, ActivityType.GeographyClub,
        ActivityType.RoboticsClub, ActivityType.ITClub, ActivityType.PhotographyClub,
        ActivityType.Chess
    ],
    'Creative & Visual Arts': [
        ActivityType.ArtAndCraft, ActivityType.Painting, ActivityType.Sculpture,
        ActivityType.Calligraphy
    ],
    'Uniformed Bodies': [
        ActivityType.Scouts, ActivityType.GirlGuides, ActivityType.Cadet,
        ActivityType.StJohnAmbulance, ActivityType.RedCrescent
    ],
    'Service & Leadership': [
        ActivityType.Prefect, ActivityType.StudentCouncil, ActivityType.LibraryClub,
        ActivityType.EnvironmentalClub
    ],
    'Other': [ActivityType.Other]
};

// ============================================
// INTERFACES
// ============================================
export interface TeacherDto {
    teacherID: number;
    teacherCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    subject?: string;
    specialization?: string;
    isActive: boolean;
}

export interface TeamMemberDto {
    teamMemberID: number;
    studentID: number;
    studentCode: string;
    studentName: string;
    grade: string;
    class: string;
    position?: string;
    jerseyNumber?: string;
    isCaptain: boolean;
    isViceCaptain: boolean;
    joinDate: string;
    isActive: boolean;
}

export interface TeamWithDetails {
    teamID: number;
    teamName: string;
    teamCode: string;
    activityType: ActivityType;
    activityTypeName: string;
    activityCategory: string;
    coach?: TeacherDto;
    assistantCoach?: TeacherDto;
    ageGroup?: string;
    division?: string;
    description?: string;
    trainingSchedule?: string;
    trainingVenue?: string;
    maxMembers: number;
    currentMemberCount: number;
    isActive: boolean;
    establishedDate: string;
    achievements?: string;
    members: TeamMemberDto[];
}

export interface TeamCreateDto {
    teamName: string;
    teamCode: string;
    activityType: ActivityType;
    coachTeacherID?: number;
    assistantCoachID?: number;
    ageGroup?: string;
    division?: string;
    description?: string;
    trainingSchedule?: string;
    trainingVenue?: string;
    maxMembers: number;
    establishedDate: string;
}

// CRITICAL: Must match backend C# DTO exactly (including Remarks field)!
// Backend has non-nullable strings (must send empty string if empty)
export interface TeamUpdateDto {
    teamName: string;                    // Required
    coachTeacherID?: number | undefined; // Optional (nullable in C#)
    assistantCoachID?: number | undefined; // Optional (nullable in C#)
    ageGroup: string | undefined;        // Non-nullable in C# - send "" if empty
    division: string | undefined;        // Non-nullable in C# - send "" if empty
    description: string | undefined;     // Non-nullable in C# - send "" if empty
    trainingSchedule: string | undefined; // Non-nullable in C# - send "" if empty
    trainingVenue: string | undefined;   // Non-nullable in C# - send "" if empty
    maxMembers: number;                  // Required
    isActive: boolean;                   // Required
    achievements: string | undefined;    // Non-nullable in C# - send "" if empty
    remarks: string | undefined;         // Non-nullable in C# - send "" if empty (MUST INCLUDE!)
}

export interface AddTeamMemberRequest {
    teamID: number;
    studentIDs: number[];
    position?: string;
}

export interface UpdateTeamMemberRequest {
    position?: string;
    jerseyNumber?: string;
    isCaptain: boolean;
    isViceCaptain: boolean;
}

// ============================================
// SERVICE
// ============================================
export const teamService = {
    // Get all teams for the school
    getAllTeams: async (activeOnly: boolean = true): Promise<TeamWithDetails[]> => {
        const response = await api.get(`/team?activeOnly=${activeOnly}`);
        return response.data.data;
    },

    // Get team by ID with full details
    getTeamById: async (id: number): Promise<TeamWithDetails> => {
        const response = await api.get(`/team/${id}`);
        return response.data.data;
    },

    // Create new team
    createTeam: async (team: TeamCreateDto): Promise<TeamWithDetails> => {
        const response = await api.post('/team', team);
        return response.data.data;
    },

    // Update team
    updateTeam: async (id: number, team: TeamUpdateDto): Promise<void> => {
        await api.put(`/team/${id}`, team);
    },

    // Add members to team
    addTeamMembers: async (teamId: number, request: AddTeamMemberRequest): Promise<void> => {
        await api.post(`/team/${teamId}/members`, request);
    },

    // Update team member
    updateTeamMember: async (memberId: number, member: UpdateTeamMemberRequest): Promise<void> => {
        await api.put(`/team/members/${memberId}`, member);
    },

    // Remove team member
    removeTeamMember: async (memberId: number): Promise<void> => {
        await api.delete(`/team/members/${memberId}`);
    }
};
