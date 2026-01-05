import api from './api';

// ============================================
// ENUMS
// ============================================
export enum EventType {
    Training = 0,
    SchoolCompetition = 1,
    DistrictCompetition = 2,
    StateCompetition = 3,
    NationalCompetition = 4,
    InternationalCompetition = 5,
    FriendlyMatch = 6,
    Performance = 7,
    Workshop = 8,
    Camp = 9,
    Other = 10
}

export enum EventStatus {
    Planned = 0,
    Confirmed = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    Postponed = 5
}

// ✅ NEW - Event Mode Enum
export enum EventMode {
    Offline = 0,
    Online = 1
}

export const EventTypeLabels: Record<EventType, string> = {
    [EventType.Training]: 'Training Session',
    [EventType.SchoolCompetition]: 'School Competition',
    [EventType.DistrictCompetition]: 'District Competition',
    [EventType.StateCompetition]: 'State Competition',
    [EventType.NationalCompetition]: 'National Competition',
    [EventType.InternationalCompetition]: 'International Competition',
    [EventType.FriendlyMatch]: 'Friendly Match',
    [EventType.Performance]: 'Performance',
    [EventType.Workshop]: 'Workshop',
    [EventType.Camp]: 'Camp',
    [EventType.Other]: 'Other'
};

export const EventStatusLabels: Record<EventStatus, string> = {
    [EventStatus.Planned]: 'Planned',
    [EventStatus.Confirmed]: 'Confirmed',
    [EventStatus.InProgress]: 'In Progress',
    [EventStatus.Completed]: 'Completed',
    [EventStatus.Cancelled]: 'Cancelled',
    [EventStatus.Postponed]: 'Postponed'
};

export const EventStatusColors: Record<EventStatus, string> = {
    [EventStatus.Planned]: 'bg-gray-100 text-gray-800',
    [EventStatus.Confirmed]: 'bg-blue-100 text-blue-800',
    [EventStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
    [EventStatus.Completed]: 'bg-green-100 text-green-800',
    [EventStatus.Cancelled]: 'bg-red-100 text-red-800',
    [EventStatus.Postponed]: 'bg-orange-100 text-orange-800'
};

// ✅ NEW - Event Mode Labels
export const EventModeLabels: Record<EventMode, string> = {
    [EventMode.Offline]: 'Offline',
    [EventMode.Online]: 'Online'
};

// ✅ NEW - Event Mode Colors (for badges/display)
export const EventModeColors: Record<EventMode, string> = {
    [EventMode.Offline]: 'bg-purple-100 text-purple-800',
    [EventMode.Online]: 'bg-cyan-100 text-cyan-800'
};

// ============================================
// INTERFACES
// ============================================
export interface ActivityEvent {
    eventID: number;
    schoolID: number;
    teamID?: number;
    eventName: string;
    eventCode: string;
    eventType: EventType;
    activityType: number;
    status: EventStatus;
    eventMode: EventMode;  // ✅ NEW
    eventDate: string;
    endDate?: string;  // Multi-Day Events Support
    startTime: string;
    endTime?: string;
    venue?: string;  // ✅ UPDATED - Now optional
    venueAddress?: string;
    organizer?: string;
    opponentSchool?: string;
    leadingTeacherID?: number;
    transportationDetails?: string;
    uniformRequirements?: string;
    description?: string;
    specialInstructions?: string;
    requiresParentConsent: boolean;
    parentNotificationSent: boolean;
    notificationSentDate?: string;
    result?: string;
    awardsReceived?: string;
    remarks?: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    updatedDate?: string;
    updatedBy?: number;
}

// Teacher assignment interface
export interface EventTeacher {
    eventTeacherID: number;
    teacherID: number;
    teacherName: string;
    teacherEmail?: string;
    isPrimary: boolean;
}

export interface EventWithDetails extends ActivityEvent {
    team?: {
        teamID: number;
        teamName: string;
        activityType: number;
    };
    leadingTeacher?: {
        teacherID: number;
        fullName: string;
        email: string;
        phoneNumber: string;
    };
    // Multiple teachers support
    teachers: EventTeacher[];
    totalParticipants: number;
    confirmedParticipants: number;
    attendedParticipants: number;
    participants: EventParticipant[];
}

export interface EventParticipant {
    participantID: number;
    eventID: number;
    studentID: number;
    studentCode: string;
    studentName: string;
    gender: string;
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

export interface EventCreateDto {
    teamID?: number;
    eventName: string;
    eventCode: string;
    eventType: EventType;
    activityType: number;
    status: EventStatus;
    eventMode: EventMode;  // ✅ NEW
    eventDate: string;
    endDate?: string;  // Multi-Day Events Support
    startTime: string;
    endTime?: string;
    venue?: string;  // ✅ UPDATED - Now optional
    venueAddress?: string;
    organizer?: string;
    opponentSchool?: string;
    leadingTeacherID?: number;
    teacherIDs?: number[];  // Multiple teachers support
    primaryTeacherID?: number;  // Multiple teachers support
    transportationDetails?: string;
    uniformRequirements?: string;
    description?: string;
    specialInstructions?: string;
    requiresParentConsent: boolean;
    result?: string;
    awardsReceived?: string;
    remarks?: string;
}

export interface EventUpdateDto {
    eventName?: string;
    eventCode?: string;
    eventType?: EventType;
    activityType?: number;
    status?: EventStatus;
    eventMode?: EventMode;  // ✅ NEW
    eventDate?: string;
    endDate?: string;  // Multi-Day Events Support
    startTime?: string;
    endTime?: string;
    venue?: string;  // ✅ UPDATED - Now optional
    venueAddress?: string;
    organizer?: string;
    opponentSchool?: string;
    leadingTeacherID?: number;
    teacherIDs?: number[];  // Multiple teachers support
    primaryTeacherID?: number;  // Multiple teachers support
    transportationDetails?: string;
    uniformRequirements?: string;
    description?: string;
    specialInstructions?: string;
    requiresParentConsent?: boolean;
    teamID?: number;
    result?: string;
    awardsReceived?: string;
    remarks?: string;
}

export interface AddEventParticipantsRequest {
    teamID?: number;
    studentIDs?: number[];
    role?: string;
    isFromTeam: boolean;
}

export interface UpdateEventParticipantRequest {
    role?: string;
    position?: string;
    attendanceConfirmed: boolean;
    parentConsentReceived: boolean;
    attended: boolean;
    performance?: string;
    remarks?: string;
}

export interface EventCalendarItem {
    eventID: number;
    eventName: string;
    eventType: EventType;
    activityType: number;
    status: EventStatus;
    eventMode: EventMode;  // ✅ NEW
    eventDate: string;
    endDate?: string;  // Multi-Day Events Support
    startTime: string;
    venue?: string;  // ✅ UPDATED - Now optional
    teamName?: string;
    participantCount: number;
}

// ============================================
// SERVICE
// ============================================
export const eventService = {
    // Get all events for the school
    getAllEvents: async (
        startDate?: string,
        endDate?: string,
        eventType?: EventType,
        status?: EventStatus,
        teamId?: number
    ): Promise<ActivityEvent[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (eventType !== undefined) params.append('eventType', eventType.toString());
        if (status !== undefined) params.append('status', status.toString());
        if (teamId) params.append('teamId', teamId.toString());

        const response = await api.get(`/activityevent?${params.toString()}`);
        return response.data.data;
    },

    // Get event by ID with full details
    getEventById: async (id: number): Promise<EventWithDetails> => {
        const response = await api.get(`/activityevent/${id}`);
        return response.data.data;
    },

    // Create new event
    createEvent: async (event: EventCreateDto): Promise<ActivityEvent> => {
        const response = await api.post('/activityevent', event);
        return response.data.data;
    },

    // Update event
    updateEvent: async (id: number, event: EventUpdateDto): Promise<void> => {
        await api.put(`/activityevent/${id}`, event);
    },

    // Delete event
    deleteEvent: async (id: number): Promise<void> => {
        await api.delete(`/activityevent/${id}`);
    },

    // Add participants to event
    addParticipants: async (eventId: number, request: AddEventParticipantsRequest): Promise<void> => {
        await api.post(`/activityevent/${eventId}/participants`, request);
    },

    // Update participant
    updateParticipant: async (participantId: number, participant: UpdateEventParticipantRequest): Promise<void> => {
        await api.put(`/activityevent/participants/${participantId}`, participant);
    },

    // Remove participant
    removeParticipant: async (participantId: number): Promise<void> => {
        await api.delete(`/activityevent/participants/${participantId}`);
    },

    // Get calendar view
    getCalendar: async (month: number, year: number): Promise<EventCalendarItem[]> => {
        const response = await api.get(`/activityevent/calendar?month=${month}&year=${year}`);
        return response.data.data;
    },

    // Send parent notifications
    sendParentNotifications: async (eventId: number): Promise<void> => {
        await api.post(`/activityevent/${eventId}/notify-parents`);
    }
};