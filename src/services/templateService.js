import api from './api';

export const templateService = {
  // Get all templates with optional filtering
  getTemplates: async (appraisalType = null, isActive = true) => {
    const params = new URLSearchParams();
    if (appraisalType) params.append('appraisal_type', appraisalType);
    params.append('is_active', isActive);
    
    const response = await api.get(`/templates/?${params}`);
    return response.data;
  },

  // Get template by ID
  getTemplate: async (id) => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  // Upload new template
  uploadTemplate: async (file, appraisalType, description) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('appraisal_type', appraisalType);
    if (description) formData.append('description', description);

    const response = await api.post('/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update field mappings
  updateFieldMappings: async (id, fieldMappings) => {
    const response = await api.put(`/templates/${id}/mappings`, {
      field_mappings: fieldMappings
    });
    return response.data;
  },

  // Generate report
  generateReport: async (templateId, projectId, reportType = 'draft', includePhotos = true) => {
    const response = await api.post(`/projects/${projectId}/generate-report/${templateId}?report_type=${reportType}`);
    return response.data;
  },

  // Delete template
  deleteTemplate: async (id) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },

  // Download template
  downloadTemplate: async (id, fileType = 'original') => {
    const response = await api.get(`/templates/${id}/download?file_type=${fileType}`, {
      responseType: 'blob'
    });
    return response;
  },

  // Download generated report
  downloadReport: async (projectId, templateId, reportType = 'draft') => {
    const response = await api.get(`/projects/${projectId}/download-report/${templateId}?report_type=${reportType}`, {
      responseType: 'blob'
    });
    return response;
  },

  // Get template configuration (column definitions)
  getTemplateConfig: async (templateId) => {
    const response = await api.get(`/templates/${templateId}/config`);
    return response.data;
  },

  // Get all template categories and their configurations
  getAllCategories: async () => {
    const response = await api.get(`/templates/categories/all`);
    return response.data;
  }
};