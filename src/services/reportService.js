import api from './api';

export const reportService = {
  // Get all reports with optional filtering
  getReports: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.report_type) params.append('report_type', filters.report_type);
    if (filters.days) params.append('days', filters.days);
    
    const queryString = params.toString();
    const url = queryString ? `/reports?${queryString}` : '/reports';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get report statistics
  getReportStats: async () => {
    const response = await api.get('/reports/stats');
    return response.data;
  }
};