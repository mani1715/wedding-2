import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import axios from 'axios';
import { Calendar, MapPin, Send, Heart, MessageCircle, Clock, Sparkles, Lock } from 'lucide-react';
import WaxSealOpening from '@/components/luxury/WaxSealOpening';
import PetalConfetti from '@/components/luxury/PetalConfetti';
import AmbientMusicPlayer from '@/components/luxury/AmbientMusicPlayer';
import WatermarkOverlay from '@/components/luxury/WatermarkOverlay';
import MandalaLoader from '@/components/luxury/MandalaLoader';
import ScrollSection from '@/components/luxury/ScrollSection';
import DigitalShagunSection from '@/components/luxury/DigitalShagunSection';
import TravelLinksSection from '@/components/luxury/TravelLinksSection';
import VenuesSection from '@/components/luxury/VenuesSection';
import GiftRegistrySection from '@/components/luxury/GiftRegistrySection';
import LivePhotoWallTeaser from '@/components/luxury/LivePhotoWallTeaser';
import FindMyPhotosModal from '@/components/luxury/FindMyPhotosModal';
import MajaReferralCTA from '@/components/luxury/MajaReferralCTA';
import PersonalizedWelcome from '@/components/luxury/PersonalizedWelcome';
import { getThemeById } from '@/themes/masterThemes';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const LuxuryPublicInvitation = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('g');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [wishDone, setWishDone] = useState(false);
  const [galleryInfo, setGalleryInfo] = useState(null);
  const [findOpen, setFindOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('luxe', 'luxe-grain', 'luxe-vignette');
    return () => document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
  }, []);

  useEffect(() => { fetchInvite(); /* eslint-disable-next-line */ }, [slug]);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API_URL}/api/public/gallery/${slug}/info`)
      .then((r) => setGalleryInfo(r.data))
      .catch(() => setGalleryInfo(null));
  }, [slug]);

  const fetchInvite = async (code = null) => {
    setLoading(true); setError('');
    try {
      const url = `${API_URL}/api/invite/${slug}${code ? `?passcode=${encodeURIComponent(code)}` : ''}`;
      const res = await axios.get(url);
      setData(res.data);
      setRequirePasscode(false);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setRequirePasscode(true);
      } else if (e.response?.status === 404) {
        setError('This invitation could not be found.');
      } else if (e.response?.status === 410) {
        setError('This invitation has expired.');
      } else {
        setError(e.response?.data?.detail || 'Failed to load invitation.');
      }
    } finally { setLoading(false); }
  };

  if (loading) {
    return <div className="luxe min-h-screen grid place-items-center"><MandalaLoader label="Opening invitation" /></div>;
  }

  if (requirePasscode) {
    return (
      <div className="luxe min-h-screen grid place-items-center px-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchInvite(passcode); }}
          className="lux-glass p-10 max-w-md w-full text-center" data-testid="passcode-form">
          <div className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-5"
            style={{ background: 'radial-gradient(circle at 30% 30%, #E8C766, #8C6A1A)' }}>
            <Lock className="w-5 h-5" style={{ color: '#16110C' }} />
          </div>
          <span className="lux-eyebrow block mb-3">◆ Private Invitation</span>
          <h2 className="font-display text-3xl mb-2" style={{ color: '#FFF8DC' }}>Passcode required</h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,248,220,0.6)' }}>This invitation is locked. Please enter the passcode shared with you.</p>
          <input type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} required
            placeholder="••••••" className="w-full px-4 py-3 rounded-lg bg-transparent text-center tracking-[0.4em] outline-none mb-4"
            style={{ color: '#FFF8DC', border: '1px solid var(--lux-border)' }} data-testid="passcode-input" />
          <button type="submit" className="lux-btn w-full justify-center" data-testid="passcode-submit">Unlock</button>
        </form>
      </div>
    );
  }

  if (error) {
    return (
      <div className="luxe min-h-screen grid place-items-center px-6">
        <div className="lux-glass p-10 max-w-md text-center" data-testid="invite-error">
          <h2 className="font-display text-3xl mb-3" style={{ color: '#FFF8DC' }}>Oh dear.</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,248,220,0.65)' }}>{error}</p>
          <button onClick={() => navigate('/')} className="lux-btn lux-btn-ghost">Back to studio</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Backend returns FLAT InvitationPublicView (not wrapped in `profile`)
  const themeId = data.design_id || data.design_theme || 'royal_mughal';
  const theme = getThemeById(themeId);
  const bride = data.bride_name || 'Bride';
  const groom = data.groom_name || 'Groom';
  const monogram = `${(bride[0] || 'A').toUpperCase()} & ${(groom[0] || 'B').toUpperCase()}`;
  const weddingDate = data.event_date ? new Date(data.event_date) : null;
  const events = data.events || [];
  const greetings = (data.greetings || []).slice(0, 8);
  const planType = data.plan_type || 'FREE';
  const watermark = planType === 'FREE';
  const musicUrl = data.background_music?.file_url || data.background_music?.url || '';
  const venueText = data.venue || '';
  const venueAddress = data.city || '';
  const story = data.love_story || data.story || '';

  return (
    <WaxSealOpening monogram={monogram} subtitle={`${bride} & ${groom}`} ctaLabel="Open Invitation" storageKey={`invite-${slug}-opened`}>
      <div className="luxe min-h-screen relative" data-testid="public-invitation">
        {/* Prompt 14 — Personalized welcome (only if ?g=token in URL) */}
        {guestToken && <PersonalizedWelcome slug={slug} token={guestToken} />}

        {watermark && <WatermarkOverlay />}

        {/* Hero */}
        <HeroCover bride={bride} groom={groom} date={weddingDate} theme={theme} />

        {/* Story */}
        {story && (
          <ScrollSection className="px-6 md:px-16 py-24 max-w-4xl mx-auto" testid="section-story">
            <span className="lux-eyebrow block mb-5">◆ Our Story</span>
            <h2 className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.05] mb-8" style={{ color: '#FFF8DC' }}>
              How <span className="text-gold italic font-script">we</span> met
            </h2>
            <p className="font-heading text-[1.1rem] md:text-[1.25rem] leading-[1.85] whitespace-pre-wrap"
              style={{ color: 'rgba(255,248,220,0.78)' }}>
              {story}
            </p>
          </ScrollSection>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section className="px-6 md:px-16 py-24" data-testid="section-events">
            <div className="max-w-5xl mx-auto">
              <ScrollSection>
                <span className="lux-eyebrow block mb-5">◆ Ceremonies</span>
                <h2 className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.05] mb-12" style={{ color: '#FFF8DC' }}>
                  Four days of <span className="text-gold italic font-script">celebration.</span>
                </h2>
              </ScrollSection>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {events.map((evt, i) => (
                  <ScrollSection key={evt.id || i} delay={i * 0.06}>
                    <div className="lux-glass p-7" data-testid={`event-card-${i}`}>
                      <div className="lux-eyebrow text-[10px] mb-3">◆ {evt.event_type || `Event ${i + 1}`}</div>
                      <h3 className="font-display text-2xl mb-2" style={{ color: '#FFF8DC' }}>{evt.title || evt.name || evt.event_type}</h3>
                      {evt.event_date && (
                        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'rgba(255,248,220,0.65)' }}>
                          <Calendar className="w-3.5 h-3.5" /> {new Date(evt.event_date).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      {(evt.venue || evt.location) && (
                        <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(255,248,220,0.65)' }}>
                          <MapPin className="w-3.5 h-3.5" /> {evt.venue || evt.location}
                        </div>
                      )}
                      {evt.description && (
                        <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(255,248,220,0.62)' }}>{evt.description}</p>
                      )}
                    </div>
                  </ScrollSection>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Venue / map */}
        {venueText && (
          <ScrollSection className="px-6 md:px-16 py-24 max-w-4xl mx-auto" testid="section-venue">
            <span className="lux-eyebrow block mb-5">◆ Venue</span>
            <h2 className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.05] mb-6" style={{ color: '#FFF8DC' }}>
              The <span className="text-gold italic font-script">where.</span>
            </h2>
            <p className="text-[1.05rem] leading-relaxed mb-2" style={{ color: 'rgba(255,248,220,0.8)' }}>{venueText}</p>
            {venueAddress && <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,248,220,0.6)' }}>{venueAddress}</p>}
            <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent([venueText, venueAddress].filter(Boolean).join(', '))}`} className="lux-btn lux-btn-ghost">
              Open in Maps <MapPin className="w-3.5 h-3.5" />
            </a>
          </ScrollSection>
        )}

        {/* Countdown */}
        {weddingDate && <Countdown date={weddingDate} />}

        {/* RSVP */}
        <ScrollSection className="px-6 md:px-16 py-24" testid="section-rsvp">
          <div className="max-w-2xl mx-auto">
            <span className="lux-eyebrow block mb-5">◆ Will you be there?</span>
            <h2 className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.05] mb-8" style={{ color: '#FFF8DC' }}>
              Kindly <span className="text-gold italic font-script">respond.</span>
            </h2>
            <RSVPForm slug={slug} onSuccess={() => setRsvpDone(true)} />
          </div>
        </ScrollSection>

        {/* Wishes */}
        <ScrollSection className="px-6 md:px-16 py-24" testid="section-wishes">
          <div className="max-w-3xl mx-auto">
            <span className="lux-eyebrow block mb-5">◆ Guest Book</span>
            <h2 className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.05] mb-8" style={{ color: '#FFF8DC' }}>
              A wish for the <span className="text-gold italic font-script">couple.</span>
            </h2>

            <WishForm slug={slug} onSuccess={() => { setWishDone(true); fetchInvite(); }} />

            {greetings.length > 0 && (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="wishes-list">
                {greetings.map((g, i) => (
                  <motion.div key={g.id || i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                    className="lux-glass p-5">
                    <p className="font-heading text-[1rem] leading-relaxed italic mb-3" style={{ color: '#FFF8DC' }}>
                      “{g.message || g.wish}”
                    </p>
                    <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>
                      — {g.guest_name || g.name || 'A guest'}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollSection>

        {/* Phase 38 — Live Photo Wall teaser */}
        <LivePhotoWallTeaser slug={slug} />

        {/* Sprint 10 — Find My Photos CTA (AI face match) */}
        {galleryInfo?.enabled && (
          <section className="px-6 md:px-12 py-12 md:py-16 text-center" data-testid="find-photos-cta">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7 }} className="max-w-2xl mx-auto">
              <span className="lux-eyebrow inline-block mb-3">◆ AI-powered photo search</span>
              <h2 className="font-display text-[1.9rem] md:text-[2.6rem] mb-3" style={{ color: '#FFF8DC' }}>
                Find <span className="font-script italic text-gold">your photos</span> from the wedding
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: 'rgba(255,248,220,0.7)' }}>
                Upload one selfie. Our AI will instantly find every photo of you from the {galleryInfo.total_photos || ''} captured at the wedding.
              </p>
              <button onClick={() => setFindOpen(true)} className="lux-btn inline-flex items-center gap-2"
                data-testid="open-find-photos">
                <Sparkles className="w-4 h-4" /> Find My Photos
              </button>
            </motion.div>
          </section>
        )}

        {/* Sprint 8 — Multi-venue travel section */}
        <VenuesSection slug={slug} />

        {/* Sprint 9 — Optional gift registry / "no gifts please" note */}
        <GiftRegistrySection slug={slug} />

        {/* Digital Shagun (UPI live blessing counter) */}
        <DigitalShagunSection slug={slug} couple={`${bride} & ${groom}`} />

        {/* Viral photographer-referral CTA */}
        <MajaReferralCTA slug={slug} />

        {/* Footer */}
        <footer className="px-6 md:px-16 py-14 text-center border-t" style={{ borderColor: 'var(--lux-border)' }}>
          <div className="font-script text-3xl text-gold mb-2 italic">{bride} & {groom}</div>
          <div className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>
            Crafted with reverence · MAJA Creations
          </div>
        </footer>

        {musicUrl && <AmbientMusicPlayer src={musicUrl} defaultVolume={0.35} />}
        <PetalConfetti trigger={rsvpDone ? Date.now() : false} count={42} duration={5200} />
        <PetalConfetti trigger={wishDone ? Date.now() : false} count={26} duration={4200} />
        <FindMyPhotosModal slug={slug} open={findOpen} onClose={() => setFindOpen(false)} />
      </div>
    </WaxSealOpening>
  );
};

