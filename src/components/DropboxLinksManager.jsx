import React, { useState, useEffect, useRef } from 'react';
import { projectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';
import { useImport } from '../context/ImportContext';

const DropboxLinksManager = ({ projectId, onLinksUpdate, onImportComplete }) => {
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [validatingLink, setValidatingLink] = useState(false);
  const [importingPhotos, setImportingPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showSuccess, showError, showLoading, updateToast, removeToast } = useToast();
  const { isImporting, setImporting, setProgress, setPollingInterval, clearImportState, pollingIntervalId, toastId } = useImport();
  
  // Keep track of current import task
  const currentTaskRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadProjectLinks();
    
    // If there's an ongoing import for this project, restore it
    if (isImporting && currentTaskRef.current?.projectId === projectId) {
      setImportingPhotos(true);
      pollingIntervalRef.current = pollingIntervalId;
    }
    
    // Cleanup polling on unmount
    return () => {
      // Don't clear polling here - let the global context handle it
      // This way the import continues even when navigating away
    };
  }, [projectId, isImporting]);


  const loadProjectLinks = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading project links for project:', projectId);
      
      const project = await projectService.getProject(projectId);
      console.log('Project data received:', project);
      
      // Handle both dropbox_links (array) and dropbox_folder_link (string)
      let projectLinks = project?.dropbox_links || [];
      
      // If dropbox_links is empty but dropbox_folder_link exists, convert it
      if (projectLinks.length === 0 && project?.dropbox_folder_link) {
        projectLinks = project.dropbox_folder_link.split('|').filter(link => link.trim());
        console.log('Converted dropbox_folder_link to array:', projectLinks);
      }
      
      console.log('Final dropbox_links:', projectLinks);
      
      setLinks(projectLinks);
      setNotificationEmail(project?.notification_email || '');
      
      if (projectLinks.length > 0) {
        console.log(`✅ Found ${projectLinks.length} existing Dropbox links`);
      } else {
        console.log('ℹ️ No existing Dropbox links found');
      }
      
    } catch (error) {
      console.error('Error loading project links:', error);
      setError('Failed to load Dropbox links');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const validateDropboxLink = (link) => {
    const dropboxPattern = /^https:\/\/(www\.)?dropbox\.com\/.*$/;
    return dropboxPattern.test(link);
  };

  const addLink = async () => {
    if (!validateDropboxLink(newLink)) {
      showError('Please enter a valid Dropbox share link');
      return;
    }

    if (notificationEmail && !notificationEmail.includes('@')) {
      showError('Please enter a valid email address for import notifications');
      return;
    }

    if (links.length >= 10) {
      showError('Maximum 10 Dropbox folders allowed per project');
      return;
    }

    if (links.includes(newLink)) {
      showError('This link has already been added');
      return;
    }

    setValidatingLink(true);
    try {
      const updatedLinks = [...links, newLink];
      console.log('Adding link. Updated links array:', updatedLinks);
      
      await projectService.addDropboxLinks(projectId, updatedLinks, notificationEmail);
      
      setLinks(updatedLinks);
      setNewLink('');
      showSuccess('Dropbox link added successfully');
      
      if (onLinksUpdate) {
        onLinksUpdate();
      }
      
    } catch (error) {
      console.error('Error adding Dropbox link:', error);
      showError(error.response?.data?.detail || 'Failed to add Dropbox link');
    } finally {
      setValidatingLink(false);
    }
  };

  const removeLink = async (index) => {
    try {
      const updatedLinks = links.filter((_, i) => i !== index);
      await projectService.addDropboxLinks(projectId, updatedLinks, notificationEmail);
      setLinks(updatedLinks);
      showSuccess('Dropbox link removed successfully');
      if (onLinksUpdate) {
        onLinksUpdate();
      }
    } catch (error) {
      showError('Failed to remove Dropbox link');
    }
  };

  const pollTaskStatus = async (taskId, toastId) => {
    try {
      const status = await projectService.getTaskStatus(projectId, taskId);
      console.log('Task status received:', status);
      
      // Update toast with progress if available
      if (status.processed_items !== undefined && status.total_items !== undefined) {
        const progressData = {
          current: status.processed_items || 0,
          total: status.total_items || 0
        };
        setProgress(progressData.current, progressData.total);
        updateToast(toastId, {
          message: 'Importing photos...',
          progress: progressData
        });
      }
      
      // Check if task is complete (backend returns lowercase status)
      if (status.status === 'completed') {
        console.log('✅ Import completed! Cleaning up...');
        
        // Clear polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Remove loading toast
        removeToast(toastId);
        
        // Parse result data if it's a JSON string
        let importedCount = 0;
        if (status.result_data) {
          try {
            const resultData = typeof status.result_data === 'string' 
              ? JSON.parse(status.result_data) 
              : status.result_data;
            importedCount = resultData.imported_count || status.processed_items || 0;
          } catch (e) {
            importedCount = status.processed_items || 0;
          }
        } else {
          importedCount = status.processed_items || 0;
        }
        
        // Show success message
        showSuccess(`Successfully imported ${importedCount} photo${importedCount !== 1 ? 's' : ''}!`);
        
        // Reset state
        setImportingPhotos(false);
        clearImportState(); // Clear global import state
        currentTaskRef.current = null;
        
        // Call onImportComplete callback if provided, otherwise reload
        if (onImportComplete) {
          setTimeout(() => {
            console.log('📍 Navigating to project overview...');
            onImportComplete();
          }, 1500);
        } else {
          // Reload the page after a short delay to show imported images
          setTimeout(() => {
            console.log('🔄 Reloading page to show imported photos...');
            window.location.reload();
          }, 1500);
        }
      } else if (status.status === 'failed') {
        console.log('❌ Import failed!');
        
        // Clear polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Remove loading toast
        removeToast(toastId);
        
        // Show error
        showError(status.error_message || 'Photo import failed');
        
        // Reset state
        setImportingPhotos(false);
        clearImportState(); // Clear global import state
        currentTaskRef.current = null;
      }
      
    } catch (error) {
      console.error('Error checking task status:', error);
      // Don't stop polling on individual errors, might be transient
    }
  };

  const importPhotos = async () => {
    setImportingPhotos(true);
    
    try {
      console.log('Starting background photo import for project:', projectId);
      
      const response = await projectService.importPhotosBackground(projectId, true); // recurring = true
      const taskId = response.task_id;
      
      console.log('Import task started with ID:', taskId);
      
      // Show persistent loading toast
      const toastId = showLoading('Starting import...', { current: 0, total: 0 });
      
      // Store task info in refs AND global state
      currentTaskRef.current = { taskId, toastId, projectId };
      setImporting(true, projectId, taskId, toastId);
      
      // Start polling for status updates every 3 seconds
      const intervalId = setInterval(() => {
        pollTaskStatus(taskId, toastId);
      }, 3000);
      
      // Store interval in global state for cleanup on unmount
      setPollingInterval(intervalId);
      pollingIntervalRef.current = intervalId;
      
      // Do initial check after 1 second
      setTimeout(() => {
        pollTaskStatus(taskId, toastId);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting background import:', error);
      setImportingPhotos(false);
      showError(error.response?.data?.detail || 'Failed to start photo import');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading Dropbox links...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={loadProjectLinks}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new link input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="Enter Dropbox folder share link..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="Enter email for import notifications (optional)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addLink}
            disabled={validatingLink || !newLink.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validatingLink ? 'Adding...' : 'Add Link'}
          </button>
        </div>
      </div>

      {/* Display added links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Configured Dropbox Folders:</h3>
          {links.map((link, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="text-sm text-gray-600 truncate flex-1 mr-4">{link}</span>
              <button
                onClick={() => removeLink(index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Import photos button */}
      {links.length > 0 ? (
        <div className="space-y-3">
          <button
            onClick={importPhotos}
            disabled={importingPhotos}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importingPhotos ? 'Importing Photos...' : `Import Photos from ${links.length} Folder(s)`}
          </button>
          
          {/* Info message when importing */}
          {importingPhotos && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                📱 Check the bottom-right corner for live import progress
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
          Add Dropbox links above to enable photo import
        </div>
      )}

      {/* Help text */}
      <div className="text-sm text-gray-500">
        <p>• Share your Dropbox folder and paste the link above</p>
        <p>• Enter an email address (optional) to receive import completion notifications</p>
        <p>• You can add up to 10 Dropbox folders per project</p>
        <p>• Only image files (JPG, PNG, GIF, BMP) will be imported</p>
      </div>
    </div>
  );
};

export default DropboxLinksManager;