import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
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
      setError('');
    } catch (err) {
      setError('Failed to load projects');
      setProjects([]);
      setClients([]);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const statusMap = {
      DRAFT: 'gray',
      IN_PROGRESS: 'info',
      REVIEW: 'warning',
      COMPLETED: 'success',
      DELIVERED: 'purple'
    };
    return statusMap[status] || 'gray';
  };

  const handleDelete = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (err) {
      setError('Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (selectedStatus && project.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const ProjectCard = ({ project }) => (
    <Card className="p-6 hover:shadow-medium transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.project_name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{project.case_number}</p>
          <Badge variant={getStatusVariant(project.status)} size="sm">
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate(`/projects/${project.id}`)}
            variant="ghost"
            size="sm"
            icon={EyeIcon}
          />
          {(isAdmin || isEditor) && (
            <Button
              onClick={() => navigate(`/projects/${project.id}/edit`)}
              variant="ghost"
              size="sm"
              icon={PencilIcon}
            />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <BuildingOfficeIcon className="w-4 h-4 mr-2" />
          <span>{project.client_name}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <span>
            {project.inspection_date 
              ? new Date(project.inspection_date).toLocaleDateString()
              : 'No date set'
            }
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <UserIcon className="w-4 h-4 mr-2" />
          <span>{project.assigned_user_name || 'Unassigned'}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 capitalize">
            {project.appraisal_type} Appraisal
          </span>
          <div className="flex space-x-2">
            <Button
              onClick={() => navigate(`/projects/${project.id}#reports`)}
              variant="outline"
              size="sm"
              icon={DocumentArrowDownIcon}
            >
              Reports
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
            </div>
            {(isAdmin || isEditor) && (
              <Button
                onClick={() => navigate('/projects/new')}
                icon={PlusIcon}
              >
                New Project
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="min-w-0 flex-1 max-w-xs">
                <label className="form-label">Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0 flex-1 max-w-xs">
                <label className="form-label">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        {filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first project.</p>
            {(isAdmin || isEditor) && (
              <Button
                onClick={() => navigate('/projects/new')}
                icon={PlusIcon}
              >
                Create Project
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Project</th>
                    <th className="table-header-cell">Client</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Inspection Date</th>
                    <th className="table-header-cell">Assigned To</th>
                    {(isAdmin || isEditor) && (
                      <th className="table-header-cell">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">{project.project_name}</div>
                          <div className="text-sm text-gray-500">{project.case_number}</div>
                        </div>
                      </td>
                      <td className="table-cell">{project.client_name}</td>
                      <td className="table-cell capitalize">{project.appraisal_type}</td>
                      <td className="table-cell">
                        <Badge variant={getStatusVariant(project.status)} size="sm">
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        {project.inspection_date 
                          ? new Date(project.inspection_date).toLocaleDateString() 
                          : '-'
                        }
                      </td>
                      <td className="table-cell">{project.assigned_user_name || '-'}</td>
                      {(isAdmin || isEditor) && (
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => navigate(`/projects/${project.id}`)}
                              variant="ghost"
                              size="sm"
                              icon={EyeIcon}
                            />
                            <Button
                              onClick={() => navigate(`/projects/${project.id}#reports`)}
                              variant="ghost"
                              size="sm"
                              icon={DocumentArrowDownIcon}
                            />
                            <Button
                              onClick={() => navigate(`/projects/${project.id}/edit`)}
                              variant="ghost"
                              size="sm"
                              icon={PencilIcon}
                            />
                            {isAdmin && (
                              <Button
                                onClick={() => handleDelete(project.id, project.project_name)}
                                variant="ghost"
                                size="sm"
                                icon={TrashIcon}
                                className="text-red-600 hover:text-red-700"
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProjectList;