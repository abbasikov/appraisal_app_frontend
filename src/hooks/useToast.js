import { useState } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration = 4000) => showToast(message, 'success', duration);
  const showError = (message, duration = 6000) => showToast(message, 'error', duration);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    removeToast
  };
};