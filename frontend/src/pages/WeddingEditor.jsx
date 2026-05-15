import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  Palette,
  Sparkles,
  Eye,
  Rocket
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const WeddingEditor = () => {
  const navigate = useNavigate();
  const { weddingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [wedding, setWedding] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    groom_name: '',
    bride_name: '',
    wedding_date: '',
    event_date: '',
    venue: '',
    selected_design_key: '',
    selected_features: []
  });

  const steps = [
    { id: 1, name: 'Basic Info', icon: FileText },
    { id: 2, name: 'Design', icon: Palette },
    { id: 3, name: 'Features', icon: Sparkles },
    { id: 4, name: 'Preview', icon: Eye }
  ];

  useEffect(() => {
    if (weddingId) {
      fetchWedding();
    } else {
      setLoading(false);
    }
  }, [weddingId]);

  const fetchWedding = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/weddings/${weddingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const w = response.data.wedding;
        setWedding(w);
        setFormData({
          title: w.title || '',
          description: w.description || '',
          slug: w.slug || '',
          groom_name: w.groom_name || '',
          bride_name: w.bride_name || '',
          wedding_date: w.wedding_date ? w.wedding_date.split('T')[0] : '',
          event_date: w.event_date ? w.event_date.split('T')[0] : '',
          venue: w.venue || '',
          selected_design_key: w.selected_design_key || '',
          selected_features: w.selected_features || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch wedding:', error);
      alert('Failed to load wedding');
      navigate('/admin/weddings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (weddingId) {
        // Update existing wedding
        const response = await axios.put(
          `${API_URL}/api/weddings/${weddingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          alert('Wedding saved successfully');
          fetchWedding();
        }
      } else {
        // Create new wedding
        const response = await axios.post(
          `${API_URL}/api/weddings`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          alert('Wedding created successfully');
          navigate(`/admin/weddings/${response.data.wedding_id}/edit`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.detail || 'Failed to save wedding');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = async () => {
    if (!weddingId) {
      alert('Please save the wedding first');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/weddings/${weddingId}/status`,
        { status: 'ready' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        alert('Wedding marked as ready!');
        fetchWedding();
      }
    } catch (error) {
      console.error('Error marking ready:', error);
      alert(error.response?.data?.detail || 'Failed to mark as ready');
    }
  };

  if (loading) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="luxe min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/admin/weddings')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {weddingId ? 'Edit Wedding' : 'Create Wedding'}
                </h1>
                {wedding && (
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={wedding.status} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              {wedding && wedding.status === 'draft' && (
                <Button
                  onClick={handleMarkReady}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Ready
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center gap-2 transition-colors ${
                      isActive
                        ? 'text-purple-600'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isActive
                          ? 'border-purple-600 bg-purple-50'
                          : isCompleted
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{step.name}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md border p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Rajesh & Priya's Wedding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{window.location.origin}/invite/</span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    disabled={!!weddingId}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="rajesh-priya-2024"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This will be your public wedding URL (cannot be changed later)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional wedding description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Groom Name *
                  </label>
                  <input
                    type="text"
                    name="groom_name"
                    value={formData.groom_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bride Name *
                  </label>
                  <input
                    type="text"
                    name="bride_name"
                    value={formData.bride_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Date
                  </label>
                  <input
                    type="date"
                    name="wedding_date"
                    value={formData.wedding_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Grand Hotel, Mumbai"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)}>
                  Next: Design Selection
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Design Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Design</h2>

              <div className="grid grid-cols-2 gap-4">
                {['royal-gold', 'modern-pink', 'classic-blue', 'elegant-purple'].map((design) => (
                  <button
                    key={design}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, selected_design_key: design }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.selected_design_key === design
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3"></div>
                    <p className="font-medium text-gray-900">{design}</p>
                    <p className="text-sm text-gray-500">10 credits</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>Next: Features</Button>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Features</h2>

              <div className="space-y-3">
                {['photo-gallery', 'rsvp-system', 'gift-registry', 'live-streaming'].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{feature}</p>
                      <p className="text-sm text-gray-500">5 credits</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.selected_features.includes(feature)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            selected_features: [...prev.selected_features, feature]
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            selected_features: prev.selected_features.filter((f) => f !== feature)
                          }));
                        }
                      }}
                      className="w-5 h-5"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(4)}>Next: Preview</Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview & Summary</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Wedding Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Title:</dt>
                      <dd className="text-gray-900 font-medium">{formData.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Couple:</dt>
                      <dd className="text-gray-900 font-medium">
                        {formData.groom_name} & {formData.bride_name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Venue:</dt>
                      <dd className="text-gray-900 font-medium">{formData.venue}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Design:</dt>
                      <dd className="text-gray-900 font-medium">{formData.selected_design_key}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Features:</dt>
                      <dd className="text-gray-900 font-medium">
                        {formData.selected_features.length} selected
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-2">Estimated Cost</h3>
                  <p className="text-2xl font-bold text-amber-900">
                    {10 + formData.selected_features.length * 5} credits
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Wedding'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeddingEditor;
