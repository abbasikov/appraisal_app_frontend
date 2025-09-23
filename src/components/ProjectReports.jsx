import React, { useState, useEffect } from 'react';
import { templateService } from '../services/templateService';
import { useToast } from '../hooks/useToast';
import { DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';

const ProjectReports = ({ project }) => {
  const [templates, setTemplates] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (project?.appraisal_type) {
      fetchCompatibleTemplates();
    }
  }, [project]);

  const fetchCompatibleTemplates = async () => {
    try {
      const response = await templateService.getTemplates(project.appraisal_type, true);
      setTemplates(response.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleGenerateReport = async (templateId, reportType = 'draft') => {
    try {
      setGeneratingReport(true);
      const result = await templateService.generateReport(templateId, project.id, reportType, true);
      
      showToast('Report generated successfully', 'success');
      
      // Download the generated report
      const downloadResponse = await templateService.downloadReport(project.id, templateId, reportType);
      
      const blob = downloadResponse.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const template = templates.find(t => t.id === templateId);
      link.download = `${project.project_name}_${template?.name}_${reportType}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Report downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to generate report', 'error');
      console.error('Report generation error:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          No templates available for {project?.appraisal_type} appraisals
        </p>
        <a 
          href="/templates/upload" 
          className="text-blue-600 hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Upload a template →
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-500">{template.appraisal_type}</p>
              {template.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.description}</p>
              )}
            </div>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
              template.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {template.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => window.open(`/templates/${template.id}`, '_blank')}
              className="w-full flex items-center justify-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="View Template Details"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View Template
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleGenerateReport(template.id, 'draft')}
                disabled={generatingReport}
                className="flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                {generatingReport ? 'Generating...' : 'Draft'}
              </button>
              <button
                onClick={() => handleGenerateReport(template.id, 'final')}
                disabled={generatingReport}
                className="flex items-center justify-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Final
              </button>
            </div>
          </div>
          
          {template.field_mappings && Object.keys(template.field_mappings).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {Object.keys(template.field_mappings).length} fields configured
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectReports;