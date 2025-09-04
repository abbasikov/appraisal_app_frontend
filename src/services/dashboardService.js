import api from './api';

export const dashboardService = {
  async getOpenProjects(limit = 10) {
    const response = await api.get(`/dashboard/open-projects?limit=${limit}`);
    return response.data;
  },

  async getCompletedProjects(limit = 10) {
    const response = await api.get(`/dashboard/completed-projects?limit=${limit}`);
    return response.data;
  },

  async getDashboardStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};