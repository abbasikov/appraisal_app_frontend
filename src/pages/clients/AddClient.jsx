import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { accountService } from '../../services/accountService';
import Layout from '../../components/Layout';

const AddClient = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    parent_account_id: '',
    attorney_name: '',
    attorney_email: '',
    attorney_phone: '',
    case_name: '',
    case_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [attorneyAccounts, setAttorneyAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAttorneyAccounts();
  }, []);

  const fetchAttorneyAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await accountService.getAccounts('attorney', true);
      setAttorneyAccounts(response.accounts || []);
    } catch (error) {
      console.error('Error fetching attorney accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-populate attorney fields when parent_account_id changes
      if (name === 'parent_account_id') {
        const selectedAccount = attorneyAccounts.find(acc => acc.id === parseInt(value));
        if (selectedAccount) {
          newData.attorney_name = selectedAccount.name || '';
          newData.attorney_email = selectedAccount.email || '';
          newData.attorney_phone = selectedAccount.phone || '';
        } else if (value === '') {
          // Clear fields if no account selected
          newData.attorney_name = '';
          newData.attorney_email = '';
          newData.attorney_phone = '';
        }
      }
      
      return newData;
    });

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.attorney_email && !/\S+@\S+\.\S+/.test(formData.attorney_email)) {
      newErrors.attorney_email = 'Please enter a valid attorney email address';
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
      // Clean the form data - remove empty strings to avoid validation errors
      const cleanedData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value && value.trim() !== '') {
          cleanedData[key] = value.trim();
        }
      });
      
      const newClient = await clientService.createClient(cleanedData);
      
      // Dispatch event to notify other components (like AccountList) about the new client
      window.dispatchEvent(new CustomEvent('clientCreated', {
        detail: { client: newClient }
      }));
      
      navigate('/clients');
    } catch (err) {
      console.error('Error creating client:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(e => e.msg || e.message || e).join(', ');
          setErrors({ submit: `Validation error: ${errorMessages}` });
        } else {
          setErrors({ submit: `Failed to create client: ${err.response.data.detail}` });
        }
      } else {
        setErrors({ submit: 'Failed to create client. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
            <button
              onClick={() => navigate('/clients')}
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
            {/* Client Information Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Attorney Information Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Attorney Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Attorney Account (Optional)
                  </label>
                  <select
                    name="parent_account_id"
                    value={formData.parent_account_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={loadingAccounts}
                  >
                    <option value="">Select an attorney account or enter manually below</option>
                    {attorneyAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.email || 'No email'}
                      </option>
                    ))}
                  </select>
                  {loadingAccounts && <p className="text-gray-500 text-sm mt-1">Loading attorney accounts...</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attorney Name
                  </label>
                  <input
                    type="text"
                    name="attorney_name"
                    value={formData.attorney_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter manually if not selected above"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attorney Email
                  </label>
                  <input
                    type="email"
                    name="attorney_email"
                    value={formData.attorney_email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.attorney_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter manually if not selected above"
                  />
                  {errors.attorney_email && <p className="text-red-500 text-sm mt-1">{errors.attorney_email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attorney Phone
                  </label>
                  <input
                    type="tel"
                    name="attorney_phone"
                    value={formData.attorney_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter manually if not selected above"
                  />
                </div>
              </div>
            </div>

            {/* Case Information Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Case Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Name
                  </label>
                  <input
                    type="text"
                    name="case_name"
                    value={formData.case_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
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
                onClick={() => navigate('/clients')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddClient;