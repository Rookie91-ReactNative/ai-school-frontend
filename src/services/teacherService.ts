import api from './api';

export interface Teacher {
    teacherID: number;
    teacherCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    subject: string;
    specialization: string;
    isActive: boolean;
    isAdmin: boolean;
    adminPosition?: string;
    joinDate: string;
    resignDate?: string;
    remarks?: string;
    userID?: number;
    username?: string;
    userRole?: string;
    hasUserAccount?: boolean;
}

export interface CreateTeacherWithUserDto {
    // Teacher Info
    teacherCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    subject: string;
    specialization: string;
    joinDate: string;
    isAdmin: boolean;
    adminPosition?: string;

    // User Account (Optional)
    createUserAccount: boolean;
    username?: string;
    password?: string; // Optional - will auto-generate if not provided
}

export interface UpdateTeacherDto {
    fullName: string;
    email: string;
    phoneNumber: string;
    subject: string;
    specialization: string;
    isActive: boolean;
    isAdmin: boolean;
    adminPosition?: string;
}

export interface CreateUserForTeacherDto {
    username: string;
    password?: string; // Optional - will auto-generate if not provided
}

export interface LinkTeacherUserDto {
    userID: number;
}

// Response type for teacher creation
export interface CreateTeacherResponse {
    teacherID: number;
    teacherCode: string;
    fullName: string;
    userID?: number;
    username?: string;
    generatedPassword?: string;
}

// Response type for user creation
export interface CreateUserResponse {
    userID: number;
    username: string;
    generatedPassword?: string;
}

export const teacherService = {
    // Get all teachers
    getAllTeachers: async (activeOnly: boolean = true): Promise<Teacher[]> => {
        const response = await api.get(`/teacher?activeOnly=${activeOnly}`);
        return response.data.data;
    },

    // Get teacher by ID
    getTeacherById: async (id: number): Promise<Teacher> => {
        const response = await api.get(`/teacher/${id}`);
        return response.data.data;
    },

    // Create new teacher (with optional user account)
    createTeacher: async (teacher: CreateTeacherWithUserDto): Promise<CreateTeacherResponse> => {
        const response = await api.post('/teacher', teacher);
        return response.data.data;
    },

    // Update teacher
    updateTeacher: async (id: number, teacher: UpdateTeacherDto): Promise<void> => {
        await api.put(`/teacher/${id}`, teacher);
    },

    // Deactivate teacher (and optionally their user account)
    deactivateTeacher: async (id: number, deactivateUser: boolean = true): Promise<void> => {
        await api.delete(`/teacher/${id}?deactivateUser=${deactivateUser}`);
    },

    // Create user account for existing teacher
    createUserForTeacher: async (teacherId: number, data: CreateUserForTeacherDto): Promise<CreateUserResponse> => {
        const response = await api.post(`/teacher/${teacherId}/create-user`, data);
        return response.data.data;
    },

    // Link teacher to existing user
    linkTeacherToUser: async (teacherId: number, data: LinkTeacherUserDto): Promise<void> => {
        await api.post(`/teacher/${teacherId}/link-user`, data);
    }
};