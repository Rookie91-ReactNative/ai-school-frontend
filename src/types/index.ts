// User types
export interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  userRole: string;
  schoolId?: number;
  schoolName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  permissions: string[];
  message: string;
}

// Student types
export interface Student {
    studentID: number;
    schoolID: number;
    studentCode: string;
    fullName: string;
    otherName?: string;
    email?: string;
    phoneNumber?: string;
    parentContact?: string;
    parentEmail?: string;
    parentName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    isActive: boolean;
    enrollmentDate?: string;
    graduationDate?: string;
    createdDate?: string;
    updatedDate?: string;
}

// Student Face Image
export interface FaceImage {
    imageID: number;
    studentID: number;
    imagePath: string;
    isPrimary: boolean;
    academicYearID: number | null;
    uploadedDate: string;
    isActive: boolean;
}

export interface CreateStudentDto {
    schoolID: number;
    studentCode: string;
    fullName: string;
    otherName?: string;  // <-- ADD THIS LINE
    email?: string;
    phoneNumber?: string;
    parentName?: string;
    parentContact?: string;
    parentEmail?: string;
    dateOfBirth?: string;
    gender: string;
    address?: string;
    enrollmentDate?: string;
}

// Attendance types
export interface AttendanceSummary {
  totalStudents: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  attendanceRate: number;
  date: string;
}

export interface AttendanceRecord {
  attendanceID: number;
  studentCode: string;
  fullName: string;
  grade: string;
  class: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  cameraName: string;
  attendanceDate: string;
}

export interface AbsentStudent {
  studentID: number;
  studentCode: string;
  fullName: string;
  grade: string;
  class: string;
  parentContact: string;
  parentEmail: string;
}

export interface RecentDetection {
  logID: number;
  studentCode: string;
  fullName: string;
  detectionTime: string;
  confidence: number;
  cameraName: string;
  snapshotPath: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  messageKey: string;
  data: T;
  errors: string[];
  language: string;
  timestamp: string;
}

export type BackendUser = {
    userID?: number;
    userId?: number;
    username?: string;
    Username?: string;
    fullName?: string;
    FullName?: string;
    email?: string;
    Email?: string;
    userRole?: string;
    UserRole?: string;
    schoolID?: number;
    schoolId?: number;
    schoolName?: string;
    SchoolName?: string;
};
