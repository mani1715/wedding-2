import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    initial_credits: 0
  });

  const [creditFormData, setCreditFormData] = useState({
    amount: '',
    reason: '',
    action: 'add' // 'add' or 'deduct'
  });

  useEffect(() => {
    // Check if user is super admin
    if (admin && admin.role !== 'super_admin') {
      navigate('/admin/dashboard');
      return;
    }
    
    fetchAdmins();
  }, [admin, navigate]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/super-admin/admins`);
      setAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/super-admin/admins`, formData);
      alert('Admin created successfully!');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', name: '', initial_credits: 0 });
      fetchAdmins();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create admin');
    }
  };

  const handleCreditOperation = async (e) => {
    e.preventDefault();
    try {
      const endpoint = creditFormData.action === 'add' 
        ? '/api/super-admin/credits/add'
        : '/api/super-admin/credits/deduct';
      
      await axios.post(`${API_URL}${endpoint}`, {
        admin_id: selectedAdmin.id,
        amount: parseInt(creditFormData.amount),
        reason: creditFormData.reason
      });
      
      alert(`Credits ${creditFormData.action === 'add' ? 'added' : 'deducted'} successfully!`);
      setShowCreditModal(false);
      setCreditFormData({ amount: '', reason: '', action: 'add' });
      fetchAdmins();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update credits');
    }
  };

  const handleViewLedger = async (admin) => {
    try {
      setSelectedAdmin(admin);
      const response = await axios.get(`${API_URL}/api/super-admin/credits/ledger/${admin.id}`);
      setLedgerData(response.data);
      setShowLedgerModal(true);
    } catch (error) {
      alert('Failed to fetch ledger');
    }
  };

  const handleStatusToggle = async (adminId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await axios.put(`${API_URL}/api/super-admin/admins/${adminId}/status`, {
        status: newStatus
      });
      alert(`Admin ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
      fetchAdmins();
    } catch (error) {
      alert('Failed to update admin status');
    }
  };

  if (loading) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="luxe min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage photographers and credits</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {admin?.name || admin?.email}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Photographer Admins</h2>
            <p className="text-sm text-gray-600 mt-1">{admins.length} total admins</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Admin
          </button>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((adminItem) => (
                <tr key={adminItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{adminItem.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{adminItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      adminItem.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {adminItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-semibold">{adminItem.available_credits}</span> available
                    </div>
                    <div className="text-xs text-gray-500">
                      {adminItem.total_credits} total / {adminItem.used_credits} used
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedAdmin(adminItem);
                          setCreditFormData({ ...creditFormData, action: 'add' });
                          setShowCreditModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Add Credits"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAdmin(adminItem);
                          setCreditFormData({ ...creditFormData, action: 'deduct' });
                          setShowCreditModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Deduct Credits"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleViewLedger(adminItem)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Ledger"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleStatusToggle(adminItem.id, adminItem.status)}
                        className={adminItem.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                        title={adminItem.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        {adminItem.status === 'active' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create Photographer Admin</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Credits</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.initial_credits}
                  onChange={(e) => setFormData({ ...formData, initial_credits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Operation Modal */}
      {showCreditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {creditFormData.action === 'add' ? 'Add' : 'Deduct'} Credits - {selectedAdmin.name}
            </h3>
            <form onSubmit={handleCreditOperation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={creditFormData.amount}
                  onChange={(e) => setCreditFormData({ ...creditFormData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Mandatory)</label>
                <textarea
                  required
                  value={creditFormData.reason}
                  onChange={(e) => setCreditFormData({ ...creditFormData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    creditFormData.action === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {creditFormData.action === 'add' ? 'Add' : 'Deduct'} Credits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {showLedgerModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">Credit Ledger - {selectedAdmin.name}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerData.map((entry) => (
                    <tr key={entry.credit_id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.action_type === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        {entry.amount > 0 ? '+' : ''}{entry.amount}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                        {entry.balance_after}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {entry.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ledgerData.length === 0 && (
                <div className="text-center py-8 text-gray-500">No transactions yet</div>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
