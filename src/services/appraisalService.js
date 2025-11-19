import api from './api';

export const appraisalService = {
  async getAppraisalSchema() {
    const response = await api.get('/appraisal-workflow/schema');
    return response.data;
  },

  async initializeAppraisalItems(projectId) {
    const response = await api.post(`/appraisal-workflow/projects/${projectId}/appraisal-items/initialize`);
    return response.data;
  },

  async getAppraisalItems(projectId) {
    const response = await api.get(`/appraisal-workflow/projects/${projectId}/appraisal-items`);
    return response.data;
  },

  async createAppraisalItem(itemData) {
    const response = await api.post('/appraisal-workflow/appraisal-items', itemData);
    return response.data;
  },

  async updateAppraisalItem(itemId, itemData) {
    const response = await api.put(`/appraisal-workflow/appraisal-items/${itemId}`, itemData);
    return response.data;
  },

  async reorderAppraisalItems(projectId, reorderData) {
    const response = await api.post(`/appraisal-workflow/projects/${projectId}/appraisal-items/reorder`, reorderData);
    return response.data;
  },

  async deleteAppraisalItem(projectId, itemId) {
    const response = await api.delete(`/appraisal-workflow/projects/${projectId}/appraisal-items/${itemId}`);
    return response.data;
  },

  async getDescriptionTemplate(itemType) {
    const response = await api.get(`/appraisal-workflow/description-template/${itemType}`);
    return response.data;
  }
};