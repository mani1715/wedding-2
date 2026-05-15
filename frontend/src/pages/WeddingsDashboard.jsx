import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import {
  Plus,
  LogOut,
  Edit,
  Archive,
  Rocket,
  Eye,
  Sparkles,
  Calendar,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import WeddingPublishModal from '@/components/WeddingPublishModal';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const WeddingsDashboard = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminCredits, setAdminCredits] = useState({});
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedWedding, setSelectedWedding] = useState(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
    } else {
      fetchWeddings();
    }
  }, [admin, navigate]);

  const fetchWeddings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/weddings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setWeddings(response.data.weddings || []);
        setAdminCredits(response.data.admin_credits || {});
      }
    } catch (error) {
      console.error('Failed to fetch weddings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleCreateWedding = () => {
    navigate('/admin/weddings/create');
  };

  const handleEditWedding = (weddingId) => {
    navigate(`/admin/weddings/${weddingId}/edit`);
  };

  const handlePublishClick = async (wedding) => {
    // Fetch latest wedding details with cost
    try {
      const response = await axios.get(`${API_URL}/api/weddings/${wedding.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSelectedWedding({
          ...response.data.wedding,
          estimated_cost: response.data.cost_breakdown?.total || 0,
          admin_credits: response.data.admin_credits
        });
        setShowPublishModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch wedding details:', error);
      alert('Failed to load wedding details');
    }
  };

  const handlePublishSuccess = (result) => {
    setShowPublishModal(false);
    setSelectedWedding(null);
    alert(`Wedding published successfully! ${result.credits_deducted} credits used.`);
    fetchWeddings();
  };

  const handleArchiveWedding = async (weddingId) => {
    if (!window.confirm('Are you sure you want to archive this wedding? This will disable the public link.')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/weddings/${weddingId}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('Wedding archived successfully');
      fetchWeddings();
    } catch (error) {
      console.error('Failed to archive wedding:', error);
      alert(error.response?.data?.detail || 'Failed to archive wedding');
    }
  };

  const handleViewPublicLink = (slug) => {
    window.open(`${window.location.origin}/invite/${slug}`, '_blank');
  };

  return (
    <div className="luxe min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Weddings
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Credit Balance */}
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-lg border border-amber-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-700">Available Credits</p>
                    <p className="text-lg font-bold text-amber-900">
                      {adminCredits.available || 0}
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleLogout} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Total: <span className="font-semibold">{weddings.length}</span> wedding
            {weddings.length !== 1 ? 's' : ''}
          </p>

          <Button
            onClick={handleCreateWedding}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Wedding
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading weddings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && weddings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No weddings yet</h3>
            <p className="text-gray-600 mb-6">Create your first wedding to get started</p>
            <Button
              onClick={handleCreateWedding}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Wedding
            </Button>
          </div>
        )}

        {/* Wedding Cards Grid */}
        {!loading && weddings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((wedding) => (
              <div
                key={wedding.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="p-5 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {wedding.title || 'Untitled Wedding'}
                    </h3>
                    <StatusBadge status={wedding.status} />
                  </div>
                  <p className="text-sm text-gray-600 font-mono">/{wedding.slug}</p>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  {/* Design Info */}
                  {wedding.selected_design_key && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Design:</span>
                      <span className="font-medium text-gray-900">
                        {wedding.selected_design_key}
                      </span>
                    </div>
                  )}

                  {/* Credit Estimate for Drafts */}
                  {(wedding.status === 'draft' || wedding.status === 'ready') && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-700">Estimated Cost:</span>
                        <span className="text-sm font-bold text-amber-900">
                          {wedding.estimated_cost || 0} credits
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Published Info */}
                  {wedding.status === 'published' && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Credits Used:</span>
                        <span className="text-sm font-bold text-green-900">
                          {wedding.total_credit_cost || 0} credits
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  {wedding.wedding_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(wedding.wedding_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-gray-50 border-t flex items-center gap-2">
                  <Button
                    onClick={() => handleEditWedding(wedding.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  {wedding.status === 'ready' && (
                    <Button
                      onClick={() => handlePublishClick(wedding)}
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      <Rocket className="w-3.5 h-3.5 mr-1" />
                      Publish
                    </Button>
                  )}

                  {wedding.status === 'published' && (
                    <Button
                      onClick={() => handleViewPublicLink(wedding.slug)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                  )}

                  {wedding.status !== 'archived' && (
                    <Button
                      onClick={() => handleArchiveWedding(wedding.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && selectedWedding && (
        <WeddingPublishModal
          wedding={selectedWedding}
          onClose={() => {
            setShowPublishModal(false);
            setSelectedWedding(null);
          }}
          onPublishSuccess={handlePublishSuccess}
        />
      )}
    </div>
  );
};

export default WeddingsDashboard;