const HeroCover = ({ bride, groom, date, theme }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 180]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.15]);
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-16 overflow-hidden" data-testid="section-hero">
      <div className="lux-orbit" style={{ width: 760, height: 760, top: -180, right: -180 }} />
      <div className="lux-orbit" style={{ width: 1100, height: 1100, top: -360, right: -360, opacity: 0.5 }} />
      <motion.div style={{ y, opacity }} className="text-center relative z-10 max-w-4xl">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}
          className="lux-eyebrow block mb-6">◆ {theme.culture} · {theme.name}</motion.span>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[3.2rem] md:text-[7rem] leading-[0.95] tracking-tight" style={{ color: '#FFF8DC' }}>
          {bride}
          <span className="block text-gold italic font-script font-light my-2 md:my-4 text-[2.2rem] md:text-[4.5rem]">&amp;</span>
          {groom}
        </motion.h1>
        {date && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }}
            className="mt-10 inline-flex items-center gap-4 text-sm tracking-[0.3em] uppercase"
            style={{ color: 'rgba(255,248,220,0.7)' }}>
            <Calendar className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <span>{date.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

const Countdown = ({ date }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(date.getTime() - now, 0);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <ScrollSection className="px-6 md:px-16 py-20 max-w-4xl mx-auto" testid="section-countdown">
      <span className="lux-eyebrow block mb-5 text-center">◆ Until the moment</span>
      <div className="grid grid-cols-4 gap-3 md:gap-6">
        {[{ v: d, l: 'Days' }, { v: h, l: 'Hours' }, { v: m, l: 'Min' }, { v: s, l: 'Sec' }].map((u) => (
          <div key={u.l} className="lux-glass p-5 text-center">
            <div className="font-display text-4xl md:text-6xl text-gold leading-none">{String(u.v).padStart(2, '0')}</div>
            <div className="mt-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,248,220,0.6)' }}>{u.l}</div>
          </div>
        ))}
      </div>
    </ScrollSection>
  );
};

