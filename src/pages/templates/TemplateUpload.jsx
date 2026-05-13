import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';

const TemplateUpload = () => {
  const [file, setFile] = useState(null);
  const [appraisalType, setAppraisalType] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAdmin, isEditor } = useAuth();

  useEffect(() => {
    // Check permissions on component mount
    if (!isAdmin && !isEditor) {
      showToast('You do not have permission to upload templates', 'error');
      navigate('/templates');
    }
  }, [isAdmin, isEditor, navigate, showToast]);

  const appraisalTypes = ['DIVORCE', 'ESTATE', 'INSURANCE', 'TAX', 'DONATION', 'OTHER'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile.name.endsWith('.docx')) {
      showToast('Please select a .docx file', 'error');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      showToast('Please select a file', 'error');
      return;
    }
    
    if (!appraisalType) {
      showToast('Please select an appraisal type', 'error');
      return;
    }

    try {
      setUploading(true);
      await templateService.uploadTemplate(file, appraisalType, description);
      showToast('Template uploaded successfully', 'success');
      navigate('/templates');
    } catch (err) {
      console.error('Error uploading template:', err);
      if (err.response?.status === 403) {
        showToast('You do not have permission to upload templates', 'error');
      } else if (err.response?.status === 401) {
        showToast('Please log in again', 'error');
        navigate('/login');
      } else {
        showToast(err.response?.data?.detail || 'Failed to upload template', 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload Template</h1>
          <p className="text-gray-600 mt-2">Upload a Word document (.docx) to create a new template</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">Drag and drop your .docx file here, or</p>
                  <input
                    type="file"
                    accept=".docx"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                    aria-label="Upload template file"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Appraisal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appraisal Type *
            </label>
            <select
              value={appraisalType}
              onChange={(e) => setAppraisalType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select appraisal type</option>
              {appraisalTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description for this template"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 form-actions-row">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="btn-responsive px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !appraisalType}
              className="btn-responsive px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {uploading ? 'Uploading...' : 'Upload Template'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TemplateUpload;