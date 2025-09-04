import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  CheckCircleIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

const ProjectBanner = ({ title, projects, type, loading }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {type === 'open' ? (
          <ClockIcon className="h-5 w-5 text-blue-500" />
        ) : (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        )}
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No {type} projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {project.project_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Client: {project.client_name}
                  </p>
                  {project.case_number && (
                    <p className="text-xs text-gray-400">
                      Case: {project.case_number}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  {type === 'open' && project.days_since_created !== undefined && (
                    <span className="text-xs text-gray-500">
                      {project.days_since_created} days ago
                    </span>
                  )}
                  {type === 'completed' && project.updated_at && (
                    <span className="text-xs text-gray-500">
                      {formatDate(project.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {projects.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/projects')}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            View all projects →
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectBanner;