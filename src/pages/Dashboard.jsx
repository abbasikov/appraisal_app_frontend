import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProjectBanner from '../components/ProjectBanner';
import { dashboardService } from '../services/dashboardService';
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isAdmin, isEditor, isReader } = useAuth();
  const navigate = useNavigate();
  const [openProjects, setOpenProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [openData, completedData, statsData] = await Promise.all([
          dashboardService.getOpenProjects(5),
          dashboardService.getCompletedProjects(5),
          dashboardService.getDashboardStats()
        ]);
        
        setOpenProjects(openData);
        setCompletedProjects(completedData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dashboardStats = stats ? [
    { name: 'Total Projects', value: stats.total_projects.toString(), icon: DocumentTextIcon },
    { name: 'Open Projects', value: stats.open_projects.toString(), icon: ChartBarIcon },
    { name: 'Completed Projects', value: stats.completed_projects.toString(), icon: DocumentTextIcon },
    { name: 'Recent Projects', value: stats.recent_projects.toString(), icon: BuildingOfficeIcon },
  ] : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="mt-1 text-sm text-gray-600 capitalize">
            {user?.role} Dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            dashboardStats.map((item) => (
              <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <item.icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {item.name}
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {item.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Project Banners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectBanner
            title="Open Projects"
            projects={openProjects}
            type="open"
            loading={loading}
          />
          <ProjectBanner
            title="Completed Projects"
            projects={completedProjects}
            type="completed"
            loading={loading}
          />
        </div>

        {/* Role-specific sections */}
        {isAdmin && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Tools</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button 
                onClick={() => navigate('/users')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <UserGroupIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500 mt-1">Create and manage user accounts</p>
              </button>
              <button 
                onClick={() => navigate('/accounts')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <BuildingOfficeIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Manage Accounts</p>
                <p className="text-xs text-gray-500 mt-1">Attorneys, clients, and contacts</p>
              </button>
              <button 
                onClick={() => navigate('/templates')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <DocumentTextIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Templates</p>
                <p className="text-xs text-gray-500 mt-1">Manage appraisal templates</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;