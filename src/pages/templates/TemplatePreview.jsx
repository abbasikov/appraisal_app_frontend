import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';

const TemplatePreview = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplate(id);
      setTemplate(data);
    } catch (err) {
      showToast('Failed to load template', 'error');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
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

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 page-header-row">
          <h1 className="text-2xl font-bold text-gray-900">Template Preview</h1>
          <button
            onClick={() => navigate(`/templates/${id}`)}
            className="btn-responsive px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Details
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600">Type: {template.appraisal_type}</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Template Structure</h3>
                <p className="text-sm text-gray-600 mt-2">
                  This template contains {Object.keys(template.field_mappings || {}).length} mapped fields
                </p>
              </div>
              
              {template.field_mappings && Object.keys(template.field_mappings).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Available Fields:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-left">
                    {Object.entries(template.field_mappings).map(([fieldName, fieldConfig]) => (
                      <div key={fieldName} className="bg-blue-50 px-3 py-2 rounded-md">
                        <span className="text-sm font-medium text-blue-900">
                          {fieldConfig.label || fieldName}
                        </span>
                        <div className="text-xs text-blue-600">
                          {fieldConfig.type || 'text'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  To see the actual template content with data, generate a report from a project.
                </p>
                <button
                  onClick={() => navigate(`/templates/${id}/generate`)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TemplatePreview;