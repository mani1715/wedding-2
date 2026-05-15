import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Filter } from 'lucide-react';
import WeddingCard from '@/components/WeddingCard';
import PublishModal from '@/components/PublishModal';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const WeddingDashboard = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminCredits, setAdminCredits] = useState({ total: 0, used: 0, available: 0 });
  const [filterStatus, setFilterStatus] = useState('all');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedWeddingId, setSelectedWeddingId] = useState(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
    } else {
      fetchWeddings();
    }
  }, [admin, filterStatus]);

  const fetchWeddings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      
      const response = await axios.get(
        `${API_URL}/api/weddings${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setWeddings(response.data.weddings || []);
        setAdminCredits(response.data.admin_credits || { total: 0, used: 0, available: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch weddings:', error);
      toast.error('Failed to load weddings');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = (weddingId) => {
    setSelectedWeddingId(weddingId);
    setPublishModalOpen(true);
  };

  const handlePublishSuccess = (data) => {
    toast.success(`Wedding published successfully! ${data.credits_consumed} credits used.`);
    fetchWeddings();
    setPublishModalOpen(false);
  };

  const handleArchive = async (weddingId) => {
    if (!confirm('Are you sure you want to archive this wedding? This will disable the public link.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/weddings/${weddingId}/archive`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Wedding archived successfully');
        fetchWeddings();
      }
    } catch (error) {
      console.error('Failed to archive wedding:', error);
      toast.error(error.response?.data?.detail || 'Failed to archive wedding');
    }
  };

  const handleView = (wedding) => {
    if (wedding.slug) {
      window.open(`/invite/${wedding.slug}`, '_blank');
    }
  };

  const statusCounts = {
    all: weddings.length,
    draft: weddings.filter(w => w.status === 'draft').length,
    ready: weddings.filter(w => w.status === 'ready').length,
    published: weddings.filter(w => w.status === 'published').length,
    archived: weddings.filter(w => w.status === 'archived').length,
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="luxe min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Weddings</h1>
              <p className="text-purple-100">Manage your wedding invitations</p>
            </div>
            
            {/* Credit Display */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Available Credits</span>
              </div>
              <div className="text-3xl font-bold">{adminCredits.available}</div>
              <div className="text-xs text-purple-100 mt-1">
                {adminCredits.used} used of {adminCredits.total} total
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => navigate('/admin/profile/new')}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Wedding
            </Button>
            
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-4 overflow-x-auto">
            {[
              { key: 'all', label: 'All Weddings' },
              { key: 'draft', label: 'Drafts' },
              { key: 'ready', label: 'Ready' },
              { key: 'published', label: 'Published' },
              { key: 'archived', label: 'Archived' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                  filterStatus === filter.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({statusCounts[filter.key]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading weddings...</p>
          </div>
        ) : weddings.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No weddings yet' : `No ${filterStatus} weddings`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all' 
                  ? 'Create your first wedding invitation to get started'
                  : `You don't have any weddings in ${filterStatus} status`}
              </p>
              {filterStatus === 'all' && (
                <Button
                  onClick={() => navigate('/admin/profile/new')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Wedding
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((wedding) => (
              <WeddingCard
                key={wedding.id}
                wedding={wedding}
                onPublish={() => handlePublish(wedding.id)}
                onArchive={() => handleArchive(wedding.id)}
                onView={() => handleView(wedding)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        weddingId={selectedWeddingId}
        onSuccess={handlePublishSuccess}
      />
    </div>
  );
};

export default WeddingDashboard;
