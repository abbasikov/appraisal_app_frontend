import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import Layout from '../../components/Layout';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'table' or 'grid'
  const { user, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, clientsData] = await Promise.all([
        projectService.getProjects(0, 100, selectedClient || null),
        clientService.getClients(0, 1000)
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load projects');
      setProjects([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await projectService.deleteProject(id);
        setProjects(projects.filter(project => project.id !== id));
      } catch (err) {
        setError('Failed to delete project');
        console.error('Error deleting project:', err);
      }
    }
  };

  const getStatusVariant = (status) => {
    const statusMap = {
      'DRAFT': 'gray',
      'IN_PROGRESS': 'blue',
      'REVIEW': 'yellow',
      'COMPLETED': 'green',
      'DELIVERED': 'purple'
    };
    return statusMap[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return CheckCircleIcon;
      case 'IN_PROGRESS':
      case 'REVIEW':
        return ClockIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getStatusGradient = (status) => {
    const gradients = {
      'DRAFT': 'from-gray-500 to-slate-600',
      'IN_PROGRESS': 'from-blue-500 to-indigo-600',
      'REVIEW': 'from-amber-500 to-orange-600',
      'COMPLETED': 'from-emerald-500 to-green-600',
      'DELIVERED': 'from-purple-500 to-violet-600'
    };
    return gradients[status] || gradients.DRAFT;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === '' || project.client_id === parseInt(selectedClient);
    const matchesStatus = selectedStatus === '' || project.status === selectedStatus;
    return matchesSearch && matchesClient && matchesStatus;
  });

  const ProjectCard = ({ project }) => {
    const StatusIcon = getStatusIcon(project.status);
    const statusGradient = getStatusGradient(project.status);
    
    return (
      <div className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 animate-slide-up">
        {/* Status badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${statusGradient} shadow-lg`}>
            <StatusIcon className="w-3 h-3" />
            <span>{project.status?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative p-6">
          {/* Project Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                  {project.project_name || 'Untitled Project'}
                </h3>
                {project.case_number && (
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Case: {project.case_number}
                  </p>
                )}
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center space-x-2 text-gray-600 mb-3">
              <UserIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{project.client_name || 'No client assigned'}</span>
            </div>

            {/* Appraisal Type */}
            <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs font-semibold rounded-full mb-4">
              <BuildingOfficeIcon className="w-3 h-3 mr-1" />
              {project.appraisal_type} Appraisal
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Inspection Date</span>
              <span className="font-medium text-gray-900">
                {project.inspection_date 
                  ? new Date(project.inspection_date).toLocaleDateString()
                  : 'Not scheduled'
                }
              </span>
            </div>
            
            {project.assigned_user_name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Assigned To</span>
                <span className="font-medium text-gray-900">{project.assigned_user_name}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate(`/projects/${project.id}`)}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <EyeIcon className="w-4 h-4" />
              <span>View</span>
            </button>
            
            {(isAdmin || isEditor) && (
              <button
                onClick={() => navigate(`/projects/${project.id}/edit`)}
                className="flex items-center justify-center p-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                title="Edit Project"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => navigate(`/projects/${project.id}#reports`)}
              className="flex items-center justify-center p-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
              title="Reports"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Loading skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-xl w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-2xl w-40 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
                    <div className="h-10 bg-gray-200 rounded-xl w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Modern Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 animate-pulse"></div>
            <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute right-1/4 top-1/4 w-6 h-6 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <BuildingOfficeIcon className="w-8 h-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Projects</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Manage and track your appraisal projects
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 text-white/90">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium">{filteredProjects.length} projects</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/90">
                    <StarIcon className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Professional Tools</span>
                  </div>
                </div>
              </div>
              
              {(isAdmin || isEditor) && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/projects/new')}
                    className="group flex items-center space-x-3 px-6 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>New Project</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Search Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 focus:bg-white transition-all duration-200 placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableCellsIcon className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BuildingOfficeIcon className="w-16 h-16 text-blue-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No projects found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedClient || selectedStatus 
                ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                : 'Get started by creating your first project to begin managing appraisals.'
              }
            </p>
            {(isAdmin || isEditor) && !searchTerm && !selectedClient && !selectedStatus && (
              <button
                onClick={() => navigate('/projects/new')}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create First Project</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Inspection Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                    {(isAdmin || isEditor) && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((project, index) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {project.project_name}
                          </div>
                          {project.case_number && (
                            <div className="text-sm text-gray-500">Case: {project.case_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{project.client_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {project.appraisal_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusGradient(project.status)}`}>
                          {React.createElement(getStatusIcon(project.status), { className: "w-3 h-3" })}
                          <span>{project.status?.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {project.inspection_date 
                          ? new Date(project.inspection_date).toLocaleDateString() 
                          : 'Not scheduled'
                        }
                      </td>
                      <td className="px-6 py-4 text-gray-900">{project.assigned_user_name || 'Unassigned'}</td>
                      {(isAdmin || isEditor) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                              title="View Project"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/projects/${project.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                              title="Edit Project"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/projects/${project.id}#reports`)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                              title="Reports"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(project.id, project.project_name)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                                title="Delete Project"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Layout>
  );
};

export default ProjectList;