import api from './api';
import type { Student, ApiResponse, CreateStudentDto, FaceImage } from '../types';

export const studentService = {
    getAllStudents: async (): Promise<Student[]> => {
        const response = await api.get<ApiResponse<Student[]>>('/student');
        return response.data.data;
    },

    getStudentByCode: async (code: string): Promise<Student> => {
        const response = await api.get<ApiResponse<Student>>(`/student/code/${code}`);
        return response.data.data;
    },

    createStudent: async (data: CreateStudentDto): Promise<ApiResponse<{ studentId: number; studentCode: string }>> => {
        const response = await api.post<ApiResponse<{ studentId: number; studentCode: string }>>('/student', data);
        return response.data;
    },

    updateStudent: async (id: number, data: CreateStudentDto): Promise<ApiResponse<void>> => {
        const response = await api.put<ApiResponse<void>>(`/student/${id}`, data);
        return response.data;
    },

    uploadPhotos: async (studentCode: string, files: FileList) => {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('images', file);
        });

        const response = await api.post(
            `/student/${studentCode}/upload-images`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // ============= PHOTO MANAGEMENT METHODS =============

    /**
     * Get all photos for a student
     * @param studentCode - Student code
     * @param includeInactive - Include deactivated photos
     */
    getStudentPhotos: async (studentCode: string, includeInactive: boolean = false): Promise<FaceImage[]> => {
        const response = await api.get<ApiResponse<FaceImage[]>>(
            `/student/${studentCode}/photos`,
            {
                params: { includeInactive }
            }
        );
        return response.data.data;
    },

    /**
     * Deactivate a photo (soft delete)
     * @param imageId - Photo ID to deactivate
     */
    deactivatePhoto: async (imageId: number): Promise<void> => {
        await api.patch(`/student/photos/${imageId}/deactivate`);
    },

    /**
     * Activate a photo (undo soft delete)
     * @param imageId - Photo ID to activate
     */
    activatePhoto: async (imageId: number): Promise<void> => {
        await api.patch(`/student/photos/${imageId}/activate`);
    },

    /**
     * Permanently delete a photo
     * @param imageId - Photo ID to delete
     */
    deletePhoto: async (imageId: number): Promise<void> => {
        await api.delete(`/student/photos/${imageId}`);
    },

    /**
     * Bulk deactivate multiple photos
     * @param imageIds - Array of photo IDs to deactivate
     */
    bulkDeactivatePhotos: async (imageIds: number[]): Promise<void> => {
        await api.post('/student/photos/bulk-deactivate', imageIds);
    },

    /**
     * Get photo statistics for a student
     * @param studentCode - Student code
     */
    getPhotoStatistics: async (studentCode: string): Promise<{
        totalPhotos: number;
        activePhotos: number;
        inactivePhotos: number;
    }> => {
        const photos = await studentService.getStudentPhotos(studentCode, true);
        return {
            totalPhotos: photos.length,
            activePhotos: photos.filter(p => p.isActive).length,
            inactivePhotos: photos.filter(p => !p.isActive).length,
        };
    },
};