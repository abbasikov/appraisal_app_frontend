import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useToast } from '../hooks/useToast';
import { projectService } from '../services/projectService';
import { 
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      const projects = response.projects || [];
      
      // Generate reports from existing projects
      const mockReports = [];
      projects.forEach((project, index) => {
        // Generate draft report for each project
        const draftDate = new Date();
        draftDate.setDate(draftDate.getDate() - (index * 2 + 1));
        
        mockReports.push({
          id: `${project.id}-draft`,
          project_id: project.id,
          project_name: project.project_name,
          client_name: project.client_name,
          template_name: `${project.appraisal_type} Template`,
          report_type: 'draft',
          created_at: draftDate.toISOString(),
          appraisal_type: project.appraisal_type,
          has_watermark: true
        });
        
        // Generate final report for some projects
        if (index % 2 === 0) {
          const finalDate = new Date();
          finalDate.setDate(finalDate.getDate() - (index * 2));
          
          mockReports.push({
            id: `${project.id}-final`,
            project_id: project.id,
            project_name: project.project_name,
            client_name: project.client_name,
            template_name: `${project.appraisal_type} Template`,
            report_type: 'final',
            created_at: finalDate.toISOString(),
            appraisal_type: project.appraisal_type,
            has_watermark: false
          });
        }
      });
      
      console.log('Generated reports:', mockReports);
      setReports(mockReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generated appraisal reports</p>
        </div>

        {reports.length === 0 ? (
          <Card className="p-4 sm:p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated</h3>
            <p className="text-gray-500">Reports will appear here once generated from projects</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.project_name}
                      </h3>
                      <Badge variant={report.report_type === 'final' ? 'success' : 'warning'}>
                        {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                      </Badge>
                      {report.has_watermark && (
                        <Badge variant="gray" size="sm">
                          Watermarked
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span>{report.client_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>{report.template_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Type: {report.appraisal_type}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;