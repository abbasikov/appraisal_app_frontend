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
  },

  // Get clients for an account
  getAccountClients: async (accountId) => {
    const response = await api.get(`/accounts/${accountId}/clients`);
    return response.data;
  },

  // Get clients for an account based on project relationships
  getAccountClientsByProjects: async (accountId) => {
    const response = await api.get(`/accounts/${accountId}/clients-by-projects`);
    return response.data;
  },

  // Create sub-account
  createSubAccount: async (parentId, subAccountData) => {
    const response = await api.post(`/accounts/${parentId}/sub-accounts`, subAccountData);
    return response.data;
  },

  // Create client for an account
  createAccountClient: async (accountId, clientData) => {
    const response = await api.post(`/accounts/${accountId}/clients`, clientData);
    return response.data;
  }
};