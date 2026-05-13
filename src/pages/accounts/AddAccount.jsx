import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { accountService } from '../../services/accountService';
import { 
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AddAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedFields, setCompletedFields] = useState(new Set());
  const [focusedField, setFocusedField] = useState('');
  const [attorneyAccounts, setAttorneyAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [formData, setFormData] = useState({
    parent_account_id: '',
    name: '',
    company: '',
    account_type: 'attorney',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    alt_phone: '',
    email: '',
    web_address: '',
    notes: ''
  });

  useEffect(() => {
    if (formData.account_type !== 'attorney' && formData.account_type !== 'client') {
      fetchAttorneyAccounts();
    }
  }, [formData.account_type]);

  const fetchAttorneyAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await accountService.getAccounts(null, true);
      // Only show attorney accounts for association
      const attorneyAccounts = (response.accounts || []).filter(account => account.account_type === 'attorney');
      setAttorneyAccounts(attorneyAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const accountTypes = [
    { value: 'attorney', label: 'Attorney', icon: BuildingOfficeIcon, color: 'blue' },
    { value: 'estate_planner', label: 'Estate Planner', icon: DocumentTextIcon, color: 'green' },
    { value: 'house_manager', label: 'House Manager', icon: UserIcon, color: 'purple' },
    { value: 'financial_manager', label: 'Financial Manager', icon: UserIcon, color: 'orange' },
    { value: 'assistant', label: 'Assistant', icon: UserIcon, color: 'pink' },
    { value: 'appraiser', label: 'Appraiser', icon: UserIcon, color: 'cyan' },
    { value: 'client', label: 'Client', icon: UserIcon, color: 'indigo' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Track completed fields for visual feedback
    if (value.trim()) {
      setCompletedFields(prev => new Set([...prev, name]));
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Clean the form data - remove empty strings and handle parent_account_id
      const cleanedData = { ...formData };
      
      // Remove empty strings
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          delete cleanedData[key];
        }
      });
      
      // Handle parent_account_id specifically
      if (cleanedData.parent_account_id && cleanedData.parent_account_id !== '') {
        cleanedData.parent_account_id = parseInt(cleanedData.parent_account_id);
      } else {
        delete cleanedData.parent_account_id;
      }
      
      const result = await accountService.createAccount(cleanedData);
      
      // If we created a client (account_type was 'client'), dispatch clientCreated event
      if (formData.account_type === 'client') {
        window.dispatchEvent(new CustomEvent('clientCreated', {
          detail: { client: result }
        }));
      }
      
      navigate('/accounts');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const icons = {
      name: UserIcon,
      email: EnvelopeIcon,
      phone: PhoneIcon,
      alt_phone: PhoneIcon,
      address: MapPinIcon,
      city: MapPinIcon,
      state: MapPinIcon,
      zip_code: MapPinIcon,
      web_address: GlobeAltIcon,
      notes: DocumentTextIcon
    };
    return icons[fieldName] || UserIcon;
  };

  const renderField = ({ name, label, type = 'text', required = false, placeholder, rows }) => {
    const Icon = getFieldIcon(name);
    const isCompleted = completedFields.has(name);
    const isFocused = focusedField === name;
    const isTextarea = type === 'textarea';
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {isCompleted && !required && <CheckIcon className="w-4 h-4 text-green-500" />}
        </label>
        
        {isTextarea ? (
          <textarea
            name={name}
            rows={rows || 4}
            value={formData[name]}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField('')}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 resize-none ${
              isFocused
                ? 'border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-500/10'
                : isCompleted
                ? 'border-green-300 bg-green-50/30'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            name={name}
            required={required}
            value={formData[name]}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField('')}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
              isFocused
                ? 'border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-500/10'
                : isCompleted
                ? 'border-green-300 bg-green-50/30'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  const selectedType = accountTypes.find(type => type.value === formData.account_type);
  
  // Calculate total visible fields dynamically based on account type
  const getTotalVisibleFields = () => {
    let totalFields = 0;
    
    // Basic fields always visible
    totalFields += 3;
    
    // Parent account field - only visible for non-attorney/non-client accounts
    if (formData.account_type !== 'attorney' && formData.account_type !== 'client') {
      totalFields += 1; 
    }
    
    // Contact fields
    totalFields += 4; 
    
    // Address fields
    totalFields += 4; 
    
    // Additional fields
    totalFields += 1;
    
    return totalFields;
  };
  
  const totalVisibleFields = getTotalVisibleFields();
  const progress = totalVisibleFields > 0 ? Math.round((completedFields.size / totalVisibleFields) * 100) : 0;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header with progress */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/accounts')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Account</h1>
              <p className="text-gray-600 text-sm sm:text-base">Create a new account in the system</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center space-x-3 pl-14 sm:pl-0">
            <span className="text-sm text-gray-600 font-medium">{completedFields.size} of {totalVisibleFields} fields</span>
            <div className="w-20 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-4 flex items-center space-x-3">
            <XMarkIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Account Type Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl bg-${selectedType?.color}-100 border border-${selectedType?.color}-200`}>
                {selectedType && <selectedType.icon className={`w-6 h-6 text-${selectedType.color}-600`} />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  New {selectedType?.label || 'Account'}
                </h2>
                <p className="text-sm text-gray-600">
                  {completedFields.size} of {totalVisibleFields} fields completed
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-blue-500" />
                <span>Basic Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField({
                  name: 'name',
                  label: 'Account Name',
                  required: true,
                  placeholder: 'Enter account name'
                })}

                {renderField({
                  name: 'company',
                  label: 'Company',
                  placeholder: 'Enter company name'
                })}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                    <span>Account Type</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="account_type"
                    value={formData.account_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                  >
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Account Assignment for non-Attorney/Client accounts */}
              {formData.account_type !== 'attorney' && formData.account_type !== 'client' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                    <span>Assigned to Account (Optional)</span>
                  </label>
                  <select
                    name="parent_account_id"
                    value={formData.parent_account_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                    disabled={loadingAccounts}
                  >
                    <option value="">No account assigned</option>
                    {attorneyAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_type.replace('_', ' ')}) - {account.email || 'No email'}
                      </option>
                    ))}
                  </select>
                  {loadingAccounts && <p className="text-gray-500 text-sm mt-1">Loading accounts...</p>}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <EnvelopeIcon className="w-5 h-5 text-green-500" />
                <span>Contact Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField({
                  name: 'email',
                  label: 'Email Address',
                  type: 'email',
                  placeholder: 'contact@example.com'
                })}

                {renderField({
                  name: 'phone',
                  label: 'Primary Phone',
                  type: 'tel',
                  placeholder: '(555) 123-4567'
                })}

                {renderField({
                  name: 'alt_phone',
                  label: 'Alternative Phone',
                  type: 'tel',
                  placeholder: '(555) 987-6543'
                })}

                {renderField({
                  name: 'web_address',
                  label: 'Website',
                  type: 'url',
                  placeholder: 'https://www.example.com'
                })}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <MapPinIcon className="w-5 h-5 text-purple-500" />
                <span>Address Information</span>
              </h3>
              
              <div className="space-y-6">
                {renderField({
                  name: 'address',
                  label: 'Street Address',
                  type: 'textarea',
                  rows: 3,
                  placeholder: '123 Main Street, Suite 100'
                })}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderField({
                    name: 'city',
                    label: 'City',
                    placeholder: 'New York'
                  })}

                  {renderField({
                    name: 'state',
                    label: 'State',
                    placeholder: 'NY'
                  })}

                  {renderField({
                    name: 'zip_code',
                    label: 'ZIP Code',
                    placeholder: '10001'
                  })}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-orange-500" />
                <span>Additional Information</span>
              </h3>
              
              {renderField({
                name: 'notes',
                label: 'Notes',
                type: 'textarea',
                rows: 4,
                placeholder: 'Any additional notes or comments...'
              })}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 form-actions-row pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/accounts')}
                className="btn-responsive px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="group btn-responsive px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5 mr-2 inline-block group-hover:scale-110 transition-transform" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddAccount;