import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import { projectService } from '../../services/projectService';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';

const ReportGenerator = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [reportType, setReportType] = useState('draft');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templateData, projectsData] = await Promise.all([
        templateService.getTemplate(id),
        projectService.getProjects()
      ]);
      
      setTemplate(templateData);
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData.projects || []);
    } catch (err) {
      showToast('Failed to load data', 'error');
      console.error('Error fetching data:', err);
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      showToast('Please select a project', 'error');
      return;
    }

    try {
      setGenerating(true);
      const result = await templateService.generateReport(
        id, 
        parseInt(selectedProject), 
        reportType, 
        includePhotos
      );
      
      showToast('Report generated successfully', 'success');
      
      // Download the generated report
      if (result.download_url) {
        const downloadResponse = await fetch(`http://localhost:8000${result.download_url}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `report_${selectedProject}_${reportType}.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          showToast('Report downloaded successfully', 'success');
        }
      }
      
      setTimeout(() => navigate('/templates'), 2000);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to generate report', 'error');
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getProjectsByType = () => {
    if (!template) return projects;
    return projects.filter(project => 
      project.appraisal_type === template.appraisal_type
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!template) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Template not found</p>
        </div>
      </Layout>
    );
  }

  const filteredProjects = getProjectsByType();

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
          <p className="text-gray-600 mt-2">
            Template: <span className="font-medium">{template.name}</span> ({template.appraisal_type})
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a project</option>
                {filteredProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.project_name} - {project.client?.name || 'Unknown Client'}
                  </option>
                ))}
              </select>
              {filteredProjects.length === 0 && (
                <p className="mt-2 text-sm text-yellow-600">
                  No projects found matching the template type ({template.appraisal_type})
                </p>
              )}
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="draft"
                    checked={reportType === 'draft'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Draft (with watermark)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="final"
                    checked={reportType === 'final'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Final (no watermark)
                  </span>
                </label>
              </div>
            </div>

            {/* Include Photos */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include photos in report
                </span>
              </label>
            </div>

            {/* Selected Project Info */}
            {selectedProject && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Project Details</h3>
                {(() => {
                  const project = projects.find(p => p.id === parseInt(selectedProject));
                  return project ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Name:</span> {project.project_name}</p>
                      <p><span className="font-medium">Client:</span> {project.client?.name || 'Unknown'}</p>
                      <p><span className="font-medium">Case Number:</span> {project.case_number || 'N/A'}</p>
                      <p><span className="font-medium">Status:</span> {project.status}</p>
                      {project.item_count && (
                        <p><span className="font-medium">Items:</span> {project.item_count}</p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/templates/${id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating || !selectedProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {generating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ReportGenerator;