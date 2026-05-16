import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Save, ExternalLink, Sparkles, Check,
  Palette as PaletteIcon, Calendar, MapPin, Music, ToggleLeft,
} from 'lucide-react';
import LuxuryShell from '@/components/luxury/LuxuryShell';
import MandalaLoader from '@/components/luxury/MandalaLoader';
import AIStoryComposer from '@/components/luxury/AIStoryComposer';
import FeatureFlagsPanel from '@/components/luxury/FeatureFlagsPanel';
import PhotoUploadField from '@/components/luxury/PhotoUploadField';
import MusicPresetPicker from '@/components/luxury/MusicPresetPicker';
import ThemePreviewModal from '@/components/luxury/ThemePreviewModal';
import { getAllThemes, getThemeById } from '@/themes/masterThemes';
import { useAuth } from '@/context/AuthContext';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STEPS = [
  { id: 'couple',  label: 'Couple',   icon: Sparkles },
  { id: 'theme',   label: 'Theme',    icon: PaletteIcon },
  { id: 'story',   label: 'Story',    icon: Sparkles },
  { id: 'events',  label: 'Events',   icon: Calendar },
  { id: 'venue',   label: 'Venue',    icon: MapPin },
  { id: 'media',   label: 'Media',    icon: Music },
  { id: 'flags',   label: 'Features', icon: ToggleLeft },
  { id: 'publish', label: 'Publish',  icon: Check },
];

const DEFAULT_FORM = {
  bride_name: '', groom_name: '', wedding_date: '', wedding_time: '',
  design_theme: 'royal_mughal',
  story: '',
  venue: '', venue_address: '',
  venue_google_map_link: '',
  background_music_url: '',
  events: [],
  feature_flags: {
    show_rsvp: true,
    show_wishes: true,
    show_live_gallery: false,
    show_countdown: true,
    show_music: true,
    show_ai_story: true,
    show_digital_shagun: false,
    show_translations: false,
  },
  language: 'English',
  passcode: '',
  is_published: false,
  // Photos
  bride_photo_url: '',
  groom_photo_url: '',
  couple_photo_url: '',
};

