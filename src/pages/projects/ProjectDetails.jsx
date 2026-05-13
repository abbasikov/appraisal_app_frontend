import React, { useState, useEffect, useRef } from 'react';
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
import useIsMobile from '../../hooks/useIsMobile';
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
  XCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  
  // Pagination state for photos
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const { isAdmin, isEditor } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft', color: 'gray' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
    { value: 'REVIEW', label: 'Review', color: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', color: 'green' },
    { value: 'DELIVERED', label: 'Delivered', color: 'purple' }
  ];

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleStatusChange = async (newStatus) => {
    try {
      await projectService.updateProject(id, { status: newStatus });
      setProject(prev => ({ ...prev, status: newStatus }));
      setStatusDropdownOpen(false);
      showSuccess('Project status updated successfully');
    } catch (err) {
      showError('Failed to update project status');
      console.error('Error updating status:', err);
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
        <div className="mx-auto max-w-7xl min-w-0 px-6 py-8 max-lg:px-0 max-lg:py-6">
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
        <div className="mx-auto max-w-7xl min-w-0 px-6 py-8 max-lg:px-0 max-lg:py-6">
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="mx-auto max-w-7xl min-w-0 space-y-8 px-6 py-8 max-lg:space-y-6 max-lg:px-0 max-lg:py-4">
        {/* Header */}
        {isMobile ? (
          <div className="flex min-w-0 flex-row items-start justify-between gap-4 max-lg:flex-col max-lg:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4 max-lg:gap-3">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="mt-0.5 shrink-0 rounded-xl p-2 transition-colors hover:bg-gray-100"
                aria-label="Back to projects"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="mb-2 break-words text-3xl font-bold leading-tight text-gray-900 max-lg:mb-1 max-lg:text-lg max-lg:leading-snug">
                  {project?.project_name || 'Untitled Project'}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 max-lg:flex-col max-lg:items-start max-lg:gap-1.5 max-lg:text-xs">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <BuildingOfficeIcon className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="truncate">{project?.client_name || 'No client'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DocumentTextIcon className="h-4 w-4 shrink-0 text-gray-500" />
                    <span>{project?.appraisal_type || 'No type'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-auto shrink-0 max-lg:w-full" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                aria-expanded={statusDropdownOpen}
                aria-haspopup="listbox"
                className={`inline-flex w-auto cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 transition-all hover:shadow-md max-lg:w-full max-lg:justify-between ${getStatusColor(project?.status)}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <StatusIcon className="h-5 w-5 shrink-0" />
                  <span className="truncate font-medium capitalize">
                    {project?.status?.replace('_', ' ') || 'Draft'}
                  </span>
                </span>
                <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 max-h-[min(70vh,24rem)] w-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg max-lg:left-0 max-lg:right-0 max-lg:w-full">
                  {statusOptions.map((option) => {
                    const OptionIcon = getStatusIcon(option.value);
                    const isSelected = project?.status === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 max-lg:py-2.5 ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        <OptionIcon className={`w-5 h-5 ${
                          option.color === 'gray' ? 'text-gray-600' :
                          option.color === 'blue' ? 'text-blue-600' :
                          option.color === 'yellow' ? 'text-yellow-600' :
                          option.color === 'green' ? 'text-green-600' :
                          option.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                        <span className={`font-medium ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <CheckCircleIcon className="w-4 h-4 text-green-600 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
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

            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${getStatusColor(project?.status)} transition-all hover:shadow-md cursor-pointer`}
              >
                <StatusIcon className="w-5 h-5" />
                <span className="font-medium capitalize">
                  {project?.status?.replace('_', ' ') || 'Draft'}
                </span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {statusOptions.map((option) => {
                    const OptionIcon = getStatusIcon(option.value);
                    const isSelected = project?.status === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        <OptionIcon className={`w-5 h-5 ${
                          option.color === 'gray' ? 'text-gray-600' :
                          option.color === 'blue' ? 'text-blue-600' :
                          option.color === 'yellow' ? 'text-yellow-600' :
                          option.color === 'green' ? 'text-green-600' :
                          option.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                        <span className={`font-medium ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <CheckCircleIcon className="w-4 h-4 text-green-600 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Overview */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 max-lg:p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-blue-200 bg-blue-100 p-2">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600 max-lg:h-5 max-lg:w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 max-lg:text-lg">Project Overview</h2>
                </div>
              </div>
              <div className="min-w-0 p-6 max-lg:p-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-lg:gap-4">
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
            <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-cyan-50/30 p-6 max-lg:p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-cyan-200 bg-cyan-100 p-2">
                    <CloudIcon className="h-6 w-6 text-cyan-600 max-lg:h-5 max-lg:w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 max-lg:text-lg">Dropbox Integration</h2>
                </div>
              </div>
              <div className="min-w-0 p-6 max-lg:p-4">
                <DropboxLinksManager 
                  projectId={id}
                  onLinksUpdate={handleLinksUpdate}
                />
              </div>
            </div>

            {/* Photos Section */}
            <div id="photos-section" className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-purple-50/30 p-6 max-lg:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-purple-200 bg-purple-100 p-2">
                      <PhotoIcon className="h-6 w-6 text-purple-600 max-lg:h-5 max-lg:w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 max-lg:text-lg">
                      Photos ({totalItems})
                    </h2>
                  </div>
                </div>
              </div>
              <div className="min-w-0 p-6 max-lg:p-4">
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
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm max-lg:p-4">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 max-lg:mb-3 max-lg:text-base">Quick Actions</h3>
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
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm max-lg:p-4">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 max-lg:mb-3 max-lg:text-base">Project Statistics</h3>
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
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm max-lg:p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900 max-lg:mb-2 max-lg:text-base">Purpose</h3>
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