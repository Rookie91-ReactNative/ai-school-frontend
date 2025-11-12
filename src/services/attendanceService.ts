import api from './api';
import type { AttendanceSummary, AttendanceRecord, AbsentStudent, RecentDetection, ApiResponse } from '../types';

export const attendanceService = {
    getTodaySummary: async (): Promise<AttendanceSummary> => {
        const response = await api.get<ApiResponse<AttendanceSummary>>('/attendance/summary');
        return response.data.data;
    },

    getTodayAttendance: async (classId?: number): Promise<AttendanceRecord[]> => {
        const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/today', {
            params: { classId },
        });
        return response.data.data;
    },

    getAbsentToday: async (): Promise<AbsentStudent[]> => {
        const response = await api.get<ApiResponse<{ students: AbsentStudent[] }>>('/attendance/absent-today');
        return response.data.data.students;
    },

    getRecentDetections: async (count: number = 10): Promise<RecentDetection[]> => {
        const response = await api.get<ApiResponse<RecentDetection[]>>('/attendance/recent-detections', {
            params: { count },
        });
        return response.data.data;
    },
};