const RSVPForm = ({ slug, onSuccess }) => {
  const [form, setForm] = useState({ guest_name: '', email: '', guest_phone: '+91', status: 'yes', guest_count: 1, message: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await axios.post(
        `${API_URL}/api/rsvp?slug=${encodeURIComponent(slug)}`,
        {
          guest_name:  form.guest_name,
          guest_phone: form.guest_phone,
          status:      form.status,
          guest_count: parseInt(form.guest_count, 10) || 1,
          message:     form.message || undefined,
        }
      );
      setDone(true); onSuccess?.();
    } catch (e) {
      const d = e.response?.data?.detail;
      const msg = Array.isArray(d) ? d.map((x) => `${(x.loc || []).slice(-1)[0]}: ${x.msg}`).join(' · ') : (d || 'RSVP failed.');
      setErr(msg);
    }
    finally { setBusy(false); }
  };

  if (done) return (
    <div className="lux-glass p-8 text-center" data-testid="rsvp-success">
      <Sparkles className="w-5 h-5 mx-auto mb-3" style={{ color: '#D4AF37' }} />
      <h3 className="font-display text-2xl mb-2" style={{ color: '#FFF8DC' }}>Thank you.</h3>
      <p className="text-sm" style={{ color: 'rgba(255,248,220,0.7)' }}>Your response has been received with love.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="lux-glass p-7 space-y-4" data-testid="rsvp-form">
      <Row>
        <LField label="Your Name"><input required type="text" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} style={lInput} data-testid="rsvp-name" /></LField>
        <LField label="Phone (with +91)"><input required type="tel" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} placeholder="+919876543210" style={lInput} data-testid="rsvp-phone" /></LField>
      </Row>
      <Row>
        <LField label="Attending"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...lInput, cursor: 'pointer', appearance: 'none' }} data-testid="rsvp-attending">
          <option value="yes" style={{ background: '#1A130B' }}>Yes, with joy</option>
          <option value="no" style={{ background: '#1A130B' }}>Regretfully no</option>
          <option value="maybe" style={{ background: '#1A130B' }}>Trying my best</option>
        </select></LField>
        <LField label="Guests"><input type="number" min={1} max={10} value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} style={lInput} data-testid="rsvp-guests" /></LField>
      </Row>
      <LField label="Message (optional)"><textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ ...lInput, resize: 'vertical' }} data-testid="rsvp-message" /></LField>
      {err && <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(139,0,0,0.18)', color: '#FFD7C9' }}>{err}</div>}
      <button type="submit" disabled={busy} className="lux-btn w-full justify-center" data-testid="rsvp-submit">
        {busy ? 'Sending…' : 'Send RSVP'} <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};

