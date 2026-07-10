import { apiClient } from './client';
import { Application } from '../types';

export const applicationsApi = {
  async upload(file: File): Promise<Application> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<Application>('/api/v1/applications/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getAll(statusFilter?: string): Promise<Application[]> {
    const params = statusFilter ? { status_filter: statusFilter } : undefined;
    const response = await apiClient.get<Application[]>('/api/v1/applications', { params });
    return response.data;
  },

  async getById(id: number): Promise<Application> {
    const response = await apiClient.get<Application>(`/api/v1/applications/${id}`);
    return response.data;
  },

  async validate(id: number, extractedData: Record<string, any>): Promise<Application> {
    const response = await apiClient.put<Application>(`/api/v1/applications/${id}/validate`, {
      extracted_data: extractedData,
    });
    return response.data;
  },

  async submit(id: number): Promise<Application> {
    const response = await apiClient.post<Application>(`/api/v1/applications/${id}/submit`);
    return response.data;
  },

  async action(id: number, action: 'approve' | 'reject' | 'escalate', reason?: string): Promise<Application> {
    const response = await apiClient.post<Application>(`/api/v1/applications/${id}/action`, {
      action,
      reason,
    });
    return response.data;
  },
};
