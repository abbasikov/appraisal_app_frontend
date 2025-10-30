import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { appraisalService } from '../../services/appraisalService';
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
    } catch (error) {
      showToast('Failed to load project data', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportType) => {
    try {
      setGenerating(true);
      
      const children = [
        new Paragraph({
          children: [new TextRun({ text: "Appraisal Report", bold: true, size: 32 })],
          alignment: "center"
        }),
        new Paragraph({
          children: [new TextRun({ text: `${project.appraisal_type} Appraisal`, size: 24 })],
          alignment: "center"
        }),
        new Paragraph({ text: "" }),
        
        new Paragraph({
          children: [new TextRun({ text: "Project Information", bold: true, size: 24 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: `Project Name: ${project.project_name}` })]
        }),
        new Paragraph({
          children: [new TextRun({ text: `Client: ${project.client_name}` })]
        }),
        new Paragraph({
          children: [new TextRun({ text: `Case Number: ${project.case_number || 'N/A'}` })]
        }),
        new Paragraph({ text: "" })
      ];
      
      if (reportType === 'draft') {
        children.unshift(
          new Paragraph({
            children: [new TextRun({ text: "DRAFT", bold: true, size: 48, color: "CCCCCC" })],
            alignment: "center"
          })
        );
      }
      
      const doc = new Document({
        sections: [{ children: children }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${project.project_name}_${reportType}_report.docx`);
      showToast(`${reportType} report downloaded successfully`, 'success');
    } catch (error) {
      showToast('Failed to generate report', 'error');
      console.error('Report generation error:', error);
    } finally {
      setGenerating(false);
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

  const totalValue = items.reduce((sum, item) => sum + (item.appraised_value || 0), 0);

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
              disabled={generating}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Download Draft'}
            </button>
            <button
              onClick={() => handleDownload('final')}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Download Final'}
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white shadow rounded-lg">
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
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item #</th>
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
                      <td>{item.room_area || '-'}</td>
                      <td>{item.item_type || '-'}</td>
                      <td>
                        <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                          {item.description || '-'}
                        </div>
                      </td>
                      <td>${(item.appraised_value || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="4"><strong>Total Appraised Value:</strong></td>
                    <td><strong>${totalValue.toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
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