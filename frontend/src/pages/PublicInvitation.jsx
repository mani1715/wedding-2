import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Calendar, MapPin, Send, Languages, MessageCircle, Phone, Mail, Download, QrCode, Clock } from 'lucide-react';
import { getTheme, applyThemeVariables } from '@/config/themes';
import { getDeity, getDeityImage } from '@/config/religiousAssets';
import { getBackgroundById } from '@/config/eventBackgroundConfig';
import { LANGUAGES, loadLanguage, getText, getSectionText, preloadLanguages } from '@/utils/languageLoader';
import TempleOpening from '@/components/TempleOpening';
// PHASE 17: Hero Opening Sequence
import HeroOpeningSequence from '@/components/HeroOpeningSequence';
// PHASE 18: Event Design System
import DesignRenderer from '@/components/DesignRenderer';
import HeroOpeningDesign from '@/components/HeroOpeningDesign';
// PHASE 14: New components for UI completion
import LordVisibility from '@/components/LordVisibility';
import SectionBackgrounds from '@/components/SectionBackgrounds';
import FlowerOverlay from '@/components/FlowerOverlay';
// PHASE 15: Event Design System
import EventDesignBackground from '@/components/EventDesignBackground';
// PHASE 20: Background Music Player
import EventMusicPlayer from '@/components/EventMusicPlayer';
// PHASE 21: Event Photo Gallery
import EventGallery from '@/components/EventGallery';
// PHASE 22: Background & Design Engine
import BackgroundRenderer, { SectionBackground } from '@/components/BackgroundRenderer';
import EventBackgroundRenderer from '@/components/EventBackgroundRenderer';
// PHASE 24: Video & Music Experience
import HeroVideoBackground from '@/components/HeroVideoBackground';
import MessageVideoPlayer from '@/components/MessageVideoPlayer';

// PHASE 25: Guest Engagement Components
import CountdownWidget from '@/components/CountdownWidget';
import GuestWishes from '@/components/GuestWishes';
import ReactionBar from '@/components/ReactionBar';

// PHASE 27: Post-Wedding Memory Mode
import MemoryModeView from '@/components/MemoryModeView';

// PHASE 28: Viral Sharing & Growth Engine
import ShareButtons from '@/components/ShareButtons';
import BrandFooter from '@/components/BrandFooter';

// PHASE 29A: Performance Optimization Components
import LazyImage from '@/components/LazyImage';
import LazyVideo from '@/components/LazyVideo';
import ImageWithFallback from '@/components/ImageWithFallback';

// PHASE 29C: Error Handling & Fallback Components
import ExpiredInvitation from '@/components/ExpiredInvitation';
import LoadingFallback from '@/components/LoadingFallback';
import EmptyState from '@/components/EmptyState';

// PHASE 29D: Accessibility Components
import SkipToContent from '@/components/SkipToContent';

// PHASE 30: Analytics Tracking
import {
  trackPageView,
  trackGalleryOpened,
  trackVideoPlayed,
  trackMusicUnmuted,
  trackMapOpened,
  trackRSVPSubmitted,
  initScrollTracking,
  initTimeTracking,
} from '@/utils/analyticsTracker';

// PHASE 32: Security & Access Control
import PasscodeModal from '@/components/PasscodeModal';
import MathCaptcha from '@/components/MathCaptcha';

// PHASE 33: Monetization & Premium Plans
import WatermarkOverlay from '@/components/WatermarkOverlay';
// PHASE 35: Guest Referral CTA
import GuestReferralCTA from '@/components/GuestReferralCTA';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Deity Background Component - Progressive Loading Layer
const DeityBackground = ({ deityId }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  
  useEffect(() => {
    if (!deityId) return;
    
    const deity = getDeity(deityId);
    if (!deity || !deity.images) return;
    
    // Start with thumbnail
    const thumbnail = new Image();
    thumbnail.src = deity.images.thumbnail;
    thumbnail.onload = () => {
      setCurrentImage(deity.images.thumbnail);
      
      // Load mobile or desktop based on screen size
      const isMobile = window.innerWidth < 768;
      const nextImage = new Image();
      nextImage.src = isMobile ? deity.images.mobile : deity.images.desktop;
      nextImage.onload = () => {
        setCurrentImage(isMobile ? deity.images.mobile : deity.images.desktop);
        setImageLoaded(true);
      };
    };
  }, [deityId]);
  
  if (!deityId || !currentImage) {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.2,
        overflow: 'hidden'
      }}
    >
      <LazyImage
        src={currentImage}
        alt="Religious background"
        width="100%"
        height="100%"
        className="w-full h-full object-cover"
        style={{
          objectPosition: 'center',
          filter: imageLoaded ? 'none' : 'blur(10px)',
          transition: 'filter 0.3s ease-in-out'
        }}
      />
    </div>
  );
};

// DUAL-LAYER BACKGROUND COMPONENT
// Renders hero and scroll backgrounds with progressive loading
const DualLayerBackground = ({ backgroundConfig }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [scrollLoaded, setScrollLoaded] = useState(false);
  const [heroImage, setHeroImage] = useState(null);
  const [scrollImage, setScrollImage] = useState(null);
  
  // Track scroll position for background transitions
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Load hero background
  useEffect(() => {
    if (!backgroundConfig?.hero_background_id) return;
    
    const background = getBackgroundById(backgroundConfig.hero_background_id);
    if (!background?.images) return;
    
    const thumbnail = new Image();
    thumbnail.src = background.images.thumbnail;
    thumbnail.onload = () => {
      setHeroImage(background.images.thumbnail);
      
      const isMobile = window.innerWidth < 768;
      const fullImage = new Image();
      fullImage.src = isMobile ? background.images.mobile : background.images.desktop;
      fullImage.onload = () => {
        setHeroImage(isMobile ? background.images.mobile : background.images.desktop);
        setHeroLoaded(true);
      };
    };
  }, [backgroundConfig?.hero_background_id]);
  
  // Load scroll background
  useEffect(() => {
    if (!backgroundConfig?.scroll_background_id) return;
    
    const background = getBackgroundById(backgroundConfig.scroll_background_id);
    if (!background?.images) return;
    
    const thumbnail = new Image();
    thumbnail.src = background.images.thumbnail;
    thumbnail.onload = () => {
      setScrollImage(background.images.thumbnail);
      
      const isMobile = window.innerWidth < 768;
      const fullImage = new Image();
      fullImage.src = isMobile ? background.images.mobile : background.images.desktop;
      fullImage.onload = () => {
        setScrollImage(isMobile ? background.images.mobile : background.images.desktop);
        setScrollLoaded(true);
      };
    };
  }, [backgroundConfig?.scroll_background_id]);
  
  // Calculate opacity based on scroll position
  const heroOpacity = Math.max(0, 0.2 - (scrollPosition / 1000));
  const scrollOpacity = Math.min(0.2, (scrollPosition / 1000));
  
  return (
    <>
      {/* Hero Background Layer */}
      {heroImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
            opacity: heroOpacity,
            overflow: 'hidden',
            transition: 'opacity 0.3s ease-out'
          }}
        >
          <LazyImage
            src={heroImage}
            alt="Hero background"
            width="100%"
            height="100%"
            className="w-full h-full object-cover"
            priority={true}
            style={{
              objectPosition: 'center top',
              filter: heroLoaded ? 'none' : 'blur(10px)',
              transition: 'filter 0.3s ease-in-out'
            }}
          />
        </div>
      )}
      
      {/* Scroll Background Layer */}
      {scrollImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
            opacity: scrollOpacity,
            overflow: 'hidden',
            transition: 'opacity 0.3s ease-out'
          }}
        >
          <LazyImage
            src={scrollImage}
            alt="Scroll background"
            width="100%"
            height="100%"
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center',
              filter: scrollLoaded ? 'none' : 'blur(10px)',
              transition: 'filter 0.3s ease-in-out'
            }}
          />
        </div>
      )}
    </>
  );
};

// Legacy EventBackground component for backward compatibility
const EventBackground = ({ backgroundConfig }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  
  useEffect(() => {
    if (!backgroundConfig || !backgroundConfig.background_id) return;
    
    const background = getBackgroundById(backgroundConfig.background_id);
    if (!background || !background.images) return;
    
    // Progressive loading: thumbnail first
    const thumbnail = new Image();
    thumbnail.src = background.images.thumbnail;
    thumbnail.onload = () => {
      setCurrentImage(background.images.thumbnail);
      
      // Then load appropriate size
      const isMobile = window.innerWidth < 768;
      const nextImage = new Image();
      nextImage.src = isMobile ? background.images.mobile : background.images.desktop;
      nextImage.onload = () => {
        setCurrentImage(isMobile ? background.images.mobile : background.images.desktop);
        setImageLoaded(true);
      };
    };
  }, [backgroundConfig]);
  
  if (!backgroundConfig || !backgroundConfig.background_id || !currentImage) {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.2,
        overflow: 'hidden'
      }}
    >
      <LazyImage
        src={currentImage}
        alt="Event background"
        width="100%"
        height="100%"
        priority={false}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
        }}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};

