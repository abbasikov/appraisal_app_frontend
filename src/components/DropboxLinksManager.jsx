import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';

const DropboxLinksManager = ({ projectId, onLinksUpdate }) => {
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [validatingLink, setValidatingLink] = useState(false);
  const [importingPhotos, setImportingPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadProjectLinks();
  }, [projectId]);


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
      
      await projectService.addDropboxLinks(projectId, updatedLinks);
      
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
      await projectService.addDropboxLinks(projectId, updatedLinks);
      setLinks(updatedLinks);
      showSuccess('Dropbox link removed successfully');
      if (onLinksUpdate) {
        onLinksUpdate();
      }
    } catch (error) {
      showError('Failed to remove Dropbox link');
    }
  };

  const importPhotos = async () => {
    setImportingPhotos(true);
    
    try {
      console.log('Starting background photo import for project:', projectId);
      
      await projectService.importPhotosBackground(projectId, true); // recurring = true
      
      showSuccess('Your photos are being imported in the background. You can continue working while the import processes automatically. Photos will appear on the project page once they are ready.');
      
      // Reset importing state after a short delay to show the success message
      setTimeout(() => {
        setImportingPhotos(false);
        if (onLinksUpdate) {
          onLinksUpdate();
        }
      }, 2000);
      
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
      {/* Debug info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        Debug: Project ID: {projectId}, Links count: {links.length}
        {links.length > 0 && <div>Links: {JSON.stringify(links)}</div>}
      </div>

      {/* Add new link input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="Enter Dropbox folder share link..."
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
          
          {/* Background import status */}
          {importingPhotos && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800">
                    Photo import started successfully!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your images are being fetched and processed in the background. This may take several minutes depending on the number and size of photos. You can continue using the application while the import runs automatically.
                  </p>
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    📱 Photos will appear on the project page once they're ready
                  </p>
                </div>
              </div>
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
        <p>• You can add up to 10 Dropbox folders per project</p>
        <p>• Only image files (JPG, PNG, GIF, BMP) will be imported</p>
      </div>
    </div>
  );
};

export default DropboxLinksManager;