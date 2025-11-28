import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { templateService } from '../../services/templateService';
import { appraisalService } from '../../services/appraisalService';
import Layout from '../../components/Layout';
import DropboxLinksManager from '../../components/DropboxLinksManager';
import { PhotoTableWithPagination } from '../../components/PhotoTable';
import ProjectReports from '../../components/ProjectReports';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  PlayIcon,
  ChartBarIcon,
  PhotoIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state for photos
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const { isAdmin, isEditor } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  useEffect(() => {
    fetchProjectDetails();
    
    if (window.location.hash === '#reports') {
      setTimeout(() => {
        const reportsSection = document.getElementById('reports-section');
        if (reportsSection) {
          reportsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [id]);

  useEffect(() => {
    fetchPhotos();
  }, [id, currentPage]);

  const fetchProjectDetails = async () => {
    try {
      const response = await projectService.getProject(id);
      setProject(response);
      
      // Fetch template to determine category
      if (response.template_id) {
        try {
          const templateData = await templateService.getTemplate(response.template_id);
          setTemplate(templateData);
        } catch (templateErr) {
          console.error('Error fetching template:', templateErr);
        }
      }
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await projectService.getProjectPhotos(id, skip, itemsPerPage);
      
      // Handle backend response format:
      // {
      //   photos: [...],
      //   total_count: number,
      //   skip: number,
      //   limit: number,
      //   has_more: boolean
      // }
      if (response && response.photos && Array.isArray(response.photos)) {
        setPhotos(response.photos);
        setTotalItems(response.total_count || 0);
        const totalPagesFromBackend = Math.ceil((response.total_count || 0) / itemsPerPage);
        setTotalPages(totalPagesFromBackend);
      } else {
        // Fallback for unexpected response format
        console.warn('Unexpected response format:', response);
        setPhotos([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
      setPhotos([]);
      setTotalItems(0);
      setTotalPages(1);
    }
  };

  const handleLinksUpdate = () => {
    fetchProjectDetails();
    // Reset to first page when links are updated
    setCurrentPage(1);
    fetchPhotos();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of photos section when page changes
    const photosSection = document.getElementById('photos-section');
    if (photosSection) {
      photosSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePhotoDelete = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await projectService.deletePhoto(photoId);
        fetchPhotos(); // Refresh current page
      } catch (err) {
        setError('Failed to delete photo');
        console.error('Error deleting photo:', err);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
      REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      DELIVERED: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusIcon = (status) => {
    const icons = {
      DRAFT: DocumentTextIcon,
      IN_PROGRESS: ClockIcon,
      REVIEW: ExclamationTriangleIcon,
      COMPLETED: CheckCircleIcon,
      DELIVERED: CheckCircleIcon
    };
    return icons[status] || DocumentTextIcon;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-200 rounded-2xl h-64"></div>
                <div className="bg-gray-200 rounded-2xl h-48"></div>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-200 rounded-2xl h-32"></div>
                <div className="bg-gray-200 rounded-2xl h-48"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-6">
            <div className="flex items-center">
              <XCircleIcon className="w-6 h-6 text-red-500 mr-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const StatusIcon = getStatusIcon(project?.status);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project?.project_name || 'Untitled Project'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>{project?.client_name || 'No client'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{project?.appraisal_type || 'No type'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${getStatusColor(project?.status)}`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium capitalize">
              {project?.status?.replace('_', ' ') || 'Draft'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-blue-100 border border-blue-200">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Overview</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <UserIcon className="w-4 h-4" />
                      <span>Client</span>
                    </div>
                    <p className="text-gray-900 font-medium">{project?.client_name || 'Not assigned'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span>Case Number</span>
                    </div>
                    <p className="text-gray-900 font-medium">{project?.case_number || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <UserIcon className="w-4 h-4" />
                      <span>Assigned User</span>
                    </div>
                    <p className="text-gray-900 font-medium">{project?.assigned_user_name || 'Unassigned'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Inspection Date</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {project?.inspection_date 
                        ? new Date(project.inspection_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Report Date</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {project?.report_date 
                        ? new Date(project.report_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span>Total Value</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      ${project?.total_value?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                
                {project?.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span>Notes</span>
                    </div>
                    <p className="text-gray-900 leading-relaxed">{project.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dropbox Integration */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-cyan-50/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-100 border border-cyan-200">
                    <CloudIcon className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Dropbox Integration</h2>
                </div>
              </div>
              <div className="p-6">
                <DropboxLinksManager 
                  projectId={id}
                  onLinksUpdate={handleLinksUpdate}
                />
              </div>
            </div>

            {/* Photos Section */}
            <div id="photos-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-purple-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-purple-100 border border-purple-200">
                      <PhotoIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Photos ({totalItems})
                    </h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <PhotoTableWithPagination 
                  photos={photos} 
                  onPhotoDelete={handlePhotoDelete}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>

            {/* Reports Section - Temporarily hidden */}
            {/* {(isAdmin || isEditor) && (
              <div id="reports-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-green-50/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-green-100 border border-green-200">
                      <ChartBarIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ProjectReports project={project} />
                </div>
              </div>
            )} */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {(isAdmin || isEditor) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/projects/${id}/appraisal?detect=true`)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>Work on Appraisal</span>
                  </button>
                  
                  <button
                    onClick={() => navigate(`/projects/${id}/edit`)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    <span>Edit Project</span>
                  </button>
                </div>
              </div>
            )}

            {/* Project Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <PhotoIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Photos</span>
                  </div>
                  <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Created</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {project?.created_at 
                      ? new Date(project.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">Last Updated</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {project?.updated_at 
                      ? new Date(project.updated_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Project Purpose */}
            {project?.purpose && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Purpose</h3>
                <p className="text-gray-700 leading-relaxed">{project.purpose}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;