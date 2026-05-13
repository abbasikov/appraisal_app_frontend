import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const FieldMappingEditor = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'date', label: 'Date' },
    { value: 'currency', label: 'Currency' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'image', label: 'Image' }
  ];

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplate(id);
      setTemplate(data);
      setFieldMappings(data.field_mappings || {});
    } catch (err) {
      showToast('Failed to load template', 'error');
      console.error('Error fetching template:', err);
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName, property, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [property]: value
      }
    }));
  };

  const addNewField = () => {
    const newFieldName = `field_${Object.keys(fieldMappings).length + 1}`;
    setFieldMappings(prev => ({
      ...prev,
      [newFieldName]: {
        id: `field_${Date.now()}`,
        label: newFieldName,
        type: 'text',
        required: false,
        default_value: '',
        options: []
      }
    }));
  };

  const removeField = (fieldName) => {
    if (window.confirm(`Are you sure you want to remove field "${fieldName}"?`)) {
      setFieldMappings(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await templateService.updateFieldMappings(id, fieldMappings);
      showToast('Field mappings updated successfully', 'success');
      navigate(`/templates/${id}`);
    } catch (err) {
      showToast('Failed to update field mappings', 'error');
      console.error('Error updating field mappings:', err);
    } finally {
      setSaving(false);
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
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Field Mappings</h1>
            <p className="text-gray-600 mt-1">Template: {template.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/templates/${id}`)}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900">Field Mappings</h2>
            <button
              onClick={addNewField}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Field
            </button>
          </div>

          <div className="px-6 py-4">
            {Object.keys(fieldMappings).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No field mappings defined</p>
                <button
                  onClick={addNewField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First Field
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(fieldMappings).map(([fieldName, fieldConfig]) => (
                  <div key={fieldName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Field: {fieldName}</h3>
                      <button
                        onClick={() => removeField(fieldName)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={fieldConfig.label || fieldName}
                          onChange={(e) => handleFieldChange(fieldName, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={fieldConfig.type || 'text'}
                          onChange={(e) => handleFieldChange(fieldName, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Value
                        </label>
                        <input
                          type="text"
                          value={fieldConfig.default_value || ''}
                          onChange={(e) => handleFieldChange(fieldName, 'default_value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={fieldConfig.required || false}
                            onChange={(e) => handleFieldChange(fieldName, 'required', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>

                    {fieldConfig.type === 'select' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options (one per line)
                        </label>
                        <textarea
                          value={(fieldConfig.options || []).join('\n')}
                          onChange={(e) => handleFieldChange(fieldName, 'options', e.target.value.split('\n').filter(opt => opt.trim()))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FieldMappingEditor;