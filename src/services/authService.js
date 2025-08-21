import api from './api';

export const authService = {
  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  async signin(credentials) {
    const response = await api.post('/auth/signin', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  async verifyEmail(email, code) {
    const response = await api.post('/auth/verify-email', { email, code });
    return response.data;
  },

  async resendVerification(email) {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  async getVerificationStatus(email) {
    const response = await api.get(`/auth/verification-status/${email}`);
    return response.data;
  },

  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset', { email });
    return response.data;
  },

  async confirmPasswordReset(email, code, newPassword) {
    const response = await api.post('/auth/password-reset/confirm', {
      email,
      code,
      new_password: newPassword
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};