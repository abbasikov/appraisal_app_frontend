import api from './api';

export const clientService = {
  async getClients(skip = 0, limit = 100, search = '') {
    const params = new URLSearchParams({ skip, limit });
    if (search) params.append('search', search);
    const response = await api.get(`/clients?${params}`);
    return response.data;
  },

  async createClient(clientData) {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  async getClient(id) {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  async updateClient(id, clientData) {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  async deleteClient(id) {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  }
};