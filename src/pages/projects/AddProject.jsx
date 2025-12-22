import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import { templateService } from '../../services/templateService';
import { accountService } from '../../services/accountService';
import Layout from '../../components/Layout';
import { 
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedFields, setCompletedFields] = useState(new Set());
  const [focusedField, setFocusedField] = useState('');
  const [projectNamePreview, setProjectNamePreview] = useState('');
  const [archivedModal, setArchivedModal] = useState({ isOpen: false, clientId: null, accountId: null });
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    case_name: '',
    case_number: '',
    appraisal_type: 'SELECT',
    purpose: '',
    inspection_date: '',
    report_date: '',
    effective_date: '',
    appraisal_location: '',
    appraisal_location_type: 'manual', // 'client', 'appraiser', 'attorney', 'manual'
    estate_of: '',  // For ESTATE appraisals
    date_of_death: '',  // For ESTATE appraisals
    address_letter_to: '',  // Address to send letter to
    assigned_user_id: '',
    account_id: '',  // NEW: Account assignment
    template_id: '',
    notes: '',
    recipient: {
      name: '',
      title: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zip_code: ''
    },
    recipient_source: '' // 'manual', 'client', 'account'
  });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [appraisers, setAppraisers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [errors, setErrors] = useState({});

  const appraisalTypes = [{ value: 'SELECT', label: 'Select', icon: UserIcon, color: 'blue', description: 'Please select appraisal type' },
    { value: 'DIVORCE', label: 'Divorce', icon: UserIcon, color: 'blue', description: 'Marital dissolution appraisals' },
    { value: 'ESTATE', label: 'Estate', icon: BuildingOfficeIcon, color: 'green', description: 'Estate settlement and probate' },
    { value: 'INSURANCE', label: 'Insurance', icon: DocumentTextIcon, color: 'purple', description: 'Insurance claim evaluations' },
    { value: 'TAX', label: 'Tax', icon: DocumentTextIcon, color: 'orange', description: 'Tax assessment purposes' },
    { value: 'DONATION', label: 'Donation', icon: DocumentTextIcon, color: 'pink', description: 'Charitable donation valuations' },
    { value: 'OTHER', label: 'Other', icon: DocumentTextIcon, color: 'gray', description: 'Custom appraisal purposes' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsData, templatesData, accountsData] = await Promise.all([
        clientService.getClients(0, 1000),
        templateService.getTemplates(),
        accountService.getAccounts(null, true)
      ]);
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setTemplates(Array.isArray(templatesData?.templates) ? templatesData.templates : Array.isArray(templatesData) ? templatesData : []);
      
      // Filter out client accounts
      const allAccounts = accountsData.accounts || [];
      const nonClientAccounts = allAccounts.filter(account => account.account_type !== 'client');
      setAccounts(nonClientAccounts);
      
      // Filter appraisers from all accounts
      const appraiserAccounts = allAccounts.filter(account => account.account_type === 'appraiser');
      setAppraisers(appraiserAccounts);
    } catch (err) {
      setClients([]);
      setTemplates([]);
      setAccounts([]);
      console.error('Error fetching data:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('recipient.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recipient: {
          ...prev.recipient,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        // Auto-populate project name when client or type changes
        if (name === 'client_id' || name === 'appraisal_type') {
          const clientId = name === 'client_id' ? value : prev.client_id;
          const appraisalType = name === 'appraisal_type' ? value : prev.appraisal_type;
          if (clientId && appraisalType && appraisalType !== 'SELECT') {
            const client = clients.find(c => c.id === parseInt(clientId));
            if (client) {
              const year = new Date().getFullYear();
              newData.project_name = `${client.name}_${appraisalType}_${year}`;
            }
          }
        }
        
        // Auto-populate recipient if source matches
        if (name === 'client_id' && prev.recipient_source === 'client') {
          const client = clients.find(c => c.id === parseInt(value));
          if (client) {
            newData.recipient = {
              name: client.name || '',
              title: '',
              company: client.company || '',
              address: client.address || '',
              city: client.city || '',
              state: client.state || '',
              zip_code: client.zip_code || ''
            };
          }
        }
        
        if (name === 'account_id' && prev.recipient_source === 'account') {
          const account = accounts.find(a => a.id === parseInt(value));
          if (account) {
            newData.recipient = {
              name: account.name || '',
              title: '',
              company: account.name || '',
              address: account.address || '',
              city: account.city || '',
              state: account.state || '',
              zip_code: account.zip_code || ''
            };
          }
        }
        
        return newData;
      });
    }
    
    // Store selected client for reference
    if (name === 'client_id') {
      const client = value ? clients.find(c => c.id === parseInt(value)) : null;
      setSelectedClient(client || null);
    }
    
    // Track completed fields for visual feedback
    if (value && value.trim()) {
      setCompletedFields(prev => new Set([...prev, name]));
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    
    if (!formData.appraisal_type || formData.appraisal_type === 'SELECT') {
      newErrors.appraisal_type = 'Please select an appraisal type';
    }

    // case_name, inspection_date, and effective_date required for all templates EXCEPT estate
    if (formData.appraisal_type !== 'ESTATE' && formData.appraisal_type !== 'SELECT') {
      if (!formData.case_name || !formData.case_name.trim()) {
        newErrors.case_name = 'Case Name is required';
      }
      if (!formData.inspection_date || !formData.inspection_date.trim()) {
        newErrors.inspection_date = 'Inspection Date is required';
      }
      if (!formData.effective_date || !formData.effective_date.trim()) {
        newErrors.effective_date = 'Effective Date is required';
      }
    }
    
    // Validate estate fields if appraisal type is ESTATE
    if (formData.appraisal_type === 'ESTATE') {
      if (!formData.estate_of || !formData.estate_of.trim()) {
        newErrors.estate_of = 'Estate Of is required for Estate appraisals';
      }
      
      if (!formData.date_of_death || !formData.date_of_death.trim()) {
        newErrors.date_of_death = 'Date of Death is required for Estate appraisals';
      }
    }
    
    // Validate address_letter_to
    if (!formData.address_letter_to || !formData.address_letter_to.trim()) {
      newErrors.address_letter_to = 'Address Letter To is required';
    }
    
    // Validate dates if provided
    if (formData.inspection_date && formData.inspection_date.trim()) {
      const inspectionDate = new Date(formData.inspection_date);
      if (isNaN(inspectionDate.getTime())) {
        newErrors.inspection_date = 'Please enter a valid inspection date';
      }
    }
    
    if (formData.report_date && formData.report_date.trim()) {
      const reportDate = new Date(formData.report_date);
      if (isNaN(reportDate.getTime())) {
        newErrors.report_date = 'Please enter a valid report due date';
      }
    }
    
    // Check if report date is after inspection date
    if (formData.inspection_date && formData.report_date && 
        formData.inspection_date.trim() && formData.report_date.trim()) {
      const inspectionDate = new Date(formData.inspection_date);
      const reportDate = new Date(formData.report_date);
      if (!isNaN(inspectionDate.getTime()) && !isNaN(reportDate.getTime()) && 
          reportDate < inspectionDate) {
        newErrors.report_date = 'Report due date should be after inspection date';
      }
    }
    
    // Project template is required
    if (!formData.template_id) {
      newErrors.template_id = 'Please select a project template';
    }

    // Appraisal location is required
    if (!formData.appraisal_location || !formData.appraisal_location.trim()) {
      newErrors.appraisal_location = 'Appraisal Location is required';
    }
    
    // Recipient validation - if a recipient source is selected, require name and address
    if (formData.recipient_source && formData.recipient_source !== '') {
      if (!formData.recipient.name || !formData.recipient.name.trim()) {
        newErrors['recipient.name'] = 'Recipient name is required';
      }
      if (!formData.recipient.address || !formData.recipient.address.trim()) {
        newErrors['recipient.address'] = 'Recipient address is required';
      }
      if (!formData.recipient.city || !formData.recipient.city.trim()) {
        newErrors['recipient.city'] = 'Recipient city is required';
      }
      if (!formData.recipient.state || !formData.recipient.state.trim()) {
        newErrors['recipient.state'] = 'Recipient state is required';
      }
      if (!formData.recipient.zip_code || !formData.recipient.zip_code.trim()) {
        newErrors['recipient.zip_code'] = 'Recipient zip code is required';
      }
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
    setError('');

    try {
      // Clean the form data - remove empty strings and convert dates properly
      const cleanedData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (key === 'client_id' && value) {
          cleanedData[key] = parseInt(value);
        } else if (key === 'assigned_user_id' && value) {
          cleanedData[key] = parseInt(value);
        } else if (key === 'account_id' && value) {
          cleanedData[key] = parseInt(value);
        } else if (key === 'template_id' && value) {
          cleanedData[key] = parseInt(value);
        } else if ((key === 'inspection_date' || key === 'report_date' || key === 'effective_date') && value && value.trim() !== '') {
          cleanedData[key] = value;
        } else if (key === 'appraisal_location' && value && value.trim() !== '') {
          cleanedData[key] = value.trim();
        } else if (key === 'appraisal_location_type') {
          // Skip this field - it's only for UI logic
        } else if (value && value.trim && value.trim() !== '') {
          cleanedData[key] = value.trim();
        } else if (!value || (value.trim && value.trim() === '')) {
          // Skip empty values - let backend handle defaults
        } else {
          cleanedData[key] = value;
        }
      });
      
      // Add recipient data if source is not empty
      if (formData.recipient_source && formData.recipient_source !== '') {
        cleanedData.recipient = formData.recipient;
      }
      
      const createdProject = await projectService.createProject(cleanedData);
      // Redirect to Dropbox integration after project creation
      navigate(`/projects/${createdProject.id}/dropbox`);
    } catch (err) {
      console.error('Error creating project:', err);
      
      // Handle different types of errors
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          const fieldErrors = {};
          err.response.data.detail.forEach(error => {
            const field = error.loc?.[error.loc.length - 1];
            const message = error.msg || error.message || 'Invalid value';
            if (field) {
              fieldErrors[field] = message;
            }
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            setError('Please fix the validation errors below.');
          } else {
            setError('Validation failed. Please check your input.');
          }
        } else {
          // Check if error message is about archived client-attorney pair
          const detail = err.response.data.detail;
          if (detail && detail.includes('archived') && detail.includes('Client ID:') && detail.includes('Account ID:')) {
            // Extract client and account IDs from error message
            const clientIdMatch = detail.match(/Client ID: (\d+)/);
            const accountIdMatch = detail.match(/Account ID: (\d+)/);
            
            const clientId = clientIdMatch ? parseInt(clientIdMatch[1]) : null;
            const accountId = accountIdMatch ? parseInt(accountIdMatch[1]) : null;
            
            setArchivedModal({
              isOpen: true,
              clientId: clientId,
              accountId: accountId
            });
          } else {
            setError(`Failed to create project: ${detail}`);
          }
        }
      } else if (err.response?.status === 422) {
        setError('Invalid data provided. Please check all required fields and date formats.');
      } else {
        setError('Failed to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedAppraisalType = appraisalTypes.find(type => type.value === formData.appraisal_type);
  const progress = Math.round((completedFields.size / Object.keys(formData).length) * 100);

  const renderField = ({ name, label, type = 'text', options = [], required = false, placeholder = '', rows = 3, description = '', disabled = false, value }) => {
    const isCompleted = completedFields.has(name);
    const isFocused = focusedField === name;
    const hasError = errors[name];
    const fieldValue = value !== undefined ? value : formData[name];

    return (
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {isCompleted && (
            <CheckIcon className="w-4 h-4 text-green-500" />
          )}
        </label>
        
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        
        {type === 'select' ? (
          <select
            name={name}
            value={fieldValue}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField('')}
            className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : isFocused
                ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 bg-blue-50/50'
                : isCompleted
                ? 'border-green-300 bg-green-50/50'
                : 'border-gray-200 hover:border-gray-300'
            } focus:outline-none focus:ring-4`}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={fieldValue}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField('')}
            placeholder={placeholder}
            rows={rows}
            className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 resize-none ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : isFocused
                ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 bg-blue-50/50'
                : isCompleted
                ? 'border-green-300 bg-green-50/50'
                : 'border-gray-200 hover:border-gray-300'
            } focus:outline-none focus:ring-4 placeholder-gray-400`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={fieldValue}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField('')}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
              disabled
                ? 'bg-gray-100 cursor-not-allowed opacity-60'
                : hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : isFocused
                ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 bg-blue-50/50'
                : isCompleted
                ? 'border-green-300 bg-green-50/50'
                : 'border-gray-200 hover:border-gray-300'
            } focus:outline-none focus:ring-4 placeholder-gray-400`}
          />
        )}
        
        {hasError && (
          <p className="text-red-600 text-sm flex items-center space-x-1">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>{errors[name]}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Archived Client Modal - Rendered via Portal */}
      {archivedModal.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in">
            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setArchivedModal({ isOpen: false, clientId: null, accountId: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="bg-red-100 rounded-full p-3">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Client-Attorney Pair Archived
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center text-sm">
              This client-attorney pair has been archived and cannot be used to create new projects.
            </p>

            {/* Additional Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">
                <center><strong>Why?</strong> <br />This client has been deleted for selected attorney.</center>
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setArchivedModal({ isOpen: false, clientId: null, accountId: null })}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Got It
            </button>
          </div>
        </div>,
        document.body
      )}

      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-700 p-8 shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 animate-pulse"></div>
            <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute right-1/4 top-1/4 w-6 h-6 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '2s' }}></div>
            <div className="absolute left-1/3 bottom-1/3 w-4 h-4 rounded-full bg-white/15 animate-bounce" style={{ animationDelay: '3s' }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate('/projects')}
                  className="inline-flex items-center space-x-2 text-emerald-100 hover:text-white transition-colors duration-200 mb-4"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span className="font-medium">Back to Projects</span>
                </button>
                
                <div className="flex items-center space-x-3 mb-2">
                  <PlusIcon className="w-8 h-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Create New Project</h1>
                </div>
                <p className="text-emerald-100 text-lg">
                  Set up a new appraisal project with all the details
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 text-white/90">
                    <SparklesIcon className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Professional Tools</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/90">
                    <StarIcon className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Quick Setup</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="text-center text-white/90">
                  <div className="text-2xl font-bold">{progress}%</div>
                  <div className="text-sm">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">Form Progress</h3>
              <p className="text-sm text-gray-600">
                {completedFields.size} of {Object.keys(formData).length} fields completed
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 font-medium">{progress}% complete</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full transition-all duration-300"
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
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {/* Project Type Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-${selectedAppraisalType?.color}-100 border border-${selectedAppraisalType?.color}-200`}>
                  {React.createElement(selectedAppraisalType?.icon || BuildingOfficeIcon, {
                    className: `w-6 h-6 text-${selectedAppraisalType?.color}-600`
                  })}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedAppraisalType?.label} Appraisal Project
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedAppraisalType?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                  <span>Basic Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'client_id',
                    label: 'Client',
                    type: 'select',
                    required: true,
                    description: 'Select the client for this appraisal project',
                    options: [
                      { value: '', label: 'Select a client' },
                      ...clients.map(client => ({
                        value: client.id,
                        label: `${client.name}${client.case_name ? ` - ${client.case_name}` : ''}`
                      }))
                    ]
                  })}

                  {renderField({
                    name: 'appraisal_type',
                    label: 'Appraisal Type',
                    type: 'select',
                    required: true,
                    description: 'Choose the type of appraisal being performed',
                    options: appraisalTypes
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'project_name',
                    label: 'Project Name',
                    required: true,
                    placeholder: projectNamePreview || 'Enter project name...',
                    description: 'A unique name to identify this project'
                  })}


                {/* Assigned to Account field */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <span>Assigned to Account (Optional)</span>
                  </label>
                  <p className="text-xs text-gray-500">Select an account to associate with this project</p>
                  <select
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('account_id')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
                      focusedField === 'account_id'
                        ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 bg-blue-50/50'
                        : completedFields.has('account_id')
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    } focus:outline-none focus:ring-4`}
                  >
                    <option value="">No account assigned</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_type.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
                </div>


                {/* Recipient Information */}
                <div className="space-y-6 bg-purple-50 p-6 rounded-2xl border border-purple-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-indigo-500" />
                    <span>Recipient Information</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span>Recipient Source</span>
                      </label>
                      <select
                        name="recipient_source"
                        value={formData.recipient_source}
                        onChange={(e) => {
                          const source = e.target.value;
                          
                          setFormData(prev => {
                            const newData = { ...prev, recipient_source: source };
                            
                            if (source === 'client') {
                              // Use selectedClient if available, otherwise try to find it from client_id
                              let client = selectedClient;
                              
                              if (!client && prev.client_id) {
                                client = clients.find(c => c.id === parseInt(prev.client_id));
                              }
                              
                              if (client) {
                                newData.recipient = {
                                  name: client.name || '',
                                  title: '',
                                  company: client.company || '',
                                  address: client.address || '',
                                  city: client.city || '',
                                  state: client.state || '',
                                  zip_code: client.zip_code || ''
                                };
                              }
                            } else if (source === 'account' && prev.account_id) {
                              const account = accounts.find(a => a.id === parseInt(prev.account_id));
                              
                              if (account) {
                                // Format account type for title (e.g., "estate_planner" -> "Estate Planner")
                                const title = account.account_type
                                  ? account.account_type.split('_')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ')
                                  : '';

                                newData.recipient = {
                                  name: account.name || '',
                                  title: title,
                                  company: account.company || '',
                                  address: account.address || '',
                                  city: account.city || '',
                                  state: account.state || '',
                                  zip_code: account.zip_code || ''
                                };
                              }
                            } else if (source === 'manual') {
                              newData.recipient = {
                                name: '',
                                title: '',
                                company: '',
                                address: '',
                                city: '',
                                state: '',
                                zip_code: ''
                              };
                            }
                            
                            return newData;
                          });
                        }}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        <option value="">Select Source...</option>
                        <option value="manual">Enter Manually</option>
                        <option value="client">Client</option>
                        {formData.account_id && (() => {
                          const account = accounts.find(a => a.id === parseInt(formData.account_id));
                          if (account) {
                            const typeLabel = account.account_type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            return <option value="account">{typeLabel}</option>;
                          }
                          return null;
                        })()}
                      </select>
                    </div>

                    {formData.recipient_source && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {renderField({
                            name: 'recipient.name',
                            label: 'Recipient Name',
                            required: true,
                            placeholder: 'Enter recipient name',
                            value: formData.recipient.name
                          })}

                          {renderField({
                            name: 'recipient.title',
                            label: 'Title',
                            placeholder: 'e.g. Attorney',
                            value: formData.recipient.title
                          })}

                          {renderField({
                            name: 'recipient.company',
                            label: 'Company / Firm',
                            placeholder: 'e.g. Smith Law LLC',
                            value: formData.recipient.company
                          })}
                        </div>

                        {renderField({
                          name: 'recipient.address',
                          label: 'Address',
                          required: true,
                          type: 'textarea',
                          rows: 3,
                          placeholder: 'Enter full address',
                          value: formData.recipient.address
                        })}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {renderField({
                            name: 'recipient.city',
                            label: 'City',
                            required: true,
                            value: formData.recipient.city,
                            placeholder: 'City'
                          })}
                          {renderField({
                            name: 'recipient.state',
                            label: 'State',
                            required: true,
                            value: formData.recipient.state,
                            placeholder: 'State'
                          })}
                          {renderField({
                            name: 'recipient.zip_code',
                            label: 'Zip Code',
                            required: true,
                            value: formData.recipient.zip_code,
                            placeholder: 'Zip Code'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {renderField({
                    name: 'address_letter_to',
                    label: 'Address Letter To',
                    type: 'text',
                    required: true,
                    placeholder: 'Enter Person Name',
                    description: 'Person to whom the letter should be addressed'
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'case_number',
                    label: 'Case Number',
                    placeholder: 'Enter case number if applicable...',
                    description: 'Optional reference number for tracking'
                  })}

                  {renderField({
                    name: 'case_name',
                    label: 'Case Name',
                    required: formData.appraisal_type !== 'ESTATE' && formData.appraisal_type !== 'SELECT',
                    placeholder: 'e.g., Estate of John Smith...',
                    description: 'Name of case for this appraisal'
                  })}
                </div>
              </div>

              {/* Scheduling */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-green-500" />
                  <span>Scheduling</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'inspection_date',
                    label: 'Inspection Date',
                    type: 'date',
                    required: formData.appraisal_type !== 'ESTATE' && formData.appraisal_type !== 'SELECT',
                    description: 'When will the property inspection take place?'
                  })}

                  {renderField({
                    name: 'report_date',
                    label: 'Report Due Date',
                    type: 'date',
                    description: 'Expected completion date for the appraisal report'
                  })}

                  {renderField({
                    name: 'effective_date',
                    label: 'Effective Date',
                    type: 'date',
                    required: formData.appraisal_type !== 'ESTATE' && formData.appraisal_type !== 'SELECT',
                    description: 'Effective date for the appraisal'
                  })}
                </div>
              </div>

              {/* Appraisal Location */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <BuildingOfficeIcon className="w-5 h-5 text-indigo-500" />
                  <span>Appraisal Location</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <span>Location Type</span>
                    </label>
                    <select
                      name="appraisal_location_type"
                      value={formData.appraisal_location_type}
                      onChange={(e) => {
                        const locationType = e.target.value;
                        setFormData(prev => ({ ...prev, appraisal_location_type: locationType }));
                        
                        // Auto-populate location based on selection
                        if (locationType === 'client' && selectedClient) {
                          const clientLocation = selectedClient.address 
                            ? `${selectedClient.address}${selectedClient.city ? `, ${selectedClient.city}` : ''}${selectedClient.state ? `, ${selectedClient.state}` : ''}${selectedClient.zip_code ? ` ${selectedClient.zip_code}` : ''}`.trim()
                            : '';
                          setFormData(prev => ({ ...prev, appraisal_location: clientLocation }));
                        } else if (locationType === 'assigned_account' && formData.account_id) {
                          // Use assigned account address
                          const account = accounts.find(a => a.id === parseInt(formData.account_id));
                          if (account) {
                            const accountLocation = account.address
                              ? `${account.address}${account.city ? `, ${account.city}` : ''}${account.state ? `, ${account.state}` : ''}${account.zip_code ? ` ${account.zip_code}` : ''}`.trim()
                              : '';
                            setFormData(prev => ({ ...prev, appraisal_location: accountLocation }));
                          }
                        } else if (locationType === 'parent_account' && formData.account_id) {
                          // Use parent account address
                          const account = accounts.find(a => a.id === parseInt(formData.account_id));
                          if (account && account.parent_account_id) {
                            // Find parent account
                            const parentAccount = accounts.find(a => a.id === account.parent_account_id);
                            if (parentAccount) {
                              const parentLocation = parentAccount.address
                                ? `${parentAccount.address}${parentAccount.city ? `, ${parentAccount.city}` : ''}${parentAccount.state ? `, ${parentAccount.state}` : ''}${parentAccount.zip_code ? ` ${parentAccount.zip_code}` : ''}`.trim()
                                : '';
                              setFormData(prev => ({ ...prev, appraisal_location: parentLocation }));
                            }
                          }
                        } else if (locationType === 'manual') {
                          setFormData(prev => ({ ...prev, appraisal_location: '' }));
                        } else if (locationType === 'appraiser') {
                          // Clear location, wait for appraiser selection
                          setFormData(prev => ({ ...prev, appraisal_location: '' }));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20"
                    >
                      <option value="manual">Enter Manually</option>
                      <option value="client">Client Address</option>
                      <option value="appraiser">Appraiser Location</option>
                      
                      {/* Dynamic options based on assigned account */}
                      {(() => {
                        if (!formData.account_id) return null;
                        
                        const selectedAccount = accounts.find(a => a.id === parseInt(formData.account_id));
                        if (!selectedAccount) return null;
                        
                        // Get readable account type name
                        const accountTypeLabel = selectedAccount.account_type.replace('_', ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        
                        const options = [];
                        
                        // Option 4: Assigned account address (for all account types including attorney)
                        options.push(
                          <option key="assigned_account" value="assigned_account">
                            {accountTypeLabel} Address
                          </option>
                        );
                        
                        // Option 5: Parent account address (only if parent exists and account is NOT an attorney)
                        // Attorneys don't have parents, so this won't show for them
                        if (selectedAccount.parent_account_id && selectedAccount.account_type !== 'attorney') {
                          const parentAccount = accounts.find(a => a.id === selectedAccount.parent_account_id);
                          if (parentAccount) {
                            // Format parent account type label
                            const parentTypeLabel = parentAccount.account_type.replace('_', ' ')
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            
                            options.push(
                              <option key="parent_account" value="parent_account">
                                {parentTypeLabel} Address
                              </option>
                            );
                          }
                        }
                        
                        return options;
                      })()}
                    </select>
                  </div>

                  {/* Appraiser Selection - shown when location type is 'appraiser' */}
                  {formData.appraisal_location_type === 'appraiser' && (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        <span>Select Appraiser</span>
                      </label>
                      <p className="text-xs text-gray-500">Choose an appraiser to use their location</p>
                      <select
                        onChange={(e) => {
                          const appraiser = appraisers.find(a => a.id === parseInt(e.target.value));
                          if (appraiser) {
                            const appraiserLocation = appraiser.address
                              ? `${appraiser.address}${appraiser.city ? `, ${appraiser.city}` : ''}${appraiser.state ? `, ${appraiser.state}` : ''}${appraiser.zip_code ? ` ${appraiser.zip_code}` : ''}`.trim()
                              : '';
                            setFormData(prev => ({ ...prev, appraisal_location: appraiserLocation }));
                          }
                        }}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        <option value="">Select an appraiser...</option>
                        {appraisers.map(appraiser => (
                          <option key={appraiser.id} value={appraiser.id}>
                            {appraiser.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {renderField({
                    name: 'appraisal_location',
                    label: 'Appraisal Location',
                    type: 'text',
                    required: true,
                    placeholder: formData.appraisal_location_type === 'manual' 
                      ? 'Enter appraisal location...' 
                      : 'Location will be auto-populated based on selection',
                    description: formData.appraisal_location_type === 'manual' 
                      ? 'Enter the location where the appraisal will take place'
                      : formData.appraisal_location_type === 'appraiser'
                      ? 'Select an appraiser above to populate this field. You can edit if needed.'
                      : formData.appraisal_location_type === 'client'
                      ? 'Using client address. You can edit if needed.'
                      : 'Using selected account address. You can edit if needed.',
                    disabled: false
                  })}
                </div>
              </div>



              {/* Template Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                  <span>Template Selection</span>
                </h3>
                
                {renderField({
                  name: 'template_id',
                  label: 'Report Template',
                  type: 'select',
                  required: true,
                  description: `Choose a template for generating reports - ${templates.length} templates available`,
                  options: [
                    { value: '', label: 'Select a template' },
                    ...templates
                      .filter(template => !formData.appraisal_type || template.appraisal_type === formData.appraisal_type)
                      .map(template => ({
                        value: template.id,
                        label: `${template.name} (${template.appraisal_type})`
                      }))
                  ]
                })}
              </div>

              {/* Estate Information - Only for ESTATE appraisals */}
              {formData.appraisal_type === 'ESTATE' && (
                <div className="space-y-6 p-6 rounded-2xl bg-green-50 border-2 border-green-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
                    <span>Estate Information</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderField({
                      name: 'estate_of',
                      label: 'Estate Of',
                      type: 'text',
                      required: true,
                      placeholder: 'Enter the name of the estate...',
                      description: 'Name of the deceased person or estate'
                    })}

                    {renderField({
                      name: 'date_of_death',
                      label: 'Date of Death',
                      type: 'date',
                      required: true,
                      description: 'Date when the individual passed away'
                    })}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                  <span>Additional Information</span>
                </h3>
                
                {renderField({
                  name: 'purpose',
                  label: 'Purpose',
                  type: 'textarea',
                  placeholder: 'Describe the purpose of this appraisal...',
                  description: 'Explain why this appraisal is being conducted',
                  rows: 3
                })}

                {renderField({
                  name: 'notes',
                  label: 'Notes',
                  type: 'textarea',
                  placeholder: 'Any additional notes or special instructions...',
                  description: 'Additional details or special requirements',
                  rows: 4
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.project_name.trim() || !formData.client_id}
                className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5 mr-2 inline-block group-hover:scale-110 transition-transform" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

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
      `}</style>
      </div>
      </Layout>
    </>
  );
};
export default AddProject;