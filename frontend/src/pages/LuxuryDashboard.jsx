import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Crown, LogOut, Plus, Wallet, Sparkles, Camera, Heart, Calendar,
  ExternalLink, Edit3, Trash2, Eye, ArrowUpRight, Search, Layers, MessageCircle, Image as ImageIcon,
  Wand2, Gift, Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AIStoryComposer from '@/components/luxury/AIStoryComposer';
import { MASTER_THEMES, getThemeById } from '@/themes/masterThemes';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: (i = 0) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

const LuxuryDashboard = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('luxe', 'luxe-grain', 'luxe-vignette');
    return () => document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
  }, []);

  useEffect(() => {
    if (!admin) { navigate('/admin/login'); return; }
    if (admin.role === 'super_admin') { navigate('/super-admin/dashboard'); return; }
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/profiles`);
      setProfiles(res.data || []);
    } catch (e) {
      console.error('Failed to load profiles', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter((p) => (
      (p.bride_name || '').toLowerCase().includes(q) ||
      (p.groom_name || '').toLowerCase().includes(q) ||
      (p.share_link || '').toLowerCase().includes(q)
    ));
  }, [profiles, search]);

  const credits = admin?.available_credits ?? 0;
  const publishedCount = profiles.filter((p) => p.status === 'published' || p.is_published).length;
  const draftCount = profiles.length - publishedCount;

  const goCreate = () => navigate('/admin/profile/new');
  const goEdit = (p) => navigate(`/admin/profile/${p.id}/edit`);
  const goRsvp = (p) => navigate(`/admin/profile/${p.id}/rsvps`);
  const goAnalytics = (p) => navigate(`/admin/profile/${p.id}/analytics`);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="luxe min-h-screen relative" data-testid="luxury-dashboard">
      {/* Top bar */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between border-b"
        style={{ background: 'rgba(14,10,6,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--lux-border)' }}
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/brand/maja-icon-64.png" alt="MAJA Creations"
            className="w-9 h-9 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 1px var(--lux-border-strong), inset 0 0 0 1px rgba(232,199,102,0.18)' }} />
          <span className="font-display text-[1.25rem] tracking-wide" style={{ color: '#FFF8DC' }}>
            MAJA<span className="text-gold"> </span>Creations
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ border: '1px solid var(--lux-border-strong)', background: 'rgba(212,175,55,0.06)' }}>
            <Wallet className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(255,248,220,0.65)' }}>Credits</span>
            <span className="font-display text-lg text-gold ml-1" data-testid="dashboard-credits">{credits}</span>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>Studio</div>
            <div className="font-heading text-sm" style={{ color: '#FFF8DC' }}>{admin?.name || admin?.email}</div>
          </div>
          <button onClick={handleLogout} className="lux-btn lux-btn-ghost text-xs" data-testid="dashboard-logout">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </motion.nav>

      <div className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto relative z-10">
        {/* Hero greeting */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mb-12">
          <motion.span variants={fadeUp} className="lux-eyebrow block mb-4">◆ Studio Console</motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-[2.6rem] md:text-[4.2rem] leading-[1.02] tracking-tight" style={{ color: '#FFF8DC' }}>
            Good day, <span className="text-gold italic font-script">{admin?.name?.split(' ')[0] || 'maestro'}.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-4 max-w-xl text-[1.02rem]" style={{ color: 'rgba(255,248,220,0.65)' }}>
            Compose, publish and watch couples weep. Drafts are free — credits consume only on publish.
          </motion.p>
        </motion.div>

        {/* Stat tiles */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatTile icon={Wallet}    label="Available Credits" value={credits}        testid="stat-credits" />
          <StatTile icon={Camera}    label="Published Weddings" value={publishedCount} testid="stat-published" />
          <StatTile icon={Edit3}     label="Drafts"             value={draftCount}     testid="stat-drafts" />
          <StatTile icon={Layers}    label="Available Themes"   value={Object.keys(MASTER_THEMES).length} testid="stat-themes" />
        </motion.div>

        {/* Action bar */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="lux-glass p-6 md:p-7 mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={goCreate} className="lux-btn" data-testid="dashboard-create-wedding">
              <Plus className="w-4 h-4" /> Create Wedding
            </button>
            <button onClick={() => setAiOpen(true)} className="lux-btn lux-btn-ghost" data-testid="dashboard-ai-story-btn">
              <Sparkles className="w-4 h-4" /> AI Story Composer
            </button>
            <button onClick={() => navigate('/admin/audit-logs')} className="lux-btn lux-btn-ghost" data-testid="dashboard-audit-logs">
              <Eye className="w-4 h-4" /> Audit Logs
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,248,220,0.45)' }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search couples…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-transparent outline-none text-sm"
              style={{ color: '#FFF8DC', border: '1px solid var(--lux-border)' }}
              data-testid="dashboard-search"
            />
          </div>
        </motion.div>

        {/* Weddings grid */}
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
            <h2 className="font-display text-3xl" style={{ color: '#FFF8DC' }}>Your Weddings</h2>
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(255,248,220,0.5)' }}>
              {filtered.length} total
            </span>
          </motion.div>

          {loading ? (
            <div className="grid place-items-center py-20">
              <div className="lux-mandala" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div variants={fadeUp} className="lux-glass p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid var(--lux-border-strong)' }}>
                <ImageIcon className="w-5 h-5" style={{ color: '#D4AF37' }} />
              </div>
              <h3 className="font-display text-2xl mb-2" style={{ color: '#FFF8DC' }}>No weddings yet</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,248,220,0.6)' }}>
                Create your first masterpiece. Drafts cost zero credits.
              </p>
              <button onClick={goCreate} className="lux-btn" data-testid="dashboard-empty-create">
                <Plus className="w-4 h-4" /> Create First Wedding
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p, i) => {
                const theme = getThemeById(p.design_theme || p.theme_id);
                const isPublished = p.status === 'published' || p.is_published;
                return (
                  <motion.div key={p.id} variants={fadeUp} custom={i}
                    whileHover={{ y: -4 }}
                    className="lux-glass overflow-hidden flex flex-col"
                    data-testid={`profile-card-${p.id}`}
                  >
                    {/* Theme palette strip */}
                    <div className="h-3 flex">
                      {theme.paletteSwatch.map((c, idx) => (
                        <div key={idx} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-display text-[1.6rem] leading-tight" style={{ color: '#FFF8DC' }}>
                            {p.bride_name || 'Bride'} <span className="text-gold italic font-script">&</span> {p.groom_name || 'Groom'}
                          </h3>
                          <p className="text-xs tracking-[0.2em] uppercase mt-1" style={{ color: 'rgba(255,248,220,0.55)' }}>
                            {theme.name}
                          </p>
                        </div>
                        <span
                          className="text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                          style={isPublished
                            ? { background: 'rgba(212,175,55,0.16)', border: '1px solid var(--lux-gold)', color: '#D4AF37' }
                            : { background: 'rgba(255,248,220,0.06)', border: '1px solid var(--lux-border)', color: 'rgba(255,248,220,0.6)' }}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      {p.wedding_date && (
                        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'rgba(255,248,220,0.55)' }}>
                          <Calendar className="w-3.5 h-3.5" /> {new Date(p.wedding_date).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      )}

                      <div className="lux-hairline my-3" />

                      <div className="mt-auto flex flex-wrap gap-2 text-xs">
                        <ActionBtn onClick={() => goEdit(p)}     icon={Edit3}      label="Edit"      testid={`edit-${p.id}`} />
                        <ActionBtn onClick={() => goRsvp(p)}     icon={MessageCircle} label="RSVPs"  testid={`rsvp-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/guests`)} icon={Users} label="Guest List" testid={`guests-${p.id}`} />
                        <ActionBtn onClick={() => goAnalytics(p)} icon={Eye}        label="Insights" testid={`analytics-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/ai-studio`)}     icon={Wand2}    label="AI Studio"  testid={`ai-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/live-gallery`)}  icon={Camera}   label="Live Wall"  testid={`live-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/wishes`)}        icon={Heart}    label="Wishes"     testid={`wishes-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/whatsapp`)}      icon={MessageCircle} label="WhatsApp" testid={`whatsapp-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/shagun`)}        icon={Gift}     label="Shagun"     testid={`shagun-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/gifts`)}         icon={Gift}     label="Gifts"      testid={`gifts-${p.id}`} />
                        <ActionBtn onClick={() => navigate(`/admin/profile/${p.id}/gallery`)}       icon={Camera}   label="AI Gallery" testid={`gallery-${p.id}`} />
                        {isPublished && p.share_link && (
                          <ActionBtn
                            onClick={() => window.open(`/invite/${p.share_link}`, '_blank')}
                            icon={ExternalLink} label="Open" testid={`open-${p.id}`} primary />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick links footer */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-16 lux-glass p-8 flex flex-wrap items-center justify-between gap-4" data-testid="topup-footer">
          <div>
            <h3 className="font-display text-2xl mb-1" style={{ color: '#FFF8DC' }}>
              Need more credits?
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,248,220,0.55)' }}>
              Plans never expire. Top up anytime — drafts stay free.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/themes')} className="lux-btn lux-btn-ghost" data-testid="dashboard-browse-themes">
              Browse Themes <Layers className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/admin/credits/top-up')} className="lux-btn" data-testid="dashboard-top-up">
              Top Up Credits <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      <AIStoryComposer open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

const StatTile = ({ icon: Icon, label, value, testid }) => (
  <motion.div variants={fadeUp} className="lux-glass p-5 flex flex-col gap-3" data-testid={testid}>
    <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} /> {label}
    </div>
    <div className="font-display text-4xl text-gold leading-none">{value}</div>
  </motion.div>
);

const ActionBtn = ({ icon: Icon, label, onClick, testid, primary }) => (
  <button onClick={onClick} data-testid={testid}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
    style={primary
      ? { background: '#D4AF37', color: '#16110C', fontWeight: 600 }
      : { background: 'transparent', color: 'rgba(255,248,220,0.78)', border: '1px solid var(--lux-border)' }
    }
  >
    <Icon className="w-3 h-3" /> {label}
  </button>
);

export default LuxuryDashboard;
