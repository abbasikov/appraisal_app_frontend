import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../../components/Layout';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';
import { 
  PlusIcon, 
  TrashIcon, 
  UserIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UsersIcon,
  CogIcon,
  StarIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const { user } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    mobile_number: '',
    role: 'reader'
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  const roles = [
    { value: 'admin', label: 'Admin', color: 'red', description: 'Full system access' },
    { value: 'editor', label: 'Editor', color: 'blue', description: 'Can create and edit content' },
    { value: 'reader', label: 'Reader', color: 'green', description: 'View-only access' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response);
    } catch (error) {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      await userService.inviteUser(inviteForm);
      showSuccess('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteForm({ email: '', first_name: '', last_name: '', mobile_number: '', role: 'reader' });
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      showSuccess('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        await userService.deleteUser(userId);
        showSuccess('User deleted successfully!');
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        await fetchUsers();
      } catch (error) {
        showError(error.response?.data?.detail || 'Failed to delete user');
        fetchUsers();
      }
    }
  };

  const canInviteRole = (role) => {
    if (user.role === 'admin') return true;
    if (user.role === 'editor') return ['editor', 'reader'].includes(role);
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (targetUser.id === user.id) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'editor') return targetUser.role === 'reader';
    return false;
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[roles.length - 1];
  };

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = 
      userItem.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || userItem.role === roleFilter;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && userItem.password_set) ||
      (statusFilter === 'pending' && !userItem.password_set);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStats = () => {
    const stats = {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      editor: users.filter(u => u.role === 'editor').length,
      reader: users.filter(u => u.role === 'reader').length,
      active: users.filter(u => u.password_set).length,
      pending: users.filter(u => !u.password_set).length
    };
    return stats;
  };

  const stats = getUserStats();

  const UserCard = ({ userItem }) => {
    const roleInfo = getRoleInfo(userItem.role);
    const isCurrentUser = userItem.id === user.id;
    
    return (
      <div className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 animate-slide-up">
        {/* Role badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-${roleInfo.color}-100 text-${roleInfo.color}-700 border border-${roleInfo.color}-200`}>
            <ShieldCheckIcon className="w-3 h-3" />
            <span>{roleInfo.label}</span>
          </div>
        </div>

        {/* Current user indicator */}
        {isCurrentUser && (
          <div className="absolute top-4 left-4 z-10">
            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
              <StarIcon className="w-3 h-3" />
              <span>You</span>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative p-6">
          {/* User Header */}
          <div className="mb-4">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <UserIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {userItem.first_name} {userItem.last_name}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {userItem.email}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <EnvelopeIcon className="w-4 h-4 text-blue-500" />
                <span>{userItem.email}</span>
              </div>
              {userItem.mobile_number && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <PhoneIcon className="w-4 h-4 text-green-500" />
                  <span>{userItem.mobile_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Role Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                userItem.password_set 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
              }`}>
                {userItem.password_set ? (
                  <CheckCircleIcon className="w-3 h-3" />
                ) : (
                  <ClockIcon className="w-3 h-3" />
                )}
                <span>{userItem.password_set ? 'Active' : 'Pending'}</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Role</span>
              {user.role === 'admin' && !isCurrentUser ? (
                <select
                  value={userItem.role}
                  onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="reader">Reader</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-${roleInfo.color}-100 text-${roleInfo.color}-700`}>
                  {roleInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canDeleteUser(userItem) && (
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => handleDeleteUser(userItem.id, `${userItem.first_name} ${userItem.last_name}`)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Remove User</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Loading skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-xl w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-2xl w-40 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-16 bg-gray-200 rounded-2xl"></div>
                  <div className="h-6 bg-gray-200 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {/* Modern Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 animate-pulse"></div>
            <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute right-1/4 top-1/4 w-6 h-6 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <UsersIcon className="w-8 h-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">User Management</h1>
                </div>
                <p className="text-violet-100 text-lg">
                  Manage team members and their permissions
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 text-white/90">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium">{stats.total} total users</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/90">
                    <SparklesIcon className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Team Collaboration</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="group flex items-center space-x-3 px-6 py-4 bg-white text-purple-600 font-semibold rounded-2xl hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Invite User</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-600">{stats.admin}</p>
              </div>
              <ShieldCheckIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Editors</p>
                <p className="text-2xl font-bold text-blue-600">{stats.editor}</p>
              </div>
              <CogIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Readers</p>
                <p className="text-2xl font-bold text-green-600">{stats.reader}</p>
              </div>
              <UserIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters & Search Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 focus:bg-white transition-all duration-200 placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 transition-all duration-200"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="reader">Reader</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-16 h-16 text-purple-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No users found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || roleFilter || statusFilter 
                ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                : 'Get started by inviting your first team member to join the platform.'
              }
            </p>
            {!searchTerm && !roleFilter && !statusFilter && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Invite First User</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((userItem, index) => (
              <div
                key={userItem.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <UserCard userItem={userItem} />
              </div>
            ))}
          </div>
        )}

        {/* Invite User Modal */}
        {showInviteModal && createPortal(
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-200 scale-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-purple-100 border border-purple-200">
                      <PlusIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Invite New User</h3>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-300 focus:ring-purple-500/20 focus:outline-none focus:ring-4 transition-all duration-200"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.first_name}
                      onChange={(e) => setInviteForm({...inviteForm, first_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-300 focus:ring-purple-500/20 focus:outline-none focus:ring-4 transition-all duration-200"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.last_name}
                      onChange={(e) => setInviteForm({...inviteForm, last_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-300 focus:ring-purple-500/20 focus:outline-none focus:ring-4 transition-all duration-200"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    value={inviteForm.mobile_number}
                    onChange={(e) => setInviteForm({...inviteForm, mobile_number: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-300 focus:ring-purple-500/20 focus:outline-none focus:ring-4 transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-300 focus:ring-purple-500/20 focus:outline-none focus:ring-4 transition-all duration-200"
                  >
                    {roles.filter(role => canInviteRole(role.value)).map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <EnvelopeIcon className="w-4 h-4 mr-2 inline-block" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
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
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </Layout>
  );
};

export default UserManagement;