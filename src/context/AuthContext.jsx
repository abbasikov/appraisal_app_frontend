import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import useIdleLogout from '../hooks/useIdleLogout';

const IDLE_MS = 60 * 60 * 1000;       // 1 hour
const REFRESH_MS = 5 * 60 * 1000;     // 5 minutes

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

  const handleIdleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login?reason=idle';
  }, []);

  useIdleLogout({
    enabled: !!user,
    idleMs: IDLE_MS,
    refreshMs: REFRESH_MS,
    onIdle: handleIdleLogout,
  });

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