import api from './api';

export const accountService = {
  // Get all accounts
  getAccounts: async (accountType = null, isActive = true) => {
    const params = new URLSearchParams();
    if (accountType) params.append('account_type', accountType);
    params.append('is_active', isActive);
    
    const response = await api.get(`/accounts/?${params}`);
    return response.data;
  },

  // Get account by ID
  getAccount: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  // Create new account
  createAccount: async (accountData) => {
    const response = await api.post('/accounts/', accountData);
    return response.data;
  },

  // Update account
  updateAccount: async (id, accountData) => {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },

  // Delete account
  deleteAccount: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  // Get sub-accounts
  getSubAccounts: async (parentId) => {
    const response = await api.get(`/accounts/${parentId}/sub-accounts`);
    return response.data;
  }
};