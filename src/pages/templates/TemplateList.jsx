import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  SparklesIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appraisalTypeFilter, setAppraisalTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'table' or 'grid'
  const { user, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const appraisalTypes = [
    { value: 'DIVORCE', label: 'Divorce', color: 'blue', icon: UserIcon },
    { value: 'ESTATE', label: 'Estate', color: 'green', icon: DocumentTextIcon },
    { value: 'INSURANCE', label: 'Insurance', color: 'purple', icon: DocumentTextIcon },
    { value: 'TAX', label: 'Tax', color: 'orange', icon: DocumentTextIcon },
    { value: 'DONATION', label: 'Donation', color: 'pink', icon: DocumentTextIcon },
    { value: 'OTHER', label: 'Other', color: 'gray', icon: DocumentTextIcon }
  ];

  useEffect(() => {
    fetchTemplates();
  }, [appraisalTypeFilter, activeFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates(appraisalTypeFilter || null, activeFilter);
      setTemplates(data.templates || []);
    } catch (err) {
      showError('Failed to load templates');
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
      showSuccess('Template deleted successfully');
    } catch (err) {
      showError('Failed to delete template');
      console.error('Error deleting template:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAppraisalTypeInfo = (type) => {
    return appraisalTypes.find(t => t.value === type) || appraisalTypes[appraisalTypes.length - 1];
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const TemplateCard = ({ template }) => {
    const typeInfo = getAppraisalTypeInfo(template.appraisal_type);
    
    return (
      <div className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 animate-slide-up">
        {/* Status badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
            template.is_active 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {template.is_active ? (
              <CheckCircleIcon className="w-3 h-3" />
            ) : (
              <ExclamationTriangleIcon className="w-3 h-3" />
            )}
            <span>{template.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative p-6">
          {/* Template Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                  {template.name || 'Untitled Template'}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`inline-flex items-center px-2.5 py-1 bg-${typeInfo.color}-100 text-${typeInfo.color}-700 text-xs font-semibold rounded-full border border-${typeInfo.color}-200`}>
                    {React.createElement(typeInfo.icon, { className: "w-3 h-3 mr-1" })}
                    {typeInfo.label}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">v{template.version || '1.0'}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {template.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-3 h-3" />
                <span>Created {formatDate(template.created_at)}</span>
              </div>
              {template.created_by && (
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-3 h-3" />
                  <span>By {template.created_by}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate(`/templates/${template.id}`)}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <EyeIcon className="w-4 h-4" />
              <span>View</span>
            </button>
            
            {(isAdmin || isEditor) && (
              <>
                <button
                  onClick={() => navigate(`/templates/${template.id}/mappings`)}
                  className="flex items-center justify-center p-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                  title="Edit Mappings"
                >
                  <CogIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => navigate(`/templates/${template.id}/generate`)}
                  className="flex items-center justify-center p-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                  title="Generate Report"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                </button>
              </>
            )}
            
            {isAdmin && (
              <button
                onClick={() => handleDelete(template.id, template.name)}
                className="flex items-center justify-center p-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                title="Delete Template"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
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
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {/* Modern Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 p-5 sm:p-8 shadow-2xl">
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
                  <DocumentTextIcon className="w-8 h-8 text-white" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Templates</h1>
                </div>
                <p className="text-purple-100 text-lg">
                  Manage your appraisal report templates
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 text-white/90">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium">{filteredTemplates.length} templates</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/90">
                    <StarIcon className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Document Management</span>
                  </div>
                </div>
              </div>
              
              {(isAdmin || isEditor) && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/templates/upload')}
                    className="group flex items-center space-x-3 px-6 py-4 bg-white text-purple-600 font-semibold rounded-2xl hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <CloudArrowUpIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Upload Template</span>
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
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 focus:bg-white transition-all duration-200 placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                value={appraisalTypeFilter}
                onChange={(e) => setAppraisalTypeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 transition-all duration-200"
              >
                <option value="">All Types</option>
                {appraisalTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value === 'true')}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 transition-all duration-200"
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-purple-600 shadow-sm' 
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
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableCellsIcon className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredTemplates.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="w-16 h-16 text-purple-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No templates found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || appraisalTypeFilter 
                ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                : 'Get started by uploading your first template to begin creating professional reports.'
              }
            </p>
            {(isAdmin || isEditor) && !searchTerm && !appraisalTypeFilter && (
              <button
                onClick={() => navigate('/templates/upload')}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Upload First Template</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <div
                key={template.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TemplateCard template={template} />
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-purple-50/30 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Template</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Version</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTemplates.map((template, index) => {
                    const typeInfo = getAppraisalTypeInfo(template.appraisal_type);
                    return (
                      <tr
                        key={template.id}
                        className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-200 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                              {template.name}
                            </div>
                            {template.created_by && (
                              <div className="text-sm text-gray-500">By {template.created_by}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                            {React.createElement(typeInfo.icon, { className: "w-3 h-3 mr-1" })}
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 max-w-xs truncate">
                          {template.description || 'No description'}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-mono text-sm">
                          v{template.version || '1.0'}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {formatDate(template.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            template.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {template.is_active ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : (
                              <ExclamationTriangleIcon className="w-3 h-3" />
                            )}
                            <span>{template.is_active ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/templates/${template.id}`)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {(isAdmin || isEditor) && (
                              <>
                                <button
                                  onClick={() => navigate(`/templates/${template.id}/mappings`)}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                                  title="Edit Mappings"
                                >
                                  <CogIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/templates/${template.id}/generate`)}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                                  title="Generate Report"
                                >
                                  <DocumentArrowDownIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(template.id, template.name)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                                title="Delete Template"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

export default TemplateList;