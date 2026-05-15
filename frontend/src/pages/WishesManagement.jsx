import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trash2, Filter, Heart, MessageSquare, Calendar } from 'lucide-react';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * PHASE 25: Guest Wishes Management
 * 
 * Admin interface to view and delete guest wishes for events
 */
function WishesManagement() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [wishes, setWishes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [stats, setStats] = useState({ total: 0, byEvent: {} });

  const fetchProfileAndWishes = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch profile
      const profileRes = await axios.get(`${BACKEND_URL}/api/admin/profiles/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileRes.data);
      setEvents(profileRes.data.events || []);

      // Fetch all wishes for all events in this profile
      const allWishes = [];
      const eventStats = {};
      
      for (const event of profileRes.data.events || []) {
        try {
          const wishesRes = await axios.get(`${BACKEND_URL}/api/events/${event.event_id}/wishes`);
          const eventWishes = wishesRes.data.wishes || [];
          
          // Add event info to each wish
          eventWishes.forEach(wish => {
            wish.event_name = event.event_type;
            wish.event_id = event.event_id;
          });
          
          allWishes.push(...eventWishes);
          eventStats[event.event_id] = eventWishes.length;
        } catch (err) {
          console.error(`Error fetching wishes for event ${event.event_id}:`, err);
        }
      }

      // Sort by created_at (newest first)
      allWishes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setWishes(allWishes);
      setStats({
        total: allWishes.length,
        byEvent: eventStats
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching wishes:', error);
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfileAndWishes();
  }, [fetchProfileAndWishes]);

  const handleDelete = async (wishId) => {
    if (!window.confirm('Are you sure you want to delete this wish? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${BACKEND_URL}/api/admin/wishes/${wishId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setWishes(prev => prev.filter(w => w.id !== wishId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (error) {
      console.error('Error deleting wish:', error);
      alert('Failed to delete wish. Please try again.');
    }
  };

  const filteredWishes = selectedEventId === 'all' 
    ? wishes 
    : wishes.filter(w => w.event_id === selectedEventId);

  if (loading) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading wishes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="luxe min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(`/admin/dashboard`)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">Guest Wishes Management</span>
            </div>
          </div>

          {profile && (
            <div className="border-t pt-4">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {profile.groom_name} & {profile.bride_name}
              </h1>
              <p className="text-gray-600 text-sm">
                Wedding Profile - {events.length} Event{events.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Wishes</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          {events.slice(0, 3).map((event) => (
            <div key={event.event_id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 capitalize">{event.event_type}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.byEvent[event.event_id] || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Events ({wishes.length})</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} ({stats.byEvent[event.event_id] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Wishes List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            Guest Wishes ({filteredWishes.length})
          </h2>

          {filteredWishes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 text-lg">
                {selectedEventId === 'all' ? 'No wishes yet' : 'No wishes for this event yet'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Wishes from guests will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWishes.map((wish) => (
                <div
                  key={wish.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50/30 to-pink-50/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {wish.emoji && (
                          <span className="text-3xl">{wish.emoji}</span>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{wish.guest_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                              {wish.event_name}
                            </span>
                            <span>•</span>
                            <span>{new Date(wish.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(wish.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed pl-11">
                        {wish.message}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(wish.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Delete wish"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
          <p className="text-sm text-gray-700 text-center">
            <span className="font-semibold">ℹ️ Note:</span> Guests are rate-limited to 5 wishes per day per IP address.
            Inappropriate content is automatically filtered.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WishesManagement;
