import api from './api';

export const projectService = {
  async getProjects(skip = 0, limit = 100, clientId = null) {
    const params = new URLSearchParams({ skip, limit });
    if (clientId) params.append('client_id', clientId);
    const response = await api.get(`/projects/?${params}`);
    return response.data;
  },

  async createProject(projectData) {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  async getProject(id) {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async updateProject(id, projectData) {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  async updateDropboxLinks(id, links) {
    const response = await api.post(`/projects/${id}/dropbox-links`, links);
    return response.data;
  },

  async deleteProject(id) {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  async addDropboxLinks(projectId, links) {
    console.log('Sending to API:', links);
    const response = await api.post(`/projects/${projectId}/dropbox-links`, links);
    return response.data;
  },

  async getProjectPhotos(projectId) {
    const response = await api.get(`/projects/${projectId}/photos`);
    return response.data;
  },

  async importPhotos(projectId, batchSize = 10) {
    const response = await api.post(`/projects/${projectId}/import-photos?batch_size=${batchSize}`);
    return response.data;
  },

  async deletePhoto(photoId) {
    const response = await api.delete(`/photos/${photoId}`);
    return response.data;
  }
};