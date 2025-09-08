import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import DropboxLinksManager from '../../components/DropboxLinksManager';
import PhotoTable from '../../components/PhotoTable';
import ProjectReports from '../../components/ProjectReports';
import { useAuth } from '../../context/AuthContext';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin, isEditor } = useAuth();

  useEffect(() => {
    fetchProjectDetails();
    fetchPhotos();
    
    // Scroll to reports section if hash is present
    if (window.location.hash === '#reports') {
      setTimeout(() => {
        const reportsSection = document.getElementById('reports-section');
        if (reportsSection) {
          reportsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await projectService.getProject(id);
      console.log('Project details response:', response);
      console.log('Dropbox links:', response?.dropbox_links);
      setProject(response);
    } catch (err) {
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await projectService.getProjectPhotos(id);
      setPhotos(response);
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  };



  const handleLinksUpdate = () => {
    console.log('Refreshing project data after links update...');
    fetchProjectDetails();
    fetchPhotos();
  };

  const handlePhotoDelete = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await projectService.deletePhoto(photoId);
        fetchPhotos();
      } catch (err) {
        setError('Failed to delete photo');
      }
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Project Header */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {project?.project_name}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Client</label>
                <p className="text-gray-900">{project?.client_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <p className="text-gray-900">{project?.appraisal_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{project?.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Case Number</label>
                <p className="text-gray-900">{project?.case_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Assigned User</label>
                <p className="text-gray-900">{project?.assigned_user_name || 'Unassigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Value</label>
                <p className="text-gray-900">${project?.total_value?.toLocaleString() || '0'}</p>
              </div>
            </div>
            {project?.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Dropbox Integration Section */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Dropbox Integration</h2>
            <DropboxLinksManager 
              projectId={id}
              onLinksUpdate={handleLinksUpdate}
            />
          </div>

          {/* Action Buttons */}
          {(isAdmin || isEditor) && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Project Actions</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.href = `/projects/${id}/appraisal`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Work on Appraisal
                </button>
                <button
                  onClick={() => window.location.href = `/projects/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Project
                </button>
              </div>
            </div>
          )}

          {/* Reports Section */}
          {(isAdmin || isEditor) && (
            <div id="reports-section" className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Generate Reports</h2>
              <ProjectReports project={project} />
            </div>
          )}

          {/* Photos Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Photos ({photos.length})</h2>
            <PhotoTable photos={photos} onPhotoDelete={handlePhotoDelete} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;