const PublicInvitation = () => {
  const { slug, eventType } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // PHASE 29C: Track error type (404, 410, 400)
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [languageData, setLanguageData] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // PHASE 27: Memory Mode state
  const [isMemoryMode, setIsMemoryMode] = useState(false);
  const [memoryModeStatus, setMemoryModeStatus] = useState(null);
  
  // Music player state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [audioRef] = useState(new Audio());
  
  // RSVP state
  const [showRSVP, setShowRSVP] = useState(false);
  const [rsvpData, setRsvpData] = useState({
    guest_name: '',
    guest_phone: '',
    status: 'yes',
    guest_count: 1,
    message: ''
  });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [submittedRsvpStatus, setSubmittedRsvpStatus] = useState('');
  
  // PHASE 11: RSVP Check & Edit functionality
  const [checkingRsvp, setCheckingRsvp] = useState(false);
  const [existingRsvp, setExistingRsvp] = useState(null);
  const [canEditRsvp, setCanEditRsvp] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [checkPhone, setCheckPhone] = useState('');
  const [checkName, setCheckName] = useState(''); // PHASE 32: For name verification
  const [needsNameVerification, setNeedsNameVerification] = useState(false); // PHASE 32
  
  // PHASE 33: Plan info for watermark
  const [showWatermark, setShowWatermark] = useState(false);
  
  // PHASE 35: Referral code for guest CTA
  const [profileReferralCode, setProfileReferralCode] = useState(null);
  
  // PHASE 32: Security & Access Control
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [verifiedEvents, setVerifiedEvents] = useState(new Set()); // Track which events are verified
  
  // PHASE 32: CAPTCHA state
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaType, setCaptchaType] = useState(''); // 'rsvp' or 'wishes'

  useEffect(() => {
    fetchInvitation();
  }, [slug, eventType]);

  // PHASE 27: Check Memory Mode status when invitation loads
  useEffect(() => {
    if (invitation && slug) {
      checkMemoryMode();
    }
  }, [invitation, slug]);

  // PHASE 27: Check if invitation is in Memory Mode
  const checkMemoryMode = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/${slug}/memory-mode`);
      setMemoryModeStatus(response.data);
      setIsMemoryMode(response.data.is_memory_mode);
    } catch (error) {
      console.error('Failed to check memory mode:', error);
      setIsMemoryMode(false);
    }
  };

  // Apply theme and set default language when invitation loads
  useEffect(() => {
    if (invitation && invitation.design_id) {
      const theme = getTheme(invitation.design_id);
      applyThemeVariables(theme);
      
      // Load Google Fonts dynamically
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lora:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Libre+Baskerville:wght@400;700&family=Quicksand:wght@400;600;700&family=Nunito:wght@400;600;700&family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@400;600;700&family=UnifrakturMaguntia&family=Merriweather:wght@400;700&family=Raleway:wght@400;600;700&family=Inter:wght@400;600;700&family=Poppins:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Indie+Flower&family=Architects+Daughter&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Set default language with priority:
      // 1. User's saved preference (localStorage)
      // 2. Profile's main language (if enabled)
      // 3. First enabled language
      if (invitation.enabled_languages && invitation.enabled_languages.length > 0) {
        let defaultLang = invitation.enabled_languages[0];
        
        // Check for saved preference first
        const savedPreference = localStorage.getItem('preferredLanguage');
        if (savedPreference && invitation.enabled_languages.includes(savedPreference)) {
          defaultLang = savedPreference;
        } 
        // Otherwise use profile's language if it's enabled
        else if (invitation.language && invitation.enabled_languages.includes(invitation.language)) {
          defaultLang = invitation.language;
        }
        
        setSelectedLanguage(defaultLang);
        
        // Preload all enabled languages for faster switching
        preloadLanguages(invitation.enabled_languages).catch(err => {
          console.warn('Failed to preload languages:', err);
        });
        
        // Load default language immediately
        loadLanguage(defaultLang).then(setLanguageData).catch(err => {
          console.error('Failed to load language:', err);
        });
      }
    }
  }, [invitation]);
  
  // PHASE 30: Initialize analytics tracking when invitation loads
  useEffect(() => {
    if (invitation && invitation.id) {
      // Track page view
      const currentEventId = invitation.events?.find(e => e.event_type === eventType)?.id;
      trackPageView(invitation.id, currentEventId);
      
      // Initialize scroll depth tracking
      const cleanupScroll = initScrollTracking(invitation.id, currentEventId);
      
      // Initialize time tracking
      const cleanupTime = initTimeTracking(invitation.id, currentEventId);
      
      // Cleanup on unmount
      return () => {
        cleanupScroll();
        cleanupTime();
      };
    }
  }, [invitation, eventType]);
  
  // Load language data when selected language changes
  useEffect(() => {
    loadLanguage(selectedLanguage).then(setLanguageData).catch(err => {
      console.error('Failed to load language:', err);
    });
    
    // Store language preference in localStorage
    localStorage.setItem('preferredLanguage', selectedLanguage);
  }, [selectedLanguage]);

  // PHASE 32: Check if current event requires passcode
  const checkEventAccess = async () => {
    // Only check if we have event type
    if (!eventType || !invitation) return true;
    
    // Get current event
    const currentEvent = invitation.events?.find(e => e.event_type === eventType);
    if (!currentEvent) return true;
    
    // Check if already verified
    if (verifiedEvents.has(currentEvent.event_id || eventType)) {
      return true;
    }
    
    // Check visibility mode
    const visibilityMode = currentEvent.visibility_mode || 'public';
    
    // Public and unlisted don't need passcode
    if (visibilityMode === 'public' || visibilityMode === 'unlisted') {
      return true;
    }
    
    // Private requires passcode - show modal
    if (visibilityMode === 'private') {
      setShowPasscodeModal(true);
      return false;
    }
    
    return true;
  };
  
  // PHASE 32: Handle passcode verification
  const handlePasscodeVerify = async (passcode) => {
    if (!invitation || !eventType) return;
    
    const currentEvent = invitation.events?.find(e => e.event_type === eventType);
    if (!currentEvent) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/api/check-event-access`,
        {
          params: {
            event_id: currentEvent.event_id,
            passcode: passcode
          }
        }
      );
      
      if (response.data.allowed) {
        // Success! Mark event as verified
        setVerifiedEvents(prev => new Set([...prev, currentEvent.event_id || eventType]));
        setShowPasscodeModal(false);
        setPasscodeError('');
        setRemainingAttempts(5);
      } else {
        // Failed verification
        setPasscodeError(response.data.message || 'Incorrect passcode');
        setRemainingAttempts(response.data.remaining_attempts || 0);
        setBlockedUntil(response.data.blocked_until);
      }
    } catch (error) {
      console.error('Failed to verify passcode:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to verify passcode';
      setPasscodeError(errorMsg);
    }
  };
  
  // PHASE 32: Check if CAPTCHA is required before submission
  const checkCaptchaRequired = async (type) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/check-captcha-required`,
        {
          params: {
            slug: slug,
            endpoint: type
          }
        }
      );
      
      return response.data.requires_captcha;
    } catch (error) {
      console.error('Failed to check CAPTCHA requirement:', error);
      return false;
    }
  };

  const fetchInvitation = async () => {
    try {
      // PHASE 13: Use event-specific endpoint if eventType is present
      const url = eventType 
        ? `${API_URL}/api/invite/${slug}/${eventType}`
        : `${API_URL}/api/invite/${slug}`;
      
      const response = await axios.get(url);
      setInvitation(response.data);
      
      // PHASE 33: Fetch feature flags to check watermark requirement
      if (response.data?.profile_id) {
        try {
          const featuresResponse = await axios.get(`${API_URL}/api/profiles/${response.data.profile_id}/features`);
          setShowWatermark(featuresResponse.data.requires_watermark);
        } catch (err) {
          console.error('Failed to fetch feature flags:', err);
          // Default to showing watermark if fetch fails (safer approach)
          setShowWatermark(true);
        }
        
        // PHASE 35: Fetch referral code for guest CTA (non-blocking)
        try {
          const referralResponse = await axios.get(`${API_URL}/api/public/referral-code/${response.data.profile_id}`);
          if (referralResponse.data?.referral_code) {
            setProfileReferralCode(referralResponse.data.referral_code);
          }
        } catch (err) {
          // Silently fail - referral code is optional
          console.log('Referral code not available');
        }
      }
      
      // PHASE 32: Check event access (passcode if required)
      await checkEventAccess();
      
      // PHASE 7: Track view after content is fetched (privacy-first)
      trackInvitationView();
    } catch (error) {
      console.error('Failed to fetch invitation:', error);
      // PHASE 29C: Set error type for proper error page rendering
      if (error.response?.status === 410) {
        setError('This invitation link has expired.');
        setErrorType('410');
      } else if (error.response?.status === 404) {
        setError('Invitation not found.');
        setErrorType('404');
      } else if (error.response?.status === 400) {
        setError(error.response?.data?.detail || 'Invalid event type.');
        setErrorType('400');
      } else {
        setError('Failed to load invitation.');
        setErrorType('500');
      }
    } finally {
      setLoading(false);
    }
  };

  // PHASE 9: Generate or retrieve session ID
  const getSessionId = () => {
    const SESSION_KEY = `session_id_${slug}`;
    const EXPIRY_KEY = `session_expiry_${slug}`;
    
    const now = new Date().getTime();
    const existingSessionId = localStorage.getItem(SESSION_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    
    // Check if session is still valid (24 hours)
    if (existingSessionId && expiry && now < parseInt(expiry)) {
      return existingSessionId;
    }
    
    // Generate new session ID
    const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExpiry = now + (24 * 60 * 60 * 1000); // 24 hours
    
    localStorage.setItem(SESSION_KEY, newSessionId);
    localStorage.setItem(EXPIRY_KEY, newExpiry.toString());
    
    return newSessionId;
  };

  // PHASE 9: Track invitation view (session-based unique tracking)
  const trackInvitationView = () => {
    try {
      // Get or generate session ID
      const sessionId = getSessionId();
      
      // Detect device type (mobile, desktop, or tablet)
      const width = window.innerWidth;
      let deviceType;
      if (width < 768) {
        deviceType = 'mobile';
      } else if (width >= 768 && width < 1024) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }
      
      // Send view tracking request (non-blocking)
      axios.post(`${API_URL}/api/invite/${slug}/view`, {
        session_id: sessionId,
        device_type: deviceType
      }).catch(err => {
        // Silent fail - don't disrupt user experience
        console.debug('View tracking failed:', err);
      });
    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.debug('View tracking error:', error);
    }
  };

  // PHASE 9: Track language selection
  const trackLanguageView = (languageCode) => {
    try {
      const sessionId = getSessionId();
      
      axios.post(`${API_URL}/api/invite/${slug}/track-language`, {
        session_id: sessionId,
        language_code: languageCode
      }).catch(err => {
        console.debug('Language tracking failed:', err);
      });
    } catch (error) {
      console.debug('Language tracking error:', error);
    }
  };

  // PHASE 9: Track interactions (map clicks, RSVP clicks, music)
  const trackInteraction = (interactionType) => {
    try {
      const sessionId = getSessionId();
      
      axios.post(`${API_URL}/api/invite/${slug}/track-interaction`, {
        session_id: sessionId,
        interaction_type: interactionType
      }).catch(err => {
        console.debug('Interaction tracking failed:', err);
      });
    } catch (error) {
      console.debug('Interaction tracking error:', error);
    }
  };

  const handleSubmitGreeting = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      await axios.post(`${API_URL}/api/invite/${slug}/greetings`, {
        guest_name: guestName,
        message: message
      });

      setSubmitSuccess(true);
      setGuestName('');
      setMessage('');
      
      // Refresh invitation to show new greeting
      fetchInvitation();
    } catch (error) {
      console.error('Failed to submit greeting:', error);
      if (error.response?.status === 429) {
        alert('Too many wishes submitted. You can only submit 3 wishes per day. Please try again tomorrow.');
      } else if (error.response?.status === 410) {
        alert('This invitation link has expired.');
      } else if (error.response?.status === 403) {
        alert('This invitation has expired. Submitting wishes is no longer available.');
      } else {
        alert('Failed to submit greeting. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Music player logic
  useEffect(() => {
    if (!invitation || !invitation.background_music || !invitation.background_music.enabled) {
      return;
    }

    // Configure audio
    audioRef.src = invitation.background_music.file_url;
    audioRef.loop = true;
    audioRef.volume = 0.5;
    audioRef.preload = 'none';

    // Pause on page blur/tab change
    const handleVisibilityChange = () => {
      if (document.hidden && musicPlaying) {
        audioRef.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audioRef.pause();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [invitation]);

  const toggleMusic = () => {
    if (musicPlaying) {
      audioRef.pause();
      setMusicPlaying(false);
      // PHASE 9: Track music pause
      trackInteraction('music_pause');
    } else {
      audioRef.play().catch(err => {
        console.error('Failed to play audio:', err);
      });
      setMusicPlaying(true);
      // PHASE 9: Track music play
      trackInteraction('music_play');
      
      // PHASE 30: Track music unmuted
      if (invitation && invitation.id) {
        const currentEventId = invitation.events?.find(e => e.event_type === eventType)?.id;
        trackMusicUnmuted(invitation.id, currentEventId);
      }
    }
  };

  // PHASE 11 + PHASE 32: Check existing RSVP status with name verification
  const handleCheckRsvp = async (e) => {
    e.preventDefault();
    
    if (!checkPhone || checkPhone.trim().length === 0) {
      setRsvpError('Please enter your phone number');
      return;
    }

    setCheckingRsvp(true);
    setRsvpError('');

    try {
      // Step 1: Check if RSVP exists (without name - minimal data)
      if (!needsNameVerification) {
        const response = await axios.get(`${API_URL}/api/invite/${slug}/rsvp/check`, {
          params: { phone: checkPhone.trim() }
        });

        if (response.data.exists) {
          if (response.data.can_edit) {
            // RSVP exists and can be edited - require name verification
            setNeedsNameVerification(true);
            setCanEditRsvp(true);
            setHoursRemaining(Math.floor(response.data.hours_remaining || 0));
            setRsvpError(''); // Clear any previous errors
          } else {
            // RSVP exists but cannot be edited (48 hours passed)
            setRsvpError(`An RSVP already exists for this phone number. The editing window (48 hours) has expired.`);
            setCanEditRsvp(false);
            setNeedsNameVerification(false);
          }
        } else {
          // No existing RSVP - allow new submission
          setExistingRsvp(null);
          setCanEditRsvp(false);
          setIsEditMode(false);
          setNeedsNameVerification(false);
          setRsvpData(prev => ({ ...prev, guest_phone: checkPhone.trim() }));
        }
      } else {
        // Step 2: Verify with name to get full RSVP data
        if (!checkName || checkName.trim().length === 0) {
          setRsvpError('Please enter your name to verify ownership');
          setCheckingRsvp(false);
          return;
        }

        const response = await axios.get(`${API_URL}/api/invite/${slug}/rsvp/check`, {
          params: { 
            phone: checkPhone.trim(),
            guest_name: checkName.trim()
          }
        });

        if (response.data.rsvp) {
          // Name verified - return full RSVP data
          setExistingRsvp(response.data.rsvp);
          setCanEditRsvp(true);
          setHoursRemaining(Math.floor(response.data.hours_remaining || 0));
          
          // Pre-fill form with existing data for editing
          setRsvpData({
            guest_name: response.data.rsvp.guest_name,
            guest_phone: response.data.rsvp.guest_phone,
            status: response.data.rsvp.status,
            guest_count: response.data.rsvp.guest_count,
            message: response.data.rsvp.message || ''
          });
          setIsEditMode(true);
          setNeedsNameVerification(false);
        } else if (response.data.error) {
          // Name verification failed
          setRsvpError('Name verification failed. Please ensure you enter the exact name used when submitting the RSVP.');
          setNeedsNameVerification(true); // Keep in verification mode
        }
      }
    } catch (error) {
      console.error('Failed to check RSVP:', error);
      setRsvpError('Failed to check RSVP status. Please try again.');
      setNeedsNameVerification(false);
    } finally {
      setCheckingRsvp(false);
    }
  };

  // RSVP submission (create or update)
  const handleSubmitRSVP = async (e) => {
    e.preventDefault();
    
    // Check if online
    if (!navigator.onLine) {
      setRsvpError('Internet connection required to submit RSVP');
      return;
    }

    setRsvpSubmitting(true);
    setRsvpError('');

    try {
      if (isEditMode && existingRsvp) {
        // Update existing RSVP
        await axios.put(`${API_URL}/api/rsvp/${existingRsvp.id}`, rsvpData);
        setRsvpSuccess(true);
        setSubmittedRsvpStatus(rsvpData.status);
      } else {
        // Create new RSVP
        await axios.post(`${API_URL}/api/rsvp?slug=${slug}`, rsvpData);
        setRsvpSuccess(true);
        setSubmittedRsvpStatus(rsvpData.status);
        
        // PHASE 30: Track RSVP submission
        if (invitation && invitation.id) {
          const currentEventId = invitation.events?.find(e => e.event_type === eventType)?.id;
          trackRSVPSubmitted(invitation.id, currentEventId);
        }
      }
      
      // Reset states
      setRsvpData({
        guest_name: '',
        guest_phone: '',
        status: 'yes',
        guest_count: 1,
        message: ''
      });
      setShowRSVP(false);
      setExistingRsvp(null);
      setIsEditMode(false);
      setCheckPhone('');
    } catch (error) {
      console.error('Failed to submit RSVP:', error);
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.detail || 'You have already submitted an RSVP';
        setRsvpError(errorMsg);
      } else if (error.response?.status === 403) {
        setRsvpError('Cannot edit RSVP after 48 hours of submission');
      } else if (error.response?.status === 410) {
        setRsvpError('This invitation link has expired');
      } else if (error.response?.status === 429) {
        setRsvpError('Too many RSVP attempts. Please try again tomorrow.');
      } else {
        setRsvpError('Failed to submit RSVP. Please try again.');
      }
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // PHASE 29C: Show loading fallback with skeleton
  if (loading) {
    return <LoadingFallback variant="page" />;
  }

  // PHASE 29C: Show error page with proper error type
  if (error) {
    return <ExpiredInvitation errorType={errorType} message={error} />;
  }

  const eventDate = new Date(invitation.event_date);
  
  // Get available languages for this invitation
  const availableLanguages = invitation.enabled_languages || ['english'];
  
  // Get text helper functions with custom text and fallback
  const customText = invitation.custom_text || {};
  
  const getT = (section, key) => {
    // Check custom text first
    if (customText[selectedLanguage]?.[`${section}.${key}`]) {
      return customText[selectedLanguage][`${section}.${key}`];
    }
    
    // Get from loaded language data
    if (languageData?.[section]?.[key]) {
      return languageData[section][key];
    }
    
    // Fallback to key
    return key;
  };
  
  const getSectionT = (section) => {
    const sectionData = languageData?.[section] || {};
    
    // Merge with custom text
    const result = { ...sectionData };
    
    if (customText[selectedLanguage]) {
      Object.keys(customText[selectedLanguage]).forEach(customKey => {
        if (customKey.startsWith(`${section}.`)) {
          const key = customKey.replace(`${section}.`, '');
          result[key] = customText[selectedLanguage][customKey];
        }
      });
    }
    
    return result;
  };

  // Generate WhatsApp URL with pre-filled message
  const generateWhatsAppURL = (phoneNumber) => {
    if (!phoneNumber) return null;
    
    // Get default message in selected language
    const defaultMessage = getT('whatsapp', 'defaultMessage');
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(defaultMessage);
    
    // Generate wa.me URL
    return `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
  };
  
  // Show loading if language data not loaded yet
  if (!languageData && !error) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background, #FFF8E7)' }}>
        <p style={{ color: 'var(--color-text, #4A3728)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* PHASE 31: SEO Meta Tags */}
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{`Wedding of ${invitation.bride_name} & ${invitation.groom_name}${eventType ? ` | ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}` : ''}`}</title>
        
        {/* SEO Description */}
        <meta 
          name="description" 
          content={
            invitation.seo_settings?.custom_description || 
            `Join us in celebrating the wedding of ${invitation.bride_name} and ${invitation.groom_name}. ${invitation.invitation_message || ''}`
          } 
        />
        
        {/* Keywords */}
        <meta 
          name="keywords" 
          content={`${invitation.bride_name}, ${invitation.groom_name}, wedding, ${eventType || 'marriage'}, invitation`} 
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${window.location.origin}/invite/${slug}${eventType ? `/${eventType}` : ''}`} />
        
        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Wedding of ${invitation.bride_name} & ${invitation.groom_name}`} />
        <meta 
          property="og:description" 
          content={
            invitation.seo_settings?.custom_description || 
            `Join us in celebrating the wedding of ${invitation.bride_name} and ${invitation.groom_name}. ${invitation.invitation_message || ''}`
          } 
        />
        <meta property="og:url" content={`${window.location.origin}/invite/${slug}${eventType ? `/${eventType}` : ''}`} />
        
        {/* OG Image - Use cover photo if available, fallback to placeholder */}
        {invitation.cover_photo_id && invitation.media && (() => {
          const coverPhoto = invitation.media.find(m => m.id === invitation.cover_photo_id);
          return coverPhoto ? (
            <meta property="og:image" content={`${API_URL}${coverPhoto.media_url}`} />
          ) : null;
        })()}
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Wedding of ${invitation.bride_name} & ${invitation.groom_name}`} />
        <meta 
          name="twitter:description" 
          content={
            invitation.seo_settings?.custom_description || 
            `Join us in celebrating the wedding of ${invitation.bride_name} and ${invitation.groom_name}.`
          } 
        />
        
        {/* Robots Meta - Control indexing based on settings and expiry */}
        {(() => {
          const isExpired = invitation.expires_at && new Date(invitation.expires_at) < new Date();
          const seoEnabled = invitation.seo_settings?.seo_enabled !== false; // Default true
          
          if (isExpired || !seoEnabled) {
            return <meta name="robots" content="noindex, nofollow" />;
          }
          return <meta name="robots" content="index, follow" />;
        })()}
      </Helmet>
      
      {/* PHASE 29D: Skip to Content Link */}
      <SkipToContent />
      
      {/* PHASE 14: Section-based background switching */}
      <SectionBackgrounds 
        eventType={eventType || 'marriage'} 
        backgroundConfig={(() => {
          if (eventType && invitation.events) {
            const currentEvent = invitation.events.find(e => e.event_type === eventType);
            return currentEvent?.background_config;
          }
          return null;
        })()}
        sections={['hero', 'welcome', 'couple', 'events', 'photos', 'greetings']}
      />
      
      {/* PHASE 15: Event Design System Background Layer */}
      {eventType && invitation.events && (() => {
        const currentEvent = invitation.events.find(e => e.event_type === eventType);
        if (currentEvent?.design_type) {
          return (
            <EventDesignBackground 
              designType={currentEvent.design_type}
              colorVariant={currentEvent.color_variant || null}
            />
          );
        }
        return null;
      })()}
      
      {/* PHASE 18: Event Design System - New Design Registry */}
      {eventType && invitation.events && (() => {
        const currentEvent = invitation.events.find(e => e.event_type === eventType);
        if (currentEvent?.phase18_design_id) {
          return (
            <>
              {/* Design Background Renderer */}
              <DesignRenderer designId={currentEvent.phase18_design_id} />
              
              {/* Hero Opening with Design-based decorations */}
              <HeroOpeningDesign
                designId={currentEvent.phase18_design_id}
                lordImageUrl={invitation?.deity_id && invitation.deity_id !== 'none' ? getDeityImage(invitation.deity_id) : null}
                eventType={eventType}
                onComplete={() => console.log('Hero opening completed')}
              />
            </>
          );
        }
        return null;
      })()}
      
      {/* PHASE 22: Premium Background Design Renderer */}
      {eventType && invitation.events && (() => {
        const currentEvent = invitation.events.find(e => e.event_type === eventType);
        if (currentEvent?.background_design_id && currentEvent?.background_type && currentEvent?.color_palette) {
          return (
            <EventBackgroundRenderer 
              designId={currentEvent.background_design_id}
              backgroundType={currentEvent.background_type}
              colorPalette={currentEvent.color_palette}
            />
          );
        }
        return null;
      })()}
      
      {/* PHASE 17: Hero Opening Sequence - Lord, Gantalu, Dheepalu */}
      <HeroOpeningSequence 
        deityId={invitation?.deity_id}
        eventType={eventType || invitation?.event_type}
        decorativeEffects={invitation?.decorative_effects !== false}
      />
      
      {/* PHASE 17: Flower overlay on first scroll */}
      <FlowerOverlay 
        eventType={eventType || 'marriage'} 
        enabled={true}
        decorativeEffects={invitation?.decorative_effects !== false}
      />
      
      {/* Background Layer - Event-specific dual-layer or legacy/deity backgrounds */}
      {eventType && invitation.events && (() => {
        // If viewing event-specific page, check for event background
        const currentEvent = invitation.events.find(e => e.event_type === eventType);
        if (currentEvent?.background_config) {
          // Check if using new dual-layer system
          if (currentEvent.background_config.hero_background_id || currentEvent.background_config.scroll_background_id) {
            return <DualLayerBackground backgroundConfig={currentEvent.background_config} />;
          }
          // Legacy single background support
          if (currentEvent.background_config.background_id) {
            return <EventBackground backgroundConfig={currentEvent.background_config} />;
          }
        }
        // Fall back to profile deity background if no event background
        return <DeityBackground deityId={invitation.deity_id} />;
      })()}
      
      {/* If not event-specific page, show profile deity background */}
      {!eventType && <DeityBackground deityId={invitation.deity_id} />}
      
      {/* PHASE 23: Lord visibility in hero section with dynamic duration */}
      {eventType && (() => {
        const currentEvent = invitation.events?.find(e => e.event_type === eventType);
        
        // Use PHASE 23 event-level lord settings
        const lordSettings = {
          lord_enabled: currentEvent?.lord_enabled || false,
          lord_id: currentEvent?.lord_id || null,
          lord_display_mode: currentEvent?.lord_display_mode || 'hero_only',
          lord_visibility_duration: currentEvent?.lord_visibility_duration || 2
        };
        
        return (
          <LordVisibility 
            lordSettings={lordSettings}
            eventType={eventType}
            section="hero"
          />
        );
      })()}
      
      {/* Main Content - Positioned above background */}
      <main 
        id="main-content"
        className="luxe min-h-screen" 
        style={{ 
          position: 'relative',
          zIndex: 1,
          background: 'var(--color-background, #FFF8E7)',
          fontFamily: 'var(--font-body, "Lora", serif)',
          color: 'var(--color-text, #4A3728)',
          paddingTop: 'var(--spacing-section, 3rem)',
          paddingBottom: 'var(--spacing-section, 3rem)'
        }}
      >
        <div className="container mx-auto px-4 max-w-4xl">
        
        {/* PHASE 24: Hero Section with Video Support */}
        {(() => {
          // Check if viewing event-specific page with hero video
          if (eventType && invitation.events) {
            const currentEvent = invitation.events.find(e => e.event_type === eventType);
            if (currentEvent?.hero_video_enabled && currentEvent?.hero_video_url) {
              // Render hero video background
              const fallbackContent = invitation.cover_photo_id && (() => {
                const coverPhoto = invitation.media.find(m => m.id === invitation.cover_photo_id);
                return coverPhoto ? (
                  <LazyImage
                    src={`${API_URL}${coverPhoto.media_url}`}
                    alt="Cover"
                    width="100%"
                    height="100%"
                    className="w-full h-full object-cover"
                  />
                ) : null;
              })();

              return (
                <div 
                  className="relative w-full mb-8 rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    height: '60vh',
                    minHeight: '400px',
                    maxHeight: '600px'
                  }}
                >
                  <HeroVideoBackground
                    videoUrl={`${API_URL}${currentEvent.hero_video_url}`}
                    thumbnailUrl={currentEvent.hero_video_thumbnail ? `${API_URL}${currentEvent.hero_video_thumbnail}` : null}
                    enabled={currentEvent.hero_video_enabled}
                    fallbackBackground={fallbackContent}
                  >
                    {/* Overlay with couple names */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
                      }}
                    >
                      <h1 
                        className="text-4xl md:text-6xl font-bold mb-4 text-white text-center px-4"
                        style={{ 
                          fontFamily: 'var(--font-heading, "Cinzel", serif)',
                          textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
                        }}
                      >
                        {invitation.groom_name} & {invitation.bride_name}
                      </h1>
                      {invitation.invitation_message && (
                        <p 
                          className="text-lg md:text-xl text-white text-center px-6 max-w-2xl"
                          style={{ 
                            textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                            fontFamily: 'var(--font-body, "Lora", serif)'
                          }}
                        >
                          {invitation.invitation_message}
                        </p>
                      )}
                    </div>
                  </HeroVideoBackground>
                </div>
              );
            }
          }

          // Fallback: Regular cover photo (no hero video)
          if (invitation.cover_photo_id) {
            const coverPhoto = invitation.media.find(m => m.id === invitation.cover_photo_id);
            return coverPhoto ? (
              <div 
                className="relative w-full mb-8 rounded-lg overflow-hidden shadow-2xl"
                style={{
                  height: '60vh',
                  minHeight: '400px',
                  maxHeight: '600px'
                }}
              >
                <LazyImage
                  src={`${API_URL}${coverPhoto.media_url}`}
                  alt="Cover"
                  width="100%"
                  height="100%"
                  className="w-full h-full object-cover"
                  priority={true}
                />
                {/* Overlay with couple names */}
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
                  }}
                >
                  <h1 
                    className="text-4xl md:text-6xl font-bold mb-4 text-white text-center px-4"
                    style={{ 
                      fontFamily: 'var(--font-heading, "Cinzel", serif)',
                      textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
                    }}
                  >
                    {invitation.groom_name} & {invitation.bride_name}
                  </h1>
                  {invitation.invitation_message && (
                    <p 
                      className="text-lg md:text-xl text-white text-center px-6 max-w-2xl"
                      style={{ 
                        textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                        fontFamily: 'var(--font-body, "Lora", serif)'
                      }}
                    >
                      {invitation.invitation_message}
                    </p>
                  )}
                </div>
              </div>
            ) : null;
          }
          return null;
        })()}

        {/* Music Player Icon - Fixed Position */}
        {invitation.background_music && invitation.background_music.enabled && invitation.background_music.file_url && (
          <button
            onClick={toggleMusic}
            className="fixed top-6 left-6 z-50 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              width: '56px',
              height: '56px',
              minWidth: '56px',
              minHeight: '56px',
              padding: '14px',
              background: 'var(--color-primary, #8B7355)',
              color: 'white',
              touchAction: 'manipulation'
            }}
            aria-label={musicPlaying ? 'Pause music' : 'Play music'}
          >
            {musicPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            )}
          </button>
        )}
        
        {/* Language Switcher - Only show if multiple languages available */}
        {availableLanguages.length > 1 && (
          <div className="flex justify-end mb-6 px-4">
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-sm">
              {availableLanguages.map((langCode) => {
                const lang = LANGUAGES.find(l => l.code === langCode);
                if (!lang) return null;
                
                return (
                  <button
                    key={langCode}
                    onClick={() => {
                      setSelectedLanguage(langCode);
                      // PHASE 9: Track language change
                      trackLanguageView(langCode);
                    }}
                    className="rounded-md text-sm font-medium transition-all active:scale-95"
                    style={{
                      minWidth: '52px',
                      minHeight: '44px',
                      padding: '12px 16px',
                      background: selectedLanguage === langCode 
                        ? 'var(--color-primary, #8B7355)' 
                        : 'transparent',
                      color: selectedLanguage === langCode 
                        ? 'white' 
                        : 'var(--color-text, #4A3728)',
                      border: selectedLanguage === langCode 
                        ? 'none' 
                        : '1px solid var(--color-accent, #C9A961)',
                      touchAction: 'manipulation'
                    }}
                  >
                    {lang.nativeName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Opening Section */}
        {invitation.sections_enabled.opening && (
          <div id="section-hero" className="text-center" style={{ marginBottom: 'var(--spacing-section, 3rem)' }}>
            <Heart 
              className="w-16 h-16 mx-auto mb-6" 
              style={{ color: 'var(--color-secondary, #D4AF37)' }} 
            />
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              {getT('opening', 'title')}
            </h1>
            <p 
              className="text-lg"
              style={{ color: 'var(--color-text, #4A3728)' }}
            >
              {getT('opening', 'subtitle')}
            </p>
          </div>
        )}

        {/* Welcome Section */}
        {invitation.sections_enabled.welcome && (
          <Card 
            id="section-welcome"
            className="p-8 mb-8 text-center"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <p className="text-xl" style={{ color: 'var(--color-text, #4A3728)' }}>
              {getT('welcome', 'message')}
            </p>
          </Card>
        )}

        {/* Couple Names Section */}
        {invitation.sections_enabled.couple && (
          <Card 
            id="section-couple"
            className="p-12 mb-8 text-center"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            {/* PHASE 27: Memory Mode Banner */}
            {isMemoryMode && memoryModeStatus && (
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex items-center justify-center text-purple-800 mb-2">
                  <span className="text-2xl mr-2">🌙</span>
                  <h4 className="text-lg font-semibold">Memory Mode</h4>
                </div>
                <p className="text-sm text-purple-700">
                  {memoryModeStatus.message}. Relive the beautiful moments from our special day.
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              <h2 
                className="text-3xl md:text-4xl font-bold"
                style={{ 
                  fontFamily: 'var(--font-heading, "Cinzel", serif)',
                  color: 'var(--color-primary, #8B7355)'
                }}
              >
                {invitation.groom_name}
              </h2>
              <Heart 
                className="w-8 h-8 mx-auto" 
                style={{ color: 'var(--color-secondary, #D4AF37)' }} 
              />
              <h2 
                className="text-3xl md:text-4xl font-bold"
                style={{ 
                  fontFamily: 'var(--font-heading, "Cinzel", serif)',
                  color: 'var(--color-primary, #8B7355)'
                }}
              >
                {invitation.bride_name}
              </h2>
            </div>
          </Card>
        )}

        {/* About Couple Section */}
        {invitation.sections_enabled.about && invitation.about_couple && (
          <Card 
            id="section-about"
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              About Us
            </h3>
            <div 
              dangerouslySetInnerHTML={{ __html: invitation.about_couple }}
              className="prose prose-lg max-w-none"
              style={{ 
                color: 'var(--color-text, #4A3728)',
                fontFamily: 'var(--font-body, "Lora", serif)'
              }}
            />
          </Card>
        )}

        {/* Family Details Section */}
        {invitation.sections_enabled.family && invitation.family_details && (
          <Card 
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              Our Families
            </h3>
            <div 
              dangerouslySetInnerHTML={{ __html: invitation.family_details }}
              className="prose prose-lg max-w-none"
              style={{ 
                color: 'var(--color-text, #4A3728)',
                fontFamily: 'var(--font-body, "Lora", serif)'
              }}
            />
          </Card>
        )}

        {/* Love Story Section */}
        {invitation.sections_enabled.love_story && invitation.love_story && (
          <Card 
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              Our Story
            </h3>
            <div 
              dangerouslySetInnerHTML={{ __html: invitation.love_story }}
              className="prose prose-lg max-w-none"
              style={{ 
                color: 'var(--color-text, #4A3728)',
                fontFamily: 'var(--font-body, "Lora", serif)'
              }}
            />
          </Card>
        )}

        {/* Event Schedule Section */}
        {invitation.sections_enabled.events && invitation.events && invitation.events.length > 0 && (
          <Card 
            id="section-events"
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              Event Schedule
            </h3>
            
            <div className="space-y-6">
              {invitation.events
                .filter(event => event.visible)
                .sort((a, b) => {
                  const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
                  if (dateCompare !== 0) return dateCompare;
                  return a.start_time.localeCompare(b.start_time);
                })
                .map((event) => (
                  <BackgroundRenderer
                    key={event.event_id}
                    event={event}
                    className="rounded-lg p-6 transition-all duration-300"
                  >
                    <div 
                      className="border-l-4 pl-4 py-2"
                      style={{ 
                        borderLeftColor: 'var(--color-secondary, #D4AF37)',
                        borderRadius: '2px'
                      }}
                    >
                    <h4 
                      className="text-lg font-semibold mb-2"
                      style={{ color: 'var(--color-primary, #8B7355)' }}
                    >
                      {event.name}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <Calendar 
                          className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" 
                          style={{ color: 'var(--color-secondary, #D4AF37)' }} 
                        />
                        <div style={{ color: 'var(--color-text, #4A3728)' }}>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-center" style={{ color: 'var(--color-secondary, #D4AF37)' }}>⏰</span>
                        <div style={{ color: 'var(--color-text, #4A3728)' }}>
                          {event.start_time}
                          {event.end_time && ` - ${event.end_time}`}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <MapPin 
                          className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" 
                          style={{ color: 'var(--color-secondary, #D4AF37)' }} 
                        />
                        <div>
                          <div 
                            className="font-medium"
                            style={{ color: 'var(--color-primary, #8B7355)' }}
                          >
                            {event.venue_name}
                          </div>
                          <div 
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-text, #4A3728)' }}
                          >
                            {event.venue_address}
                          </div>
                        </div>
                      </div>

                      {event.description && (
                        <div className="mt-2 italic text-xs" style={{ color: 'var(--color-text-light, #6B5A47)' }}>
                          {event.description}
                        </div>
                      )}
                      
                      {/* Event-Type Specific Content Display */}
                      {event.event_content && Object.keys(event.event_content).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="space-y-2 text-xs">
                            {/* Engagement Content */}
                            {event.event_type === 'engagement' && (
                              <>
                                {event.event_content.couple_names && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>💑</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Couple: </span>{event.event_content.couple_names}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.venue_details && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>📝</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.venue_details}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Haldi Content */}
                            {event.event_type === 'haldi' && (
                              <>
                                {(event.event_content.bride_name || event.event_content.groom_name) && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>👰🤵</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.bride_name && event.event_content.groom_name 
                                        ? `${event.event_content.bride_name} & ${event.event_content.groom_name}`
                                        : event.event_content.bride_name || event.event_content.groom_name}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.ceremony_time && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>⏰</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Ceremony: </span>{event.event_content.ceremony_time}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.dress_code && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>👔</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Dress Code: </span>{event.event_content.dress_code}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Mehendi Content */}
                            {event.event_type === 'mehendi' && (
                              <>
                                {event.event_content.bride_name && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>👰</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Bride: </span>{event.event_content.bride_name}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.mehendi_time && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>⏰</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Mehendi Time: </span>{event.event_content.mehendi_time}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.venue_details && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>📝</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.venue_details}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Marriage Content */}
                            {event.event_type === 'marriage' && (
                              <>
                                {(event.event_content.bride_full_name || event.event_content.groom_full_name) && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>💑</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.bride_full_name && event.event_content.groom_full_name
                                        ? `${event.event_content.bride_full_name} & ${event.event_content.groom_full_name}`
                                        : event.event_content.bride_full_name || event.event_content.groom_full_name}
                                    </div>
                                  </div>
                                )}
                                {(event.event_content.bride_parents || event.event_content.groom_parents) && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>👨‍👩‍👧‍👦</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.bride_parents && (
                                        <div><span className="font-medium">Bride&apos;s Parents: </span>{event.event_content.bride_parents}</div>
                                      )}
                                      {event.event_content.groom_parents && (
                                        <div><span className="font-medium">Groom&apos;s Parents: </span>{event.event_content.groom_parents}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.muhurat_time && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>🕉️</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Muhurat: </span>{event.event_content.muhurat_time}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.rituals && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>🙏</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Rituals: </span>{event.event_content.rituals}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.dress_code && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>👔</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Dress Code: </span>{event.event_content.dress_code}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Reception Content */}
                            {event.event_type === 'reception' && (
                              <>
                                {event.event_content.couple_names && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>💑</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.couple_names}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.reception_time && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>⏰</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Reception: </span>{event.event_content.reception_time}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.venue_details && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>📝</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      {event.event_content.venue_details}
                                    </div>
                                  </div>
                                )}
                                {event.event_content.dress_code && (
                                  <div className="flex items-start">
                                    <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-secondary, #D4AF37)' }}>👔</span>
                                    <div style={{ color: 'var(--color-text, #4A3728)' }}>
                                      <span className="font-medium">Dress Code: </span>{event.event_content.dress_code}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {event.map_link && (
                        <div className="mt-3 space-y-3">
                          <a
                            href={event.map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              trackInteraction('map_click');
                              // PHASE 30: Track map opened
                              if (invitation && invitation.id) {
                                trackMapOpened(invitation.id, event.id);
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md"
                            style={{
                              background: 'var(--color-secondary, #D4AF37)',
                              color: 'white',
                              textDecoration: 'none'
                            }}
                          >
                            📍 Get Directions
                          </a>
                          
                          {/* Map Embed - Desktop Only, if enabled */}
                          {invitation.map_settings?.embed_enabled && (
                            <div className="hidden md:block mt-3 w-full h-64 rounded-lg overflow-hidden border border-gray-300">
                              <iframe
                                src={(() => {
                                  // Convert regular Google Maps link to embed format
                                  const url = event.map_link;
                                  if (url.includes('google.com/maps')) {
                                    // Extract coordinates or place info
                                    if (url.includes('@')) {
                                      // Has coordinates: extract them
                                      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                                      if (match) {
                                        return `https://maps.google.com/maps?q=${match[1]},${match[2]}&output=embed`;
                                      }
                                    }
                                    // Try to use the full URL as query
                                    return `https://maps.google.com/maps?q=${encodeURIComponent(event.venue_name + ' ' + event.venue_address)}&output=embed`;
                                  }
                                  return url;
                                })()}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`Map for ${event.venue_name}`}
                              ></iframe>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* PHASE 23: Lord Image in Section (section_based mode only) */}
                      {event.lord_enabled && event.lord_display_mode === 'section_based' && (
                        <div className="mt-4 flex justify-center">
                          <LordVisibility 
                            lordSettings={{
                              lord_enabled: event.lord_enabled,
                              lord_id: event.lord_id,
                              lord_display_mode: event.lord_display_mode,
                              lord_visibility_duration: event.lord_visibility_duration
                            }}
                            eventType={event.event_type}
                            section="details"
                          />
                        </div>
                      )}
                      
                      {/* PHASE 24: Message Video Player */}
                      {event.message_video_enabled && event.message_video_url && (
                        <div className="mt-6">
                          <MessageVideoPlayer
                            videoUrl={`${API_URL}${event.message_video_url}`}
                            enabled={event.message_video_enabled}
                          />
                        </div>
                      )}
                      
                      {/* PHASE 21: Event Photo Gallery */}
                      {event.gallery_enabled && (
                        <div className="mt-6">
                          {event.gallery_images && event.gallery_images.length > 0 ? (
                            <EventGallery 
                              gallery_images={event.gallery_images}
                              eventType={event.event_type}
                              onGalleryOpen={() => {
                                // PHASE 30: Track gallery opened
                                if (invitation && invitation.id) {
                                  trackGalleryOpened(invitation.id, event.id);
                                }
                              }}
                            />
                          ) : (
                            <EmptyState type="gallery" />
                          )}
                        </div>
                      )}
                      
                      {/* PHASE 25: Event Countdown Widget - Hidden in Memory Mode (PHASE 27) */}
                      {!isMemoryMode && event.countdown_enabled !== false && event.event_date && (
                        <div className="mt-8">
                          <CountdownWidget
                            eventDate={event.event_date}
                            eventTime={event.event_time}
                            enabled={event.countdown_enabled !== false}
                          />
                        </div>
                      )}
                      
                      {/* PHASE 25: Guest Wishes Section */}
                      {event.wishes_enabled !== false && (
                        <div className="mt-8">
                          <GuestWishes
                            eventId={event.event_id}
                            enabled={event.wishes_enabled !== false}
                          />
                        </div>
                      )}
                      
                      {/* PHASE 25: Quick Reaction Bar */}
                      {event.reactions_enabled !== false && (
                        <ReactionBar
                          eventId={event.event_id}
                          enabled={event.reactions_enabled !== false}
                          position="bottom"
                        />
                      )}
                    </div>
                    </div>
                  </BackgroundRenderer>
                ))}
            </div>
          </Card>
        )}

        {/* Fallback: Show old event details if no events array */}
        {invitation.sections_enabled.events && (!invitation.events || invitation.events.length === 0) && (
          <Card 
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              {getT('events', 'title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar 
                  className="w-6 h-6 mr-4 mt-1" 
                  style={{ color: 'var(--color-secondary, #D4AF37)' }} 
                />
                <div>
                  <p 
                    className="font-semibold"
                    style={{ color: 'var(--color-primary, #8B7355)' }}
                  >
                    {getT('events', 'dateLabel')}
                  </p>
                  <p style={{ color: 'var(--color-text, #4A3728)' }}>
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin 
                  className="w-6 h-6 mr-4 mt-1" 
                  style={{ color: 'var(--color-secondary, #D4AF37)' }} 
                />
                <div>
                  <p 
                    className="font-semibold"
                    style={{ color: 'var(--color-primary, #8B7355)' }}
                  >
                    {getT('events', 'venueLabel')}
                  </p>
                  <p 
                    className="whitespace-pre-line"
                    style={{ color: 'var(--color-text, #4A3728)' }}
                  >
                    {invitation.venue}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Event Countdown Section */}
        {invitation.sections_enabled.countdown && invitation.events && invitation.events.length > 0 && (() => {
          // Find main wedding event or first event
          const mainEvent = invitation.events.find(e => e.name.toLowerCase().includes('wedding') && e.visible) || invitation.events.find(e => e.visible);
          if (!mainEvent) return null;
          
          const eventDate = new Date(mainEvent.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          const daysToGo = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
          
          // Don't show countdown after the event date
          if (daysToGo < 0) return null;
          
          return (
            <Card 
              className="p-6 mb-8 text-center"
              style={{
                background: 'var(--color-card, #FFFDF7)',
                boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
                border: 'var(--card-border, 1px solid #E8D9C5)',
                borderRadius: 'var(--card-radius, 12px)',
                marginBottom: 'var(--spacing-card, 1.5rem)'
              }}
            >
              <Clock 
                className="w-12 h-12 mx-auto mb-4" 
                style={{ color: 'var(--color-secondary, #D4AF37)' }} 
              />
              <p 
                className="text-3xl md:text-4xl font-bold"
                style={{ 
                  color: 'var(--color-primary, #8B7355)',
                  fontFamily: 'var(--font-heading, "Cinzel", serif)'
                }}
              >
                ⏳ {daysToGo === 0 ? "Today's the Day!" : `${daysToGo} Day${daysToGo > 1 ? 's' : ''} to Go`}
              </p>
              <p 
                className="text-sm mt-2"
                style={{ color: 'var(--color-text, #4A3728)' }}
              >
                {mainEvent.name} • {new Date(mainEvent.date).toLocaleDateString()}
              </p>
            </Card>
          );
        })()}

        {/* WhatsApp Greeting Section */}
        {(invitation.whatsapp_groom || invitation.whatsapp_bride) && (
          <Card 
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              {getT('greetings', 'title')}
            </h3>
            <p 
              className="text-center mb-6"
              style={{ color: 'var(--color-text, #4A3728)' }}
            >
              Send your wishes directly via WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {invitation.whatsapp_groom && (
                <Button
                  onClick={() => window.open(generateWhatsAppURL(invitation.whatsapp_groom), '_blank')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white"
                >
                  <MessageCircle className="w-5 h-5" />
                  {getT('whatsapp', 'groomButton')}
                </Button>
              )}
              {invitation.whatsapp_bride && (
                <Button
                  onClick={() => window.open(generateWhatsAppURL(invitation.whatsapp_bride), '_blank')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white"
                >
                  <MessageCircle className="w-5 h-5" />
                  {getT('whatsapp', 'brideButton')}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Photos Section */}
        {invitation.sections_enabled.photos && invitation.media.length > 0 && (
          <Card 
            id="section-photos"
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              {getT('photos', 'title')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {invitation.media
                .filter(m => m.media_type === 'photo')
                .map((media) => (
                  <div 
                    key={media.id} 
                    className="aspect-square overflow-hidden"
                    style={{
                      border: 'var(--image-border, 4px solid #D4AF37)',
                      borderRadius: 'var(--image-radius, 8px)'
                    }}
                  >
                    <LazyImage
                      src={media.media_url}
                      alt={media.caption || 'Wedding photo'}
                      width="100%"
                      height="100%"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Video Section */}
        {invitation.sections_enabled.video && invitation.media.some(m => m.media_type === 'video') && (
          <Card 
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              {getT('video', 'title')}
            </h3>
            <div 
              className="aspect-video overflow-hidden bg-gray-100"
              style={{
                border: 'var(--image-border, 4px solid #D4AF37)',
                borderRadius: 'var(--image-radius, 8px)'
              }}
            >
              {invitation.media
                .filter(m => m.media_type === 'video')
                .map((media) => (
                  <LazyVideo
                    key={media.id}
                    src={media.media_url}
                    controls={true}
                    autoPlay={false}
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                  />
                ))}
            </div>
          </Card>
        )}

        {/* Greetings Section */}
        {invitation.sections_enabled.greetings && (
          <Card 
            id="section-greetings"
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              {getT('greetings', 'title')}
            </h3>

            {/* PHASE 12: Expiry Notice for Greetings */}
            {invitation.is_expired && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: '#FFF3CD', border: '1px solid #FFC107' }}>
                <p className="text-sm text-center font-medium" style={{ color: '#856404' }}>
                  ⚠️ This invitation has expired. Submitting new wishes is no longer available.
                </p>
              </div>
            )}

            {/* Greeting Form */}
            {!invitation.is_expired && (
            <form onSubmit={handleSubmitGreeting} className="mb-8">
              <div className="space-y-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text, #4A3728)' }}
                  >
                    {getT('greetings', 'nameLabel')}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-md"
                    style={{
                      borderColor: 'var(--color-accent, #C9A961)',
                      background: 'var(--color-background, #FFF8E7)',
                      color: 'var(--color-text, #4A3728)'
                    }}
                    placeholder={getT('greetings', 'messagePlaceholder')}
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text, #4A3728)' }}
                  >
                    Your Message (max 250 characters)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      if (e.target.value.length <= 250) {
                        setMessage(e.target.value);
                      }
                    }}
                    required
                    maxLength={250}
                    rows="4"
                    className="w-full px-4 py-2 border rounded-md"
                    style={{
                      borderColor: 'var(--color-accent, #C9A961)',
                      background: 'var(--color-background, #FFF8E7)',
                      color: 'var(--color-text, #4A3728)'
                    }}
                    placeholder={getT('greetings', 'messagePlaceholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {message.length}/250 characters
                  </p>
                </div>
                {!navigator.onLine && (
                  <p className="text-red-600 text-sm text-center">
                    Internet connection required to submit greeting
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={submitting || !navigator.onLine}
                  className="w-full text-white"
                  style={{
                    background: 'var(--color-primary, #8B7355)',
                    opacity: (submitting || !navigator.onLine) ? 0.6 : 1
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Sending...' : getT('greetings', 'submitButton')}
                </Button>
                {submitSuccess && (
                  <p className="text-green-600 text-sm text-center">
                    Thank you! Your greeting has been submitted.
                  </p>
                )}
              </div>
            </form>
            )}

            {/* Display Greetings */}
            {invitation.greetings.length > 0 && (
              <div>
                <h4 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--color-primary, #8B7355)' }}
                >
                  Wishes from Loved Ones ({invitation.greetings.length})
                </h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {invitation.greetings.map((greeting) => (
                    <div 
                      key={greeting.id} 
                      className="rounded-lg p-4"
                      style={{
                        background: 'var(--color-background, #FFF8E7)',
                        border: 'var(--card-border, 1px solid #E8D9C5)'
                      }}
                    >
                      <p 
                        className="font-semibold mb-1"
                        style={{ color: 'var(--color-primary, #8B7355)' }}
                      >
                        {greeting.guest_name}
                      </p>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: 'var(--color-text, #4A3728)' }}
                      >
                        {greeting.message}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: 'var(--color-accent, #C9A961)' }}
                      >
                        {new Date(greeting.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* RSVP Section - Conditional based on sections_enabled and Memory Mode (PHASE 27) */}
        {!isMemoryMode && invitation.sections_enabled.rsvp && (
          <Card 
            id="section-rsvp"
            className="mb-8 p-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0,0,0,0.1))',
              borderRadius: 'var(--card-radius, 8px)'
            }}
          >
          <h3 
            className="text-2xl font-semibold mb-4 text-center"
            style={{ 
              color: 'var(--color-primary, #8B7355)',
              fontFamily: 'var(--font-heading, "Playfair Display", serif)'
            }}
          >
            RSVP
          </h3>
          <p className="text-center mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
            Please let us know if you can join us for this special occasion
          </p>
          <p className="text-center mb-6 text-xs" style={{ color: 'var(--color-accent, #C9A961)' }}>
            You can edit your RSVP within 48 hours of submission
          </p>

          {/* PHASE 12: Expiry Notice for RSVP */}
          {invitation.is_expired && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: '#FFF3CD', border: '1px solid #FFC107' }}>
              <p className="text-sm text-center font-medium" style={{ color: '#856404' }}>
                ⚠️ This invitation has expired. RSVP submissions are no longer available.
              </p>
            </div>
          )}

          {/* PHASE 11 + PHASE 32: Check Existing RSVP Status with Name Verification */}
          {!invitation.is_expired && !existingRsvp && !rsvpSuccess && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--color-background, #FFF8E7)', border: '1px dashed var(--color-accent, #C9A961)' }}>
              <p className="text-sm mb-3 text-center" style={{ color: 'var(--color-text, #4A3728)' }}>
                Already submitted? Check or edit your RSVP
              </p>
              <form onSubmit={handleCheckRsvp} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={checkPhone}
                    onChange={(e) => setCheckPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={needsNameVerification}
                    className="flex-1 px-4 py-2 border rounded-md text-sm"
                    style={{
                      borderColor: 'var(--color-accent, #C9A961)',
                      background: needsNameVerification ? '#f5f5f5' : 'white',
                      color: 'var(--color-text, #4A3728)'
                    }}
                  />
                  {!needsNameVerification && (
                    <Button
                      type="submit"
                      disabled={checkingRsvp}
                      className="text-white text-sm"
                      style={{ background: 'var(--color-primary, #8B7355)' }}
                    >
                      {checkingRsvp ? 'Checking...' : 'Check Status'}
                    </Button>
                  )}
                </div>
                
                {/* PHASE 32: Name verification step */}
                {needsNameVerification && (
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: 'var(--color-text, #4A3728)' }}>
                      🔒 For security, please enter your name to verify ownership:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={checkName}
                        onChange={(e) => setCheckName(e.target.value)}
                        placeholder="Enter your full name"
                        className="flex-1 px-4 py-2 border rounded-md text-sm"
                        style={{
                          borderColor: 'var(--color-accent, #C9A961)',
                          background: 'white',
                          color: 'var(--color-text, #4A3728)'
                        }}
                      />
                      <Button
                        type="submit"
                        disabled={checkingRsvp}
                        className="text-white text-sm"
                        style={{ background: 'var(--color-primary, #8B7355)' }}
                      >
                        {checkingRsvp ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNeedsNameVerification(false);
                        setCheckName('');
                        setCheckPhone('');
                        setCanEditRsvp(false);
                      }}
                      className="text-xs underline"
                      style={{ color: 'var(--color-accent, #C9A961)' }}
                    >
                      Use different phone number
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* PHASE 11: Show existing RSVP info if found but not editable */}
          {existingRsvp && !canEditRsvp && !rsvpSuccess && (
            <div className="text-center py-6 mb-4 rounded-lg" style={{ background: 'var(--color-background, #FFF8E7)' }}>
              <div className="text-5xl mb-3">
                {existingRsvp.status === 'yes' && '✓'}
                {existingRsvp.status === 'no' && '✗'}
                {existingRsvp.status === 'maybe' && '?'}
              </div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary, #8B7355)' }}>
                Your RSVP Status
              </h4>
              <p className="font-semibold mb-3" style={{ color: 'var(--color-text, #4A3728)' }}>
                {existingRsvp.status === 'yes' && '✓ Attending'}
                {existingRsvp.status === 'no' && 'Not Attending'}
                {existingRsvp.status === 'maybe' && 'Maybe'}
              </p>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                Name: <span className="font-medium">{existingRsvp.guest_name}</span>
              </p>
              {existingRsvp.status === 'yes' && existingRsvp.guest_count > 1 && (
                <p className="text-sm mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                  Guests: <span className="font-medium">{existingRsvp.guest_count}</span>
                </p>
              )}
              <p className="text-xs mt-4" style={{ color: 'var(--color-accent, #C9A961)' }}>
                ⓘ Editing period (48 hours) has expired
              </p>
              <Button
                onClick={() => {
                  setExistingRsvp(null);
                  setCheckPhone('');
                }}
                className="mt-4 text-sm"
                style={{ background: 'var(--color-accent, #C9A961)', color: 'white' }}
              >
                Check Another Number
              </Button>
            </div>
          )}

          {/* RSVP Form - New or Edit */}
          {!invitation.is_expired && !rsvpSuccess && (!existingRsvp || canEditRsvp) ? (
            <>
              {/* Show edit info banner if in edit mode */}
              {isEditMode && canEditRsvp && (
                <div className="mb-4 p-3 rounded-lg" style={{ background: '#FFF3CD', border: '1px solid #FFC107' }}>
                  <p className="text-sm text-center" style={{ color: '#856404' }}>
                    ✏️ Editing your RSVP • {hoursRemaining} hours remaining to make changes
                  </p>
                </div>
              )}

            <form onSubmit={handleSubmitRSVP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={rsvpData.guest_name}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, guest_name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border rounded-md"
                  style={{
                    borderColor: 'var(--color-accent, #C9A961)',
                    background: 'var(--color-background, #FFF8E7)',
                    color: 'var(--color-text, #4A3728)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                  Phone Number (with country code) *
                </label>
                <input
                  type="tel"
                  value={rsvpData.guest_phone}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, guest_phone: e.target.value }))}
                  required
                  disabled={isEditMode}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border rounded-md"
                  style={{
                    borderColor: 'var(--color-accent, #C9A961)',
                    background: isEditMode ? '#f5f5f5' : 'var(--color-background, #FFF8E7)',
                    color: 'var(--color-text, #4A3728)',
                    opacity: isEditMode ? 0.7 : 1
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-accent, #C9A961)' }}>
                  {isEditMode ? 'Phone number cannot be changed' : 'Format: +[country code][number]'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                  Will you attend? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'yes', label: 'Attending', emoji: '✓' },
                    { value: 'no', label: 'Not Attending', emoji: '✗' },
                    { value: 'maybe', label: 'Maybe', emoji: '?' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRsvpData(prev => ({ ...prev, status: option.value }));
                        trackInteraction('rsvp_click');
                      }}
                      className="rounded-md text-sm font-medium transition-all active:scale-95"
                      style={{
                        minHeight: '56px',
                        padding: '14px 16px',
                        background: rsvpData.status === option.value 
                          ? 'var(--color-primary, #8B7355)' 
                          : 'var(--color-background, #FFF8E7)',
                        color: rsvpData.status === option.value 
                          ? 'white' 
                          : 'var(--color-text, #4A3728)',
                        border: '2px solid var(--color-accent, #C9A961)',
                        touchAction: 'manipulation'
                      }}
                    >
                      <div className="text-xl mb-1">{option.emoji}</div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {rsvpData.status === 'yes' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rsvpData.guest_count}
                    onChange={(e) => setRsvpData(prev => ({ ...prev, guest_count: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2 border rounded-md"
                    style={{
                      borderColor: 'var(--color-accent, #C9A961)',
                      background: 'var(--color-background, #FFF8E7)',
                      color: 'var(--color-text, #4A3728)'
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text, #4A3728)' }}>
                  Message / Blessings (Optional, max 250 characters)
                </label>
                <textarea
                  value={rsvpData.message}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, message: e.target.value.slice(0, 250) }))}
                  rows="3"
                  maxLength="250"
                  className="w-full px-4 py-2 border rounded-md"
                  style={{
                    borderColor: 'var(--color-accent, #C9A961)',
                    background: 'var(--color-background, #FFF8E7)',
                    color: 'var(--color-text, #4A3728)'
                  }}
                  placeholder="Your message..."
                />
                <p className="text-xs text-right mt-1" style={{ color: 'var(--color-accent, #C9A961)' }}>
                  {rsvpData.message.length}/250
                </p>
              </div>

              {rsvpError && (
                <p className="text-red-600 text-sm text-center">
                  {rsvpError}
                </p>
              )}

              {!navigator.onLine && (
                <p className="text-orange-600 text-sm text-center">
                  Internet connection required to submit RSVP
                </p>
              )}

              <div className="flex gap-2">
                {isEditMode && (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setExistingRsvp(null);
                      setCheckPhone('');
                      setRsvpData({
                        guest_name: '',
                        guest_phone: '',
                        status: 'yes',
                        guest_count: 1,
                        message: ''
                      });
                    }}
                    className="text-sm"
                    style={{ background: '#6c757d', color: 'white' }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={rsvpSubmitting || !navigator.onLine}
                  className="flex-1 text-white"
                  style={{
                    background: 'var(--color-primary, #8B7355)',
                    opacity: (rsvpSubmitting || !navigator.onLine) ? 0.6 : 1
                  }}
                >
                  {rsvpSubmitting ? 'Submitting...' : (isEditMode ? 'Update RSVP' : 'Submit RSVP')}
                </Button>
              </div>
            </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">
                {submittedRsvpStatus === 'yes' && '✓'}
                {submittedRsvpStatus === 'no' && '✗'}
                {submittedRsvpStatus === 'maybe' && '?'}
              </div>
              <h4 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--color-primary, #8B7355)' }}
              >
                Thank You!
              </h4>
              <p style={{ color: 'var(--color-text, #4A3728)' }} className="mb-2">
                Your RSVP has been submitted successfully.
              </p>
              <p style={{ color: 'var(--color-primary, #8B7355)' }} className="font-semibold">
                {submittedRsvpStatus === 'yes' && '✓ Attending'}
                {submittedRsvpStatus === 'no' && 'Not Attending'}
                {submittedRsvpStatus === 'maybe' && 'Maybe'}
              </p>
            </div>
          )}
        </Card>
        )}

        {/* Contact Information Section */}
        {invitation.sections_enabled.contact && invitation.contact_info && 
          (invitation.contact_info.groom_phone || invitation.contact_info.bride_phone || invitation.contact_info.emergency_phone || invitation.contact_info.email) && (
          <Card 
            id="section-contact"
            className="p-8 mb-8"
            style={{
              background: 'var(--color-card, #FFFDF7)',
              boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
              border: 'var(--card-border, 1px solid #E8D9C5)',
              borderRadius: 'var(--card-radius, 12px)',
              marginBottom: 'var(--spacing-card, 1.5rem)'
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ 
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                color: 'var(--color-primary, #8B7355)'
              }}
            >
              Contact Us
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitation.contact_info.groom_phone && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/50">
                  <Phone className="w-5 h-5" style={{ color: 'var(--color-primary, #8B7355)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text, #4A3728)' }}>
                      Groom Family
                    </p>
                    <a 
                      href={`tel:${invitation.contact_info.groom_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {invitation.contact_info.groom_phone}
                    </a>
                  </div>
                </div>
              )}
              {invitation.contact_info.bride_phone && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/50">
                  <Phone className="w-5 h-5" style={{ color: 'var(--color-primary, #8B7355)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text, #4A3728)' }}>
                      Bride Family
                    </p>
                    <a 
                      href={`tel:${invitation.contact_info.bride_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {invitation.contact_info.bride_phone}
                    </a>
                  </div>
                </div>
              )}
              {invitation.contact_info.emergency_phone && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/50">
                  <Phone className="w-5 h-5" style={{ color: 'var(--color-secondary, #D4AF37)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text, #4A3728)' }}>
                      Emergency Contact
                    </p>
                    <a 
                      href={`tel:${invitation.contact_info.emergency_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {invitation.contact_info.emergency_phone}
                    </a>
                  </div>
                </div>
              )}
              {invitation.contact_info.email && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/50">
                  <Mail className="w-5 h-5" style={{ color: 'var(--color-primary, #8B7355)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text, #4A3728)' }}>
                      Email
                    </p>
                    <a 
                      href={`mailto:${invitation.contact_info.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {invitation.contact_info.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Add to Calendar & QR Code Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Add to Calendar Button */}
          {invitation.sections_enabled.calendar && invitation.events && invitation.events.filter(e => e.visible).length > 0 && (
            <Card 
              className="p-6 flex-1 text-center"
              style={{
                background: 'var(--color-card, #FFFDF7)',
                boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
                border: 'var(--card-border, 1px solid #E8D9C5)',
                borderRadius: 'var(--card-radius, 12px)'
              }}
            >
              <Calendar 
                className="w-10 h-10 mx-auto mb-3" 
                style={{ color: 'var(--color-secondary, #D4AF37)' }} 
              />
              <h4 
                className="text-lg font-semibold mb-3"
                style={{ 
                  color: 'var(--color-primary, #8B7355)',
                  fontFamily: 'var(--font-heading, "Cinzel", serif)'
                }}
              >
                Save the Date
              </h4>
              <Button
                onClick={() => window.open(`${API_URL}/api/invite/${slug}/calendar`, '_blank')}
                className="w-full"
                style={{
                  background: 'var(--color-primary, #8B7355)',
                  color: 'white'
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
            </Card>
          )}

          {/* QR Code Display */}
          {invitation.sections_enabled.qr && (
            <Card 
              className="p-6 flex-1 text-center"
              style={{
                background: 'var(--color-card, #FFFDF7)',
                boxShadow: 'var(--card-shadow, 0 4px 12px rgba(139, 115, 85, 0.15))',
                border: 'var(--card-border, 1px solid #E8D9C5)',
                borderRadius: 'var(--card-radius, 12px)'
              }}
            >
              <QrCode 
                className="w-10 h-10 mx-auto mb-3" 
                style={{ color: 'var(--color-secondary, #D4AF37)' }} 
              />
              <h4 
                className="text-lg font-semibold mb-3"
                style={{ 
                  color: 'var(--color-primary, #8B7355)',
                  fontFamily: 'var(--font-heading, "Cinzel", serif)'
                }}
              >
                Share Invitation
              </h4>
              <LazyImage
                src={`${API_URL}/api/invite/${slug}/qr`}
                alt="Invitation QR Code"
                width="192px"
                height="192px"
                className="w-48 h-48 mx-auto rounded-lg"
                style={{ border: '2px solid var(--color-accent, #C9A961)' }}
              />
              <p className="text-xs mt-3" style={{ color: 'var(--color-text, #4A3728)' }}>
                Scan to view this invitation
              </p>
            </Card>
          )}
        </div>

        {/* PHASE 27: Memory Mode View - Thank You Message & Wedding Album */}
        {isMemoryMode && (
          <div className="mt-8">
            <MemoryModeView slugUrl={slug} />
          </div>
        )}

        {/* Footer Section */}
        {invitation.sections_enabled.footer && (
          <div className="text-center py-8">
            <Heart 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: 'var(--color-secondary, #D4AF37)' }}
            />
            <p 
              className="text-lg"
              style={{ color: 'var(--color-text, #4A3728)' }}
            >
              {getT('footer', 'thankyou')}
            </p>
          </div>
        )}

        {/* PHASE 28: Share Buttons - Smart Share System */}
        {/* PHASE 31: Conditional rendering based on social_sharing_enabled */}
        {invitation.seo_settings?.social_sharing_enabled !== false && (
          <div className="mt-8 mb-4">
            <ShareButtons
              shareUrl={window.location.href}
              title={`Join us for the wedding of ${invitation.bride_name} & ${invitation.groom_name}`}
              description={`We're getting married! Join us in celebrating our special day.`}
            />
          </div>
        )}

        {/* PHASE 35: Guest Referral CTA - Subtle, Premium, No Spam */}
        {!isMemoryMode && profileReferralCode && (
          <div className="mt-8 mb-4">
            <GuestReferralCTA 
              profileSlug={invitation.slug}
              referralCode={profileReferralCode}
            />
          </div>
        )}

        {/* PHASE 28: Brand Footer - Soft Virality */}
        <BrandFooter platformName="WeddingPulse" />
      </div>
    </main>
    
    {/* PHASE 20: Background Music Player */}
    {/* PHASE 24: Event-Level Background Music Player */}
    {(() => {
      // Get the current event's music settings
      const currentEvent = invitation.events?.find(e => e.event_type === eventType);
      if (currentEvent?.background_music_enabled && currentEvent?.background_music_url) {
        const musicUrl = `${API_URL}${currentEvent.background_music_url}`;
        return (
          <EventMusicPlayer 
            musicUrl={musicUrl} 
            enabled={currentEvent.background_music_enabled}
          />
        );
      }
      // Fallback to PHASE 20 music_file if PHASE 24 not set
      if (currentEvent?.music_enabled && currentEvent?.music_file) {
        const musicUrl = `${API_URL}${currentEvent.music_file}`;
        return (
          <EventMusicPlayer 
            musicUrl={musicUrl} 
            enabled={currentEvent.music_enabled}
          />
        );
      }
      return null;
    })()}
    
    {/* PHASE 33: Watermark for FREE plan */}
    {showWatermark && <WatermarkOverlay position="bottom-right" />}
    
    </>
  );
};

export default PublicInvitation;
