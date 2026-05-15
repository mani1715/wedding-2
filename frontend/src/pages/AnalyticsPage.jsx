import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Eye, Users, Globe, Clock, Smartphone, Monitor, Tablet, MapPin, CheckCircle, Music, Play, Pause } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AnalyticsPage = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch profile info
      const profileResponse = await axios.get(`${API_URL}/api/admin/profiles/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileResponse.data);

      // Fetch detailed analytics
      const analyticsResponse = await axios.get(`${API_URL}/api/admin/profiles/${profileId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(analyticsResponse.data);

      // Fetch summary with date range
      const summaryResponse = await axios.get(`${API_URL}/api/admin/profiles/${profileId}/analytics/summary?date_range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(summaryResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
      setLoading(false);
    }
  }, [profileId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHour = (hour) => {
    const h = parseInt(hour);
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };

  const getLanguageName = (code) => {
    const names = {
      'english': 'English',
      'telugu': 'Telugu',
      'tamil': 'Tamil',
      'kannada': 'Kannada',
      'malayalam': 'Malayalam',
      'hindi': 'Hindi'
    };
    return names[code] || code;
  };

  if (loading) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const dailyViewsData = analytics?.daily_views?.slice().reverse() || [];
  
  const hourlyData = Object.entries(analytics?.hourly_distribution || {})
    .map(([hour, count]) => ({
      hour: formatHour(hour),
      views: count
    }))
    .sort((a, b) => {
      const getHourValue = (str) => {
        const num = parseInt(str);
        const isPM = str.includes('PM');
        if (num === 12) return isPM ? 12 : 0;
        return isPM ? num + 12 : num;
      };
      return getHourValue(a.hour) - getHourValue(b.hour);
    });

  const languageData = Object.entries(analytics?.language_views || {})
    .map(([lang, count]) => ({
      language: getLanguageName(lang),
      views: count
    }));

  const deviceData = [
    { name: 'Mobile', value: analytics?.mobile_views || 0, color: '#10b981' },
    { name: 'Desktop', value: analytics?.desktop_views || 0, color: '#8b5cf6' },
    { name: 'Tablet', value: analytics?.tablet_views || 0, color: '#f59e0b' }
  ];

  const COLORS = ['#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="luxe min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              {profile && (
                <p className="text-gray-600 mt-1">
                  {profile.groom_name} & {profile.bride_name} - {profile.slug}
                </p>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="mt-4 md:mt-0">
              <div className="flex gap-2">
                {['7d', '30d', 'all'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      dateRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.total_views || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.unique_views || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Viewed Language</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summary?.most_viewed_language ? getLanguageName(summary.most_viewed_language) : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peak View Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summary?.peak_hour !== null ? formatHour(summary.peak_hour) : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">First Viewed</h3>
            <p className="text-gray-600">{formatDate(analytics?.first_viewed_at)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Viewed</h3>
            <p className="text-gray-600">{formatDate(analytics?.last_viewed_at)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Device Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Device Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <Smartphone className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.mobile_views || 0}</p>
              </div>
              <div className="text-center">
                <Monitor className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Desktop</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.desktop_views || 0}</p>
              </div>
              <div className="text-center">
                <Tablet className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                <p className="text-sm text-gray-600">Tablet</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.tablet_views || 0}</p>
              </div>
            </div>
            {deviceData.some(d => d.value > 0) && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deviceData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Language Usage */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Language Usage
            </h3>
            {languageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={languageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="language" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No language data yet</p>
            )}
          </div>
        </div>

        {/* Daily Views Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Daily Views Trend
          </h3>
          {dailyViewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyViewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Views" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No daily view data yet</p>
          )}
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Peak Viewing Hours
          </h3>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No hourly data yet</p>
          )}
        </div>

        {/* Interaction Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <MapPin className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Map Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.map_clicks || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">RSVP Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.rsvp_clicks || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Play className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Music Plays</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.music_plays || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
              <Pause className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Music Pauses</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.music_pauses || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
