import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import Layout from '../../components/Layout';
import DropboxLinksManager from '../../components/DropboxLinksManager';
import { 
  ArrowLeftIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';

const ProjectDropbox = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const projectData = await projectService.getProject(id);
      setProject(projectData);
    } catch (err) {
      console.error('Error fetching project:', err);
    }
  };

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
          <div className="absolute inset-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 animate-pulse"></div>
            <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="relative z-10">
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center space-x-2 text-blue-100 hover:text-white transition-colors duration-200 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Back to Projects</span>
            </button>
            
            <div className="flex items-center space-x-3 mb-2">
              <CloudArrowDownIcon className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">Dropbox Integration</h1>
            </div>
            <p className="text-blue-100 text-lg mb-4">
              Connect your Dropbox folder to import project images
            </p>
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-1">{project.project_name}</h3>
              <p className="text-blue-100 text-sm">{project.client_name} • {project.appraisal_type} Appraisal</p>
            </div>
          </div>
        </div>

        {/* Dropbox Links Manager */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <DropboxLinksManager 
            projectId={id} 
            onLinksUpdate={() => {
              // Optionally refresh project data or show success message
            }}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Continue to Project
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDropbox;