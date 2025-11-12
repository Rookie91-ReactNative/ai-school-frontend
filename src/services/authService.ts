import api from './api';
import axios from 'axios';

interface LoginCredentials {
    username: string;
    password: string;
}

interface AuthResponse {
    token: string;
    refreshToken: string;
    user: {
        userId: number;
        username: string;
        fullName: string;
        email: string;
        userRole: string;
        schoolID: number;
        schoolName: string;
    };
}

class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly USER_KEY = 'user_data';
    private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/login', credentials);
            const data = response.data.data;

            // Store tokens in localStorage for persistent sessions
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));

            // Set token expiry time (e.g., 8 hours from now)
            const expiryTime = new Date().getTime() + (8 * 60 * 60 * 1000); // 8 hours
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

            return data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || 'Login failed';
                throw new Error(message);
            }
            throw new Error('An unexpected error occurred during login.');
        }
    }

    logout(): void {
        // Clear all stored data
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }

    getToken(): string | null {
        // Check if token is expired
        if (this.isTokenExpired()) {
            this.logout();
            return null;
        }
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    getCurrentUser(): AuthResponse['user'] | null {
        const userStr = localStorage.getItem(this.USER_KEY);

        //console.log('getCurrentUser - Raw user string from localStorage:', userStr);

        if (!userStr) {
            //console.log('getCurrentUser - No user data found in localStorage');
            return null;
        }

        try {
            const user = JSON.parse(userStr);
            //console.log('getCurrentUser - Parsed user:', user);
            return user;
        } catch (error) {
            console.error('getCurrentUser - Error parsing user data:', error);
            return null;
        }
    }

    isAuthenticated(): boolean {
        // Check if token exists and is not expired
        if (this.isTokenExpired()) {
            this.logout();
            return false;
        }

        const token = this.getToken();
        const user = this.getCurrentUser();
        return !!token && !!user;
    }

    isTokenExpired(): boolean {
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiryTime) return true;

        const currentTime = new Date().getTime();
        return currentTime > parseInt(expiryTime);
    }

    async refreshAccessToken(): Promise<string | null> {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) return null;

            const response = await api.post('/auth/refresh', { refreshToken });
            const newToken = response.data.data.token;

            localStorage.setItem(this.TOKEN_KEY, newToken);

            // Reset expiry time
            const expiryTime = new Date().getTime() + (8 * 60 * 60 * 1000); // 8 hours
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

            return newToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            return null;
        }
    }

    // Method to extend session (call this on user activity)
    extendSession(): void {
        if (this.isAuthenticated()) {
            const expiryTime = new Date().getTime() + (8 * 60 * 60 * 1000); // 8 hours
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
    }
}

export const authService = new AuthService();