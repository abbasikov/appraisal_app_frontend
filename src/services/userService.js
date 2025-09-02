import api from './api';

export const userService = {
  async getUsers() {
    const response = await api.get('/users/');
    return response.data;
  },

  async inviteUser(userData) {
    const response = await api.post('/users/invite', userData);
    return response.data;
  },

  async updateUserRole(userId, role) {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  async setupPassword(token, password) {
    const response = await api.post('/users/setup-password', { token, password });
    return response.data;
  }
};