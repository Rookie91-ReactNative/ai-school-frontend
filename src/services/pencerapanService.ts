import api from './api';

// ============================================================
//  TYPES
// ============================================================

export interface PencerapanPhoto {
    photoID: number;
    reportID: number;
    blobStorageUrl: string;
    blobName: string;
    caption?: string;
    sortOrder: number;
    sourceType: 'Uploaded' | 'StudentPhoto' | 'TeacherPhoto';
    createdDate: string;
}

export interface PencerapanSummary {
    reportID: number;
    schoolID: number;
    teacherID: number;
    teacherName?: string;
    teacherFullName?: string;
    academicYearID: number;
    academicYearName?: string;
    classID?: number;
    className?: string;
    pencerapanNo: 1 | 2;
    pencerapanLabel: string;   // "Pertama" | "Kedua"
    subject: string;
    dateOfObservation: string;
    status: 'Draft' | 'Finalized';
    preparedBy?: string;
    photoCount: number;
    createdDate: string;
    updatedDate?: string;
}

export interface PencerapanDetail extends PencerapanSummary {
    schoolName?: string;
    schoolAddress?: string;
    timeStart?: string;
    timeEnd?: string;
    timeRange?: string;
    photos: PencerapanPhoto[];
}

export interface PencerapanCreateDto {
    teacherID: number;
    academicYearID: number;
    classID?: number;
    pencerapanNo: 1 | 2;
    subject: string;
    dateOfObservation: string;   // ISO date string
    timeStart?: string;          // "HH:mm"
    timeEnd?: string;            // "HH:mm"
    preparedBy?: string;
    status: 'Draft' | 'Finalized';
}

export interface PencerapanUpdateDto {
    teacherID?: number;
    academicYearID?: number;
    classID?: number;
    pencerapanNo?: 1 | 2;
    subject?: string;
    dateOfObservation?: string;
    timeStart?: string;
    timeEnd?: string;
    preparedBy?: string;
    status?: 'Draft' | 'Finalized';
}

export interface PencerapanQueryParams {
    page?: number;
    pageSize?: number;
    academicYearID?: number;
    teacherID?: number;
    status?: 'Draft' | 'Finalized' | '';
}

export interface PencerapanListResponse {
    items: PencerapanSummary[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PhotoOrderItem {
    photoID: number;
    sortOrder: number;
    caption?: string;
}

// ============================================================
//  SERVICE
// ============================================================

export const pencerapanService = {

    // ── Reports ─────────────────────────────────────────────

    getReports: async (params: PencerapanQueryParams = {}): Promise<PencerapanListResponse> => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', String(params.page));
        if (params.pageSize) query.append('pageSize', String(params.pageSize));
        if (params.academicYearID) query.append('academicYearId', String(params.academicYearID));
        if (params.teacherID) query.append('teacherId', String(params.teacherID));
        if (params.status) query.append('status', params.status);

        const response = await api.get(`/pencerapan?${query.toString()}`);
        return response.data.data;
    },

    getReportById: async (id: number): Promise<PencerapanDetail> => {
        const response = await api.get(`/pencerapan/${id}`);
        return response.data.data;
    },

    createReport: async (dto: PencerapanCreateDto): Promise<PencerapanDetail> => {
        const response = await api.post('/pencerapan', dto);
        return response.data.data;
    },

    updateReport: async (id: number, dto: PencerapanUpdateDto): Promise<PencerapanDetail> => {
        const response = await api.put(`/pencerapan/${id}`, dto);
        return response.data.data;
    },

    deleteReport: async (id: number): Promise<void> => {
        await api.delete(`/pencerapan/${id}`);
    },

    // ── Word Document ────────────────────────────────────────

    downloadReport: async (id: number, fileName: string): Promise<void> => {
        const response = await api.get(`/pencerapan/${id}/download`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    // ── Photos ───────────────────────────────────────────────

    uploadPhoto: async (
        reportId: number,
        file: File,
        caption?: string,
        sortOrder: number = 0
    ): Promise<PencerapanPhoto> => {
        const formData = new FormData();
        formData.append('file', file);
        if (caption) formData.append('caption', caption);
        if (sortOrder) formData.append('sortOrder', String(sortOrder));

        const response = await api.post(
            `/pencerapan/${reportId}/photos/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data.data;
    },

    deletePhoto: async (reportId: number, photoId: number): Promise<void> => {
        await api.delete(`/pencerapan/${reportId}/photos/${photoId}`);
    },

    reorderPhotos: async (reportId: number, photos: PhotoOrderItem[]): Promise<void> => {
        await api.put(`/pencerapan/${reportId}/photos/reorder`, { photos });
    },
};