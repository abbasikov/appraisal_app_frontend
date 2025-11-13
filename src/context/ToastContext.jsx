import React, { createContext, useContext, useState } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 5000, persistent = false, progress = null) => {
    const id = Date.now();
    const toast = { id, message, type, duration, persistent, progress };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast after duration (unless persistent)
    if (!persistent) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id; // Return the toast ID so it can be updated/removed later
  };

  const updateToast = (id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration = 4000) => showToast(message, 'success', duration);
  const showError = (message, duration = 6000) => showToast(message, 'error', duration);
  const showLoading = (message, progress = null) => showToast(message, 'loading', null, true, progress);

  const value = {
    showToast,
    showSuccess,
    showError,
    showLoading,
    updateToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};