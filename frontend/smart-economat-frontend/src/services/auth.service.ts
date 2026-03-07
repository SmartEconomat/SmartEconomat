import { baseFetch, ApiResponse } from './api.service';

export const authService = {
    async login(data: any): Promise<ApiResponse<any>> {
        const response = await baseFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    async registerAlumno(data: any): Promise<ApiResponse<any>> {
        const response = await baseFetch('/alumnos/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    async registerProfesor(data: any): Promise<ApiResponse<any>> {
        const response = await baseFetch('/profesores/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    async forgotPassword(email: string): Promise<ApiResponse<any>> {
        const response = await baseFetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        return await response.json();
    },

    async resetPassword(data: any): Promise<ApiResponse<any>> {
        const response = await baseFetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    async changePassword(data: any): Promise<ApiResponse<any>> {
        const response = await baseFetch('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    }
};