const WishForm = ({ slug, onSuccess }) => {
  const [form, setForm] = useState({ guest_name: '', message: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await axios.post(`${API_URL}/api/invite/${slug}/greetings`, {
        guest_name: form.guest_name,
        message: form.message,
      });
      setDone(true); setForm({ guest_name: '', message: '' }); onSuccess?.();
    } catch (e) {
      const d = e.response?.data?.detail;
      const msg = Array.isArray(d) ? d.map((x) => `${(x.loc || []).slice(-1)[0]}: ${x.msg}`).join(' · ') : (d || 'Could not send wish.');
      setErr(msg);
    }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="lux-glass p-7 space-y-4" data-testid="wish-form">
      <Row>
        <LField label="Your Name"><input required type="text" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} style={lInput} data-testid="wish-name" /></LField>
      </Row>
      <LField label="Your Wish (250 chars max)"><textarea required maxLength={250} rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="A blessing for the couple…" style={{ ...lInput, resize: 'vertical' }} data-testid="wish-message" /></LField>
      {done && <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(212,175,55,0.12)', color: '#E8C766' }}>Wish recorded. Thank you.</div>}
      {err && <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(139,0,0,0.18)', color: '#FFD7C9' }}>{err}</div>}
      <button type="submit" disabled={busy} className="lux-btn lux-btn-ghost" data-testid="wish-submit">
        {busy ? 'Sending…' : 'Send Wish'} <MessageCircle className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};

const lInput = {
  width: '100%', padding: '0.85rem 1rem', background: 'transparent', color: '#FFF8DC',
  border: '1px solid var(--lux-border)', borderRadius: '0.5rem', outline: 'none',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', caretColor: '#D4AF37',
};

const Row = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;

const LField = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>{label}</span>
    {children}
  </label>
);

export default LuxuryPublicInvitation;
