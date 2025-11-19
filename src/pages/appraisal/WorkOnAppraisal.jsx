import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AppraisalTable from "../../components/AppraisalTable";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Tabs from "../../components/ui/Tabs";
import { appraisalService } from "../../services/appraisalService";
import { projectService } from "../../services/projectService";
import { templateService } from "../../services/templateService";
import { useToast } from "../../hooks/useToast";
import ToastContainer from "../../components/ToastContainer";
import TableDataEntry from '../../components/TableDataEntry';
import { 
  ArrowLeftIcon,
  PlayIcon,
  DocumentTextIcon,
  PhotoIcon,
  Cog6ToothIcon,
  TableCellsIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const WorkOnAppraisal = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [templateCategory, setTemplateCategory] = useState('image_based');
  const [appraisalItems, setAppraisalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchProjectAndItems();
    fetchTemplates();
  }, [projectId]);

  const fetchProjectAndItems = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);
      // Fetch template to determine category
      if (projectData.template_id) {
        try {
          const templateData = await templateService.getTemplate(projectData.template_id);
          setTemplate(templateData);
          setTemplateCategory(templateData.template_category || 'image_based');
          console.log('Template category:', templateData.template_category);
        } catch (templateErr) {
          console.error('Error fetching template:', templateErr);
          setTemplateCategory('image_based');
        }
      }
      
      // Fetch appraisal items
      const itemsData = await appraisalService.getAppraisalItems(projectId);
      setAppraisalItems(itemsData);

      // Auto-initialize items if none exist
      if (itemsData.length === 0) {
        await handleInitializeItemsInternal();
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      showError("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const templatesData = await templateService.getTemplates();
      setTemplates(templatesData.templates || templatesData || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleInitializeItemsInternal = async () => {
    try {
      setInitializing(true);
      const result = await appraisalService.initializeAppraisalItems(projectId);

      // Fetch the newly created items
      const itemsData = await appraisalService.getAppraisalItems(projectId);
      setAppraisalItems(itemsData);

      return result;
    } catch (error) {
      console.error("Error initializing items:", error);
      throw error;
    } finally {
      setInitializing(false);
    }
  };

  const handleInitializeItems = async () => {
    try {
      const result = await handleInitializeItemsInternal();
      showSuccess(`Initialized ${result.count} items from photos`);
    } catch (error) {
      showError("Failed to initialize appraisal items");
    }
  };

  const handleItemUpdate = async (itemId, updatedData) => {
    try {
      await appraisalService.updateAppraisalItem(itemId, updatedData);

      // Update local state
      setAppraisalItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updatedData } : item
        )
      );
    } catch (error) {
      console.error("Error updating item:", error);
      showError("Failed to update item");
    }
  };

  const handleItemsReorder = async (reorderedItems) => {
    try {
      // Update local state immediately for better UX
      setAppraisalItems(reorderedItems);

      // Prepare reorder data
      const reorderData = reorderedItems.map((item, index) => ({
        item_id: item.id,
        new_sort_order: index + 1,
      }));

      await appraisalService.reorderAppraisalItems(projectId, reorderData);
    } catch (error) {
      console.error("Error reordering items:", error);
      showError("Failed to reorder items");
      // Refresh to get correct order
      await fetchProjectAndItems();
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      console.log('💾 Saving all items...', appraisalItems);
      
      // For table-based templates, save attributes
      if (['coin', 'wine', 'content'].includes(templateCategory)) {
        for (const item of appraisalItems) {
          if (item.id) {
            // Update existing item
            await appraisalService.updateAppraisalItem(item.id, {
              item_type: item.item_type,
              line_number: item.line_number,
              sort_order: item.sort_order,
              attributes: item.attributes
            });
          } else {
            // Create new item
            await appraisalService.createAppraisalItem({
              project_id: parseInt(projectId),
              item_type: item.item_type,
              line_number: item.line_number,
              sort_order: item.sort_order,
              attributes: item.attributes
            });
          }
        }
      }
      
      showSuccess('All changes saved successfully');
      await fetchProjectAndItems(); // Refresh data
    } catch (error) {
      console.error('Error saving:', error);
      showError(error.response?.data?.detail || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewMode = () => {
    navigate(`/projects/${projectId}/review`);
  };

  const handleGenerateReport = async () => {
    if (!project?.template_id) {
      showError("No template assigned to this project");
      return;
    }

    try {
      setGeneratingReport(true);
      const result = await templateService.generateReport(
        project.template_id,
        projectId,
        "final",
        true
      );

      showSuccess("Report generated successfully");

      // Download the generated report
      if (result.download_url) {
        const downloadResponse = await fetch(
          `${import.meta.env.VITE_API_URL}${result.download_url}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `appraisal_report_${projectId}.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          showSuccess("Report downloaded successfully");
        }
      }
    } catch (error) {
      console.error("Error generating report:", error);
      showError("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card className="p-12">
          <div className="text-center">
            <LoadingSpinner size="xl" />
            <p className="text-gray-500 mt-4">Loading appraisal workspace...</p>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate(`/projects/${projectId}`)}
                variant="ghost"
                icon={ArrowLeftIcon}
                size="sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Appraisal Workspace
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm text-gray-600">
                    {project?.project_name}
                  </p>
                  <span className="text-gray-400">•</span>
                  <p className="text-sm text-gray-600">
                    {project?.client?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSaveAll}
                loading={saving}
                disabled={saving}
                variant="success"
                icon={DocumentTextIcon}
              >
                Save All
              </Button>

              {/* Generate Report button temporarily hidden */}
              {/* <Button
                onClick={handleGenerateReport}
                loading={generatingReport}
                disabled={generatingReport || !project?.template_id}
                variant="primary"
                icon={DocumentTextIcon}
              >
                Generate Report
              </Button> */}

              <Button onClick={handleReviewMode} icon={PlayIcon}>
                Review Mode
              </Button>
            </div>
          </div>
        </Card>

        {/* Workspace Tabs */}
        <Tabs defaultValue="items" className="space-y-6">
          <Card className="p-6">
            <Tabs.List>
              <Tabs.Trigger
                value="items"
                className="flex items-center space-x-2"
              >
                <TableCellsIcon className="w-4 h-4" />
                <span>Appraisal Items</span>
              </Tabs.Trigger>
              {/* Settings button temporarily hidden */}
              {/* <Tabs.Trigger value="settings" className="flex items-center space-x-2">
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Settings</span>
              </Tabs.Trigger> */}
              {/* Analytics button temporarily hidden */}
              {/* <Tabs.Trigger value="analytics" className="flex items-center space-x-2">
                <ChartBarIcon className="w-4 h-4" />
                <span>Analytics</span>
              </Tabs.Trigger> */}
            </Tabs.List>
          </Card>

          {/* Settings tab content temporarily hidden */}
          {/* <Tabs.Content value="settings">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Appraisal Configuration</h3>
                <p className="text-sm text-gray-600 mt-1">Configure template and valuation settings</p>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="form-label">Purpose</label>
                    <select className="form-input">
                      <option value="">Select Purpose</option>
                      <option value="divorce">Divorce</option>
                      <option value="estate">Estate</option>
                      <option value="tax">Tax</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Value Type</label>
                    <select className="form-input">
                      <option value="">Select Value Type</option>
                      <option value="fair_market">Fair Market Value</option>
                      <option value="replacement">Replacement Value</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Appraisal Type</label>
                    <select className="form-input">
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
              </Card.Body>
            </Card>
          </Tabs.Content> */}

          {/* Analytics tab content temporarily hidden */}
          {/* <Tabs.Content value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TableCellsIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{appraisalItems.length}</h3>
                <p className="text-sm text-gray-600">Total Items</p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ChartBarIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${appraisalItems.reduce((sum, item) => sum + (item.appraised_value || 0), 0).toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">Total Value</p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <PhotoIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {appraisalItems.filter(item => item.photo_id).length}
                </h3>
                <p className="text-sm text-gray-600">Items with Photos</p>
              </Card>
            </div>
          </Tabs.Content> */}

          <Tabs.Content value="items">
            <div className="space-y-6">
              {/* Items Header */}
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {['coin', 'wine', 'content'].includes(templateCategory) 
                          ? 'Table Data' 
                          : 'Appraisal Items'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {appraisalItems.length} items • Total value: ${appraisalItems.reduce((sum, item) => {
                          if (templateCategory === 'coin') {
                            const qty = parseFloat(item.attributes?.quantity || 0);
                            const price = parseFloat(item.attributes?.appraised_price || 0);
                            return sum + (qty * price);
                          } else if (templateCategory === 'wine') {
                            return sum + parseFloat(item.attributes?.total_price || 0);
                          } else if (templateCategory === 'content') {
                            return sum + parseFloat(item.attributes?.fair_market_value || 0);
                          } else {
                            return sum + (item.appraised_value || 0);
                          }
                        }, 0).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Only show Initialize from Photos button for image-based templates */}
                    {templateCategory === 'image_based' && (
                      <Button
                        onClick={handleInitializeItems}
                        loading={initializing}
                        disabled={initializing}
                        icon={PhotoIcon}
                      >
                        Initialize from Photos
                      </Button>
                    )}
                    
                    {/* Show info message for table-based templates */}
                    {['coin', 'wine', 'content'].includes(templateCategory) && (
                      <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💡 Edit table data directly below
                        </p>
                      </div>
                    )}
                  </div>
                </Card.Header>
              </Card>
              
              {/* Appraisal Table or Table Data Entry */}
              {['coin', 'wine', 'content'].includes(templateCategory) ? (
                <TableDataEntry
                  templateCategory={templateCategory}
                  items={appraisalItems}
                  onItemsChange={setAppraisalItems}
                  projectId={projectId}
                  loading={loading}
                />
              ) : (
                <AppraisalTable
                  items={appraisalItems}
                  onItemUpdate={handleItemUpdate}
                  onItemsReorder={handleItemsReorder}
                  loading={loading}
                />
              )}
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    </Layout>
  );
};

export default WorkOnAppraisal;
