import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../../services/projectService";
import { appraisalService } from "../../services/appraisalService";
import { templateService } from "../../services/templateService";
import Layout from "../../components/Layout";
import { useToast } from "../../hooks/useToast";
import useIsMobile from "../../hooks/useIsMobile";
import ToastContainer from "../../components/ToastContainer";
import InspectionVerificationModal from "../../components/InspectionVerificationModal";
import { detectItemTypeFromTemplate } from "../../utils/templateDetector";
import api from "../../services/api";
import {
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

// ThumbnailImage component with proper auth token handling
const ThumbnailImage = ({ projectId, photoId, alt, className, style }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/projects/${projectId}/photos/${photoId}/thumbnail`, {
          responseType: 'blob'
        });
        const imageUrl = URL.createObjectURL(response.data);
        setImageSrc(imageUrl);
        setError(false);
      } catch (err) {
        console.error('Error loading thumbnail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && photoId) {
      fetchThumbnail();
    }

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [projectId, photoId]);

  if (loading) {
    return <div style={{ ...style, backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (error || !imageSrc) {
    return <div style={{ ...style, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>No Photo</div>;
  }

  return <img src={imageSrc} alt={alt} className={className} style={style} />;
};

const ProjectReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef();
  const statusDropdownRef = useRef(null);
  const { showToast, toasts, removeToast } = useToast();
  const isMobile = useIsMobile();

  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [pendingReportType, setPendingReportType] = useState(null);
  const [detectedItemType, setDetectedItemType] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, itemsData] = await Promise.all([
        projectService.getProject(id),
        appraisalService.getAppraisalItems(id),
      ]);
      setProject(projectData);
      setItems(itemsData);
      
      // Detect item type from template
      if (projectData.template_id) {
        try {
          const templateData = await templateService.getTemplate(projectData.template_id);
          setTemplate(templateData);
          const detectedType = detectItemTypeFromTemplate(templateData.name || '');
          setDetectedItemType(detectedType);
          console.log('Template name:', templateData.name, 'Detected item type:', detectedType);
        } catch (err) {
          console.error('Error fetching template:', err);
        }
      }
      
      // Fetch compatible templates for this project's appraisal type
      if (projectData.appraisal_type) {
        try {
          const response = await templateService.getTemplates(
            projectData.appraisal_type,
            true
          );
          setTemplates(response.templates || []);
        } catch (err) {
          console.error("Failed to load templates:", err);
        }
      }
    } catch (error) {
      showToast("Failed to load project data", "error");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (reportType) => {
    // Show inspection verification modal first
    setPendingReportType(reportType);
    setShowInspectionModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
      REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      DELIVERED: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusIcon = (status) => {
    const icons = {
      DRAFT: DocumentTextIcon,
      IN_PROGRESS: ClockIcon,
      REVIEW: ExclamationTriangleIcon,
      COMPLETED: CheckCircleIcon,
      DELIVERED: CheckCircleIcon
    };
    return icons[status] || DocumentTextIcon;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await projectService.updateProject(id, { status: newStatus });
      setProject(prev => ({ ...prev, status: newStatus }));
      setStatusDropdownOpen(false);
      showToast('Project status updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update project status', 'error');
      console.error('Error updating status:', err);
    }
  };

  const handleInspectionVerification = async (didInspect) => {
    const reportType = pendingReportType;
    setShowInspectionModal(false);
    
    try {
      // Set the appropriate loading state based on report type
      if (reportType === "draft") {
        setGeneratingDraft(true);
      } else if (reportType === "final") {
        setGeneratingFinal(true);
      }
      console.log(
        "Download clicked:",
        reportType,
        "Project template_id:",
        project.template_id,
        "Did inspect:",
        didInspect
      );
      
      // Get the template ID to use
      let templateId = project.template_id;
      
      // If no template is assigned to the project, use the first compatible template
      if (!templateId && templates.length > 0) {
        templateId = templates[0].id;
        console.log(
          `No template assigned to project, using first compatible template: ${templateId}`
        );
      }
      
      // If we still don't have a template ID, use a default template (ID 1)
      if (!templateId) {
        templateId = 1;
        console.log(
          "No compatible templates found, using default template ID 1"
        );
      }
      
      // Generate the report using templateService with inspection verification
      const result = await templateService.generateReport(
        templateId,
        project.id,
        reportType,
        true,
        didInspect
      );
      
      showToast("Report generated successfully", "success");
      
      // Download the generated report
      const downloadResponse = await templateService.downloadReport(
        project.id,
        templateId,
        reportType
      );
      
      const blob = downloadResponse.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Find the template name if available
      const template = templates.find((t) => t.id === templateId);
      const templateName = template ? template.name : "";
      
      // Create a descriptive filename
      link.download = `${project.project_name}_${
        templateName ? templateName + "_" : ""
      }${reportType}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast("Report downloaded successfully", "success");
    } catch (error) {
      showToast("Failed to generate report", "error");
      console.error("Report generation error:", error);
    } finally {
      // Clear the appropriate loading state
      if (reportType === "draft") {
        setGeneratingDraft(false);
      } else if (reportType === "final") {
        setGeneratingFinal(false);
      }
      setPendingReportType(null);
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


  const totalValue = items.reduce(
    (sum, item) => sum + (item.appraised_value || 0),
    0
  );

  const StatusIcon = getStatusIcon(project?.status);

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="max-w-6xl mx-auto space-y-6 max-lg:min-w-0 max-lg:space-y-4">
        {/* Header */}
        {isMobile ? (
          <div className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-3 max-lg:flex-col max-lg:items-stretch">
            <h1 className="text-2xl font-bold text-gray-900 max-lg:text-lg">Project Review</h1>
            <div className="flex min-w-0 flex-row flex-wrap items-center justify-end gap-2 max-lg:flex-col max-lg:gap-2">
              <button
                type="button"
                onClick={() => navigate(`/projects/${id}/appraisal`)}
                className="w-auto rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 max-lg:min-h-10 max-lg:w-full"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={() => handleDownload("draft")}
                disabled={generatingDraft}
                className="flex w-auto items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 max-lg:min-h-10 max-lg:w-full"
              >
                {generatingDraft && (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                )}
                {generatingDraft ? "Generating..." : "Download Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleDownload("final")}
                disabled={generatingFinal}
                className="flex w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 max-lg:min-h-10 max-lg:w-full"
              >
                {generatingFinal && (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                )}
                {generatingFinal ? "Generating..." : "Download Final"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Project Review</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/projects/${id}/appraisal`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Editing
              </button>
              <button
                onClick={() => handleDownload("draft")}
                disabled={generatingDraft}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
              >
                {generatingDraft && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {generatingDraft ? "Generating..." : "Download Draft"}
              </button>
              <button
                onClick={() => handleDownload("final")}
                disabled={generatingFinal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {generatingFinal && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {generatingFinal ? "Generating..." : "Download Final"}
              </button>
            </div>
          </div>
        )}

        {/* Report Preview */}
        <div className="bg-white shadow rounded-lg max-lg:min-w-0 max-lg:overflow-hidden">
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
              @media (max-width: 1023px) {
                .items-table th, .items-table td {
                  padding: 8px;
                  font-size: 12px;
                }
                .items-table { margin-top: 16px; }
              }
            `}
          </style>
          <div ref={contentRef} className="p-8 max-lg:p-4">
            {/* Header */}
            {isMobile ? (
              <div className="header min-w-0">
                <div className="flex w-full min-w-0 flex-row items-start justify-between gap-4 max-lg:flex-col max-lg:gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 break-words text-3xl font-bold text-gray-900 max-lg:text-xl">Appraisal Report</h2>
                    <p className="text-lg text-gray-600 max-lg:text-sm">
                      {project.appraisal_type} Appraisal
                    </p>
                  </div>
                  {/* Status Badge Dropdown */}
                  <div className="relative w-auto shrink-0 max-lg:w-full" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      aria-expanded={statusDropdownOpen}
                      aria-haspopup="listbox"
                      className={`inline-flex w-auto cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 transition-all hover:shadow-md max-lg:w-full max-lg:justify-between ${getStatusColor(project?.status)}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <StatusIcon className="h-5 w-5 shrink-0" />
                        <span className="truncate font-medium capitalize">
                          {project?.status?.replace('_', ' ') || 'Draft'}
                        </span>
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute right-0 z-50 mt-2 max-h-[min(70vh,24rem)] w-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg max-lg:left-0 max-lg:right-0 max-lg:w-full">
                        {statusOptions.map((option) => {
                          const OptionIcon = getStatusIcon(option.value);
                          const isSelected = project?.status === option.value;
                          return (
                            <button
                              type="button"
                              key={option.value}
                              onClick={() => handleStatusChange(option.value)}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-base transition-colors hover:bg-gray-50 max-lg:py-2.5 max-lg:text-sm ${
                                isSelected ? 'bg-gray-50' : ''
                              }`}
                            >
                              <OptionIcon className={`w-5 h-5 ${
                                option.color === 'gray' ? 'text-gray-600' :
                                option.color === 'blue' ? 'text-blue-600' :
                                option.color === 'yellow' ? 'text-yellow-600' :
                                option.color === 'green' ? 'text-green-600' :
                                option.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                              }`} />
                              <span className={`font-bold ${
                                isSelected ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {option.label}
                              </span>
                              {isSelected && (
                                <CheckCircleIcon className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="header">
                <div className="flex items-center w-full">
                  <h1 className="text-3xl font-bold mb-2">Appraisal Report</h1>
                  <div className="relative ml-auto" ref={statusDropdownRef}>
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${getStatusColor(project?.status)} transition-all hover:shadow-md cursor-pointer`}
                    >
                      <StatusIcon className="w-5 h-5" />
                      <span className="font-medium capitalize">
                        {project?.status?.replace('_', ' ') || 'Draft'}
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        {statusOptions.map((option) => {
                          const OptionIcon = getStatusIcon(option.value);
                          const isSelected = project?.status === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(option.value)}
                              className={`w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-gray-50' : ''
                              }`}
                            >
                              <OptionIcon className={`w-5 h-5 ${
                                option.color === 'gray' ? 'text-gray-600' :
                                option.color === 'blue' ? 'text-blue-600' :
                                option.color === 'yellow' ? 'text-yellow-600' :
                                option.color === 'green' ? 'text-green-600' :
                                option.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                              }`} />
                              <span className={`font-medium ${
                                isSelected ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {option.label}
                              </span>
                              {isSelected && (
                                <CheckCircleIcon className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-lg text-gray-600">
                  {project.appraisal_type} Appraisal
                </p>
              </div>
            )}

            {/* Project Information */}
            {isMobile ? (
              <div className="project-info mt-8 min-w-0 max-lg:mt-6">
                <h3 className="mb-3 text-xl font-bold text-gray-900 max-lg:text-lg">
                  Project Information
                </h3>
                <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 max-lg:gap-3">
                  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Project name</p>
                    <p className="mt-1 break-words text-sm text-gray-900">{project.project_name}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client</p>
                    <p className="mt-1 break-words text-sm text-gray-900">{project.client_name}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Case number</p>
                    <p className="mt-1 text-sm text-gray-900">{project.case_number || "N/A"}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Appraisal type</p>
                    <p className="mt-1 text-sm text-gray-900">{project.appraisal_type}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Inspection date</p>
                    <p className="mt-1 text-sm text-gray-900">{project.inspection_date || "N/A"}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Report date</p>
                    <p className="mt-1 text-sm text-gray-900">{project.report_date || new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="project-info">
                <h2 className="text-xl font-semibold mb-4">
                  Project Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Project Name:</strong> {project.project_name}
                  </div>
                  <div>
                    <strong>Client:</strong> {project.client_name}
                  </div>
                  <div>
                    <strong>Case Number:</strong> {project.case_number || "N/A"}
                  </div>
                  <div>
                    <strong>Appraisal Type:</strong> {project.appraisal_type}
                  </div>
                  <div>
                    <strong>Inspection Date:</strong>{" "}
                    {project.inspection_date || "N/A"}
                  </div>
                  <div>
                    <strong>Report Date:</strong>{" "}
                    {project.report_date || new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {/* Items Table — horizontal scroll contained here only */}
            <div className="max-lg:min-w-0">
              <h2 className="text-xl font-semibold mb-4 max-lg:mb-3 max-lg:mt-6 max-lg:text-lg max-lg:font-bold max-lg:text-gray-900">Appraisal Items</h2>
              <div className="max-lg:overflow-x-auto max-lg:-mx-4 max-lg:px-4">
              <table className="items-table min-w-0 max-lg:min-w-[520px]">
                <thead>
                  <tr>
                    <th>Item #</th>
                    <th>Photo</th>
                    {/* Hide Room/Area for Coins and Wine */}
                    {detectedItemType !== "Coins" && detectedItemType !== "Wine" && (
                      <th>Room/Area</th>
                    )}
                    <th>Type</th>
                    <th>Description</th>
                    <th>{project.appraisal_type === 'INSURANCE' || project.appraisal_type === 'REPLACEMENT' ? 'Replacement Value' : 'Appraised Value'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        {item.photo_id ? (
                          <ThumbnailImage
                            projectId={id}
                            photoId={item.photo_id}
                            alt="Item photo"
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>
                            No Photo
                          </div>
                        )}
                      </td>
                      {/* Hide Room/Area for Coins and Wine */}
                      {detectedItemType !== "Coins" && detectedItemType !== "Wine" && (
                        <td>{item.room_area || '-'}</td>
                      )}
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
                    <td colSpan={detectedItemType === "Coins" || detectedItemType === "Wine" ? "4" : "5"}>
                      <strong>Total {project.appraisal_type === 'INSURANCE' || project.appraisal_type === 'REPLACEMENT' ? 'Replacement' : 'Appraised'} Value:</strong>
                    </td>
                    <td><strong>${totalValue.toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 max-lg:mt-6">
              <h2 className="text-xl font-semibold mb-4 max-lg:mb-3 max-lg:text-lg max-lg:font-bold max-lg:text-gray-900">Summary</h2>
              <p className="max-lg:text-sm">
                This appraisal report contains {items.length} items with a total{" "}
                {project.appraisal_type === 'INSURANCE' || project.appraisal_type === 'REPLACEMENT' ? 'replacement' : 'appraised'} value of ${totalValue.toLocaleString()}. The appraisal
                was conducted for {project.appraisal_type.toLowerCase()}{" "}
                purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Inspection Verification Modal */}
      <InspectionVerificationModal
        isOpen={showInspectionModal}
        onClose={() => {
          setShowInspectionModal(false);
          setPendingReportType(null);
        }}
        onConfirm={handleInspectionVerification}
      />
    </Layout>
  );
};

export default ProjectReview;
