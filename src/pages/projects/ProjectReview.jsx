import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { appraisalService } from '../../services/appraisalService';
import { templateService } from '../../services/templateService';
import Layout from '../../components/Layout';
import { useToast } from '../../hooks/useToast';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';

const ProjectReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef();
  const { showToast } = useToast();
  
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [templateCategory, setTemplateCategory] = useState('image_based');
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, itemsData] = await Promise.all([
        projectService.getProject(id),
        appraisalService.getAppraisalItems(id)
      ]);
      setProject(projectData);
      setItems(itemsData);
      
      // Fetch template to determine category
      if (projectData.template_id) {
        try {
          const templateData = await templateService.getTemplate(projectData.template_id);
          setTemplate(templateData);
          setTemplateCategory(templateData.template_category || 'image_based');
        } catch (templateErr) {
          console.error('Error fetching template:', templateErr);
          setTemplateCategory('image_based');
        }
      }
      
      // Fetch compatible templates for this project's appraisal type
      if (projectData.appraisal_type) {
        try {
          const response = await templateService.getTemplates(projectData.appraisal_type, true);
          setTemplates(response.templates || []);
        } catch (err) {
          console.error('Failed to load templates:', err);
        }
      }
      
      // If project has template, generate preview using template
      if (projectData.template_id) {
        await generateTemplatePreview(projectData.template_id);
      }
    } catch (error) {
      showToast('Failed to load project data', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const generateTemplatePreview = async (templateId) => {
    try {
      const { templateService } = await import('../../services/templateService');
      const result = await templateService.generateReport(templateId, id, 'draft', true);
      // This would generate the actual template-based report preview
    } catch (error) {
      console.log('Template preview generation failed, using basic preview');
    }
  };

  const handleDownload = async (reportType) => {
    try {
      // Set the appropriate loading state based on report type
      if (reportType === 'draft') {
        setGeneratingDraft(true);
      } else if (reportType === 'final') {
        setGeneratingFinal(true);
      }
      console.log('Download clicked:', reportType, 'Project template_id:', project.template_id);
      
      // Get the template ID to use
      let templateId = project.template_id;
      
      // If no template is assigned to the project, use the first compatible template
      if (!templateId && templates.length > 0) {
        templateId = templates[0].id;
        console.log(`No template assigned to project, using first compatible template: ${templateId}`);
      }
      
      // If we still don't have a template ID, use a default template (ID 1)
      if (!templateId) {
        templateId = 1;
        console.log('No compatible templates found, using default template ID 1');
      }
      
      // Generate the report using templateService
      const result = await templateService.generateReport(templateId, project.id, reportType, true);
      
      showToast('Report generated successfully', 'success');
      
      // Download the generated report
      const downloadResponse = await templateService.downloadReport(project.id, templateId, reportType);
      
      const blob = downloadResponse.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Find the template name if available
      const template = templates.find(t => t.id === templateId);
      const templateName = template ? template.name : '';
      
      // Create a descriptive filename
      link.download = `${project.project_name}_${templateName ? templateName + '_' : ''}${reportType}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Report downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to generate report', 'error');
      console.error('Report generation error:', error);
    } finally {
      // Clear the appropriate loading state
      if (reportType === 'draft') {
        setGeneratingDraft(false);
      } else if (reportType === 'final') {
        setGeneratingFinal(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const totalValue = items.reduce((sum, item) => {
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
  }, 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Review</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Project
            </button>
            <button
              onClick={() => handleDownload('draft')}
              disabled={generatingDraft}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              {generatingDraft && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {generatingDraft ? 'Generating...' : 'Download Draft'}
            </button>
            <button
              onClick={() => handleDownload('final')}
              disabled={generatingFinal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {generatingFinal && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {generatingFinal ? 'Generating...' : 'Download Final'}
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white shadow rounded-lg">
          <style>
            {`
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .items-table th, .items-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
                vertical-align: top;
              }
              .items-table th {
                background-color: #f8f9fa;
                font-weight: bold;
              }
              .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .total-row {
                font-weight: bold;
                background-color: #e3f2fd !important;
                border-top: 2px solid #1976d2;
              }
            `}
          </style>
          <div ref={contentRef} className="p-8">

            
            {/* Header */}
            <div className="header">
              <h1 className="text-3xl font-bold mb-2">Appraisal Report</h1>
              <p className="text-lg text-gray-600">{project.appraisal_type} Appraisal</p>

            </div>

            {/* Project Information */}
            <div className="project-info">
              <h2 className="text-xl font-semibold mb-4">Project Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Project Name:</strong> {project.project_name}
                </div>
                <div>
                  <strong>Client:</strong> {project.client_name}
                </div>
                <div>
                  <strong>Case Number:</strong> {project.case_number || 'N/A'}
                </div>
                <div>
                  <strong>Appraisal Type:</strong> {project.appraisal_type}
                </div>
                <div>
                  <strong>Inspection Date:</strong> {project.inspection_date || 'N/A'}
                </div>
                <div>
                  <strong>Report Date:</strong> {project.report_date || new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Appraisal Items</h2>
              
              {/* Coin Table */}
              {templateCategory === 'coin' && (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item #</th>
                      <th>Quantity</th>
                      <th>Year</th>
                      <th>Coin</th>
                      <th>Condition</th>
                      <th>Appraised Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.attributes?.quantity || '-'}</td>
                        <td>{item.attributes?.year || '-'}</td>
                        <td>{item.attributes?.coin_name || '-'}</td>
                        <td>{item.attributes?.condition || '-'}</td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                          ${(parseFloat(item.attributes?.appraised_price || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="5"><strong>Total Appraised Value:</strong></td>
                      <td><strong>${totalValue.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Wine Table */}
              {templateCategory === 'wine' && (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item #</th>
                      <th>Quantity</th>
                      <th>Bottle Description</th>
                      <th>Per Bottle Price</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.attributes?.quantity || '-'}</td>
                        <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                          {item.attributes?.bottle_description || '-'}
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                          ${(parseFloat(item.attributes?.per_bottle_price || 0)).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                          ${(parseFloat(item.attributes?.total_price || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="4"><strong>Total Appraised Value:</strong></td>
                      <td><strong>${totalValue.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Content Table */}
              {templateCategory === 'content' && (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item #</th>
                      <th>Area</th>
                      <th>Fair Market Value (FMV)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.attributes?.area || '-'}</td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                          ${(parseFloat(item.attributes?.fair_market_value || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="2"><strong>Total Appraised Value:</strong></td>
                      <td><strong>${totalValue.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Image-based Table (default) */}
              {templateCategory === 'image_based' && (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item #</th>
                      <th>Photo</th>
                      <th>Room/Area</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Appraised Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          {item.photo_id ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL}/api/v1/projects/${id}/photos/${item.photo_id}/thumbnail`}
                              alt="Item photo"
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>
                              No Photo
                            </div>
                          )}
                        </td>
                        <td>{item.room_area || '-'}</td>
                        <td>{item.item_type || '-'}</td>
                        <td>
                          <div style={{ maxWidth: '250px', wordWrap: 'break-word', whiteSpace: 'pre-line', fontSize: '14px' }}>
                            {item.description ? 
                              item.description.replace(/\[Enter [^\]]+\]/g, '___').replace(/:/g, ':\n') 
                              : '-'
                            }
                          </div>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>${(item.appraised_value || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="5"><strong>Total Appraised Value:</strong></td>
                      <td><strong>${totalValue.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Summary */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <p>
                This appraisal report contains {items.length} items with a total appraised value of ${totalValue.toLocaleString()}.
                The appraisal was conducted for {project.appraisal_type.toLowerCase()} purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectReview;