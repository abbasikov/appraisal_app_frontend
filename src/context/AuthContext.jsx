import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.signin(credentials);
    // Only get user data if we actually got a token (successful login)
    if (response.access_token) {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const loginWithMFA = async (credentials, otpCode) => {
    try {
      const response = await authService.signinMFA(credentials, otpCode);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return response;
    } catch (error) {
      // Don't clear user state on MFA error, just re-throw
      throw error;
    }
  };

  const value = {
    user,
    login,
    loginWithMFA,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor',
    isReader: user?.role === 'reader'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};