const LuxuryProfileForm = () => {
  const navigate = useNavigate();
  const { profileId, weddingId } = useParams();
  const [searchParams] = useSearchParams();
  const onBehalfOf = searchParams.get('on_behalf_of'); // super-admin impersonation
  const id = profileId || weddingId || null;
  const { admin, loading: authLoading } = useAuth();
  const isNew = !id;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [previewTheme, setPreviewTheme] = useState(null); // theme preview modal

  useEffect(() => {
    if (authLoading) return; // wait for auth to hydrate
    if (!admin) { navigate('/admin/login'); return; }
    if (!isNew) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, authLoading]);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/profiles/${id}`);
      const d = res.data || {};
      // Read MAJA-extended fields stored under custom_text._maja
      const maja = (d.custom_text && d.custom_text._maja) || {};
      let extendedEvents = [];
      try { extendedEvents = maja.events_extended ? JSON.parse(maja.events_extended) : []; } catch {}

      setForm({
        ...DEFAULT_FORM,
        bride_name: d.bride_name || '',
        groom_name: d.groom_name || '',
        wedding_date: d.event_date ? new Date(d.event_date).toISOString().slice(0, 10) : '',
        design_theme: d.design_id || d.design_theme || 'royal_mughal',
        venue: d.venue || '',
        venue_address: d.city || d.venue_address || '',
        story: d.love_story || d.story || '',
        background_music_url: d.background_music?.url || '',
        language: Array.isArray(d.language) ? (d.language[0] || 'English').replace(/^\w/, (c) => c.toUpperCase()) : (d.language || 'English'),
        events: extendedEvents.length > 0 ? extendedEvents : (d.events || []).map((e) => ({
          id: e.id || e.event_id, event_type: e.event_type || 'Wedding', title: e.title || e.name || '',
          event_date: e.event_date || e.date || '',
          start_time: e.start_time || e.wedding_time || '',
          venue: e.venue || e.venue_name || '',
          venue_address: e.venue_address || '',
          description: e.description || '',
          google_map_link: e.google_map_link || e.map_link || '',
          dress_code: e.dress_code || '',
          hero_photo_url: e.hero_photo_url || '',
        })),
        feature_flags: { ...DEFAULT_FORM.feature_flags, ...(d.sections_enabled || {}) },
        passcode: d.passcode || '',
        // Photos + extras (from custom_text._maja or top-level)
        bride_photo_url:        maja.bride_photo_url        || d.bride_photo_url        || '',
        groom_photo_url:        maja.groom_photo_url        || d.groom_photo_url        || '',
        couple_photo_url:       maja.couple_photo_url       || d.couple_photo_url       || '',
        venue_google_map_link:  maja.venue_google_map_link  || d.map_settings?.map_link || '',
      });
      setShareLink(d.share_link || d.slug || '');
      setPublished(!!d.is_enabled || !!d.is_published);
    } catch (e) { setError(e.response?.data?.detail || 'Failed to load wedding.'); }
    finally { setLoading(false); }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setFlag = (k, v) => setForm((f) => ({ ...f, feature_flags: { ...f.feature_flags, [k]: v } }));

  const save = async (opts = {}) => {
    setSaving(true); setError('');
    try {
      const body = {
        bride_name: form.bride_name,
        groom_name: form.groom_name,
        event_type: 'marriage',
        event_date: form.wedding_date ? new Date(form.wedding_date).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        venue:      form.venue || 'TBA',
        city:       form.venue_address || '',
        design_id:  form.design_theme || 'royal_mughal',
        language:   [(form.language || 'English').toLowerCase()],
        enabled_languages: [(form.language || 'English').toLowerCase()],
        love_story: form.story || '',
        events:     [],   // strict per-event validation skipped; we persist extended events under custom_text._maja
        background_music: form.background_music_url ? { enabled: true, url: form.background_music_url, autoplay: false } : { enabled: false, url: '', autoplay: false },
        sections_enabled: form.feature_flags || {},
        map_settings: form.venue_google_map_link ? { embed_enabled: true, map_link: form.venue_google_map_link } : { embed_enabled: false },
        link_expiry_type: 'permanent',
        // Photos + per-event details persisted via custom_text (free-form dict)
        custom_text: {
          _maja: {
            bride_photo_url: form.bride_photo_url || '',
            groom_photo_url: form.groom_photo_url || '',
            couple_photo_url: form.couple_photo_url || '',
            venue_google_map_link: form.venue_google_map_link || '',
            events_extended: JSON.stringify(form.events || []),
          },
        },
      };
      let res;
      if (isNew) {
        const createUrl = onBehalfOf
          ? `${API_URL}/api/admin/profiles?on_behalf_of=${encodeURIComponent(onBehalfOf)}`
          : `${API_URL}/api/admin/profiles`;
        res = await axios.post(createUrl, body);
      } else {
        res = await axios.put(`${API_URL}/api/admin/profiles/${id}`, body);
      }
      setShareLink(res.data.share_link || res.data.slug || '');
      if (opts.publish) {
        try {
          const pubRes = await axios.put(`${API_URL}/api/admin/profiles/${res.data.id || id}/enable`);
          setPublished(true);
          setShareLink(pubRes.data.share_link || res.data.share_link || '');
        } catch (_) { setPublished(true); }
      }
      if (isNew && res.data.id) {
        const suffix = onBehalfOf ? `?on_behalf_of=${encodeURIComponent(onBehalfOf)}` : '';
        navigate(`/admin/profile/${res.data.id}/edit${suffix}`, { replace: true });
      }
      return res.data;
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((x) => `${x.loc?.join('.')}: ${x.msg}`).join('; ') : (detail || 'Save failed.');
      setError(msg);
      return null;
    } finally { setSaving(false); }
  };

  const next = async () => {
    if (step < STEPS.length - 1) {
      // auto-save quietly between steps when editing existing
      if (!isNew && form.bride_name && form.groom_name) await save();
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prev = () => { setStep((s) => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading) {
    return <LuxuryShell title="Loading"><div className="grid place-items-center py-32"><MandalaLoader /></div></LuxuryShell>;
  }

  return (
    <LuxuryShell
      eyebrow={onBehalfOf ? '◆ Wedding Editor · On behalf of photographer' : '◆ Wedding Editor'}
      title={isNew ? 'New Wedding' : `${form.bride_name} & ${form.groom_name}`}
      showBack
      onBack={() => navigate(onBehalfOf ? `/super-admin/photographers/${onBehalfOf}` : '/admin/dashboard')}
      actions={
        <button onClick={() => save()} disabled={saving} className="lux-btn lux-btn-ghost text-xs" data-testid="save-btn">
          {saving ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
      }
      testid="luxury-profile-form"
    >
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto">
        {onBehalfOf && (
          <div className="mb-6 px-5 py-4 rounded-xl flex items-start gap-3 text-sm"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)', color: '#FFF8DC' }}
            data-testid="on-behalf-banner"
          >
            <Sparkles className="w-4 h-4 mt-0.5 text-gold shrink-0" />
            <div>
              <div className="font-medium" style={{ color: '#D4AF37' }}>Creating invitation on behalf of a photographer</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,248,220,0.7)' }}>
                This invitation will be saved under photographer ID <span className="font-mono">{onBehalfOf.slice(0, 8)}…</span> and appear in their dashboard.
              </div>
            </div>
          </div>
        )}        {/* Stepper */}
        <div className="lux-glass p-4 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button key={s.id} onClick={() => setStep(i)} data-testid={`step-${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-full transition-all whitespace-nowrap"
                  style={active
                    ? { background: '#D4AF37', color: '#16110C', fontWeight: 600 }
                    : { background: 'transparent', color: done ? '#D4AF37' : 'rgba(255,248,220,0.65)', border: '1px solid var(--lux-border)' }
                  }>
                  <span className="text-[10px] tracking-[0.2em] uppercase">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-xs uppercase tracking-widest">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(139,0,0,0.18)', border: '1px solid rgba(139,0,0,0.5)', color: '#FFD7C9' }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={STEPS[step].id}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lux-glass p-8 md:p-10"
          >
            {STEPS[step].id === 'couple' && (
              <Step title="The Couple" subtitle="Names will appear in the hero of every invitation.">
                <Row>
                  <Field label="Bride Name"><Input value={form.bride_name} onChange={(v) => setField('bride_name', v)} testid="field-bride" /></Field>
                  <Field label="Groom Name"><Input value={form.groom_name} onChange={(v) => setField('groom_name', v)} testid="field-groom" /></Field>
                </Row>
                <Row>
                  <Field label="Wedding Date"><Input type="date" value={form.wedding_date?.slice(0, 10) || ''} onChange={(v) => setField('wedding_date', v)} testid="field-date" /></Field>
                  <Field label="Wedding Time"><Input type="time" value={form.wedding_time} onChange={(v) => setField('wedding_time', v)} testid="field-time" /></Field>
                </Row>
                <Field label="Language"><Select value={form.language} onChange={(v) => setField('language', v)} options={['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi', 'Hinglish']} testid="field-language" /></Field>

                {/* Photos */}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                  <div className="lux-eyebrow mb-3">◆ Photos · Hero & 3D animation</div>
                  {!id && (
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,248,220,0.55)' }}>
                      Save the draft once to enable photo uploads.
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PhotoUploadField label="Bride Solo"  value={form.bride_photo_url}  onChange={(v) => setField('bride_photo_url',  v)} profileId={id} testid="upload-bride" />
                    <PhotoUploadField label="Groom Solo"  value={form.groom_photo_url}  onChange={(v) => setField('groom_photo_url',  v)} profileId={id} testid="upload-groom" />
                    <PhotoUploadField label="Couple"      value={form.couple_photo_url} onChange={(v) => setField('couple_photo_url', v)} profileId={id} testid="upload-couple" />
                  </div>
                </div>
              </Step>
            )}

            {STEPS[step].id === 'theme' && (
              <Step title="Choose a Theme" subtitle="Click any theme to preview the actual rendered design. Use 'Open in new tab' for a full screen tour.">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="theme-grid">
                  {getAllThemes().map((t) => {
                    const selected = form.design_theme === t.id;
                    return (
                      <div key={t.id} className="lux-glass p-5 transition-all"
                        style={selected ? { borderColor: 'var(--lux-gold)', background: 'rgba(212,175,55,0.07)' } : {}}
                        data-testid={`theme-${t.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.5)' }}>0{t.order}</span>
                          <div className="flex -space-x-1.5">
                            {t.paletteSwatch.map((c, idx) => (
                              <span key={idx} className="w-4 h-4 rounded-full border" style={{ background: c, borderColor: 'rgba(255,248,220,0.2)' }} />
                            ))}
                          </div>
                        </div>
                        <h3 className="font-display text-xl mb-1" style={{ color: '#FFF8DC' }}>{t.name}</h3>
                        <p className="text-xs mb-3" style={{ color: 'rgba(255,248,220,0.55)' }}>{t.culture}</p>
                        <div className="flex items-center justify-between mb-4 text-[10px] tracking-[0.2em] uppercase"
                          style={{ color: 'rgba(255,248,220,0.55)' }}>
                          <span>{t.planRequired}</span>
                          <span className="text-gold">{t.creditCost} credit{t.creditCost > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button" onClick={() => setPreviewTheme(t)}
                            className="lux-btn lux-btn-ghost text-[10px] flex-1 justify-center"
                            data-testid={`theme-preview-${t.id}`}
                          >
                            <Sparkles className="w-3 h-3" /> Preview
                          </button>
                          <button
                            type="button" onClick={() => setField('design_theme', t.id)}
                            className="lux-btn text-[10px] flex-1 justify-center"
                            style={selected ? { background: '#D4AF37', color: '#16110C' } : {}}
                            data-testid={`theme-pick-${t.id}`}
                          >
                            {selected ? <><Check className="w-3 h-3" /> Selected</> : 'Use Theme'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Step>
            )}

            {STEPS[step].id === 'story' && (
              <Step title="Your Love Story" subtitle="Where you met, how it began. Or let Claude write it.">
                <div className="flex justify-end mb-3">
                  <button type="button" onClick={() => setAiOpen(true)} className="lux-btn lux-btn-ghost text-xs" data-testid="ai-compose-story">
                    <Sparkles className="w-3.5 h-3.5" /> AI Compose
                  </button>
                </div>
                <Field label="Story"><Textarea rows={8} value={form.story} onChange={(v) => setField('story', v)} testid="field-story" /></Field>
              </Step>
            )}

            {STEPS[step].id === 'events' && (
              <Step title="Ceremonies" subtitle="Each ceremony has its own page with a separate shareable link. Add as many as you need.">
                <EventsEditor
                  events={form.events || []}
                  onChange={(events) => setField('events', events)}
                  profileId={id}
                  slug={shareLink}
                />
              </Step>
            )}

            {STEPS[step].id === 'venue' && (
              <Step title="The Venue" subtitle="Primary venue. Add a Google Maps link so guests can tap to navigate.">
                <Field label="Venue Name"><Input value={form.venue} onChange={(v) => setField('venue', v)} placeholder="The Leela Palace" testid="field-venue" /></Field>
                <Field label="Full Address"><Textarea rows={3} value={form.venue_address} onChange={(v) => setField('venue_address', v)} placeholder="Lake Pichola, Udaipur, Rajasthan 313001" testid="field-venue-address" /></Field>
                <Field label="Google Maps Link">
                  <Input
                    value={form.venue_google_map_link}
                    onChange={(v) => setField('venue_google_map_link', v)}
                    placeholder="https://maps.google.com/?q=The+Leela+Palace+Udaipur"
                    testid="field-venue-map"
                  />
                </Field>
                <p className="text-xs" style={{ color: 'rgba(255,248,220,0.5)' }}>
                  Open Google Maps → search the venue → tap "Share" → "Copy link" → paste here. Guests tap the "Open in Maps" button on the invitation to get instant turn-by-turn directions.
                </p>
                {form.venue_google_map_link && (
                  <a href={form.venue_google_map_link} target="_blank" rel="noreferrer"
                    className="lux-btn lux-btn-ghost text-xs inline-flex items-center gap-2 mt-2"
                    data-testid="venue-map-test-link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test this Maps link
                  </a>
                )}
              </Step>
            )}

            {STEPS[step].id === 'media' && (
              <Step title="Music" subtitle="Pick from 20 curated tracks or paste your own URL.">
                <MusicPresetPicker
                  value={form.background_music_url}
                  onChange={(v) => setField('background_music_url', v)}
                />
              </Step>
            )}

            {STEPS[step].id === 'flags' && (
              <Step title="Feature Flags" subtitle="Toggle individual capabilities for this invitation.">
                <FeatureFlagsPanel
                  flags={[
                    { key: 'show_rsvp',          label: 'RSVP',                description: 'Collect guest responses with attendance count.',              enabled: form.feature_flags.show_rsvp },
                    { key: 'show_wishes',        label: 'Guest Wishes',        description: 'Public guest book on the invitation.',                          enabled: form.feature_flags.show_wishes },
                    { key: 'show_countdown',     label: 'Countdown',           description: 'Live ticker until the wedding moment.',                         enabled: form.feature_flags.show_countdown },
                    { key: 'show_music',         label: 'Ambient Music',       description: 'Persistent background score with crossfade.',                   enabled: form.feature_flags.show_music },
                    { key: 'show_live_gallery',  label: 'Live Photo Gallery',  description: 'Stream the wedding photos in real-time.',                       enabled: form.feature_flags.show_live_gallery, locked: 'GOLD' },
                    { key: 'show_ai_story',      label: 'AI Story Composer',   description: 'Claude Sonnet 4.5 prose generation.',                           enabled: form.feature_flags.show_ai_story,  locked: 'GOLD' },
                    { key: 'show_digital_shagun',label: 'Digital Shagun',      description: 'Accept gifts via UPI / QR / Razorpay.',                         enabled: form.feature_flags.show_digital_shagun, locked: 'PRO' },
                    { key: 'show_translations',  label: 'Multi-language',      description: 'Auto-translate content to selected language.',                  enabled: form.feature_flags.show_translations,  locked: 'PRO' },
                  ]}
                  onChange={setFlag}
                />
              </Step>
            )}

            {STEPS[step].id === 'publish' && (
              <Step title="Publish" subtitle={published ? 'This wedding is live.' : 'Drafts are free. Publish consumes credits based on theme.'}>
                <div className="space-y-4">
                  <Field label="Privacy Passcode (optional)">
                    <Input value={form.passcode} onChange={(v) => setField('passcode', v)} placeholder="Leave blank for public invite" testid="field-passcode" />
                  </Field>

                  <div className="lux-glass p-6">
                    <div className="lux-eyebrow mb-2">◆ Publishing Cost</div>
                    <div className="font-display text-4xl text-gold mb-2">{getThemeById(form.design_theme).creditCost} credit{getThemeById(form.design_theme).creditCost > 1 ? 's' : ''}</div>
                    <div className="text-sm" style={{ color: 'rgba(255,248,220,0.65)' }}>
                      Theme: {getThemeById(form.design_theme).name}. Your balance: <span className="text-gold font-display">{admin?.available_credits ?? 0}</span>
                    </div>
                  </div>

                  {published && shareLink && (
                    <div className="lux-glass p-6">
                      <div className="lux-eyebrow mb-2">◆ Share Link</div>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <code className="font-mono text-sm break-all" style={{ color: '#FFF8DC' }}>{window.location.origin}/invite/{shareLink}</code>
                        <a href={`/invite/${shareLink}`} target="_blank" rel="noreferrer" className="lux-btn lux-btn-ghost text-xs" data-testid="open-invite-link">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const result = await save({ publish: true });
                      if (result) setPublished(true);
                    }}
                    disabled={saving || (admin?.available_credits ?? 0) < getThemeById(form.design_theme).creditCost}
                    className="lux-btn w-full justify-center"
                    data-testid="publish-btn"
                  >
                    {saving ? 'Publishing…' : published ? 'Re-publish (free)' : 'Publish Now'}
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={prev} disabled={step === 0} className="lux-btn lux-btn-ghost text-xs disabled:opacity-40" data-testid="step-prev">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={next} disabled={step === STEPS.length - 1} className="lux-btn text-xs disabled:opacity-40" data-testid="step-next">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AIStoryComposer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onInsert={(text) => { setField('story', text); setAiOpen(false); }}
        defaults={{ bride: form.bride_name, groom: form.groom_name, theme: form.design_theme, kind: 'love_story', language: form.language }}
      />

      <ThemePreviewModal
        open={!!previewTheme}
        theme={previewTheme}
        onClose={() => setPreviewTheme(null)}
        onUse={(themeId) => setField('design_theme', themeId)}
      />
    </LuxuryShell>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */

const Step = ({ title, subtitle, children }) => (
  <div>
    <h2 className="font-display text-3xl md:text-[2.4rem] leading-tight mb-2" style={{ color: '#FFF8DC' }}>{title}</h2>
    {subtitle && <p className="text-sm mb-7" style={{ color: 'rgba(255,248,220,0.6)' }}>{subtitle}</p>}
    <div className="space-y-4">{children}</div>
  </div>
);

const Row = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>{label}</span>
    {children}
  </label>
);

const baseInput = {
  width: '100%', padding: '0.85rem 1rem', background: 'transparent', color: '#FFF8DC',
  border: '1px solid var(--lux-border)', borderRadius: '0.5rem', outline: 'none',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', caretColor: '#D4AF37',
};
const Input = ({ value, onChange, type = 'text', placeholder, testid }) => (
  <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={baseInput} data-testid={testid} />
);
const Textarea = ({ value, onChange, rows = 4, testid }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
    style={{ ...baseInput, resize: 'vertical', minHeight: 80 }} data-testid={testid} />
);
const Select = ({ value, onChange, options, testid }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    style={{ ...baseInput, cursor: 'pointer', appearance: 'none' }} data-testid={testid}>
    {options.map((o) => <option key={o} value={o} style={{ background: '#1A130B' }}>{o}</option>)}
  </select>
);

/* ── Events sub-editor ────────────────────────────────────── */
const EVENT_TYPES = ['Mehndi', 'Sangeet', 'Haldi', 'Wedding', 'Reception', 'Engagement', 'Cocktail', 'Sufi Night'];

const slugifyEventType = (t) => (t || 'event').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const EventsEditor = ({ events, onChange, profileId, slug }) => {
  const add = () => onChange([
    ...events,
    {
      id: `tmp-${Date.now()}`,
      event_type: 'Mehndi',
      title: '',
      event_date: '',
      start_time: '',
      venue: '',
      venue_address: '',
      description: '',
      google_map_link: '',
      dress_code: '',
      hero_photo_url: '',
    },
  ]);
  const update = (i, k, v) => onChange(events.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
  const remove = (i) => onChange(events.filter((_, idx) => idx !== i));

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [copiedIdx, setCopiedIdx] = React.useState(null);
  const copy = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-4" data-testid="events-editor">
      {events.length === 0 && (
        <div className="lux-glass p-6 text-center" style={{ borderStyle: 'dashed' }}>
          <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>
            No ceremonies added yet. Each ceremony gets its own page and link.
          </p>
        </div>
      )}
      {events.map((e, i) => {
        const eventSlug = slugifyEventType(e.event_type);
        const eventLink = slug ? `${origin}/invite/${slug}/${eventSlug}` : '';
        return (
          <div key={e.id || i} className="lux-glass p-5" data-testid={`event-row-${i}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="lux-eyebrow text-[10px]">Ceremony {i + 1} · {e.event_type || 'Event'}</span>
              <button type="button" onClick={() => remove(i)} className="text-xs tracking-widest uppercase" style={{ color: '#FFB0A0' }} data-testid={`remove-event-${i}`}>Remove</button>
            </div>
            <Row>
              <Field label="Type"><Select value={e.event_type} onChange={(v) => update(i, 'event_type', v)} options={EVENT_TYPES} testid={`event-type-${i}`} /></Field>
              <Field label="Title"><Input value={e.title} onChange={(v) => update(i, 'title', v)} placeholder="An evening of music" testid={`event-title-${i}`} /></Field>
            </Row>
            <Row>
              <Field label="Date"><Input type="date" value={e.event_date?.slice(0, 10) || ''} onChange={(v) => update(i, 'event_date', v)} testid={`event-date-${i}`} /></Field>
              <Field label="Start Time"><Input type="time" value={e.start_time || ''} onChange={(v) => update(i, 'start_time', v)} testid={`event-time-${i}`} /></Field>
            </Row>
            <Field label="Venue Name"><Input value={e.venue} onChange={(v) => update(i, 'venue', v)} placeholder="The Leela Palace" testid={`event-venue-${i}`} /></Field>
            <Field label="Full Venue Address"><Textarea rows={2} value={e.venue_address || ''} onChange={(v) => update(i, 'venue_address', v)} placeholder="Lake Pichola, Udaipur" testid={`event-address-${i}`} /></Field>
            <Field label="Google Maps Link">
              <Input value={e.google_map_link || ''} onChange={(v) => update(i, 'google_map_link', v)}
                placeholder="https://maps.google.com/?q=…" testid={`event-map-${i}`} />
            </Field>
            <Row>
              <Field label="Dress Code"><Input value={e.dress_code || ''} onChange={(v) => update(i, 'dress_code', v)} placeholder="Pastel · Indo-Western" testid={`event-dresscode-${i}`} /></Field>
              <Field label="Description"><Textarea rows={2} value={e.description || ''} onChange={(v) => update(i, 'description', v)} testid={`event-desc-${i}`} /></Field>
            </Row>

            {/* Hero photo for this event */}
            <div className="mt-4">
              <PhotoUploadField
                label={`${e.event_type || 'Event'} Hero Photo`}
                value={e.hero_photo_url || ''}
                onChange={(v) => update(i, 'hero_photo_url', v)}
                profileId={profileId}
                testid={`event-hero-${i}`}
              />
            </div>

            {/* Per-event shareable link */}
            {slug && (
              <div className="mt-4 px-4 py-3 rounded-lg flex items-center justify-between gap-3 flex-wrap"
                style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.25)' }}
                data-testid={`event-link-${i}`}
              >
                <div className="min-w-0">
                  <span className="lux-eyebrow text-[9px] block mb-1">◆ Separate link for {e.event_type}</span>
                  <code className="font-mono text-xs break-all" style={{ color: '#FFF8DC' }}>{eventLink}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => copy(eventLink, i)}
                    className="lux-btn lux-btn-ghost text-[10px] inline-flex items-center gap-1.5"
                    data-testid={`event-copy-${i}`}
                  >
                    {copiedIdx === i ? <><Check className="w-3 h-3" /> Copied</> : 'Copy'}
                  </button>
                  <a href={eventLink} target="_blank" rel="noreferrer"
                    className="lux-btn text-[10px] inline-flex items-center gap-1.5"
                    data-testid={`event-open-${i}`}
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                </div>
              </div>
            )}
            {!slug && (
              <p className="mt-3 text-[11px] italic" style={{ color: 'rgba(255,248,220,0.45)' }}>
                Save the wedding draft first to generate the separate ceremony link.
              </p>
            )}
          </div>
        );
      })}
      <button type="button" onClick={add} className="lux-btn lux-btn-ghost w-full justify-center" data-testid="add-event">
        + Add Ceremony
      </button>
    </div>
  );
};

export default LuxuryProfileForm;
