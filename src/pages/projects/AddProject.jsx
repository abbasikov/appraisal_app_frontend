import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import { templateService } from '../../services/templateService';
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
  LightBulbIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedFields, setCompletedFields] = useState(new Set());
  const [focusedField, setFocusedField] = useState('');
  const [projectNamePreview, setProjectNamePreview] = useState('');
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
    template_id: '',
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
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

  useEffect(() => {
    generateProjectNamePreview();
  }, [formData.client_id, formData.appraisal_type]);

  const fetchData = async () => {
    try {
      const [clientsData, usersData, templatesData] = await Promise.all([
        clientService.getClients(0, 1000),
        // Users endpoint would be needed here - for now skip
        Promise.resolve([]),
        templateService.getTemplates()
      ]);
      
      console.log('Clients data:', clientsData);
      console.log('Templates data:', templatesData);
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTemplates(Array.isArray(templatesData?.templates) ? templatesData.templates : Array.isArray(templatesData) ? templatesData : []);
    } catch (err) {
      setClients([]);
      setUsers([]);
      setTemplates([]);
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
        // Always update project name when client or type changes
        setFormData(prev => ({ ...prev, project_name: preview }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-populate client details when client is selected
    if (name === 'client_id' && value) {
      const client = clients.find(c => c.id === parseInt(value));
      if (client) {
        setSelectedClient(client);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          case_number: client.case_number || prev.case_number,
          // You can add more fields here if needed
        }));
      } else {
        setSelectedClient(null);
      }
    }
    
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
      
      console.log('Sending project data:', cleanedData);
      const createdProject = await projectService.createProject(cleanedData);
      console.log('Created project:', createdProject);
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
          setError(`Failed to create project: ${err.response.data.detail}`);
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

  const renderField = ({ name, label, type = 'text', options = [], required = false, placeholder = '', rows = 3, description = '', disabled = false }) => {
    const isCompleted = completedFields.has(name);
    const isFocused = focusedField === name;
    const hasError = errors[name];

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
            value={formData[name]}
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
            value={formData[name]}
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
            value={formData[name]}
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

                {/* Client Account Information */}
                {selectedClient && selectedClient.parent_account_name && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Account Information</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This client belongs to: <span className="font-semibold">{selectedClient.parent_account_name}</span>
                    </p>
                  </div>
                )}
                
                {selectedClient && !selectedClient.parent_account_name && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Account Information</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This client is not linked to any account.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'project_name',
                    label: 'Project Name',
                    required: true,
                    placeholder: projectNamePreview || 'Enter project name...',
                    description: 'A unique name to identify this project'
                  })}

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
                        } else if ((locationType === 'attorney' || locationType === 'appraiser') && selectedClient?.parent_account_id) {
                          // For attorney/appraiser, use parent account address
                          const parentAddress = selectedClient.parent_account_address 
                            ? `${selectedClient.parent_account_address}${selectedClient.parent_account_city ? `, ${selectedClient.parent_account_city}` : ''}${selectedClient.parent_account_state ? `, ${selectedClient.parent_account_state}` : ''}${selectedClient.parent_account_zip ? ` ${selectedClient.parent_account_zip}` : ''}`.trim()
                            : '';
                          setFormData(prev => ({ ...prev, appraisal_location: parentAddress }));
                        } else if (locationType === 'manual') {
                          setFormData(prev => ({ ...prev, appraisal_location: '' }));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20"
                    >
                      <option value="manual">Enter Manually</option>
                      <option value="client">Client Location</option>
                      {selectedClient?.parent_account_type === 'appraiser' && (
                        <option value="appraiser">Appraiser Location</option>
                      )}
                      {selectedClient?.parent_account_type === 'attorney' && (
                        <option value="attorney">Attorney Location</option>
                      )}
                    </select>
                  </div>

                  {renderField({
                    name: 'appraisal_location',
                    label: 'Appraisal Location',
                    type: 'text',
                    placeholder: formData.appraisal_location_type === 'manual' 
                      ? 'Enter appraisal location...' 
                      : 'Location will be auto-populated based on selection',
                    description: formData.appraisal_location_type === 'manual' 
                      ? 'Enter the location where the appraisal will take place'
                      : `Using ${formData.appraisal_location_type === 'client' ? 'client' : formData.appraisal_location_type} location. You can edit if needed.`,
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
                  description: `Choose a template for generating reports (optional) - ${templates.length} templates available`,
                  options: [
                    { value: '', label: 'No template selected' },
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
      `}</style>
    </Layout>
  );
};

export default AddProject;