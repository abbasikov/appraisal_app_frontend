import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';
import Badge from './ui/Badge';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HomeIcon, 
      iconSolid: HomeIconSolid,
      roles: ['admin', 'editor', 'reader'],
      gradient: 'from-blue-500 to-indigo-600' 
    },
    { 
      name: 'Accounts', 
      href: '/accounts', 
      icon: UserGroupIcon, 
      iconSolid: UserGroupIconSolid,
      roles: ['admin', 'editor', 'reader'],
      gradient: 'from-emerald-500 to-green-600' 
    },

    { 
      name: 'Projects', 
      href: '/projects', 
      icon: BuildingOfficeIcon, 
      iconSolid: BuildingOfficeIconSolid,
      roles: ['admin', 'editor'],
      gradient: 'from-orange-500 to-red-600' 
    },
    { 
      name: 'Templates', 
      href: '/templates', 
      icon: DocumentTextIcon, 
      iconSolid: DocumentTextIconSolid,
      roles: ['admin', 'editor', 'reader'],
      gradient: 'from-cyan-500 to-blue-600' 
    },
    { 
      name: 'Appraisals', 
      href: '/appraisals', 
      icon: DocumentTextIcon, 
      iconSolid: DocumentTextIconSolid,
      roles: ['admin', 'editor', 'reader'],
      gradient: 'from-pink-500 to-purple-600' 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: DocumentTextIcon, 
      iconSolid: DocumentTextIconSolid,
      roles: ['admin', 'editor'],
      gradient: 'from-amber-500 to-orange-600' 
    },
    { 
      name: 'Users', 
      href: '/users', 
      icon: UserGroupIcon, 
      iconSolid: UserGroupIconSolid,
      roles: ['admin'],
      gradient: 'from-violet-500 to-purple-600' 
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Cog6ToothIcon, 
      iconSolid: Cog6ToothIconSolid,
      roles: ['admin', 'editor', 'reader'],
      gradient: 'from-gray-500 to-slate-600' 
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-72';
  const mainMargin = sidebarCollapsed ? 'pl-20' : 'pl-72';

  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-purple-500 to-indigo-600 text-white',
      editor: 'from-blue-500 to-cyan-600 text-white',
      reader: 'from-gray-500 to-slate-600 text-white'
    };
    return colors[role] || colors.reader;
  };

  const NavItem = ({ item, collapsed = false }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    const IconComponent = isActive ? item.iconSolid : item.icon;
    
    return (
      <Link
        to={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg transform scale-105' 
            : 'text-gray-700 hover:bg-gradient-to-r hover:' + item.gradient + ' hover:text-white hover:shadow-md hover:scale-102'
        }`}
        title={collapsed ? item.name : ''}
      >
        {/* Glow effect for active item */}
        {isActive && (
          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-2xl opacity-20 blur-lg -z-10`}></div>
        )}
        
        <div className="relative flex items-center w-full">
          <IconComponent className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 ${
            isActive ? 'scale-110' : 'group-hover:scale-110'
          }`} />
          
          {!collapsed && (
            <>
              <span className="ml-4 truncate font-semibold">{item.name}</span>
              {/* Active indicator */}
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 transition-all duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-gray-100/50">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img 
                  src="/logo.jpeg" 
                  alt="AppraisalBuilder Logo" 
                  className="w-14 h-10 rounded-lg shadow-lg object-cover"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-2 h-2 text-yellow-900" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  AppraisalBuilder
                </h1>
                <p className="text-xs text-gray-500 font-medium">Professional Edition</p>
              </div>
            </div>
          )}
          
          {/* Toggle buttons */}
          <div className="flex space-x-2">
            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Desktop collapse button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              )}
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item, index) => (
            <div 
              key={item.name} 
              className="animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <NavItem item={item} collapsed={sidebarCollapsed} />
            </div>
          ))}
        </nav>

        {/* User Profile Section - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100/50 p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              {/* User info */}
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <Badge variant={user?.role === 'admin' ? 'purple' : user?.role === 'editor' ? 'info' : 'gray'} size="sm">
                    {user?.role}
                  </Badge>
                </div>
              </div>
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="group w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-2xl hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white transition-all duration-300 hover:shadow-lg"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="ml-3 font-semibold">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Collapsed user avatar */}
              <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto shadow-lg">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              {/* Collapsed logout */}
              <button
                onClick={handleLogout}
                className="w-full p-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mx-auto" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`${mainMargin} transition-all duration-300`}>
        {/* Modern Top Header Bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Bars3Icon className="w-6 h-6 text-gray-600" />
                </button>
                
                {/* Page title with modern styling */}
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent capitalize">
                    {location.pathname.split('/')[1] || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome back, <span className="font-medium text-blue-600">{user?.first_name}</span>! 👋
                  </p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Modern Search */}
                <div className="hidden sm:block relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects, clients..."
                    className="pl-10 pr-4 py-2.5 w-80 bg-gray-50/80 border border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 focus:bg-white transition-all duration-200 placeholder-gray-400"
                  />
                </div>
                
                {/* Notifications with modern styling */}
                <div className="relative">
                  <button className="relative p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-2xl transition-all duration-200 group">
                    <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg">
                      <span className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></span>
                    </span>
                  </button>
                </div>

                {/* Quick actions - visible on larger screens */}
                <div className="hidden xl:flex items-center space-x-2">
                  <button className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    Quick Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6 px-6">
          <div className="animate-slide-in">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Layout;