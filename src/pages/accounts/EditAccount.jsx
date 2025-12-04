import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  DocumentTextIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const EditAccount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedFields, setCompletedFields] = useState(new Set());
  const [focusedField, setFocusedField] = useState('');
  const [originalData, setOriginalData] = useState({});
  const [attorneyAccounts, setAttorneyAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'client',
    parent_account_id: '',
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

  const accountTypes = [
    { value: 'attorney', label: 'Attorney', icon: BuildingOfficeIcon, color: 'blue' },
    { value: 'estate_planner', label: 'Estate Planner', icon: DocumentTextIcon, color: 'green' },
    { value: 'house_manager', label: 'House Manager', icon: UserIcon, color: 'purple' },
    { value: 'financial_manager', label: 'Financial Manager', icon: UserIcon, color: 'orange' },
    { value: 'assistant', label: 'Assistant', icon: UserIcon, color: 'pink' },
    { value: 'appraiser', label: 'Appraiser', icon: UserIcon, color: 'cyan' },
    { value: 'client', label: 'Client', icon: UserIcon, color: 'emerald' }
  ];

  useEffect(() => {
    fetchAccount();
  }, [id]);

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

  const fetchAccount = async () => {
    try {
      const account = await accountService.getAccount(id);
      const accountData = {
        name: account.name || '',
        account_type: account.account_type || 'client',
        parent_account_id: account.parent_account_id || '',
        address: account.address || '',
        city: account.city || '',
        state: account.state || '',
        zip_code: account.zip_code || '',
        phone: account.phone || '',
        alt_phone: account.alt_phone || '',
        email: account.email || '',
        web_address: account.web_address || '',
        notes: account.notes || ''
      };
      
      setFormData(accountData);
      setOriginalData(accountData);
      
      // Set completed fields based on existing data
      const completed = new Set();
      Object.entries(accountData).forEach(([key, value]) => {
        if (value && value.trim()) {
          completed.add(key);
        }
      });
      setCompletedFields(completed);
      
    } catch (err) {
      setError('Failed to load account');
      console.error('Error fetching account:', err);
    } finally {
      setFetchLoading(false);
    }
  };

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
      
      await accountService.updateAccount(id, cleanedData);
      navigate('/accounts');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update account');
      console.error('Error updating account:', err);
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

  const hasChanges = () => {
    return Object.keys(formData).some(key => formData[key] !== originalData[key]);
  };

  const renderField = ({ name, label, type = 'text', required = false, placeholder, rows }) => {
    const Icon = getFieldIcon(name);
    const isCompleted = completedFields.has(name);
    const isFocused = focusedField === name;
    const hasChanged = formData[name] !== originalData[name];
    const isTextarea = type === 'textarea';
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {isCompleted && !required && <CheckIcon className="w-4 h-4 text-green-500" />}
          {hasChanged && <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" title="Modified" />}
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
              hasChanged
                ? 'border-orange-300 bg-orange-50/30'
                : isFocused
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
              hasChanged
                ? 'border-orange-300 bg-orange-50/30'
                : isFocused
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
  const progress = Math.round((completedFields.size / Object.keys(formData).length) * 100);
  const changedFields = Object.keys(formData).filter(key => formData[key] !== originalData[key]).length;

  if (fetchLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header with progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/accounts')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Account</h1>
              <p className="text-gray-600">Update account information</p>
            </div>
          </div>
          
          {/* Progress and changes indicator */}
          <div className="flex items-center space-x-4">
            {hasChanges() && (
              <div className="flex items-center space-x-2 bg-orange-100 border border-orange-200 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-orange-800">
                  {changedFields} change{changedFields !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 font-medium">{progress}% complete</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
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
                <PencilSquareIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit {selectedType?.label || 'Account'}
                </h2>
                <p className="text-sm text-gray-600">
                  {completedFields.size} of {Object.keys(formData).length} fields completed
                  {hasChanges() && ` • ${changedFields} unsaved change${changedFields !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
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

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                    <span>Account Type</span>
                    <span className="text-red-500">*</span>
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  </label>
                  <select
                    name="account_type"
                    value={formData.account_type}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
                      formData.account_type !== originalData.account_type
                        ? 'border-orange-300 bg-orange-50/30'
                        : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                    }`}
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
                    {formData.parent_account_id && formData.parent_account_id !== originalData.parent_account_id && (
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" title="Modified" />
                    )}
                  </label>
                  <select
                    name="parent_account_id"
                    value={formData.parent_account_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
                      formData.parent_account_id !== originalData.parent_account_id
                        ? 'border-orange-300 bg-orange-50/30'
                        : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                    }`}
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
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/accounts')}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !hasChanges()}
                className="group px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="w-5 h-5 mr-2 inline-block group-hover:scale-110 transition-transform" />
                    Update Account
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

export default EditAccount;