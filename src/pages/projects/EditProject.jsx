import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import Layout from '../../components/Layout';

const EditProject = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    case_number: '',
    appraisal_type: 'DIVORCE',
    purpose: '',
    inspection_date: '',
    report_date: '',
    assigned_user_id: '',
    status: 'DRAFT',
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectData, clientsData] = await Promise.all([
        projectService.getProject(id),
        clientService.getClients(0, 1000)
      ]);
      
      setFormData({
        project_name: projectData.project_name || '',
        client_id: projectData.client_id || '',
        case_number: projectData.case_number || '',
        appraisal_type: projectData.appraisal_type || 'DIVORCE',
        purpose: projectData.purpose || '',
        inspection_date: projectData.inspection_date || '',
        report_date: projectData.report_date || '',
        assigned_user_id: projectData.assigned_user_id || '',
        status: projectData.status || 'DRAFT',
        notes: projectData.notes || ''
      });
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrors({ fetch: 'Failed to load project data' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const projectData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null,
        inspection_date: formData.inspection_date || null,
        report_date: formData.report_date || null
      };
      
      // Remove empty string dates
      if (projectData.inspection_date === '') projectData.inspection_date = null;
      if (projectData.report_date === '') projectData.report_date = null;
      
      await projectService.updateProject(id, projectData);
      navigate('/projects');
    } catch (err) {
      console.error('Error updating project:', err);
      setErrors({ submit: 'Failed to update project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
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

          {errors.fetch && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.fetch}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DIVORCE">Divorce</option>
                    <option value="ESTATE">Estate</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="TAX">Tax</option>
                    <option value="DONATION">Donation</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
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
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.project_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
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
                {loading ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProject;