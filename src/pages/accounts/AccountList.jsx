import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import AddSubAccountModal from '../../components/AddSubAccountModal';
import EditClientModal from '../../components/EditClientModal';
import { accountService } from '../../services/accountService';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  FunnelIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [clients, setClients] = useState({});
  const [unassignedClients, setUnassignedClients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const { isAdmin, isEditor } = useAuth();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleGlobalSearch = (event) => {
      setFilter(event.detail);
    };

    const handleClientCreated = (event) => {
      const { client } = event.detail;
      if (client.parent_account_id && expandedAccounts.has(client.parent_account_id)) {
        // Refresh clients for the parent account
        accountService.getAccountClients(client.parent_account_id)
          .then(clientsData => {
            setClients(prev => ({ ...prev, [client.parent_account_id]: clientsData }));
          })
          .catch(err => console.error('Error refreshing clients:', err));
      } else if (!client.parent_account_id) {
        // Add to unassigned clients
        setUnassignedClients(prev => [client, ...prev]);
      }
    };

    const handleClientUpdated = (event) => {
      const { client, oldParentAccountId, newParentAccountId } = event.detail;
      
      // Handle unassigned clients list updates
      if (!oldParentAccountId && newParentAccountId) {
        // Client was assigned from unassigned
        setUnassignedClients(prev => prev.filter(c => c.id !== client.id));
      } else if (oldParentAccountId && !newParentAccountId) {
        // Client was unassigned
        setUnassignedClients(prev => [client, ...prev]);
      } else if (!oldParentAccountId && !newParentAccountId) {
        // Client updated but still unassigned
        setUnassignedClients(prev => prev.map(c => c.id === client.id ? client : c));
      }
      
      // Refresh clients for old parent account if it was expanded
      if (oldParentAccountId && expandedAccounts.has(oldParentAccountId)) {
        accountService.getAccountClients(oldParentAccountId)
          .then(clientsData => {
            setClients(prev => ({ ...prev, [oldParentAccountId]: clientsData }));
          })
          .catch(err => console.error('Error refreshing old parent clients:', err));
      }
      
      // Refresh clients for new parent account if it's expanded
      if (newParentAccountId && expandedAccounts.has(newParentAccountId)) {
        accountService.getAccountClients(newParentAccountId)
          .then(clientsData => {
            setClients(prev => ({ ...prev, [newParentAccountId]: clientsData }));
          })
          .catch(err => console.error('Error refreshing new parent clients:', err));
      }
    };

    window.addEventListener('globalSearch', handleGlobalSearch);
    window.addEventListener('clientCreated', handleClientCreated);
    window.addEventListener('clientUpdated', handleClientUpdated);
    return () => {
      window.removeEventListener('globalSearch', handleGlobalSearch);
      window.removeEventListener('clientCreated', handleClientCreated);
      window.removeEventListener('clientUpdated', handleClientUpdated);
    };
  }, [expandedAccounts]);

  const fetchAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      setAccounts(Array.isArray(response.accounts) ? response.accounts : []);
      
      // Fetch unassigned clients
      const clientsResponse = await clientService.getClients();
      const unassigned = clientsResponse.filter(client => !client.parent_account_id);
      setUnassignedClients(unassigned);
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error fetching accounts:', err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await accountService.deleteAccount(id);
        setAccounts(accounts.filter(account => account.id !== id));
      } catch (err) {
        setError('Failed to delete account');
        console.error('Error deleting account:', err);
      }
    }
  };

  const toggleAccountExpansion = async (accountId) => {
    const newExpanded = new Set(expandedAccounts);
    if (expandedAccounts.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
      // Fetch clients based on project relationships
      try {
        const clientsData = await accountService.getAccountClientsByProjects(accountId);
        setClients(prev => ({ ...prev, [accountId]: clientsData }));
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    }
    setExpandedAccounts(newExpanded);
  };

  const accountTypes = [
    { value: '', label: 'All Types' },
    { value: 'attorney', label: 'Attorney' },
    { value: 'client', label: 'Client' },
    { value: 'insurance_company', label: 'Insurance Company' },
    { value: 'lender', label: 'Lender' },
    { value: 'other', label: 'Other' }
  ];

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name?.toLowerCase().includes(filter.toLowerCase()) ||
                         account.email?.toLowerCase().includes(filter.toLowerCase());
    const matchesType = selectedType === '' || account.account_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getAccountTypeLabel = (type) => {
    if (!type) return 'Unknown';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      attorney: 'bg-blue-100 text-blue-800 border-blue-200',
      client: 'bg-green-100 text-green-800 border-green-200',
      insurance_company: 'bg-purple-100 text-purple-800 border-purple-200',
      lender: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.other;
  };

  const getAccountIcon = (type) => {
    const icons = {
      attorney: BuildingOfficeIcon,
      client: UserIcon,
      insurance_company: BuildingOfficeIcon,
      lender: BuildingOfficeIcon,
      other: UserIcon
    };
    return icons[type] || UserIcon;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="animate-pulse p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Accounts
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {(isAdmin || isEditor) && (
            <Link
              to="/accounts/new"
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Add Account
            </Link>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts by name or email..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
              />
            </div>
            
            {/* Type Filter */}
            <div className="relative sm:w-64">
              <FunnelIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-12 pr-8 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 bg-white"
              >
                {accountTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List View */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredAccounts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAccounts.map((account, index) => {
                const IconComponent = getAccountIcon(account.account_type);
                
                return (
                  <div key={account.id}>
                    <div 
                      className="group p-6 hover:bg-gray-50 transition-all duration-200 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left Section - Account Info */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          {/* Expand/Collapse Button - Only show for non-client accounts */}
                          {account.account_type !== 'client' ? (
                            <button
                              onClick={() => toggleAccountExpansion(account.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {expandedAccounts.has(account.id) ? (
                                <ChevronDownIcon className="w-5 h-5" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 h-6"></div>
                          )}
                          
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <div className={`p-3 rounded-2xl ${getAccountTypeColor(account.account_type).replace('text-', 'bg-').replace('-800', '-500')} bg-opacity-20 border`}>
                              <IconComponent className="w-6 h-6 text-gray-700" />
                            </div>
                          </div>
                          
                          {/* Account Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {account.name || 'Unnamed Account'}
                              </h3>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getAccountTypeColor(account.account_type)}`}>
                                {getAccountTypeLabel(account.account_type)}
                              </span>
                            </div>
                            
                            {/* Contact Info */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                              {account.email && (
                                <div className="flex items-center">
                                  <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="truncate">{account.email}</span>
                                </div>
                              )}
                              {account.phone && (
                                <div className="flex items-center">
                                  <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>{account.phone}</span>
                                </div>
                              )}
                              {(account.city || account.state) && (
                                <div className="flex items-center">
                                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>
                                    {[account.city, account.state].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Additional Info */}
                            {account.created_at && (
                              <div className="mt-2 text-xs text-gray-500">
                                Added {new Date(account.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          
                          {(isAdmin || isEditor) && (
                            <Link
                              to={`/accounts/${account.id}/edit`}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                              title="Edit Account"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </Link>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(account.id, account.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Account"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Content - Sub-accounts and Clients - Only show for non-client accounts */}
                    {account.account_type !== 'client' && expandedAccounts.has(account.id) && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        <div className="p-6 pl-16">
                          <div className="grid grid-cols-1 gap-6">
                            {/* Sub-accounts (removed since sub-accounts are now just clients) */}
                            
                            {/* Clients */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Clients</h4>
                              </div>
                              <div className="space-y-2">
                                {clients[account.id]?.length > 0 ? (
                                  clients[account.id].map(client => (
                                    <div key={client.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                          <span className="text-sm font-medium flex-shrink-0">{client.name}</span>
                                          {client.projects && client.projects.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {client.projects.map(project => (
                                                <span key={project.id} className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                                  {project.name}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {(isAdmin || isEditor) && (
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                                          <button
                                            onClick={() => {
                                              setSelectedClient(client);
                                              setEditModalOpen(true);
                                            }}
                                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                            title="Edit Client"
                                          >
                                            <PencilIcon className="w-4 h-4" />
                                          </button>
                                          {isAdmin && (
                                            <button
                                              onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
                                                  clientService.deleteClient(client.id)
                                                    .then(() => {
                                                      // Refresh clients list
                                                      if (expandedAccounts.has(account.id)) {
                                                        accountService.getAccountClientsByProjects(account.id)
                                                          .then(clientsData => {
                                                            setClients(prev => ({ ...prev, [account.id]: clientsData }));
                                                          })
                                                          .catch(err => console.error('Error refreshing clients:', err));
                                                      }
                                                    })
                                                    .catch(err => {
                                                      console.error('Error deleting client:', err);
                                                      setError('Failed to delete client');
                                                    });
                                                }
                                              }}
                                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                              title="Delete Client"
                                            >
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">No clients</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
              <p className="text-gray-600 mb-8">
                {filter || selectedType ? 'Try adjusting your search or filter.' : 'Get started by adding your first account.'}
              </p>
              {(isAdmin || isEditor) && (
                <Link
                  to="/accounts/new"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add First Account
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Unassigned Clients Section */}
        {unassignedClients.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-orange-500" />
                <span>Unassigned Clients</span>
                <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
                  {unassignedClients.length}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Clients not assigned to any account
              </p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {unassignedClients.map((client, index) => (
                <div 
                  key={client.id}
                  className="group p-6 hover:bg-gray-50 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-2xl bg-orange-100 border border-orange-200">
                          <UserIcon className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                            {client.name}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">
                            Unassigned Client
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                          {client.email && (
                            <div className="flex items-center">
                              <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {(client.city || client.state) && (
                            <div className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <span>
                                {[client.city, client.state].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {client.created_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            Added {new Date(client.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      
                      {(isAdmin || isEditor) && (
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setEditModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Edit Client"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
                              clientService.deleteClient(client.id)
                                .then(() => {
                                  setUnassignedClients(prev => prev.filter(c => c.id !== client.id));
                                })
                                .catch(err => {
                                  console.error('Error deleting client:', err);
                                  setError('Failed to delete client');
                                });
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Client"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Sub-account/Client Modal */}
      <AddSubAccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        parentAccountId={selectedAccountId}
        onSuccess={() => {
          // Refresh the clients data
          if (selectedAccountId && expandedAccounts.has(selectedAccountId)) {
            accountService.getAccountClients(selectedAccountId)
              .then(clientsData => {
                setClients(prev => ({ ...prev, [selectedAccountId]: clientsData }));
              })
              .catch(err => {
                console.error('Error refreshing clients:', err);
              });
          }
        }}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        client={selectedClient}
        onSuccess={() => {
          // Refresh the clients data for the parent account
          if (selectedClient?.parent_account_id && expandedAccounts.has(selectedClient.parent_account_id)) {
            accountService.getAccountClients(selectedClient.parent_account_id)
              .then(clientsData => {
                setClients(prev => ({ ...prev, [selectedClient.parent_account_id]: clientsData }));
              })
              .catch(err => {
                console.error('Error refreshing clients:', err);
              });
          }
        }}
      />

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

export default AccountList;