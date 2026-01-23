import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import { accountService } from '../../services/accountService';
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
  PencilSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedFields, setCompletedFields] = useState(new Set());
  const [focusedField, setFocusedField] = useState('');
  const [originalData, setOriginalData] = useState({});
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    case_name: '',
    case_number: '',
    appraisal_type: 'DIVORCE',
    purpose: '',
    inspection_date: '',
    report_date: '',
    estate_of: '',
    date_of_death: '',
    address_letter_to: '',
    assigned_user_id: '',
    account_id: '',
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
  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});

  const appraisalTypes = [
    { value: 'DIVORCE', label: 'Divorce', icon: UserIcon, color: 'blue' },
    { value: 'ESTATE', label: 'Estate', icon: BuildingOfficeIcon, color: 'green' },
    { value: 'INSURANCE', label: 'Insurance', icon: DocumentTextIcon, color: 'purple' },
    { value: 'TAX', label: 'Tax', icon: DocumentTextIcon, color: 'orange' },
    { value: 'DONATION', label: 'Donation', icon: DocumentTextIcon, color: 'pink' },
    { value: 'OTHER', label: 'Other', icon: DocumentTextIcon, color: 'gray' }
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft', color: 'gray' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
    { value: 'REVIEW', label: 'Review', color: 'yellow' },
    { value: 'COMPLETED', label: 'Completed', color: 'green' },
    { value: 'DELIVERED', label: 'Delivered', color: 'purple' }
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [projectData, clientsData, accountsData, templatesData] = await Promise.all([
        projectService.getProject(id),
        clientService.getClients(0, 1000),
        accountService.getAccounts(null, true),
        templateService.getTemplates()
      ]);
      
      const projectFormData = {
        project_name: projectData.project_name || '',
        client_id: projectData.client_id || '',
        case_name: projectData.case_name || '',
        case_number: projectData.case_number || '',
        appraisal_type: projectData.appraisal_type || 'DIVORCE',
        purpose: projectData.purpose || '',
        inspection_date: projectData.inspection_date ? projectData.inspection_date.split('T')[0] : '',
        report_date: projectData.report_date ? projectData.report_date.split('T')[0] : '',
        estate_of: projectData.estate_of || '',
        date_of_death: projectData.date_of_death ? projectData.date_of_death.split('T')[0] : '',
        address_letter_to: projectData.address_letter_to || '',
        assigned_user_id: projectData.assigned_user_id || '',
        status: projectData.status || 'DRAFT',
        effective_date: projectData.effective_date ? projectData.effective_date.split('T')[0] : '',
        notes: projectData.notes || '',
        account_id: projectData.account_id || '',
        template_id: projectData.template_id || '',
        recipient: projectData.recipient ? {
          name: projectData.recipient.name || '',
          title: projectData.recipient.title || '',
          company: projectData.recipient.company || '',
          address: projectData.recipient.address || '',
          city: projectData.recipient.city || '',
          state: projectData.recipient.state || '',
          zip_code: projectData.recipient.zip_code || ''
        } : {
          name: '',
          title: '',
          company: '',
          address: '',
          city: '',
          state: '',
          zip_code: ''
        },
        recipient_source: projectData.recipient ? 'manual' : '' // Default to manual if recipient exists
      };
      
      setFormData(projectFormData);
      setOriginalData(projectFormData);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setTemplates(Array.isArray(templatesData?.templates) ? templatesData.templates : Array.isArray(templatesData) ? templatesData : []);
      
      const allAccounts = accountsData.accounts || [];
      const nonClientAccounts = allAccounts.filter(account => account.account_type !== 'client');
      setAccounts(nonClientAccounts);
      
      // Track completed fields
      const completed = new Set();
      Object.entries(projectFormData).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          completed.add(key);
        }
      });
      setCompletedFields(completed);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load project data');
    } finally {
      setFetchLoading(false);
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

    // 1. case_name required for DIVORCE
    if (formData.appraisal_type === 'DIVORCE') {
      if (!formData.case_name || !formData.case_name.trim()) {
        newErrors.case_name = 'Case Name is required for Divorce appraisals';
      }
      if (!formData.effective_date || !formData.effective_date.trim()) {
        newErrors.effective_date = 'Effective Date is required for Divorce appraisals';
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

    // Inspection Date (Appointment Date) required for ALL
    if (!formData.inspection_date || !formData.inspection_date.trim()) {
      newErrors.inspection_date = 'Inspection Date is required';
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

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const getChangedFieldsCount = () => {
    return Object.keys(formData).filter(key => 
      formData[key] !== originalData[key]
    ).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { recipient_source, ...rest } = formData;

      const projectData = {
        ...rest,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null,
        account_id: formData.account_id ? parseInt(formData.account_id) : null,
        template_id: formData.template_id ? parseInt(formData.template_id) : null,
        // Convert empty date strings to null for backend validation
        inspection_date: formData.inspection_date || null,
        report_date: formData.report_date || null,
        effective_date: formData.effective_date || null,
        date_of_death: formData.date_of_death || null
      };

      // Only send recipient when a source is selected
      if (recipient_source && recipient_source !== '') {
        projectData.recipient = formData.recipient;
      } else if (projectData.recipient) {
        delete projectData.recipient;
      }
      
      await projectService.updateProject(id, projectData);
      navigate('/projects');
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAppraisalType = appraisalTypes.find(type => type.value === formData.appraisal_type);
  const selectedStatus = statusOptions.find(status => status.value === formData.status);
  
  // Calculate total visible fields dynamically based on form state
  const getTotalVisibleFields = () => {
    let totalFields = 0;
    
    // Basic fields always visible
    totalFields += 3;
    totalFields += 1;
    totalFields += 1;
    totalFields += 1;
    totalFields += 2; 
    
    // Scheduling fields
    totalFields += 3;
    
    // Appraisal location
    totalFields += 2;
    
    // Template
    totalFields += 1;
    
    // Additional info
    totalFields += 2;
    
    // Recipient fields - only count if recipient_source is selected
    if (formData.recipient_source && formData.recipient_source !== '') {
      totalFields += 7;
    } else {
      totalFields += 1;
    }
    
    // Estate-specific fields - only count if appraisal type is ESTATE
    if (formData.appraisal_type === 'ESTATE') {
      totalFields += 2;
    }
    
    return totalFields;
  };
  
  const totalVisibleFields = getTotalVisibleFields();
  const progress = totalVisibleFields > 0 ? Math.round((completedFields.size / totalVisibleFields) * 100) : 0;
  const changedFields = getChangedFieldsCount();

  const renderField = ({ name, label, type = 'text', options = [], required = false, placeholder = '', rows = 3, value }) => {
    const isCompleted = completedFields.has(name);
    const isFocused = focusedField === name;
    const hasError = errors[name];

    const getValueFromState = (data) => {
      if (!data) return '';
      if (name.startsWith('recipient.')) {
        const field = name.split('.')[1];
        return data.recipient ? data.recipient[field] : '';
      }
      return data[name];
    };

    const fieldValue = value !== undefined ? value : getValueFromState(formData);
    const originalValue = getValueFromState(originalData);
    const isChanged = fieldValue !== originalValue;

    return (
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {isCompleted && (
            <CheckIcon className="w-4 h-4 text-green-500" />
          )}
          {isChanged && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </label>
        
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
            className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
              hasError
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

  if (fetchLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Loading skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded-xl w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 p-8 shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 animate-pulse"></div>
            <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute right-1/4 top-1/4 w-6 h-6 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate(`/projects/${id}`)}
                  className="inline-flex items-center space-x-2 text-indigo-100 hover:text-white transition-colors duration-200 mb-4"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span className="font-medium">Back to Project</span>
                </button>
                
                <div className="flex items-center space-x-3 mb-2">
                  <PencilSquareIcon className="w-8 h-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Edit Project</h1>
                </div>
                <p className="text-indigo-100 text-lg">
                  Update project details and settings
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="flex items-center space-x-4 text-white/90">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{progress}%</div>
                    <div className="text-sm">Complete</div>
                  </div>
                  {hasChanges() && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-300">{changedFields}</div>
                      <div className="text-sm">Changes</div>
                    </div>
                  )}
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
                {completedFields.size} of {totalVisibleFields} fields completed
                {hasChanges() && (
                  <span className="text-orange-600 font-medium">
                    {' '}• {changedFields} unsaved change{changedFields !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
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
                    Status: <span className={`font-medium text-${selectedStatus?.color}-600`}>
                      {selectedStatus?.label}
                    </span>
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
                    options: appraisalTypes
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'project_name',
                    label: 'Project Name',
                    required: true,
                    placeholder: 'Enter project name...'
                  })}

                  {renderField({
                    name: 'address_letter_to',
                    label: 'Address Letter To',
                    type: 'text',
                    required: true,
                    placeholder: 'Enter Person Name'
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField({
                    name: 'case_number',
                    label: 'Case Number',
                    placeholder: 'Enter case number...'
                  })}

                  {renderField({
                    name: 'case_name',
                    label: 'Case Name',
                    placeholder: 'e.g., Estate of John Smith...',
                    description: 'Name of case for this appraisal'
                  })}
                </div>

                {renderField({
                  name: 'status',
                  label: 'Project Status',
                  type: 'select',
                  options: statusOptions
                })}

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
                              const client = clients.find(c => c.id === parseInt(prev.client_id));
                              
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
                          placeholder: 'Street Address',
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
                    type: 'date'
                  })}

                  {renderField({
                    name: 'report_date',
                    label: 'Report Date',
                    type: 'date'
                  })}

                  {renderField({
                    name: 'effective_date',
                    label: 'Effective Date',
                    type: 'date'
                  })}
                </div>
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
                      placeholder: 'Enter the name of the estate...'
                    })}

                    {renderField({
                      name: 'date_of_death',
                      label: 'Date of Death',
                      type: 'date'
                    })}
                  </div>
                </div>
              )}
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
                  description: `Choose a template for generating reports - ${templates.length} templates available`,
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
                  rows: 3
                })}

                {renderField({
                  name: 'notes',
                  label: 'Notes',
                  type: 'textarea',
                  placeholder: 'Any additional notes or comments...',
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
                disabled={loading || !formData.project_name.trim() || !formData.client_id || !hasChanges()}
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
                    Update Project
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

export default EditProject;