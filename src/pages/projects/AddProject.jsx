import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import { authService } from '../../services/authService';
import Layout from '../../components/Layout';

const AddProject = () => {
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    case_number: '',
    appraisal_type: 'DIVORCE',
    purpose: '',
    inspection_date: '',
    report_date: '',
    assigned_user_id: '',
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projectNamePreview, setProjectNamePreview] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateProjectNamePreview();
  }, [formData.client_id, formData.appraisal_type]);

  const fetchData = async () => {
    try {
      const [clientsData, usersData] = await Promise.all([
        clientService.getClients(0, 1000),
        // Get users with editor role - this would need a users endpoint
        // For now, we'll skip this and handle it later
        Promise.resolve([])
      ]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setClients([]);
      setUsers([]);
      console.error('Error fetching data:', err);
    }
  };

  const generateProjectNamePreview = () => {
    if (formData.client_id && formData.appraisal_type) {
      const client = clients.find(c => c.id === parseInt(formData.client_id));
      if (client) {
        const year = new Date().getFullYear();
        const preview = `${client.name}_${formData.appraisal_type}_${year}`;
        setProjectNamePreview(preview);
        if (!formData.project_name) {
          setFormData(prev => ({ ...prev, project_name: preview }));
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    }
    
    if (!formData.client_id) {
      newErrors.client_id = 'Please select a client';
    }
    
    if (!formData.appraisal_type) {
      newErrors.appraisal_type = 'Please select an appraisal type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert string IDs to integers
      const projectData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null
      };
      
      await projectService.createProject(projectData);
      navigate('/projects');
    } catch (err) {
      console.error('Error creating project:', err);
      setErrors({ submit: 'Failed to create project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
          
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Information Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.client_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.case_name ? `- ${client.case_name}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.client_id && <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appraisal Type *
                  </label>
                  <select
                    name="appraisal_type"
                    value={formData.appraisal_type}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.appraisal_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="DIVORCE">Divorce</option>
                    <option value="ESTATE">Estate</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="TAX">Tax</option>
                    <option value="DONATION">Donation</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.appraisal_type && <p className="text-red-500 text-sm mt-1">{errors.appraisal_type}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Number
                  </label>
                  <input
                    type="text"
                    name="case_number"
                    value={formData.case_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    placeholder={projectNamePreview}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.project_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {projectNamePreview && (
                    <p className="text-sm text-gray-500 mt-1">
                      Auto-generated: {projectNamePreview}
                    </p>
                  )}
                  {errors.project_name && <p className="text-red-500 text-sm mt-1">{errors.project_name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inspection Date
                  </label>
                  <input
                    type="date"
                    name="inspection_date"
                    value={formData.inspection_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Date
                  </label>
                  <input
                    type="date"
                    name="report_date"
                    value={formData.report_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the purpose of this appraisal..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddProject;