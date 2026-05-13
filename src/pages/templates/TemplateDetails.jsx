import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';

const TemplateDetails = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAdmin, isEditor } = useAuth();

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplate(id);
      setTemplate(data);
    } catch (err) {
      showToast('Failed to load template details', 'error');
      console.error('Error fetching template:', err);
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownload = async (fileType) => {
    try {
      const response = await templateService.downloadTemplate(id, fileType);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}_${fileType}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`Template downloaded successfully`, 'success');
    } catch (err) {
      showToast('Failed to download template', 'error');
      console.error('Download error:', err);
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

  if (!template) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Template not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 page-header-row">
          <h1 className="text-2xl font-bold text-gray-900">Template Details</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/templates')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Templates
            </button>
            <button
              onClick={() => handleDownload('original')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Download Original
            </button>
            {template.fillable_file_path && (
              <button
                onClick={() => handleDownload('fillable')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Download Fillable
              </button>
            )}
            {/* Preview Template button temporarily hidden */}
            {/* <button
              onClick={() => navigate(`/templates/${id}/preview`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Preview Template
            </button> */}
            {(isAdmin || isEditor) && (
              <>
                <button
                  onClick={() => navigate(`/templates/${id}/mappings`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Edit Mappings
                </button>
                {/* Generate Report button temporarily hidden */}
                {/* <button
                  onClick={() => navigate(`/templates/${id}/generate`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate Report
                </button> */}
              </>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Basic Information */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{template.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Appraisal Type</label>
                <p className="mt-1 text-sm text-gray-900">{template.appraisal_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Version</label>
                <p className="mt-1 text-sm text-gray-900">{template.version}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  template.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(template.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created By</label>
                <p className="mt-1 text-sm text-gray-900">{template.created_by || 'Unknown'}</p>
              </div>
            </div>
            {template.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-sm text-gray-900">{template.description}</p>
              </div>
            )}
          </div>

          {/* Field Mappings */}
          <div className="px-6 py-4">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Field Mappings</h2>
            {template.field_mappings && Object.keys(template.field_mappings).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                        Field Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                        Required
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                        Default Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(template.field_mappings).map(([fieldName, fieldConfig]) => (
                      <tr key={fieldName}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fieldConfig.label || fieldName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {fieldConfig.type || 'text'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fieldConfig.required ? (
                            <span className="text-red-600">Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fieldConfig.default_value || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No field mappings found</p>
                {(isAdmin || isEditor) && (
                  <button
                    onClick={() => navigate(`/templates/${id}/mappings`)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Add field mappings
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TemplateDetails;