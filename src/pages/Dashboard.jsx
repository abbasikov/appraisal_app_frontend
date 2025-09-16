import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { dashboardService } from '../services/dashboardService';
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarDaysIcon,
  FolderOpenIcon,
  SparklesIcon,
  BoltIcon,
  ArrowRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  DocumentTextIcon as DocumentTextIconSolid,
  ClockIcon as ClockIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';

const Dashboard = () => {
  const { user, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const [openProjects, setOpenProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

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
    { 
      id: 'total',
      name: 'Total Projects', 
      value: stats.total_projects || 0, 
      icon: DocumentTextIconSolid,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      change: '+12%',
      trend: 'up',
      description: 'All projects in system'
    },
    { 
      id: 'open',
      name: 'Active Projects', 
      value: stats.open_projects || 0, 
      icon: ClockIconSolid,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-100',
      change: '+5%',
      trend: 'up',
      description: 'Currently in progress'
    },
    { 
      id: 'completed',
      name: 'Completed', 
      value: stats.completed_projects || 0, 
      icon: CheckCircleIconSolid,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-100',
      change: '+8%',
      trend: 'up',
      description: 'Successfully finished'
    },
    { 
      id: 'recent',
      name: 'This Month', 
      value: stats.recent_projects || 0, 
      icon: ChartBarIconSolid,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-100',
      change: '+15%',
      trend: 'up',
      description: 'New this month'
    },
  ] : [];

  const quickActions = [
    {
      name: 'New Project',
      description: 'Start a new appraisal project',
      icon: PlusIcon,
      gradient: 'from-blue-500 to-blue-600',
      action: () => navigate('/projects/new'),
      show: isAdmin || isEditor
    },

    {
      name: 'Browse Templates',
      description: 'Manage appraisal templates',
      icon: DocumentTextIcon,
      gradient: 'from-purple-500 to-indigo-600',
      action: () => navigate('/templates'),
      show: true
    },
    {
      name: 'View Reports',
      description: 'Access analytics and reports',
      icon: ChartBarIcon,
      gradient: 'from-orange-500 to-red-500',
      action: () => navigate('/reports'),
      show: isAdmin || isEditor
    }
  ].filter(action => action.show);

  const StatCard = ({ stat, index }) => {
    const isHovered = hoveredCard === stat.id;
    
    return (
      <div 
        className={`relative group cursor-pointer transform transition-all duration-300 ${
          isHovered ? 'scale-105 -translate-y-1' : 'hover:scale-102'
        }`}
        onMouseEnter={() => setHoveredCard(stat.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-white/20`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute -left-2 -bottom-2 w-16 h-16 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-700"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                isHovered ? 'rotate-6 scale-110' : ''
              }`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium ${
                isHovered ? 'bg-emerald-200' : ''
              } transition-colors duration-300`}>
                <ArrowTrendingUpIcon className="w-3 h-3" />
                <span>{stat.change}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left`}>
                {stat.value}
              </div>
              <div className="space-y-1">
                <p className="text-gray-900 font-medium text-sm">{stat.name}</p>
                <p className="text-gray-600 text-xs">{stat.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const QuickActionCard = ({ action, index }) => (
    <div 
      className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
      onClick={action.action}
      style={{ animationDelay: `${(index + 4) * 100}ms` }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group-hover:border-gray-200">
        {/* Hover gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
        
        <div className="relative z-10 flex items-center space-x-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
            <action.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
              {action.name}
            </h3>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
              {action.description}
            </p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>
    </div>
  );

  const ProjectCard = ({ project, status = 'active' }) => (
    <div className="group cursor-pointer bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            status === 'active' 
              ? 'bg-amber-100 text-amber-600' 
              : 'bg-green-100 text-green-600'
          }`}>
            {status === 'active' ? <ClockIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.project_name || 'Untitled Project'}
            </h4>
            <p className="text-sm text-gray-600">{project.client_name || 'No client'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'No date'}</p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            status === 'active' 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {status === 'active' ? 'Active' : 'Complete'}
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-32"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
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
                <div className="flex items-center space-x-3 mb-2">
                  <SparklesIcon className="w-8 h-8 text-yellow-300 animate-pulse" />
                  <h1 className="text-3xl font-bold text-white">
                    Welcome back, {user?.first_name || 'User'}! 
                  </h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Ready to manage your appraisal projects with ease
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-4">
                <div className="text-right text-white/90">
                  <p className="text-sm">Today's Date</p>
                  <p className="font-semibold">{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                <CalendarDaysIcon className="w-10 h-10 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <div key={stat.id} className="animate-slide-up">
              <StatCard stat={stat} index={index} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={action.name} action={action} index={index} />
            ))}
          </div>
        </div>

        {/* Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Projects */}
          <div className="animate-slide-up" style={{ animationDelay: '700ms' }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                      <FolderOpenIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/projects')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 hover:space-x-2 transition-all duration-200"
                  >
                    <span>View All</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {openProjects.length > 0 ? (
                    openProjects.slice(0, 4).map((project, index) => (
                      <div key={project.id || index} className="animate-fade-in" style={{ animationDelay: `${800 + index * 100}ms` }}>
                        <ProjectCard project={project} status="active" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FolderOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No active projects</p>
                      {(isAdmin || isEditor) && (
                        <button 
                          onClick={() => navigate('/projects/new')}
                          className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Create your first project
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Completed Projects */}
          <div className="animate-slide-up" style={{ animationDelay: '800ms' }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Completed Projects</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/projects')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 hover:space-x-2 transition-all duration-200"
                  >
                    <span>View All</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {completedProjects.length > 0 ? (
                    completedProjects.slice(0, 4).map((project, index) => (
                      <div key={project.id || index} className="animate-fade-in" style={{ animationDelay: `${900 + index * 100}ms` }}>
                        <ProjectCard project={project} status="completed" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No completed projects yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        {isAdmin && (
          <div className="animate-slide-up" style={{ animationDelay: '900ms' }}>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                  <Cog6ToothIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Admin Tools</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { name: 'Manage Users', desc: 'Create and manage user accounts', icon: UserGroupIcon, path: '/users', color: 'from-blue-500 to-blue-600' },
                  { name: 'Manage Accounts', desc: 'Attorneys, clients, and contacts', icon: BuildingOfficeIcon, path: '/accounts', color: 'from-green-500 to-emerald-600' },
                  { name: 'Templates', desc: 'Manage appraisal templates', icon: DocumentTextIcon, path: '/templates', color: 'from-purple-500 to-indigo-600' }
                ].map((tool, index) => (
                  <div 
                    key={tool.name}
                    onClick={() => navigate(tool.path)}
                    className="group cursor-pointer bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${1000 + index * 100}ms` }}
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} mb-4 w-fit group-hover:scale-110 transition-transform duration-300`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-sm text-gray-600">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;