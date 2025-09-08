import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AppraisalTable from '../../components/AppraisalTable';
import { appraisalService } from '../../services/appraisalService';
import { projectService } from '../../services/projectService';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import { 
  ArrowLeftIcon,
  PlayIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

const WorkOnAppraisal = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  const [project, setProject] = useState(null);
  const [appraisalItems, setAppraisalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjectAndItems();
  }, [projectId]);

  const fetchProjectAndItems = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);
      
      // Fetch appraisal items
      const itemsData = await appraisalService.getAppraisalItems(projectId);
      setAppraisalItems(itemsData);
      
    } catch (error) {
      console.error('Error fetching project data:', error);
      showError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeItems = async () => {
    try {
      setInitializing(true);
      const result = await appraisalService.initializeAppraisalItems(projectId);
      showSuccess(`Initialized ${result.count} items from photos`);
      
      // Refresh the items
      await fetchProjectAndItems();
    } catch (error) {
      console.error('Error initializing items:', error);
      showError('Failed to initialize appraisal items');
    } finally {
      setInitializing(false);
    }
  };

  const handleItemUpdate = async (itemId, updatedData) => {
    try {
      await appraisalService.updateAppraisalItem(itemId, updatedData);
      
      // Update local state
      setAppraisalItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, ...updatedData } : item
        )
      );
      
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Failed to update item');
    }
  };

  const handleItemsReorder = async (reorderedItems) => {
    try {
      // Update local state immediately for better UX
      setAppraisalItems(reorderedItems);
      
      // Prepare reorder data
      const reorderData = reorderedItems.map((item, index) => ({
        item_id: item.id,
        new_sort_order: index + 1
      }));
      
      await appraisalService.reorderAppraisalItems(projectId, reorderData);
      
    } catch (error) {
      console.error('Error reordering items:', error);
      showError('Failed to reorder items');
      // Refresh to get correct order
      await fetchProjectAndItems();
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      showSuccess('All changes saved successfully');
    } catch (error) {
      console.error('Error saving:', error);
      showError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewMode = () => {
    navigate(`/projects/${projectId}/review`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Work on Appraisal
                </h1>
                <p className="text-sm text-gray-600">
                  {project?.project_name} - {project?.client?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save All'}</span>
              </button>
              
              <button
                onClick={handleReviewMode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Template Selection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Purpose</option>
                <option value="divorce">Divorce</option>
                <option value="estate">Estate</option>
                <option value="tax">Tax</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Value Type</option>
                <option value="fair_market">Fair Market Value</option>
                <option value="replacement">Replacement Value</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appraisal Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Type</option>
                <option value="art">Art</option>
                <option value="autos">Autos</option>
                <option value="coins">Coins</option>
                <option value="collectibles">Collectibles</option>
                <option value="content">Content</option>
                <option value="firearms">Firearms</option>
                <option value="handbags">Handbags</option>
                <option value="jewelry">Jewelry</option>
                <option value="watches">Watches</option>
                <option value="wine">Wine</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appraisal Items Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Appraisal Items ({appraisalItems.length})
              </h3>
              
              {appraisalItems.length === 0 && (
                <button
                  onClick={handleInitializeItems}
                  disabled={initializing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {initializing ? 'Initializing...' : 'Initialize from Photos'}
                </button>
              )}
            </div>
          </div>
          
          <AppraisalTable
            items={appraisalItems}
            onItemUpdate={handleItemUpdate}
            onItemsReorder={handleItemsReorder}
            loading={loading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default WorkOnAppraisal;