import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { Plus, LogOut, ExternalLink, Copy, Edit, Trash2, Calendar, Clock, Palette, Church, Languages, Users, Eye, Smartphone, Monitor, Download, BarChart, MessageCircle, QrCode, Save, FileText, List, Sparkles, Gift, Paintbrush } from 'lucide-react';
import { DESIGN_THEMES } from '@/config/designThemes';
import { DEITY_OPTIONS } from '@/config/religiousAssets';
import EventInvitationManager from '@/components/EventInvitationManager';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import PlanBadge from '@/components/PlanBadge';
import UpgradeModal from '@/components/UpgradeModal';
import PaymentHistory from '@/components/PaymentHistory';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});  // PHASE 7: Store analytics data
  const [managingEventInvitations, setManagingEventInvitations] = useState(null);  // NEW: Track which profile is managing event invitations
  
  // PHASE 29E: Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  
  // PHASE 33: Plan management state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedProfileForPlan, setSelectedProfileForPlan] = useState(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
    } else {
      fetchProfiles();
      fetchTemplates();
    }
  }, [admin]);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/profiles`);
      setProfiles(response.data);
      
      // PHASE 7: Fetch analytics for all profiles
      fetchAllAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  // PHASE 7: Fetch analytics for all profiles
  const fetchAllAnalytics = async (profilesList) => {
    const analyticsData = {};
    
    for (const profile of profilesList) {
      try {
        const response = await axios.get(`${API_URL}/api/admin/profiles/${profile.id}/analytics`);
        analyticsData[profile.id] = response.data;
      } catch (error) {
        console.debug('Failed to fetch analytics for profile:', profile.id);
        // Set default empty analytics if fetch fails
        analyticsData[profile.id] = {
          total_views: 0,
          mobile_views: 0,
          desktop_views: 0,
          last_viewed_at: null
        };
      }
    }
    
    setAnalytics(analyticsData);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const copyLink = (slug) => {
    const link = `${window.location.origin}/invite/${slug}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  // PHASE 13: Copy event-specific link
  const copyEventLink = (slug, eventType) => {
    const link = `${window.location.origin}/invite/${slug}/${eventType}`;
    navigator.clipboard.writeText(link);
    alert(`${eventType.charAt(0).toUpperCase() + eventType.slice(1)} link copied to clipboard!`);
  };

  // PHASE 29E: Initiate delete with confirmation modal
  const handleDelete = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    setProfileToDelete(profile);
    setShowDeleteConfirm(true);
  };

  // PHASE 29E: Confirm delete action
  const confirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      await axios.delete(`${API_URL}/api/admin/profiles/${profileToDelete.id}`);
      fetchProfiles();
      setShowDeleteConfirm(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Failed to delete profile');
    }
  };

  const handleDuplicate = async (profileId) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/profiles/${profileId}/duplicate`);
      const newProfile = response.data;
      
      // Redirect to edit page for the duplicated profile
      navigate(`/admin/profile/${newProfile.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate profile:', error);
      alert('Failed to duplicate profile. Please try again.');
    }
  };

  const handleSaveAsTemplate = async (profileId) => {
    if (!window.confirm('Save this profile as a template? It will be available for reuse when creating new profiles.')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/profiles/${profileId}/save-as-template`);
      alert('Profile saved as template successfully!');
      fetchTemplates();
      fetchProfiles();
    } catch (error) {
      console.error('Failed to save as template:', error);
      alert('Failed to save as template. Please try again.');
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/profiles/from-template/${templateId}`);
      const newProfile = response.data;
      
      // Redirect to edit page for the new profile
      navigate(`/admin/profile/${newProfile.id}/edit`);
    } catch (error) {
      console.error('Failed to create from template:', error);
      alert('Failed to create profile from template. Please try again.');
    }
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      marriage: 'Marriage',
      engagement: 'Engagement',
      birthday: 'Birthday'
    };
    return labels[type] || type;
  };

  const getDesignName = (designId) => {
    const design = DESIGN_THEMES.find(d => d.id === designId);
    return design ? design.name : designId;
  };

  const getDeityName = (deityId) => {
    if (!deityId) return 'No Religious Theme';
    const deity = DEITY_OPTIONS.find(d => d.id === deityId);
    return deity ? deity.name : 'Unknown';
  };

  const getExpiryInfo = (profile) => {
    if (profile.link_expiry_type === 'permanent') {
      return 'Permanent';
    }
    if (profile.link_expiry_date) {
      const expiryDate = new Date(profile.link_expiry_date);
      const now = new Date();
      if (expiryDate < now) {
        return 'Expired';
      }
      return `Expires ${expiryDate.toLocaleDateString()}`;
    }
    return 'N/A';
  };

  // PHASE 8: Download PDF invitation
  const handleDownloadPDF = async (profile) => {
    try {
      // Get the primary language (first in enabled_languages array)
      const language = profile.enabled_languages && profile.enabled_languages.length > 0 
        ? profile.enabled_languages[0] 
        : 'english';
      
      const response = await axios.get(
        `${API_URL}/api/admin/profiles/${profile.id}/download-pdf?language=${language}`,
        {
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const groomName = profile.groom_name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const brideName = profile.bride_name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      link.setAttribute('download', `wedding-invitation-${groomName}-${brideName}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };
  
  // PHASE 33: Handle plan upgrade
  const handleManagePlan = (profile) => {
    setSelectedProfileForPlan(profile);
    setShowUpgradeModal(true);
  };
  
  // PHASE 33: Handle upgrade success
  const handleUpgradeSuccess = () => {
    fetchProfiles(); // Refresh profiles to show updated plan
    setShowUpgradeModal(false);
    setSelectedProfileForPlan(null);
  };

  if (loading) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="luxe min-h-screen ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {admin?.name || admin?.email}</p>
              
              {/* PHASE 35: Credit Balance Display */}
              {admin?.role === 'admin' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Credits: <span className="text-purple-700 font-bold">{admin?.available_credits || 0}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    ({admin?.total_credits || 0} total / {admin?.used_credits || 0} used)
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {/* PHASE 37: Wedding Dashboard Link */}
              <Button
                onClick={() => navigate('/admin/weddings')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <List className="w-4 h-4 mr-2" />
                My Weddings
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/audit-logs')}
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Audit Logs
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-rose-500 text-rose-500 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Templates ({templates.length})
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-gray-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showTemplates ? 'Hide Templates' : 'Show Templates'}
              </Button>
            </div>

            {showTemplates && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {templates.map((template) => (
                  <Card key={template.id} className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-200 rounded">
                          TEMPLATE
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {template.groom_name} & {template.bride_name}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center text-xs">
                          <Palette className="w-4 h-4 mr-2" />
                          <span className="font-medium">{getDesignName(template.design_id)}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Church className="w-4 h-4 mr-2" />
                          <span>{getDeityName(template.deity_id)}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Languages className="w-4 h-4 mr-2" />
                          <span>
                            {template.enabled_languages 
                              ? `${template.enabled_languages.length} language${template.enabled_languages.length > 1 ? 's' : ''}` 
                              : 'English'}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCreateFromTemplate(template.id)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Use This Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800">
            Invitation Profiles ({profiles.length})
          </h2>
          <Button
            onClick={() => navigate('/admin/profile/new')}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Profile
          </Button>
        </div>

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">No profiles created yet</p>
            <Button
              onClick={() => navigate('/admin/profile/new')}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Create Your First Profile
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-rose-600 bg-rose-100 rounded">
                          {getEventTypeLabel(profile.event_type)}
                        </span>
                        {/* PHASE 33: Plan Badge */}
                        <PlanBadge plan={profile.plan_type || 'FREE'} size="sm" />
                      </div>
                      {!profile.is_active && (
                        <span className="text-xs text-gray-500">Inactive</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {profile.groom_name} & {profile.bride_name}
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(profile.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {getExpiryInfo(profile)}
                    </div>
                    <div className="flex items-center text-xs">
                      <Palette className="w-4 h-4 mr-2" />
                      <span className="font-medium">{getDesignName(profile.design_id)}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Church className="w-4 h-4 mr-2" />
                      <span>{getDeityName(profile.deity_id)}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Languages className="w-4 h-4 mr-2" />
                      <span>
                        {profile.enabled_languages 
                          ? `${profile.enabled_languages.length} language${profile.enabled_languages.length > 1 ? 's' : ''}` 
                          : Array.isArray(profile.language) 
                            ? profile.language.join(', ') 
                            : profile.language}
                      </span>
                    </div>
                  </div>

                  {/* PHASE 7: Analytics Display */}
                  {analytics[profile.id] && (
                    <div className="pt-3 pb-2 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded p-2">
                          <div className="flex items-center justify-center mb-1">
                            <Eye className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {analytics[profile.id].total_views}
                          </div>
                          <div className="text-xs text-blue-600">Total Views</div>
                        </div>
                        <div className="bg-green-50 rounded p-2">
                          <div className="flex items-center justify-center mb-1">
                            <Smartphone className="w-3 h-3 text-green-600" />
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            {analytics[profile.id].mobile_views}
                          </div>
                          <div className="text-xs text-green-600">Mobile</div>
                        </div>
                        <div className="bg-purple-50 rounded p-2">
                          <div className="flex items-center justify-center mb-1">
                            <Monitor className="w-3 h-3 text-purple-600" />
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            {analytics[profile.id].desktop_views}
                          </div>
                          <div className="text-xs text-purple-600">Desktop</div>
                        </div>
                      </div>
                      {analytics[profile.id].last_viewed_at && (
                        <div className="text-xs text-gray-500 text-center mt-2">
                          Last viewed: {new Date(analytics[profile.id].last_viewed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/invite/${profile.slug}`, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(profile.slug)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    
                    {/* PHASE 13: Event-Specific Links */}
                    {profile.events && profile.events.length > 0 && (
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Event Links ({profile.events.length})
                        </div>
                        <div className="space-y-1.5">
                          {profile.events
                            .filter(evt => evt.visible)
                            .sort((a, b) => a.order - b.order)
                            .map((evt) => (
                              <div key={evt.event_id} className="flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/invite/${profile.slug}/${evt.event_type}`, '_blank')}
                                  className="flex-1 text-xs bg-white hover:bg-gray-50 h-8"
                                  title={`View ${evt.name} invitation`}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {evt.name}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyEventLink(profile.slug, evt.event_type)}
                                  className="px-2 bg-white hover:bg-gray-50 h-8"
                                  title={`Copy ${evt.name} link`}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/edit`)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/rsvps`)}
                        className="flex-1"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        RSVPs
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(profile)}
                        className="flex-1 text-blue-600 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/analytics`)}
                        className="flex-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        <BarChart className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/qr-codes`)}
                        className="flex-1 text-teal-600 hover:bg-teal-50"
                        title="Generate QR Codes (Phase 28)"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Codes (Phase 28)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/greetings`)}
                        className="flex-1 text-purple-600 hover:bg-purple-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Greetings
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/wishes`)}
                        className="flex-1 text-pink-600 hover:bg-pink-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Wishes (Phase 25)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/post-wedding`)}
                        className="flex-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Post-Wedding (Phase 27)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/theme-settings`)}
                        className="flex-1 text-purple-600 hover:bg-purple-50"
                        title="Theme & Design Settings (Phase 34)"
                      >
                        <Paintbrush className="w-4 h-4 mr-1" />
                        Theme Settings
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${profile.id}/referrals`)}
                        className="flex-1 text-emerald-600 hover:bg-emerald-50"
                        title="Referrals & Credits (Phase 35)"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Referrals & Credits
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(profile.id)}
                        className="flex-1 text-blue-600 hover:bg-blue-50"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveAsTemplate(profile.id)}
                        className="flex-1 text-amber-600 hover:bg-amber-50"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save as Template
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setManagingEventInvitations({ id: profile.id, slug: profile.slug })}
                        className="flex-1 text-purple-600 hover:bg-purple-50"
                      >
                        <List className="w-4 h-4 mr-1" />
                        Event Invitations
                      </Button>
                    </div>
                    {/* PHASE 33: Manage Plan Button */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePlan(profile)}
                        className="flex-1 text-green-600 hover:bg-green-50 font-semibold"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Manage Plan
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
                        className="flex-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Event Invitation Manager Modal */}
        {managingEventInvitations && (
          <EventInvitationManager
            profileId={managingEventInvitations.id}
            profileSlug={managingEventInvitations.slug}
            onClose={() => setManagingEventInvitations(null)}
          />
        )}

        {/* PHASE 29E: Delete Confirmation Modal */}
        <DeleteConfirmModal
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={confirmDelete}
          title="Delete Profile"
          description="This will permanently delete the profile and all associated data including events, RSVPs, wishes, and analytics. This action cannot be undone."
          itemName={profileToDelete ? `${profileToDelete.groom_name} & ${profileToDelete.bride_name}` : null}
          confirmText="Delete Profile"
        />
        
        {/* PHASE 33: Upgrade Modal */}
        {selectedProfileForPlan && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => {
              setShowUpgradeModal(false);
              setSelectedProfileForPlan(null);
            }}
            currentPlan={selectedProfileForPlan.plan_type || 'FREE'}
            profileId={selectedProfileForPlan.id}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
