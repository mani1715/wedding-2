import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { ArrowLeft, Save, Eye, ChevronDown, ChevronUp, Check, Upload, X, Star, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { getAllThemes } from '@/config/themeSystem';
import { DEITY_OPTIONS } from '@/config/religiousAssets';
import { LANGUAGES } from '@/utils/languageLoader';
import { 
  getEventBackgroundConfig, 
  allowsLordBackgrounds, 
  prohibitsLordBackgrounds,
  getDefaultBackgrounds 
} from '@/config/eventBackgroundConfig';
import RichTextEditor from '@/components/RichTextEditor';
import EventContentFields from '@/components/EventContentFields';
import EventDesignSelector from '@/components/EventDesignSelector';
import DesignSelector from '@/components/DesignSelector'; // PHASE 18
import BackgroundDesignSelector from '@/components/BackgroundDesignSelector'; // PHASE 22
import LordSettingsSelector from '@/components/LordSettingsSelector'; // PHASE 23
// PHASE 29E: Admin Safety Nets & Recovery
import useAutoSave from '@/hooks/useAutoSave';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import AutoSaveIndicator from '@/components/AutoSaveIndicator';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { PreviewPublishModal } from '@/components/PreviewPublishModal';
import VersionHistory from '@/components/VersionHistory';
// PHASE 32: Admin Action Security
import { DisableInvitationConfirm } from '@/components/DisableInvitationConfirm';
import { ExpireInvitationConfirm } from '@/components/ExpireInvitationConfirm';
// PHASE 33: Monetization & Feature Gating
import PlanBadge from '@/components/PlanBadge';
import LockedFeatureIndicator from '@/components/LockedFeatureIndicator';
import UpgradeModal from '@/components/UpgradeModal';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ProfileForm = () => {
  const navigate = useNavigate();
  const { profileId, weddingId } = useParams();
  const { admin } = useAuth();
  // Support both legacy profileId and new weddingId routes
  const editId = profileId || weddingId;
  const isEdit = !!editId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomText, setShowCustomText] = useState(false);
  const [whatsappErrors, setWhatsappErrors] = useState({
    groom: '',
    bride: ''
  });

  const [formData, setFormData] = useState({
    groom_name: '',
    bride_name: '',
    event_type: 'marriage',
    event_date: '',
    expires_at: '',  // PHASE 12: Invitation expiry date
    venue: '',
    city: '',
    invitation_message: '',
    language: ['english'],
    design_id: 'royal_red',
    deity_id: null,
    whatsapp_groom: '',
    whatsapp_bride: '',
    enabled_languages: ['english'],
    custom_text: {},
    about_couple: '',
    family_details: '',
    love_story: '',
    cover_photo_id: null,
    link_expiry_type: 'days',
    link_expiry_value: '30',
    sections_enabled: {
      opening: true,
      welcome: true,
      couple: true,
      about: false,
      family: false,
      love_story: false,
      photos: true,
      video: false,
      events: true,
      rsvp: false,
      greetings: true,
      footer: true,
      contact: false,
      calendar: false,
      countdown: false,
      qr: false
    },
    background_music: {
      enabled: false,
      file_url: null
    },
    map_settings: {
      embed_enabled: false
    },
    seo_settings: {
      seo_enabled: true,
      social_sharing_enabled: true,
      custom_description: ''
    },
    contact_info: {
      groom_phone: '',
      bride_phone: '',
      emergency_phone: '',
      email: ''
    },
    events: []
  });

  const [savedProfile, setSavedProfile] = useState(null);
  const [eventLinks, setEventLinks] = useState({});  // PHASE 13: Event-specific links
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // PHASE 29E: Admin Safety Nets & Recovery
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  // PHASE 32: Admin Action Security Confirmations
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [expireConfirmOpen, setExpireConfirmOpen] = useState(false);

  // PHASE 33: Feature Gating & Plan Management
  const [featureFlags, setFeatureFlags] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // PHASE 29E: Auto-save hook
  const { clearAutoSave, lastSaved, isSaving } = useAutoSave(
    `profile-form-${editId || 'new'}`,
    formData,
    (restoredData) => {
      // Restore data on page load
      if (window.confirm('Found unsaved changes. Would you like to restore them?')) {
        setFormData(restoredData);
        setHasUnsavedChanges(true);
      }
    },
    30000 // 30 seconds
  );

  // PHASE 29E: Unsaved changes warning
  useUnsavedChanges(hasUnsavedChanges);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }

    if (isEdit) {
      fetchProfile();
    }
  }, [admin, editId]);

  // PHASE 29E: Track form changes for unsaved changes warning
  useEffect(() => {
    if (initialFormData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/profiles/${editId}`);
      const profile = response.data;
      
      const profileData = {
        groom_name: profile.groom_name,
        bride_name: profile.bride_name,
        event_type: profile.event_type,
        event_date: new Date(profile.event_date).toISOString().split('T')[0],
        expires_at: profile.expires_at ? new Date(profile.expires_at).toISOString().split('T')[0] : '',  // PHASE 12
        venue: profile.venue,
        city: profile.city || '',
        invitation_message: profile.invitation_message || '',
        language: Array.isArray(profile.language) ? profile.language : [profile.language],
        design_id: profile.design_id || 'royal_red',
        deity_id: profile.deity_id || null,
        whatsapp_groom: profile.whatsapp_groom || '',
        whatsapp_bride: profile.whatsapp_bride || '',
        enabled_languages: profile.enabled_languages || ['english'],
        custom_text: profile.custom_text || {},
        about_couple: profile.about_couple || '',
        family_details: profile.family_details || '',
        love_story: profile.love_story || '',
        cover_photo_id: profile.cover_photo_id || null,
        link_expiry_type: profile.link_expiry_type,
        link_expiry_value: profile.link_expiry_value || '30',
        sections_enabled: profile.sections_enabled,
        background_music: profile.background_music || { enabled: false, file_url: null },
        map_settings: profile.map_settings || { embed_enabled: false },
        seo_settings: profile.seo_settings || { seo_enabled: true, social_sharing_enabled: true, custom_description: '' },
        contact_info: profile.contact_info || { groom_phone: '', bride_phone: '', emergency_phone: '', email: '' },
        events: profile.events || [],
        slug: profile.slug
      };
      
      setFormData(profileData);
      setInitialFormData(JSON.parse(JSON.stringify(profileData))); // PHASE 29E: Deep copy for comparison
      
      // PHASE 13: Store event-specific links
      setEventLinks(profile.event_links || {});
      setSavedProfile(profile);

      // Fetch photos for this profile
      await fetchPhotos(editId);

      // PHASE 33: Fetch feature flags for plan-based access control
      await fetchFeatureFlags(editId);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to load profile');
    }
  };

  // PHASE 33: Fetch feature flags to check plan access
  const fetchFeatureFlags = async (profId) => {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/${profId}/features`);
      setFeatureFlags(response.data);
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      // Default to no features enabled on error (safer)
      setFeatureFlags({
        background_music: false,
        hero_video: false,
        gallery_unlimited: false,
        gallery_limited: false,
        analytics_basic: false,
        analytics_advanced: false,
        ai_translation: false,
        ai_description: false,
        plan_type: 'FREE'
      });
    }
  };

  const fetchPhotos = async (profId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/profiles/${profId}/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotos(response.data.filter(m => m.media_type === 'photo'));
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  // PHASE 33: Helper functions for feature access checks
  const hasFeature = (feature) => {
    if (!featureFlags) return false;
    return featureFlags[feature] === true;
  };

  const getCurrentPlan = () => {
    return featureFlags?.plan_type || savedProfile?.plan_type || 'FREE';
  };

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgradeSuccess = async (updatedProfile) => {
    // Refresh profile and feature flags
    if (editId) {
      await fetchProfile();
    }
    setShowUpgradeModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => {
      const currentLangs = prev.language;
      const newLangs = currentLangs.includes(lang)
        ? currentLangs.filter(l => l !== lang)
        : [...currentLangs, lang];
      
      // Ensure at least one language is selected
      return {
        ...prev,
        language: newLangs.length > 0 ? newLangs : currentLangs
      };
    });
  };

  const handleEnabledLanguageToggle = (lang) => {
    setFormData(prev => {
      const currentLangs = prev.enabled_languages;
      
      // Prevent removing English (mandatory language)
      if (lang === 'english' && currentLangs.includes('english')) {
        return prev; // Cannot remove English
      }
      
      const newLangs = currentLangs.includes(lang)
        ? currentLangs.filter(l => l !== lang)
        : [...currentLangs, lang];
      
      // Ensure at least one language is enabled
      return {
        ...prev,
        enabled_languages: newLangs.length > 0 ? newLangs : currentLangs
      };
    });
  };

  const validateWhatsAppNumber = (number) => {
    if (!number || number.trim() === '') return true; // Optional field
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    return e164Pattern.test(number);
  };

  const handleWhatsAppChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate
    if (value && !validateWhatsAppNumber(value)) {
      setWhatsappErrors(prev => ({
        ...prev,
        [field === 'whatsapp_groom' ? 'groom' : 'bride']: 'Must be in E.164 format (e.g., +919876543210)'
      }));
    } else {
      setWhatsappErrors(prev => ({
        ...prev,
        [field === 'whatsapp_groom' ? 'groom' : 'bride']: ''
      }));
    }
  };

  const handleCustomTextChange = (language, section, value) => {
    setFormData(prev => ({
      ...prev,
      custom_text: {
        ...prev.custom_text,
        [language]: {
          ...(prev.custom_text[language] || {}),
          [section]: value
        }
      }
    }));
  };

  const handleExpiryPresetChange = (e) => {
    const preset = e.target.value;
    if (preset === 'custom') {
      setFormData(prev => ({
        ...prev,
        link_expiry_type: 'days',
        link_expiry_value: ''
      }));
    } else if (preset === '1day') {
      setFormData(prev => ({
        ...prev,
        link_expiry_type: 'days',
        link_expiry_value: '1'
      }));
    } else if (preset === '7days') {
      setFormData(prev => ({
        ...prev,
        link_expiry_type: 'days',
        link_expiry_value: '7'
      }));
    } else if (preset === '30days') {
      setFormData(prev => ({
        ...prev,
        link_expiry_type: 'days',
        link_expiry_value: '30'
      }));
    }
  };

  const getExpiryPreset = () => {
    if (formData.link_expiry_type === 'days') {
      if (formData.link_expiry_value === '1' || formData.link_expiry_value === 1) return '1day';
      if (formData.link_expiry_value === '7' || formData.link_expiry_value === 7) return '7days';
      if (formData.link_expiry_value === '30' || formData.link_expiry_value === 30) return '30days';
    }
    return 'custom';
  };

  const handleSectionToggle = (section) => {
    setFormData(prev => ({
      ...prev,
      sections_enabled: {
        ...prev.sections_enabled,
        [section]: !prev.sections_enabled[section]
      }
    }));
  };

  // Event Handlers
  const generateEventId = () => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addDefaultEvents = () => {
    // PHASE 13: Marriage-specific events with event_type
    const defaultEvents = [
      { name: 'Haldi', event_type: 'haldi', visible: true, show_lord: false, show_gantalu: false, show_fire: false },
      { name: 'Mehendi', event_type: 'mehendi', visible: true, show_lord: false, show_gantalu: false, show_fire: false },
      { name: 'Marriage', event_type: 'marriage', visible: true, show_lord: true, show_gantalu: true, show_fire: true },
      { name: 'Reception', event_type: 'reception', visible: true, show_lord: true, show_gantalu: true, show_fire: true }
    ];

    const newEvents = defaultEvents.map((evt, index) => ({
      event_id: generateEventId(),
      event_type: evt.event_type,
      name: evt.name,
      date: '',
      start_time: '',
      end_time: '',
      venue_name: '',
      venue_address: '',
      map_link: '',
      description: '',
      theme_id: null,  // Multi-event: Event-specific theme
      design_preset_id: null,  // Legacy support
      show_lord: evt.show_lord,
      show_gantalu: evt.show_gantalu,
      show_fire: evt.show_fire,
      event_content: {},  // Event-specific content fields
      music_enabled: false,  // PHASE 20: Background music
      music_file: null,  // PHASE 20: Music file path
      gallery_enabled: false,  // PHASE 21: Photo gallery
      gallery_images: [],  // PHASE 21: Gallery images
      background_design_id: null,  // PHASE 22: Premium design ID
      background_type: null,  // PHASE 22: Background rendering type
      color_palette: null,  // PHASE 22: Color scheme
      lord_enabled: true,  // PHASE 23: Lord image enabled
      lord_id: 'ganesha',  // PHASE 23: Default lord (Ganesha)
      lord_display_mode: 'hero_only',  // PHASE 23: Display mode
      lord_visibility_duration: 2,  // PHASE 23: Visibility duration
      hero_video_enabled: false,  // PHASE 24: Hero video enabled
      hero_video_url: null,  // PHASE 24: Hero video URL
      hero_video_thumbnail: null,  // PHASE 24: Hero video thumbnail
      message_video_enabled: false,  // PHASE 24: Message video enabled
      message_video_url: null,  // PHASE 24: Message video URL
      background_music_enabled: false,  // PHASE 24: Background music enabled
      background_music_url: null,  // PHASE 24: Background music URL
      visible: evt.visible,
      order: index
    }));

    setFormData(prev => ({
      ...prev,
      events: newEvents
    }));
  };

  const addEvent = () => {
    if (formData.events.length >= 7) {
      alert('Maximum 7 events allowed');
      return;
    }

    const newEvent = {
      event_id: generateEventId(),
      event_type: 'marriage',  // PHASE 13: Default event type
      name: '',
      date: '',
      start_time: '',
      end_time: '',
      venue_name: '',
      venue_address: '',
      map_link: '',
      description: '',
      theme_id: null,  // Multi-event: Event-specific theme
      design_preset_id: null,  // Legacy support
      show_lord: true,  // Default enabled for marriage
      show_gantalu: true,
      show_fire: true,
      event_content: {},  // Event-specific content fields
      music_enabled: false,  // PHASE 20: Background music
      music_file: null,  // PHASE 20: Music file path
      gallery_enabled: false,  // PHASE 21: Photo gallery
      gallery_images: [],  // PHASE 21: Gallery images
      background_design_id: null,  // PHASE 22: Premium design ID
      background_type: null,  // PHASE 22: Background rendering type
      color_palette: null,  // PHASE 22: Color scheme
      lord_enabled: true,  // PHASE 23: Lord image enabled
      lord_id: 'ganesha',  // PHASE 23: Default lord (Ganesha)
      lord_display_mode: 'hero_only',  // PHASE 23: Display mode
      lord_visibility_duration: 2,  // PHASE 23: Visibility duration
      hero_video_enabled: false,  // PHASE 24: Hero video enabled
      hero_video_url: null,  // PHASE 24: Hero video URL
      hero_video_thumbnail: null,  // PHASE 24: Hero video thumbnail
      message_video_enabled: false,  // PHASE 24: Message video enabled
      message_video_url: null,  // PHASE 24: Message video URL
      background_music_enabled: false,  // PHASE 24: Background music enabled
      background_music_url: null,  // PHASE 24: Background music URL
      visible: true,
      order: formData.events.length
    };

    setFormData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));
  };

  const updateEvent = (eventId, field, value) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.map(evt =>
        evt.event_id === eventId ? { ...evt, [field]: value } : evt
      )
    }));
  };

  const deleteEvent = (eventId) => {
    const visibleEvents = formData.events.filter(e => e.visible && e.event_id !== eventId);
    const eventToDelete = formData.events.find(e => e.event_id === eventId);
    
    if (visibleEvents.length === 0 && eventToDelete?.visible) {
      alert('At least one event must be visible');
      return;
    }

    // PHASE 29E: Show confirmation modal
    setDeleteConfirmation({
      open: true,
      type: 'event',
      itemId: eventId,
      itemName: eventToDelete?.name || 'Event',
      eventId: null
    });
  };
  
  const deleteEventConfirmed = (eventId) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter(evt => evt.event_id !== eventId)
    }));
  };

  const toggleEventVisibility = (eventId) => {
    const event = formData.events.find(e => e.event_id === eventId);
    if (!event) return;

    const visibleCount = formData.events.filter(e => e.visible).length;
    
    if (event.visible && visibleCount === 1) {
      alert('At least one event must be visible');
      return;
    }

    setFormData(prev => ({
      ...prev,
      events: prev.events.map(evt =>
        evt.event_id === eventId ? { ...evt, visible: !evt.visible } : evt
      )
    }));
  };

  const moveEvent = (eventId, direction) => {
    const index = formData.events.findIndex(e => e.event_id === eventId);
    if (index === -1) return;

    const newEvents = [...formData.events];
    
    if (direction === 'up' && index > 0) {
      [newEvents[index], newEvents[index - 1]] = [newEvents[index - 1], newEvents[index]];
    } else if (direction === 'down' && index < newEvents.length - 1) {
      [newEvents[index], newEvents[index + 1]] = [newEvents[index + 1], newEvents[index]];
    }

    // Update order numbers
    newEvents.forEach((evt, idx) => {
      evt.order = idx;
    });

    setFormData(prev => ({
      ...prev,
      events: newEvents
    }));
  };

  // PHASE 21: Gallery Upload Handlers
  const handleGalleryUpload = async (eventId, files) => {
    if (!files || files.length === 0) return;

    // PHASE 33: Check feature access (SILVER+ required for gallery)
    if (!hasFeature('gallery_limited') && !hasFeature('gallery_unlimited')) {
      alert('Gallery feature requires SILVER plan or higher. Please upgrade to unlock this feature.');
      handleUpgradeClick();
      return;
    }
    
    // Get current event
    const event = formData.events.find(e => e.event_id === eventId);
    const currentGalleryCount = event?.gallery_images?.length || 0;
    
    // Check total count
    if (currentGalleryCount + files.length > 20) {
      alert(`Gallery limit exceeded. Current: ${currentGalleryCount}, Trying to add: ${files.length}, Max: 20`);
      return;
    }
    
    // Validate each file
    for (let file of files) {
      // Validate file size (3 MB max)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 3) {
        alert(`File ${file.name} exceeds 3MB limit`);
        return;
      }
      
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`);
        return;
      }
    }
    
    try {
      const formDataToSend = new FormData();
      for (let file of files) {
        formDataToSend.append('files', file);
      }
      
      const response = await axios.post(
        `${API_URL}/api/admin/events/${eventId}/upload-gallery-images`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${admin.token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update local state with new gallery
      const currentGallery = event?.gallery_images || [];
      const newGallery = [...currentGallery, ...response.data.uploaded_images];
      updateEvent(eventId, 'gallery_images', newGallery);
      
      alert(`Uploaded ${response.data.uploaded_images.length} images successfully!`);
    } catch (err) {
      console.error('Gallery upload error:', err);
      alert(err.response?.data?.detail || 'Failed to upload gallery images');
    }
  };
  
  // PHASE 29E: State for delete confirmations
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    type: null, // 'event', 'gallery_image', 'hero_video', 'message_video', 'music'
    itemId: null,
    itemName: '',
    eventId: null
  });
  
  const handleGalleryImageDelete = async (eventId, imageId) => {
    // PHASE 29E: Show confirmation modal instead of window.confirm
    const event = formData.events.find(e => e.event_id === eventId);
    const image = event?.gallery_images?.find(img => img.id === imageId);
    
    setDeleteConfirmation({
      open: true,
      type: 'gallery_image',
      itemId: imageId,
      itemName: 'Gallery Image',
      eventId: eventId
    });
  };
  
  const confirmDelete = async () => {
    const { type, itemId, eventId } = deleteConfirmation;
    
    try {
      if (type === 'gallery_image') {
        await axios.delete(
          `${API_URL}/api/admin/events/${eventId}/gallery-images/${itemId}`,
          {
            headers: {
              'Authorization': `Bearer ${admin.token}`
            }
          }
        );
        
        // Update local state
        const event = formData.events.find(e => e.event_id === eventId);
        const updatedGallery = event.gallery_images.filter(img => img.id !== itemId);
        // Reorder
        updatedGallery.forEach((img, idx) => img.order = idx);
        updateEvent(eventId, 'gallery_images', updatedGallery);
        
        alert('Image deleted successfully!');
      } else if (type === 'event') {
        deleteEventConfirmed(itemId);
      } else if (type === 'hero_video') {
        await performDeleteHeroVideo(eventId);
      } else if (type === 'message_video') {
        await performDeleteMessageVideo(eventId);
      } else if (type === 'music') {
        await performDeleteMusic(eventId);
      } else if (type === 'photo') {
        await performDeletePhoto(itemId);
      }
      
      // Close modal
      setDeleteConfirmation({ open: false, type: null, itemId: null, itemName: '', eventId: null });
    } catch (err) {
      console.error(`Delete ${type} error:`, err);
      alert(err.response?.data?.detail || `Failed to delete ${type}`);
    }
  };
  
  const handleGalleryToggle = async (eventId, enabled) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/events/${eventId}/gallery-toggle`,
        { gallery_enabled: enabled },
        {
          headers: {
            'Authorization': `Bearer ${admin.token}`,
            'Content-Type': 'application/json'
          },
          params: { gallery_enabled: enabled }
        }
      );
      
      // Update local state
      updateEvent(eventId, 'gallery_enabled', enabled);
    } catch (err) {
      console.error('Gallery toggle error:', err);
      alert(err.response?.data?.detail || 'Failed to toggle gallery');
    }
  };
  
  const handleGalleryReorder = async (eventId, newOrder) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/events/${eventId}/reorder-gallery`,
        newOrder,
        {
          headers: {
            'Authorization': `Bearer ${admin.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Local state is already updated by drag-drop handler
    } catch (err) {
      console.error('Gallery reorder error:', err);
      alert(err.response?.data?.detail || 'Failed to reorder gallery');
    }
  };


  // PHASE 24: Video & Music Upload Handlers
  const handleHeroVideoUpload = async (eventId, file) => {
    if (!file) return;

    // PHASE 33: Check feature access (GOLD+ required)
    if (!hasFeature('hero_video')) {
      alert('Hero video feature requires GOLD plan or higher. Please upgrade to unlock this feature.');
      handleUpgradeClick();
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4 or WebM)');
      return;
    }

    // Validate file size (10MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      alert(`Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is 10MB.`);
      return;
    }

    // Show duration warning if available
    if (fileSizeMB > 5) {
      const proceed = window.confirm(
        `Video size is ${fileSizeMB.toFixed(2)}MB. For best performance, we recommend keeping hero videos 5-8 seconds (around 2-5MB). Continue anyway?`
      );
      if (!proceed) return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/admin/events/${eventId}/upload-hero-video`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update local state
      updateEvent(eventId, 'hero_video_url', response.data.video_url);
      updateEvent(eventId, 'hero_video_thumbnail', response.data.thumbnail_url);
      updateEvent(eventId, 'hero_video_enabled', true);

      alert('Hero video uploaded successfully!');
    } catch (err) {
      console.error('Hero video upload error:', err);
      alert(err.response?.data?.detail || 'Failed to upload hero video');
    }
  };

  const handleMessageVideoUpload = async (eventId, file) => {
    if (!file) return;

    // PHASE 33: Check feature access (GOLD+ required)
    if (!hasFeature('hero_video')) { // Message video uses same feature flag
      alert('Message video feature requires GOLD plan or higher. Please upgrade to unlock this feature.');
      handleUpgradeClick();
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4 or WebM)');
      return;
    }

    // Validate file size (10MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      alert(`Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is 10MB.`);
      return;
    }

    // Show duration warning if available
    if (fileSizeMB > 7) {
      const proceed = window.confirm(
        `Video size is ${fileSizeMB.toFixed(2)}MB. For best performance, we recommend keeping message videos under 30 seconds (around 5-7MB). Continue anyway?`
      );
      if (!proceed) return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/admin/events/${eventId}/upload-message-video`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update local state
      updateEvent(eventId, 'message_video_url', response.data.video_url);
      updateEvent(eventId, 'message_video_enabled', true);

      alert('Message video uploaded successfully!');
    } catch (err) {
      console.error('Message video upload error:', err);
      alert(err.response?.data?.detail || 'Failed to upload message video');
    }
  };

  const handleMusicUpload = async (eventId, file) => {
    if (!file) return;

    // PHASE 33: Check feature access (SILVER+ required)
    if (!hasFeature('background_music')) {
      alert('Background music feature requires SILVER plan or higher. Please upgrade to unlock this feature.');
      handleUpgradeClick();
      return;
    }

    // Validate file type
    if (!file.type.includes('audio/mpeg') && !file.type.includes('audio/mp3')) {
      alert('Please select a valid MP3 audio file');
      return;
    }

    // Validate file size (5MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      alert(`Music file is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is 5MB.`);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/admin/events/${eventId}/upload-music`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update local state
      updateEvent(eventId, 'background_music_url', response.data.music_url);
      updateEvent(eventId, 'background_music_enabled', true);

      alert('Background music uploaded successfully!');
    } catch (err) {
      console.error('Music upload error:', err);
      alert(err.response?.data?.detail || 'Failed to upload music');
    }
  };

  const handleDeleteHeroVideo = async (eventId) => {
    // PHASE 29E: Show confirmation modal
    setDeleteConfirmation({
      open: true,
      type: 'hero_video',
      itemId: null,
      itemName: 'Hero Video',
      eventId: eventId
    });
  };

  const performDeleteHeroVideo = async (eventId) => {
    const token = localStorage.getItem('adminToken');
    await axios.delete(
      `${API_URL}/api/admin/events/${eventId}/hero-video`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    // Update local state
    updateEvent(eventId, 'hero_video_url', null);
    updateEvent(eventId, 'hero_video_thumbnail', null);
    updateEvent(eventId, 'hero_video_enabled', false);

    alert('Hero video deleted successfully');
  };

  const handleDeleteMessageVideo = async (eventId) => {
    // PHASE 29E: Show confirmation modal
    setDeleteConfirmation({
      open: true,
      type: 'message_video',
      itemId: null,
      itemName: 'Message Video',
      eventId: eventId
    });
  };

  const performDeleteMessageVideo = async (eventId) => {
    const token = localStorage.getItem('adminToken');
    await axios.delete(
      `${API_URL}/api/admin/events/${eventId}/message-video`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    // Update local state
    updateEvent(eventId, 'message_video_url', null);
    updateEvent(eventId, 'message_video_enabled', false);

    alert('Message video deleted successfully');
  };

  const handleDeleteMusic = async (eventId) => {
    // PHASE 29E: Show confirmation modal
    setDeleteConfirmation({
      open: true,
      type: 'music',
      itemId: null,
      itemName: 'Background Music',
      eventId: eventId
    });
  };

  const performDeleteMusic = async (eventId) => {
    const token = localStorage.getItem('adminToken');
    await axios.delete(
      `${API_URL}/api/admin/events/${eventId}/music`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    // Update local state
    updateEvent(eventId, 'background_music_url', null);
    updateEvent(eventId, 'background_music_enabled', false);

    alert('Background music deleted successfully');
  };

  const handleToggleHeroVideo = async (eventId, enabled) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URL}/api/admin/events/${eventId}/toggle-hero-video?enabled=${enabled}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      updateEvent(eventId, 'hero_video_enabled', enabled);
    } catch (err) {
      console.error('Toggle hero video error:', err);
      alert(err.response?.data?.detail || 'Failed to toggle hero video');
    }
  };

  const handleToggleMessageVideo = async (eventId, enabled) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URL}/api/admin/events/${eventId}/toggle-message-video?enabled=${enabled}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      updateEvent(eventId, 'message_video_enabled', enabled);
    } catch (err) {
      console.error('Toggle message video error:', err);
      alert(err.response?.data?.detail || 'Failed to toggle message video');
    }
  };

  const handleToggleBackgroundMusic = async (eventId, enabled) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URL}/api/admin/events/${eventId}/toggle-music?enabled=${enabled}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      updateEvent(eventId, 'background_music_enabled', enabled);
    } catch (err) {
      console.error('Toggle music error:', err);
      alert(err.response?.data?.detail || 'Failed to toggle music');
    }
  };


  // PHASE 22: Background Design Handler
  const handleBackgroundDesignUpdate = (eventId, designData) => {
    // Update local state with new background design data
    updateEvent(eventId, 'background_design_id', designData.background_design_id);
    updateEvent(eventId, 'background_type', designData.background_type);
    updateEvent(eventId, 'color_palette', designData.color_palette);
  };

  // PHASE 25: Guest Engagement Settings Handler
  const handleEngagementToggle = async (eventId, settingType, value) => {
    if (!isEdit) {
      updateEvent(eventId, settingType, value);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const settings = {
        wishes_enabled: settingType === 'wishes_enabled' ? value : undefined,
        reactions_enabled: settingType === 'reactions_enabled' ? value : undefined,
        countdown_enabled: settingType === 'countdown_enabled' ? value : undefined
      };

      await axios.patch(
        `${API_URL}/api/admin/events/${eventId}/engagement-settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: settings
        }
      );

      updateEvent(eventId, settingType, value);
    } catch (error) {
      console.error('Failed to update engagement settings:', error);
      alert('Failed to update engagement settings. Please try again.');
    }
  };


  // Photo Management Functions
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (photos.length + files.length > 20) {
      alert('Maximum 20 photos allowed per profile');
      return;
    }

    if (!isEdit) {
      alert('Please save the profile first before uploading photos');
      return;
    }

    setUploadingPhoto(true);

    try {
      const token = localStorage.getItem('admin_token');
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum 5MB per file.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', '');

        const response = await axios.post(
          `${API_URL}/api/admin/profiles/${editId}/upload-photo`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setPhotos(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSetCoverPhoto = async (photoId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/api/admin/media/${photoId}/set-cover`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPhotos(prev => prev.map(p => ({
        ...p,
        is_cover: p.id === photoId
      })));

      setFormData(prev => ({
        ...prev,
        cover_photo_id: photoId
      }));
    } catch (error) {
      console.error('Failed to set cover photo:', error);
      alert('Failed to set cover photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    // PHASE 29E: Show confirmation modal
    const photo = photos.find(p => p.id === photoId);
    setDeleteConfirmation({
      open: true,
      type: 'photo',
      itemId: photoId,
      itemName: photo?.caption || 'Photo',
      eventId: null
    });
  };
  
  const performDeletePhoto = async (photoId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/api/admin/media/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPhotos(prev => prev.filter(p => p.id !== photoId));

      if (formData.cover_photo_id === photoId) {
        setFormData(prev => ({ ...prev, cover_photo_id: null }));
      }
      
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo');
    }
  };

  const handleUpdateCaption = async (photoId, caption) => {
    try {
      const token = localStorage.getItem('admin_token');
      const formDataPayload = new FormData();
      formDataPayload.append('caption', caption);

      await axios.put(
        `${API_URL}/api/admin/media/${photoId}/caption`,
        formDataPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, caption } : p
      ));
    } catch (error) {
      console.error('Failed to update caption:', error);
    }
  };

  const handleMovePhoto = (photoId, direction) => {
    const currentIndex = photos.findIndex(p => p.id === photoId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    // Swap photos
    const newPhotos = [...photos];
    [newPhotos[currentIndex], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[currentIndex]];
    setPhotos(newPhotos);

    // Update order on backend
    handleReorderPhotos(newPhotos.map(p => p.id));
  };

  const handleReorderPhotos = async (photoIds) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_URL}/api/admin/profiles/${editId}/reorder-media`,
        { media_ids: photoIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to reorder photos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // PHASE 29E: Show preview modal before publishing (only for new profiles or major updates)
    if (!isEdit || !savedProfile) {
      setShowPreviewModal(true);
      return;
    }
    
    // Proceed with actual submit
    await performSubmit();
  };

  // PHASE 29E: Actual submit logic separated for preview modal
  const performSubmit = async () => {
    setError('');

    // Validate WhatsApp numbers
    if (formData.whatsapp_groom && !validateWhatsAppNumber(formData.whatsapp_groom)) {
      setError('Groom WhatsApp number must be in E.164 format');
      return;
    }
    if (formData.whatsapp_bride && !validateWhatsAppNumber(formData.whatsapp_bride)) {
      setError('Bride WhatsApp number must be in E.164 format');
      return;
    }

    // Validate events if any exist
    if (formData.events.length > 0) {
      const visibleEvents = formData.events.filter(e => e.visible);
      if (visibleEvents.length === 0) {
        setError('At least one event must be visible');
        return;
      }

      // Validate required fields for all events
      for (const evt of formData.events) {
        if (!evt.name || !evt.date || !evt.start_time || !evt.venue_name || !evt.venue_address || !evt.map_link) {
          setError(`Please fill all required fields for event: ${evt.name || 'Unnamed'}`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,  // PHASE 12
        link_expiry_value: formData.link_expiry_value ? parseInt(formData.link_expiry_value) : 30,
        whatsapp_groom: formData.whatsapp_groom || null,
        whatsapp_bride: formData.whatsapp_bride || null,
        deity_id: formData.deity_id || null
      };

      let response;
      if (isEdit) {
        response = await axios.put(`${API_URL}/api/admin/profiles/${editId}`, submitData);
      } else {
        response = await axios.post(`${API_URL}/api/admin/profiles`, submitData);
        
        // PHASE 35: Apply referral code if this is first profile creation
        const referralCode = sessionStorage.getItem('referral_code');
        if (referralCode && response.data.id) {
          try {
            // Get device fingerprint (simple version)
            const deviceFingerprint = `${navigator.userAgent}_${screen.width}x${screen.height}`;
            
            await axios.post(`${API_URL}/api/referrals/apply`, {
              referral_code: referralCode,
              profile_id: response.data.id,
              device_fingerprint: deviceFingerprint
            });
            
            // Clear referral code after successful application
            sessionStorage.removeItem('referral_code');
            
            alert('Profile created successfully! Referral bonus applied - you earned 50 credits! 🎁');
          } catch (refError) {
            console.error('Failed to apply referral:', refError);
            // Don't block profile creation if referral fails
            alert('Profile created successfully! (Note: Referral code could not be applied)');
          }
        }
      }

      setSavedProfile(response.data);
      
      // PHASE 13: Update event links from response
      if (response.data.event_links) {
        setEventLinks(response.data.event_links);
      }
      
      // PHASE 29E: Clear auto-save and reset unsaved changes
      clearAutoSave();
      setHasUnsavedChanges(false);
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
      
      // Don't navigate immediately, show the generated link
      if (!isEdit) {
        alert('Profile created successfully! You can now preview the invitation or copy the link.');
      } else {
        alert('Profile updated successfully!');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      
      // Handle validation errors from backend (422 status)
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // If detail is an array of validation errors, format them nicely
        if (Array.isArray(detail)) {
          const errorMessages = detail.map(err => {
            const field = err.loc ? err.loc.join(' > ') : 'Unknown field';
            return `${field}: ${err.msg}`;
          }).join('; ');
          setError(errorMessages);
        } 
        // If detail is a string, use it directly
        else if (typeof detail === 'string') {
          setError(detail);
        }
        // If detail is an object, convert to string
        else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError('Failed to save profile. Please check all required fields.');
      }
    } finally {
      setLoading(false);
      setShowPreviewModal(false);
    }
  };

  const handlePreview = () => {
    const slug = savedProfile?.slug || (isEdit && formData.slug);
    if (slug) {
      window.open(`/invite/${slug}`, '_blank');
    } else {
      alert('Please save the profile first to generate a preview link.');
    }
  };

  const handleCopyLink = () => {
    const link = savedProfile?.invitation_link;
    if (link) {
      const fullLink = window.location.origin + link;
      navigator.clipboard.writeText(fullLink);
      alert('Link copied to clipboard!');
    }
  };

  // PHASE 32: Admin Action Security - Disable/Enable/Expire Handlers
  const handleDisableInvitation = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/api/admin/profiles/${editId}/disable`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invitation disabled successfully');
      fetchProfile(); // Refresh to show updated status
      setDisableConfirmOpen(false);
    } catch (error) {
      console.error('Failed to disable invitation:', error);
      alert(error.response?.data?.detail || 'Failed to disable invitation');
    }
  };

  const handleEnableInvitation = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/api/admin/profiles/${editId}/enable`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invitation enabled successfully');
      fetchProfile(); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to enable invitation:', error);
      alert(error.response?.data?.detail || 'Failed to enable invitation');
    }
  };

  const handleExpireInvitation = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/api/admin/profiles/${editId}/expire`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invitation expired successfully');
      fetchProfile(); // Refresh to show updated status
      setExpireConfirmOpen(false);
    } catch (error) {
      console.error('Failed to expire invitation:', error);
      alert(error.response?.data?.detail || 'Failed to expire invitation');
    }
  };

  const handleUnexpireInvitation = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/api/admin/profiles/${editId}/unexpire`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invitation expiration removed successfully');
      fetchProfile(); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to unexpire invitation:', error);
      alert(error.response?.data?.detail || 'Failed to unexpire invitation');
    }
  };


  return (
    <div className="luxe min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEdit ? 'Edit Profile' : 'Create New Profile'}
          </h1>
          {/* PHASE 29E: Version History Button */}
          {isEdit && editId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {showVersionHistory ? 'Hide' : 'Show'} Version History
            </Button>
          )}
        </div>

        {/* PHASE 29E: Version History Panel */}
        {isEdit && showVersionHistory && profileId && (
          <div className="mb-6">
            <VersionHistory 
              profileId={editId} 
              onRestore={() => {
                fetchProfile();
                setShowVersionHistory(false);
              }}
            />
          </div>
        )}

        {/* PHASE 32: Admin Action Security - Quick Actions */}
        {isEdit && editId && savedProfile && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-orange-50 to-purple-50 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-orange-600">⚡</span> Quick Admin Actions
              </h3>
              {/* PHASE 33: Current Plan Display */}
              {featureFlags && (
                <div className="flex items-center gap-2">
                  <PlanBadge plan={getCurrentPlan()} size="md" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUpgradeClick}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Manage Plan
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Disable/Enable Toggle */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${savedProfile.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    Status: {savedProfile.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                {savedProfile.is_active ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDisableConfirmOpen(true)}
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    🔒 Disable Invitation
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnableInvitation}
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  >
                    🔓 Enable Invitation
                  </Button>
                )}
              </div>

              {/* Expire/Unexpire Toggle */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Expiry: {savedProfile.expires_at ? new Date(savedProfile.expires_at) < new Date() ? '⏰ Expired' : '✓ Valid' : '∞ No Expiry'}
                  </span>
                </div>
                {!savedProfile.expires_at || new Date(savedProfile.expires_at) > new Date() ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExpireConfirmOpen(true)}
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    ⏰ Expire Now
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUnexpireInvitation}
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    🔄 Remove Expiry
                  </Button>
                )}
              </div>

              {/* Preview Link */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700 mb-1">Quick Preview</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  👁️ View Live
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 italic">
              ℹ️ Disabling makes invitation inaccessible. Expiring marks it as past event. Both preserve data.
            </p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Groom Name *
                  </label>
                  <input
                    type="text"
                    name="groom_name"
                    value={formData.groom_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
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
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  >
                    <option value="marriage">Marriage</option>
                    <option value="engagement">Engagement</option>
                    <option value="birthday">Birthday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                
                {/* PHASE 12: Invitation Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: Event Date + 7 days. After expiry, guests can view but cannot RSVP or submit wishes.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <textarea
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              {/* City and Invitation Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City or location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Welcome Message
                  <span className="text-xs text-gray-500 ml-2">
                    ({(formData.invitation_message || '').length}/200)
                  </span>
                </label>
                <textarea
                  name="invitation_message"
                  value={formData.invitation_message}
                  onChange={handleChange}
                  maxLength={200}
                  rows="2"
                  placeholder="A brief welcome message for your guests (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          </Card>

          {/* Design Theme Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Design Theme *</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getAllThemes().map((design) => (
                <div
                  key={design.themeId}
                  onClick={() => setFormData(prev => ({ ...prev, design_id: design.themeId }))}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                    formData.design_id === design.themeId
                      ? 'border-rose-500 bg-rose-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="aspect-video bg-gradient-to-br rounded-md mb-3 overflow-hidden" 
                       style={{
                         backgroundImage: `linear-gradient(to bottom right, ${design.colors.primary}, ${design.colors.secondary})`
                       }}>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">{design.name}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {design.hasLord && '🕉️ Religious '} 
                    {design.hasGantalu && '🔔 '} 
                    {design.hasFire && '🪔 '}
                  </div>
                  {formData.design_id === design.themeId && (
                    <div className="flex items-center text-rose-600 text-xs font-semibold">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Deity/Religious Background Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Religious Background (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a deity theme for your invitation, or choose "No Religious Theme" for a secular invitation
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {DEITY_OPTIONS.map((deity) => (
                <div
                  key={deity.id}
                  onClick={() => setFormData(prev => ({ ...prev, deity_id: deity.id === 'none' ? null : deity.id }))}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                    (formData.deity_id === deity.id || (deity.id === 'none' && !formData.deity_id))
                      ? 'border-rose-500 bg-rose-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                    <img 
                      src={deity.thumbnail} 
                      alt={deity.name}
                      className="w-full h-full object-contain rounded-md"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full items-center justify-center text-gray-400 text-xs" style={{display: 'none'}}>
                      {deity.name}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-gray-800 mb-1 text-center">{deity.name}</div>
                  <div className="text-xs text-gray-600 mb-2 text-center line-clamp-2">{deity.description}</div>
                  {(formData.deity_id === deity.id || (deity.id === 'none' && !formData.deity_id)) && (
                    <div className="flex items-center justify-center text-rose-600 text-xs font-semibold">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Language Configuration */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Language Configuration *</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select which languages guests can view the invitation in. English is mandatory and always enabled.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => {
                const isEnglish = lang.code === 'english';
                const isChecked = formData.enabled_languages.includes(lang.code);
                
                return (
                  <label 
                    key={lang.code} 
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all ${
                      isChecked
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200'
                    } ${isEnglish ? 'opacity-75' : 'cursor-pointer hover:border-gray-400'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => !isEnglish && handleEnabledLanguageToggle(lang.code)}
                      disabled={isEnglish}
                      className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {lang.name}
                        {isEnglish && <span className="ml-2 text-xs text-gray-500">(Required)</span>}
                      </div>
                      <div className="text-xs text-gray-600">{lang.nativeName}</div>
                    </div>
                    {isChecked && (
                      <Check className="w-4 h-4 text-rose-600" />
                    )}
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Rich Text Content Sections */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Content Sections</h2>
            <p className="text-sm text-gray-600 mb-6">
              Add optional rich text content sections to tell your story
            </p>
            
            <div className="space-y-6">
              {/* About Couple */}
              <RichTextEditor
                label="About the Couple"
                value={formData.about_couple}
                onChange={(html) => setFormData(prev => ({ ...prev, about_couple: html }))}
                enabled={formData.sections_enabled.about}
                onToggle={() => handleSectionToggle('about')}
              />

              {/* Family Details */}
              <RichTextEditor
                label="Family Details"
                value={formData.family_details}
                onChange={(html) => setFormData(prev => ({ ...prev, family_details: html }))}
                enabled={formData.sections_enabled.family}
                onToggle={() => handleSectionToggle('family')}
              />

              {/* Love Story */}
              <RichTextEditor
                label="Love Story"
                value={formData.love_story}
                onChange={(html) => setFormData(prev => ({ ...prev, love_story: html }))}
                enabled={formData.sections_enabled.love_story}
                onToggle={() => handleSectionToggle('love_story')}
              />
            </div>
          </Card>

          {/* Photo Gallery Management */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Photo Gallery</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload up to 20 photos. Max 5MB each. Images will be converted to WebP format.
            </p>

            {!isEdit && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Please save the profile first before uploading photos.
                </p>
              </div>
            )}

            {isEdit && (
              <>
                {/* Upload Button */}
                <div className="mb-6">
                  <label className={`inline-flex items-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    photos.length >= 20 || uploadingPhoto
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-rose-300 hover:border-rose-500 hover:bg-rose-50'
                  }`}>
                    <Upload className="w-5 h-5 mr-2 text-rose-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photos'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={photos.length >= 20 || uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    {photos.length}/20 photos uploaded
                  </p>
                </div>

                {/* Photos Grid */}
                {photos.length > 0 && (
                  <>
                    <p className="text-xs text-gray-600 mb-2">
                      Use the arrow buttons to reorder photos. Drag them to change display order on the invitation.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                          {/* Photo */}
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                            <img
                              src={`${API_URL}${photo.media_url}`}
                              alt={photo.caption || 'Wedding photo'}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Cover Badge */}
                          {photo.is_cover && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-semibold z-10">
                              <Star className="w-3 h-3" />
                              Cover
                            </div>
                          )}

                          {/* Reorder Buttons - Bottom Left */}
                          <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(photo.id, 'up')}
                              disabled={index === 0}
                              className={`p-1.5 bg-white rounded-full shadow-md ${
                                index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
                              }`}
                              title="Move left"
                            >
                              <ChevronLeft className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(photo.id, 'down')}
                              disabled={index === photos.length - 1}
                              className={`p-1.5 bg-white rounded-full shadow-md ${
                                index === photos.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
                              }`}
                              title="Move right"
                            >
                              <ChevronRight className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>

                          {/* Action Buttons - Top Right */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(photo.id)}
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-yellow-50"
                              title="Set as cover"
                            >
                              <Star className={`w-4 h-4 ${photo.is_cover ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50"
                              title="Delete"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>

                          {/* Caption */}
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                            placeholder="Add caption..."
                            className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {photos.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No photos uploaded yet. Click "Upload Photos" to add images.
                  </div>
                )}
              </>
            )}
          </Card>

          {/* WhatsApp Numbers */}
          <Card className="p-6">`

            <h2 className="text-xl font-semibold text-gray-800 mb-4">WhatsApp Contact Numbers (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Allow guests to send WhatsApp wishes directly. Include country code (e.g., +91 for India)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groom's WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp_groom}
                  onChange={(e) => handleWhatsAppChange('whatsapp_groom', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-rose-500 ${
                    whatsappErrors.groom ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {whatsappErrors.groom && (
                  <p className="text-xs text-red-600 mt-1">{whatsappErrors.groom}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Format: +[country code][number]</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bride's WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp_bride}
                  onChange={(e) => handleWhatsAppChange('whatsapp_bride', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-rose-500 ${
                    whatsappErrors.bride ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {whatsappErrors.bride && (
                  <p className="text-xs text-red-600 mt-1">{whatsappErrors.bride}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Format: +[country code][number]</p>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Provide contact details for guests to reach you. Phone numbers should include country code (e.g., +91 for India).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groom Family Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_info.groom_phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, groom_phone: e.target.value }
                  }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: +[country code][number]</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bride Family Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_info.bride_phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, bride_phone: e.target.value }
                  }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: +[country code][number]</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={formData.contact_info.emergency_phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, emergency_phone: e.target.value }
                  }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: +[country code][number]</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_info.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, email: e.target.value }
                  }))}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </Card>

          {/* Sections Enabled */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Enable/Disable Sections</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(formData.sections_enabled)
                .filter(section => section !== 'decorative_effects')  // Handle separately
                .map((section) => (
                <label key={section} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sections_enabled[section]}
                    onChange={() => handleSectionToggle(section)}
                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{section}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* PHASE 17: Decorative Effects Master Toggle */}
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Decorative Effects</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enable divine decorations for a premium first impression: lord images, temple bells (gantalu), 
                  oil lamps (dheepalu), and flower petals. Creates an unforgettable experience in the first 5 seconds.
                </p>
                
                <label className="flex items-center space-x-3 cursor-pointer bg-white rounded-lg p-4 border border-amber-300 hover:border-amber-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.sections_enabled.decorative_effects !== false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sections_enabled: {
                        ...prev.sections_enabled,
                        decorative_effects: e.target.checked
                      }
                    }))}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Enable Decorative Effects</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended for authentic Indian wedding experience
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {/* Background Music (Optional) */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Background Music (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add background music to your invitation. Music will NOT autoplay and guests can control playback.
            </p>
            
            {/* Enable/Disable Toggle */}
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.background_music.enabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  background_music: {
                    ...prev.background_music,
                    enabled: e.target.checked,
                    file_url: e.target.checked ? prev.background_music.file_url : null
                  }
                }))}
                className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Background Music</span>
            </label>

            {/* Music Upload Field */}
            {formData.background_music.enabled && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Music File URL *
                </label>
                <input
                  type="url"
                  value={formData.background_music.file_url || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    background_music: {
                      ...prev.background_music,
                      file_url: e.target.value
                    }
                  }))}
                  placeholder="https://example.com/wedding-music.mp3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500"
                  required={formData.background_music.enabled}
                />
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Supported format: MP3 only</p>
                  <p>• Maximum file size: 5MB recommended</p>
                  <p>• Music will play in a loop at 50% volume</p>
                  <p>• Guests can toggle music ON/OFF anytime</p>
                </div>
              </div>
            )}
          </Card>

          {/* Map Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Map Display Settings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Control how maps are displayed on the invitation page.
            </p>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.map_settings.embed_enabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  map_settings: {
                    ...prev.map_settings,
                    embed_enabled: e.target.checked
                  }
                }))}
                className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Map Embeds on Desktop</span>
            </label>
            
            <div className="mt-3 text-xs text-gray-600 space-y-1 ml-8">
              <p>• Map embeds will only show on desktop screens (≥768px)</p>
              <p>• Mobile devices will always show "Get Directions" link only</p>
              <p>• Maps are embedded below event information</p>
              <p>• Guests can still use the "Get Directions" link on all devices</p>
            </div>
          </Card>

          {/* PHASE 31: SEO & Social Sharing Settings */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">SEO & Social Sharing</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Control how your invitation appears in search engines and when shared on social media (WhatsApp, Facebook, Instagram).
                </p>
                
                {/* SEO Indexing Toggle */}
                <label className="flex items-center space-x-3 cursor-pointer bg-white rounded-lg p-4 border border-blue-300 hover:border-blue-400 transition-colors mb-3">
                  <input
                    type="checkbox"
                    checked={formData.seo_settings?.seo_enabled !== false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      seo_settings: {
                        ...prev.seo_settings,
                        seo_enabled: e.target.checked
                      }
                    }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Enable SEO Indexing</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Allow search engines to discover and index your invitation
                    </p>
                  </div>
                </label>

                {/* Social Sharing Toggle */}
                <label className="flex items-center space-x-3 cursor-pointer bg-white rounded-lg p-4 border border-blue-300 hover:border-blue-400 transition-colors mb-3">
                  <input
                    type="checkbox"
                    checked={formData.seo_settings?.social_sharing_enabled !== false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      seo_settings: {
                        ...prev.seo_settings,
                        social_sharing_enabled: e.target.checked
                      }
                    }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">Enable Social Sharing</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Show share buttons on the invitation page
                    </p>
                  </div>
                </label>

                {/* Custom Description */}
                <div className="bg-white rounded-lg p-4 border border-blue-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom SEO Description (Optional)
                  </label>
                  <textarea
                    value={formData.seo_settings?.custom_description || ''}
                    onChange={(e) => {
                      if (e.target.value.length <= 160) {
                        setFormData(prev => ({
                          ...prev,
                          seo_settings: {
                            ...prev.seo_settings,
                            custom_description: e.target.value
                          }
                        }));
                      }
                    }}
                    placeholder="Join us for a beautiful celebration of love and union..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    rows="3"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.seo_settings?.custom_description?.length || 0}/160 characters
                    {!formData.seo_settings?.custom_description && ' - Auto-generated if not provided'}
                  </p>
                </div>

                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p>• SEO helps guests find your invitation through search engines</p>
                  <p>• Social sharing creates beautiful previews on WhatsApp, Facebook, Instagram</p>
                  <p>• Admin pages are never indexed by search engines</p>
                  <p>• Expired invitations are automatically blocked from indexing</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Wedding Events Schedule */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Wedding Events Schedule</h2>
                <p className="text-sm text-gray-600 mt-1">Add multiple events (max 7). At least one event must be visible.</p>
              </div>
              {formData.events.length === 0 && (
                <Button
                  type="button"
                  onClick={addDefaultEvents}
                  variant="outline"
                  className="border-rose-500 text-rose-600 hover:bg-rose-50"
                >
                  Add Default Events
                </Button>
              )}
            </div>

            {formData.events.length > 0 && (
              <div className="space-y-4 mb-4">
                {formData.events.map((event, index) => (
                  <div key={event.event_id} className={`border rounded-lg p-4 ${!event.visible ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Event {index + 1}</span>
                        <label className="flex items-center space-x-1 text-xs">
                          <input
                            type="checkbox"
                            checked={event.visible}
                            onChange={() => toggleEventVisibility(event.event_id)}
                            className="w-3 h-3"
                          />
                          <span>Visible</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          onClick={() => moveEvent(event.event_id, 'up')}
                          disabled={index === 0}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => moveEvent(event.event_id, 'down')}
                          disabled={index === formData.events.length - 1}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => deleteEvent(event.event_id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Type *
                        </label>
                        <select
                          value={event.event_type || 'marriage'}
                          onChange={(e) => updateEvent(event.event_id, 'event_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        >
                          <option value="engagement">Engagement</option>
                          <option value="haldi">Haldi</option>
                          <option value="mehendi">Mehendi</option>
                          <option value="marriage">Marriage</option>
                          <option value="reception">Reception</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Name *
                        </label>
                        <input
                          type="text"
                          value={event.name}
                          onChange={(e) => updateEvent(event.event_id, 'name', e.target.value)}
                          placeholder="e.g., Mehendi Ceremony"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Date *
                        </label>
                        <input
                          type="date"
                          value={event.date}
                          onChange={(e) => updateEvent(event.event_id, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          value={event.start_time}
                          onChange={(e) => updateEvent(event.event_id, 'start_time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={event.end_time}
                          onChange={(e) => updateEvent(event.event_id, 'end_time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue Name *
                        </label>
                        <input
                          type="text"
                          value={event.venue_name}
                          onChange={(e) => updateEvent(event.event_id, 'venue_name', e.target.value)}
                          placeholder="e.g., Grand Ballroom, Hotel Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue Address *
                        </label>
                        <input
                          type="text"
                          value={event.venue_address}
                          onChange={(e) => updateEvent(event.event_id, 'venue_address', e.target.value)}
                          placeholder="Full address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Google Maps Link *
                        </label>
                        <input
                          type="url"
                          value={event.map_link}
                          onChange={(e) => updateEvent(event.event_id, 'map_link', e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (max 500 chars)
                        </label>
                        <textarea
                          value={event.description}
                          onChange={(e) => updateEvent(event.event_id, 'description', e.target.value)}
                          maxLength={500}
                          rows={2}
                          placeholder="Optional description of the event"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">{event.description?.length || 0}/500</p>
                      </div>
                      
                      {/* PHASE 14: Muhurtham Time - Mandatory for Marriage events */}
                      {event.event_type && event.event_type.toLowerCase() === 'marriage' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Muhurtham Time *
                            <span className="text-xs text-gray-500 ml-2">(Auspicious timing for marriage ceremony)</span>
                          </label>
                          <input
                            type="time"
                            value={event.muhurtham_time || ''}
                            onChange={(e) => updateEvent(event.event_id, 'muhurtham_time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            required
                          />
                          <p className="text-xs text-red-500 mt-1">Required for Marriage events</p>
                        </div>
                      )}
                      
                      {/* PHASE 14: Dress Code - Optional for Reception events */}
                      {event.event_type && event.event_type.toLowerCase() === 'reception' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dress Code
                            <span className="text-xs text-gray-500 ml-2">(Optional - e.g., Formal, Traditional, Cocktail)</span>
                          </label>
                          <input
                            type="text"
                            value={event.dress_code || ''}
                            onChange={(e) => updateEvent(event.event_id, 'dress_code', e.target.value)}
                            placeholder="e.g., Formal Attire, Traditional Indian Wear"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      )}
                      
                      {/* PHASE 14: Video Invitation Placeholder (not implemented yet) */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Video Invitation
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-2">Coming Soon</span>
                        </label>
                        <input
                          type="url"
                          value={event.video_invitation_url || ''}
                          onChange={(e) => updateEvent(event.event_id, 'video_invitation_url', e.target.value)}
                          placeholder="Video invitation URL (feature coming soon)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
                          disabled
                        />
                        <p className="text-xs text-gray-400 mt-1">Video invitation feature will be available in future updates</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Design Theme (Optional)
                        </label>
                        <select
                          value={event.theme_id || event.design_preset_id || ''}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            updateEvent(event.event_id, 'theme_id', value);
                            updateEvent(event.event_id, 'design_preset_id', value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Use Profile Default Theme</option>
                          {getAllThemes().map(theme => (
                            <option key={theme.themeId} value={theme.themeId}>{theme.name}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use profile's default design theme</p>
                      </div>
                      
                      {/* Divine Decoration Toggles - Multi-Event Feature */}
                      <div className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-amber-500 rounded"></span>
                          Divine Decorations
                        </h4>
                        {event.event_type && ['haldi', 'mehendi'].includes(event.event_type.toLowerCase()) ? (
                          <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
                            <p className="text-xs text-yellow-800">
                              <strong>Note:</strong> Divine decorations (Lord images, temple bells, fire lamps) are not available for {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} events.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-amber-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={event.show_lord !== false}
                                onChange={(e) => updateEvent(event.event_id, 'show_lord', e.target.checked)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Lord Images</span>
                            </label>
                            <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-amber-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={event.show_gantalu !== false}
                                onChange={(e) => updateEvent(event.event_id, 'show_gantalu', e.target.checked)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Temple Bells</span>
                            </label>
                            <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-amber-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={event.show_fire !== false}
                                onChange={(e) => updateEvent(event.event_id, 'show_fire', e.target.checked)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Fire Lamps</span>
                            </label>
                          </div>
                        )}
                        <p className="text-xs text-gray-600 mt-2">Control the display of traditional divine elements in this event invitation</p>
                      </div>
                      
                      {/* PHASE 20: Background Music Section */}
                      <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-blue-500 rounded"></span>
                          Background Music (Optional)
                        </h4>
                        
                        <div className="space-y-3">
                          {/* Music Enable Toggle */}
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={event.music_enabled || false}
                                onChange={(e) => {
                                  if (isEdit) {
                                    handleMusicToggle(event.event_id, e.target.checked);
                                  } else {
                                    updateEvent(event.event_id, 'music_enabled', e.target.checked);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable Background Music</span>
                            </label>
                          </div>
                          
                          {/* Music Upload/Display */}
                          {event.music_enabled && (
                            <div className="p-3 bg-white rounded-lg border border-blue-100">
                              {event.music_file ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                        <span className="text-blue-600 text-xs font-bold">🎵</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">Music Uploaded</p>
                                        <p className="text-xs text-gray-500">{event.music_file.split('/').pop()}</p>
                                      </div>
                                    </div>
                                    {isEdit && (
                                      <button
                                        type="button"
                                        onClick={() => handleMusicDelete(event.event_id)}
                                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                  <audio 
                                    controls 
                                    className="w-full h-8"
                                    src={`${API_URL}${event.music_file}`}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="block">
                                    <input
                                      type="file"
                                      accept=".mp3,audio/mpeg"
                                      onChange={(e) => {
                                        if (isEdit && e.target.files[0]) {
                                          handleMusicUpload(event.event_id, e.target.files[0]);
                                        }
                                      }}
                                      className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100
                                        cursor-pointer"
                                      disabled={!isEdit}
                                    />
                                  </label>
                                  <p className="text-xs text-gray-600 mt-2">
                                    Upload MP3 file only • Max size: 5 MB
                                    {!isEdit && ' • Save profile first to upload music'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2">
                          Add background music to enhance the invitation experience. Music will auto-play when guests visit the invitation page (browser permitting).
                        </p>
                      </div>
                      
                      {/* PHASE 21: Photo Gallery Upload Section */}
                      <div className="md:col-span-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-green-500 rounded"></span>
                          Event Photo Gallery (Phase 21) - Optional
                        </h4>
                        
                        <div className="space-y-3">
                          {/* Gallery Toggle */}
                          <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={event.gallery_enabled || false}
                                onChange={(e) => {
                                  if (isEdit) {
                                    handleGalleryToggle(event.event_id, e.target.checked);
                                  } else {
                                    updateEvent(event.event_id, 'gallery_enabled', e.target.checked);
                                  }
                                }}
                                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable Photo Gallery</span>
                            </label>
                          </div>
                          
                          {/* Gallery Upload/Display */}
                          {event.gallery_enabled && (
                            <div className="p-3 bg-white rounded-lg border border-green-100">
                              {/* Current Gallery Images */}
                              {event.gallery_images && event.gallery_images.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-gray-600 mb-2">
                                    Gallery Images ({event.gallery_images.length}/20)
                                  </p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {event.gallery_images.sort((a, b) => a.order - b.order).map((img) => (
                                      <div key={img.id} className="relative group">
                                        <img
                                          src={`${API_URL}${img.image_url}`}
                                          alt="Gallery"
                                          className="w-full h-20 object-cover rounded border border-gray-200"
                                        />
                                        {isEdit && (
                                          <button
                                            type="button"
                                            onClick={() => handleGalleryImageDelete(event.event_id, img.id)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Upload New Images */}
                              {(!event.gallery_images || event.gallery_images.length < 20) && (
                                <div>
                                  <label className="block">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        if (isEdit && e.target.files.length > 0) {
                                          handleGalleryUpload(event.event_id, Array.from(e.target.files));
                                        }
                                      }}
                                      className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-green-50 file:text-green-700
                                        hover:file:bg-green-100
                                        cursor-pointer"
                                      disabled={!isEdit}
                                    />
                                  </label>
                                  <p className="text-xs text-gray-600 mt-2">
                                    Upload images • Max 20 images • Max 3 MB per image • Auto-converts to WebP
                                    {!isEdit && ' • Save profile first to upload gallery'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2">
                          Add event photos to create a beautiful gallery. Images are optimized and lazy-loaded for best performance.
                        </p>
                      </div>
                      
                      {/* PHASE 22: Event Background & Design Engine */}
                      {isEdit && (
                        <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                          <BackgroundDesignSelector
                            event={event}
                            onDesignUpdate={(designData) => handleBackgroundDesignUpdate(event.event_id, designData)}
                            isEditMode={isEdit}
                          />
                        </div>
                      )}
                      
                      {/* PHASE 23: Lord Image Engine & Placement Rules */}
                      {isEdit && (
                        <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                          <LordSettingsSelector
                            eventId={event.event_id}
                            eventType={event.event_type}
                            currentSettings={{
                              lord_enabled: event.lord_enabled,
                              lord_id: event.lord_id,
                              lord_display_mode: event.lord_display_mode,
                              lord_visibility_duration: event.lord_visibility_duration
                            }}
                            onUpdate={(lordSettings) => {
                              updateEvent(event.event_id, 'lord_enabled', lordSettings.lord_enabled);
                              updateEvent(event.event_id, 'lord_id', lordSettings.lord_id);
                              updateEvent(event.event_id, 'lord_display_mode', lordSettings.lord_display_mode);
                              updateEvent(event.event_id, 'lord_visibility_duration', lordSettings.lord_visibility_duration);
                            }}
                            adminToken={localStorage.getItem('adminToken')}
                          />
                        </div>
                      )}
                      
                      {/* PHASE 25: Guest Engagement Engine */}
                      {isEdit && (
                        <div className="md:col-span-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <span className="w-1 h-6 bg-green-600 rounded"></span>
                            Guest Engagement (Phase 25)
                          </h4>
                          <p className="text-sm text-gray-600 mb-6">
                            Enable interactive features to increase guest engagement and time-on-page
                          </p>

                          <div className="space-y-4">
                            {/* Guest Wishes Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-800 mb-1">💬 Guest Wishes</h5>
                                <p className="text-xs text-gray-600">
                                  Allow guests to leave heartfelt wishes and messages (max 200 characters)
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={event.wishes_enabled !== false}
                                  onChange={(e) => handleEngagementToggle(event.event_id, 'wishes_enabled', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>

                            {/* Reaction Bar Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-800 mb-1">❤️ Quick Reactions</h5>
                                <p className="text-xs text-gray-600">
                                  Lightweight reaction bar (Love it, Blessings, Excited) - one per device
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={event.reactions_enabled !== false}
                                  onChange={(e) => handleEngagementToggle(event.event_id, 'reactions_enabled', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>

                            {/* Countdown Widget Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-800 mb-1">⏰ Event Countdown</h5>
                                <p className="text-xs text-gray-600">
                                  Display countdown timer with days, hours, and minutes until the event
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={event.countdown_enabled !== false}
                                  onChange={(e) => handleEngagementToggle(event.event_id, 'countdown_enabled', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">✨ Tip:</span> Enable all engagement features to maximize guest interaction and time-on-page!
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* PHASE 24: Video & Music Experience */}
                      {isEdit && (
                        <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-600 rounded"></span>
                            Video & Music Experience (Phase 24)
                          </h4>
                          <p className="text-sm text-gray-600 mb-6">
                            Add videos and background music to create an immersive, emotional invitation experience.
                          </p>

                          <div className="space-y-6">
                            {/* Hero Video */}
                            <div className="bg-white rounded-lg p-4 border border-purple-100 relative">
                              {/* PHASE 33: Locked feature overlay */}
                              {!hasFeature('hero_video') && featureFlags && (
                                <LockedFeatureIndicator
                                  feature="hero_video"
                                  currentPlan={getCurrentPlan()}
                                  onClick={handleUpgradeClick}
                                  variant="overlay"
                                />
                              )}
                              
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    Hero Background Video
                                    {/* PHASE 33: Show plan badge for locked feature */}
                                    {!hasFeature('hero_video') && featureFlags && (
                                      <span className="ml-2">
                                        <LockedFeatureIndicator
                                          feature="hero_video"
                                          currentPlan={getCurrentPlan()}
                                          onClick={handleUpgradeClick}
                                          variant="inline"
                                        />
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Looping video as hero background (5-8 seconds recommended, max 10MB)
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={event.hero_video_enabled || false}
                                    onChange={(e) => handleToggleHeroVideo(event.event_id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                              </div>

                              {event.hero_video_url ? (
                                <div className="space-y-3">
                                  <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                    <video
                                      src={`${API_URL}${event.hero_video_url}`}
                                      controls
                                      className="w-full max-h-48 object-cover"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <label className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      <span className="text-sm font-medium text-gray-700">Replace Video</span>
                                      <input
                                        type="file"
                                        accept="video/mp4,video/webm"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) handleHeroVideoUpload(event.event_id, file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHeroVideo(event.event_id)}
                                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 mb-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="mb-1 text-sm text-gray-600 font-medium">Click to upload hero video</p>
                                    <p className="text-xs text-gray-500">MP4 or WebM (MAX 10MB)</p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) handleHeroVideoUpload(event.event_id, file);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            {/* Message Video */}
                            <div className="bg-white rounded-lg p-4 border border-purple-100 relative">
                              {/* PHASE 33: Locked feature overlay */}
                              {!hasFeature('hero_video') && featureFlags && (
                                <LockedFeatureIndicator
                                  feature="hero_video"
                                  currentPlan={getCurrentPlan()}
                                  onClick={handleUpgradeClick}
                                  variant="overlay"
                                />
                              )}
                              
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    Message Video
                                    {/* PHASE 33: Show plan badge for locked feature */}
                                    {!hasFeature('hero_video') && featureFlags && (
                                      <span className="ml-2">
                                        <LockedFeatureIndicator
                                          feature="hero_video"
                                          currentPlan={getCurrentPlan()}
                                          onClick={handleUpgradeClick}
                                          variant="inline"
                                        />
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Personal video message from bride/groom (max 30 seconds, max 10MB)
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={event.message_video_enabled || false}
                                    onChange={(e) => handleToggleMessageVideo(event.event_id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                              </div>

                              {event.message_video_url ? (
                                <div className="space-y-3">
                                  <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                    <video
                                      src={`${API_URL}${event.message_video_url}`}
                                      controls
                                      className="w-full max-h-48 object-cover"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <label className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      <span className="text-sm font-medium text-gray-700">Replace Video</span>
                                      <input
                                        type="file"
                                        accept="video/mp4,video/webm"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) handleMessageVideoUpload(event.event_id, file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessageVideo(event.event_id)}
                                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 mb-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mb-1 text-sm text-gray-600 font-medium">Click to upload message video</p>
                                    <p className="text-xs text-gray-500">MP4 or WebM (MAX 10MB)</p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) handleMessageVideoUpload(event.event_id, file);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            {/* Background Music */}
                            <div className="bg-white rounded-lg p-4 border border-purple-100 relative">
                              {/* PHASE 33: Locked feature overlay */}
                              {!hasFeature('background_music') && featureFlags && (
                                <LockedFeatureIndicator
                                  feature="background_music"
                                  currentPlan={getCurrentPlan()}
                                  onClick={handleUpgradeClick}
                                  variant="overlay"
                                />
                              )}
                              
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    Background Music
                                    {/* PHASE 33: Show plan badge for locked feature */}
                                    {!hasFeature('background_music') && featureFlags && (
                                      <span className="ml-2">
                                        <LockedFeatureIndicator
                                          feature="background_music"
                                          currentPlan={getCurrentPlan()}
                                          onClick={handleUpgradeClick}
                                          variant="inline"
                                        />
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Ambient music for the invitation (MP3 only, max 5MB)
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={event.background_music_enabled || false}
                                    onChange={(e) => handleToggleBackgroundMusic(event.event_id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                              </div>

                              {event.background_music_url ? (
                                <div className="space-y-3">
                                  <div className="relative rounded-lg bg-gray-50 border border-gray-200 p-4">
                                    <audio
                                      src={`${API_URL}${event.background_music_url}`}
                                      controls
                                      className="w-full"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <label className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      <span className="text-sm font-medium text-gray-700">Replace Music</span>
                                      <input
                                        type="file"
                                        accept="audio/mpeg,audio/mp3"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) handleMusicUpload(event.event_id, file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMusic(event.event_id)}
                                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 mb-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                    <p className="mb-1 text-sm text-gray-600 font-medium">Click to upload background music</p>
                                    <p className="text-xs text-gray-500">MP3 only (MAX 5MB)</p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="audio/mpeg,audio/mp3"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) handleMusicUpload(event.event_id, file);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* PHASE 18: Event Design System */}
                      <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-purple-500 rounded"></span>
                          Event Design System (Phase 18)
                        </h4>
                        <DesignSelector
                          eventType={event.event_type}
                          selectedDesignId={event.phase18_design_id || event.design_type}
                          onDesignChange={(designId) => updateEvent(event.event_id, 'phase18_design_id', designId)}
                        />
                      </div>
                      
                      {/* PHASE 13 PART 2: Event-Specific Background Selector */}
                      <div className="md:col-span-2">
                        <EventBackgroundSelector 
                          eventType={event.event_type}
                          backgroundConfig={event.background_config}
                          onChange={(config) => updateEvent(event.event_id, 'background_config', config)}
                        />
                      </div>
                      
                      {/* Event-Type Specific Content Fields */}
                      <div className="md:col-span-2">
                        <EventContentFields
                          eventType={event.event_type}
                          eventContent={event.event_content || {}}
                          onChange={(content) => updateEvent(event.event_id, 'event_content', content)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* PHASE 13: Event-Specific Links Display */}
            {isEdit && Object.keys(eventLinks).length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Event-Specific Invitation Links</h3>
                <div className="space-y-2">
                  {Object.entries(eventLinks).map(([eventType, link]) => {
                    const eventTypeCapitalized = eventType.charAt(0).toUpperCase() + eventType.slice(1);
                    const fullLink = `${window.location.origin}${link}`;
                    return (
                      <div key={eventType} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                        <span className="text-sm font-medium text-gray-700">{eventTypeCapitalized}:</span>
                        <div className="flex items-center gap-2">
                          <a 
                            href={fullLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
                          >
                            {link}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(fullLink);
                              alert('Link copied to clipboard!');
                            }}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-blue-700 mt-2">Each event has its own invitation page with event-specific design and details</p>
              </div>
            )}

            <Button
              type="button"
              onClick={addEvent}
              disabled={formData.events.length >= 7}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              + Add Event {formData.events.length > 0 && `(${formData.events.length}/7)`}
            </Button>
          </Card>

          {/* Custom Text Overrides (Collapsible) */}
          <Card className="p-6">
            <div 
              onClick={() => setShowCustomText(!showCustomText)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Customize Text (Optional)</h2>
                <p className="text-sm text-gray-600 mt-1">Override default text templates for enabled languages</p>
              </div>
              {showCustomText ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            
            {showCustomText && (
              <div className="mt-6 space-y-6">
                {formData.enabled_languages.map((lang) => {
                  const langConfig = LANGUAGES.find(l => l.code === lang);
                  return (
                    <div key={lang} className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {langConfig?.name} ({langConfig?.nativeName})
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opening Title
                          </label>
                          <input
                            type="text"
                            value={formData.custom_text[lang]?.opening_title || ''}
                            onChange={(e) => handleCustomTextChange(lang, 'opening_title', e.target.value)}
                            placeholder="Leave empty to use default"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Welcome Message
                          </label>
                          <textarea
                            value={formData.custom_text[lang]?.welcome_message || ''}
                            onChange={(e) => handleCustomTextChange(lang, 'welcome_message', e.target.value)}
                            placeholder="Leave empty to use default"
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Footer Thank You Message
                          </label>
                          <input
                            type="text"
                            value={formData.custom_text[lang]?.footer_thankyou || ''}
                            onChange={(e) => handleCustomTextChange(lang, 'footer_thankyou', e.target.value)}
                            placeholder="Leave empty to use default"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Link Expiry */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Link Expiry Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Duration *
                </label>
                <select
                  value={getExpiryPreset()}
                  onChange={handleExpiryPresetChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="1day">1 Day</option>
                  <option value="7days">7 Days</option>
                  <option value="30days">30 Days (Default)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {getExpiryPreset() === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      name="link_expiry_type"
                      value={formData.link_expiry_type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      type="number"
                      name="link_expiry_value"
                      value={formData.link_expiry_value}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Generated Link Display */}
          {savedProfile && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Profile Saved Successfully!</h3>
              <p className="text-sm text-gray-700 mb-3">Your invitation link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin + savedProfile.invitation_link}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Copy Link
                </Button>
              </div>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : (isEdit ? 'Update Profile' : 'Save Profile')}
            </Button>
            {(savedProfile || isEdit) && (
              <Button
                type="button"
                onClick={handlePreview}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Invitation
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
              className="flex-1"
            >
              {savedProfile ? 'Back to Dashboard' : 'Cancel'}
            </Button>
          </div>
        </form>

        {/* PHASE 29E: Auto-Save Indicator */}
        <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />

        {/* PHASE 29E: Preview Before Publish Modal */}
        <PreviewPublishModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          onConfirm={async () => {
            await performSubmit();
            setShowPreviewModal(false);
          }}
          profileData={formData}
          previewUrl={savedProfile?.slug ? `/invite/${savedProfile.slug}` : null}
        />

        {/* PHASE 29E: Delete Confirmation Modal */}
        <DeleteConfirmModal
          open={deleteConfirmation.open}
          onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}
          onConfirm={confirmDelete}
          title={`Delete ${deleteConfirmation.type || 'Item'}`}
          description={`Are you sure you want to delete this ${deleteConfirmation.itemName.toLowerCase()}? This action cannot be undone and will permanently remove it from your invitation.`}
          itemName={deleteConfirmation.itemName}
          confirmText="Delete Permanently"
        />

        {/* PHASE 32: Admin Action Security - Disable Confirmation Modal */}
        <DisableInvitationConfirm
          open={disableConfirmOpen}
          onOpenChange={setDisableConfirmOpen}
          onConfirm={handleDisableInvitation}
          invitationName={savedProfile ? `${savedProfile.groom_name} & ${savedProfile.bride_name}` : ''}
        />

        {/* PHASE 32: Admin Action Security - Expire Confirmation Modal */}
        <ExpireInvitationConfirm
          open={expireConfirmOpen}
          onOpenChange={setExpireConfirmOpen}
          onConfirm={handleExpireInvitation}
          invitationName={savedProfile ? `${savedProfile.groom_name} & ${savedProfile.bride_name}` : ''}
          eventDate={savedProfile?.event_date}
        />

        {/* PHASE 33: Upgrade Plan Modal */}
        {isEdit && editId && featureFlags && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            currentPlan={getCurrentPlan()}
            profileId={editId}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        )}
      </div>
    </div>
  );
};

/**
 * EVENT-BASED BACKGROUND SELECTOR
 * Supports dual-layer backgrounds (hero + scroll) with event-specific rules
 */
const EventBackgroundSelector = ({ eventType, backgroundConfig, onChange }) => {
  const config = getEventBackgroundConfig(eventType);
  const [heroSelected, setHeroSelected] = useState(backgroundConfig?.hero_background_id || null);
  const [scrollSelected, setScrollSelected] = useState(backgroundConfig?.scroll_background_id || null);
  
  if (!config) return null;
  
  // Check if lord backgrounds are prohibited
  const lordProhibited = prohibitsLordBackgrounds(eventType);
  
  // Helper to render background cards
  const renderBackgroundCards = (bgList, layer) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
      {bgList.map((bg) => {
        const isSelected = layer === 'hero' ? heroSelected === bg.id : scrollSelected === bg.id;
        return (
          <div
            key={bg.id}
            onClick={() => {
              if (layer === 'hero') {
                setHeroSelected(bg.id);
                onChange({ 
                  ...backgroundConfig,
                  hero_background_id: bg.id,
                  scroll_background_id: scrollSelected 
                });
              } else {
                setScrollSelected(bg.id);
                onChange({ 
                  ...backgroundConfig,
                  hero_background_id: heroSelected,
                  scroll_background_id: bg.id 
                });
              }
            }}
            className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-lg ${
              isSelected ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-rose-300'
            }`}
          >
            <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
              <img
                src={bg.thumbnail || bg.images?.thumbnail}
                alt={bg.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            <div className="text-xs font-semibold text-gray-800 text-center">{bg.name}</div>
            <div className="text-xs text-gray-600 text-center line-clamp-2 mt-1">{bg.description}</div>
            {isSelected && (
              <div className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Event Backgrounds {lordProhibited && <span className="text-xs text-orange-600 font-normal">(Lord backgrounds disabled for {eventType})</span>}
        </label>
        <p className="text-xs text-gray-600">
          {config.hero.description}
        </p>
      </div>
      
      {/* Hero/Top Background */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-6 bg-rose-500 rounded"></div>
          <h4 className="font-semibold text-sm text-gray-800">{config.hero.label}</h4>
        </div>
        <p className="text-xs text-gray-600 mb-3">{config.hero.description}</p>
        {renderBackgroundCards(config.hero.options, 'hero')}
      </div>
      
      {/* Scroll Background */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-6 bg-purple-500 rounded"></div>
          <h4 className="font-semibold text-sm text-gray-800">{config.scroll.label}</h4>
        </div>
        <p className="text-xs text-gray-600 mb-3">{config.scroll.description}</p>
        {renderBackgroundCards(config.scroll.options, 'scroll')}
      </div>
      
      {/* Preview Info */}
      {(heroSelected || scrollSelected) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Selected:</strong> {heroSelected && `Hero (${heroSelected})`} {scrollSelected && `• Scroll (${scrollSelected})`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;
