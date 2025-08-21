import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isAdmin, isAppraiser, isClient } = useAuth();

  const stats = [
    { name: 'Total Appraisals', value: '12', icon: DocumentTextIcon, change: '+4.75%', changeType: 'positive' },
    { name: 'Properties', value: '8', icon: BuildingOfficeIcon, change: '+2.02%', changeType: 'positive' },
    { name: 'Pending Reviews', value: '3', icon: ChartBarIcon, change: '-1.39%', changeType: 'negative' },
    { name: 'Completed', value: '9', icon: DocumentTextIcon, change: '+10.18%', changeType: 'positive' },
  ];

  const recentAppraisals = [
    { id: 1, property: '123 Main St', status: 'In Progress', date: '2024-01-15', value: '$450,000' },
    { id: 2, property: '456 Oak Ave', status: 'Completed', date: '2024-01-14', value: '$320,000' },
    { id: 3, property: '789 Pine Rd', status: 'Pending', date: '2024-01-13', value: '$275,000' },
  ];

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
          {stats.map((item) => (
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
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {item.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Appraisals
            </h3>
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {recentAppraisals.map((appraisal) => (
                  <li key={appraisal.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appraisal.property}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appraisal.date} • {appraisal.value}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appraisal.status === 'Completed' 
                            ? 'bg-green-100 text-green-800'
                            : appraisal.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appraisal.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <a
                href="/appraisals"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all appraisals
              </a>
            </div>
          </div>
        </div>

        {/* Role-specific sections */}
        {isAdmin && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Tools</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Manage Users</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">System Reports</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Templates</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;