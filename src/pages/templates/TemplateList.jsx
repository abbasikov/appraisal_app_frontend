import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import { PencilIcon, TrashIcon, EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appraisalTypeFilter, setAppraisalTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(true);
  const { user, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const appraisalTypes = ['DIVORCE', 'ESTATE', 'INSURANCE', 'TAX', 'DONATION', 'OTHER'];

  useEffect(() => {
    fetchTemplates();
  }, [appraisalTypeFilter, activeFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates(appraisalTypeFilter || null, activeFilter);
      setTemplates(data.templates || []);
    } catch (err) {
      showToast('Failed to load templates', 'error');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      return;
    }

    try {
      await templateService.deleteTemplate(templateId);
      setTemplates(templates.filter(template => template.id !== templateId));
      showToast('Template deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete template', 'error');
      console.error('Error deleting template:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          {(isAdmin || isEditor) && (
            <Link 
              to="/templates/upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Upload Template
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex space-x-4">
          <select
            value={appraisalTypeFilter}
            onChange={(e) => setAppraisalTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {appraisalTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value === 'true')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.appraisal_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {template.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(template.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/templates/${template.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {(isAdmin || isEditor) && (
                          <>
                            <button
                              onClick={() => navigate(`/templates/${template.id}/mappings`)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Mappings"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/templates/${template.id}/generate`)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Generate Report"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(template.id, template.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default TemplateList;