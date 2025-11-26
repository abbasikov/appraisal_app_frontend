import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ImportContext = createContext();

export const useImport = () => {
  const context = useContext(ImportContext);
  if (!context) {
    throw new Error('useImport must be used within an ImportProvider');
  }
  return context;
};

export const ImportProvider = ({ children }) => {
  const [importState, setImportState] = useState({
    isImporting: false,
    projectId: null,
    taskId: null,
    toastId: null,
    progress: { current: 0, total: 0 },
    pollingIntervalId: null
  });

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (importState.pollingIntervalId) {
        clearInterval(importState.pollingIntervalId);
      }
    };
  }, []);

  const setImporting = useCallback((isImporting, projectId = null, taskId = null, toastId = null) => {
    setImportState(prev => ({
      ...prev,
      isImporting,
      projectId: isImporting ? projectId : null,
      taskId: isImporting ? taskId : null,
      toastId: isImporting ? toastId : null
    }));
  }, []);

  const setProgress = useCallback((current, total) => {
    setImportState(prev => ({
      ...prev,
      progress: { current, total }
    }));
  }, []);

  const setPollingInterval = useCallback((intervalId) => {
    setImportState(prev => ({
      ...prev,
      pollingIntervalId: intervalId
    }));
  }, []);

  const clearImportState = useCallback(() => {
    // Clear polling interval
    if (importState.pollingIntervalId) {
      clearInterval(importState.pollingIntervalId);
    }
    
    setImportState({
      isImporting: false,
      projectId: null,
      taskId: null,
      toastId: null,
      progress: { current: 0, total: 0 },
      pollingIntervalId: null
    });
  }, [importState.pollingIntervalId]);

  const value = {
    ...importState,
    setImporting,
    setProgress,
    setPollingInterval,
    clearImportState
  };

  return (
    <ImportContext.Provider value={value}>
      {children}
    </ImportContext.Provider>
  );
};
