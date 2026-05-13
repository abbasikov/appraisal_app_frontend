import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clientService } from '../../services/clientService';
import Layout from '../../components/Layout';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const { user, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients(0, 100, search);
      setClients(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to load clients');
      setClients([]);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      return;
    }

    try {
      await clientService.deleteClient(clientId);
      setClients(clients.filter(client => client.id !== clientId));
    } catch (err) {
      setError('Failed to delete client');
      console.error('Error deleting client:', err);
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

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6 page-header-row">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          {(isAdmin || isEditor) && (
            <Link
              to="/clients/new"
              className="btn-responsive text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add New Client
            </Link>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                  Case Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                  Attorney
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                  Phone
                </th>
                {(isAdmin || isEditor) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-lg:font-bold max-lg:text-gray-700">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.case_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.attorney_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.phone || '-'}
                    </td>
                    {(isAdmin || isEditor) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(client.id, client.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientList;