import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  Sparkles, Camera, Crown, Wallet, ShieldCheck, Layers, ArrowRight,
  Heart, Music, Image as ImageIcon, QrCode, Globe2, MessageCircle, Star,
} from 'lucide-react';
import '../styles/luxury.css';
import HeroMandala3D from '../components/luxury/HeroMandala3D';

/* ──────────────────────────────────────────────────────────────
   Premium B2B SaaS Landing for Indian Wedding Photographers
   Palette: Royal Heritage (Crimson + Champagne Gold + Ivory + Charcoal)
   ────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 36, filter: 'blur(8px)' },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/* The 10 cinematic master themes (per spec) */
const MASTER_THEMES = [
  { name: 'Royal Mughal',         palette: ['#8B0000', '#D4AF37', '#FFF8DC'], hint: 'Crimson · Gold · Ivory' },
  { name: 'South Indian Temple',  palette: ['#D4AF37', '#420D09', '#F5E6BE'], hint: 'Gold · Maroon · Parchment' },
  { name: 'Modern Minimal',       palette: ['#DCAE96', '#8A9A5B', '#F5F5DC'], hint: 'Dusty Rose · Sage · Sand' },
  { name: 'Beach Destination',    palette: ['#005F69', '#BFA379', '#F2D2BD'], hint: 'Teal · Bronze · Peach' },
  { name: 'Punjabi Sangeet',      palette: ['#4B0082', '#C0C0C0', '#FFFFFF'], hint: 'Imperial Purple · Silver' },
  { name: 'Bengali Traditional',  palette: ['#8B0000', '#FFFFFF', '#D4AF37'], hint: 'Red · White · Gold' },
  { name: 'Christian Elegant',    palette: ['#3D2B1F', '#F5F5DC', '#DCAE96'], hint: 'Mocha · Sand · Rose' },
  { name: 'Muslim Nikah',         palette: ['#355E3B', '#D4AF37', '#FFF8DC'], hint: 'Hunter Green · Gold' },
  { name: 'Nature / Eco Wedding', palette: ['#8A9A5B', '#E97451', '#F5F5DC'], hint: 'Sage · Terracotta · Sand' },
  { name: 'Bollywood Luxury',     palette: ['#2E1A47', '#D4AF37', '#005F69'], hint: 'Purple · Gold · Teal' },
];

const FEATURES = [
  { icon: Crown,       title: 'Locked Premium Themes',     copy: 'Photographers can never break design. Curated luxury layouts only.' },
  { icon: Wallet,      title: 'Credit-Based Publishing',   copy: 'Drafts are free. Credits consume only on publish. Never expire.' },
  { icon: Camera,      title: 'Live Photo Galleries',      copy: 'Stream wedding moments to guests in real-time, beautifully.' },
  { icon: Sparkles,    title: 'AI Story Composer',         copy: 'Cinematic captions, vows, and event copy in seconds.' },
  { icon: Music,       title: 'Persistent Ambient Music',  copy: 'Crossfaded between sections — never breaks the spell.' },
  { icon: ImageIcon,   title: '3D Unfolding Invitation',   copy: 'Wax-seal opening, scroll storytelling, parallax depth.' },
  { icon: QrCode,      title: 'QR + Digital Shagun',       copy: 'Frictionless RSVP, gifts and entry passes for every guest.' },
  { icon: Globe2,      title: 'Multi-Language',            copy: 'Hindi, Tamil, Telugu, Bengali, Urdu, English & more.' },
  { icon: ShieldCheck, title: 'Private & Secure',          copy: 'Passcode invites, anti-scraping, RBAC, audit trails.' },
];

const STATS = [
  { value: '10',  label: 'Master Themes' },
  { value: '60+', label: 'Premium Sections' },
  { value: '8',   label: 'Indian Wedding Cultures' },
  { value: '∞',   label: 'Drafts per Photographer' },
];

const PLANS = [
  { name: 'Free',     credits: '5',  perks: ['Watermark', 'Royal Mughal theme', 'Basic analytics', 'Email support'] },
  { name: 'Silver',   credits: '25', perks: ['No watermark', '4 themes unlocked', 'Full analytics', 'Priority support'] },
  { name: 'Gold',     credits: '60', perks: ['8 themes unlocked', 'Live gallery', 'AI story composer', 'Custom domain'] },
  { name: 'Platinum', credits: '∞',  perks: ['All 10 themes', '3D invitations', 'Dedicated manager', 'White-label option'] },
];

const Nav = ({ onLogin }) => (
  <motion.nav
    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
    className="fixed top-0 inset-x-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between"
    style={{ background: 'linear-gradient(180deg, rgba(14,10,6,0.85), rgba(14,10,6,0))', backdropFilter: 'blur(8px)' }}
    data-testid="lux-nav"
  >
    <div className="flex items-center gap-3">
      <img src="/brand/maja-icon-64.png" alt="MAJA Creations"
        className="w-9 h-9 rounded-full object-cover"
        style={{ boxShadow: '0 0 0 1px var(--lux-border-strong), inset 0 0 0 1px rgba(232,199,102,0.18)' }} />
      <span className="font-display text-[1.35rem] tracking-wide" style={{ color: '#FFF8DC' }}>
        MAJA<span className="text-gold"> </span>Creations
      </span>
    </div>
    <div className="hidden md:flex items-center gap-9 text-[0.82rem] tracking-[0.18em] uppercase" style={{ color: 'rgba(255,248,220,0.7)' }}>
      <a href="#themes" className="hover:text-[var(--lux-gold)] transition-colors">Themes</a>
      <a href="#features" className="hover:text-[var(--lux-gold)] transition-colors">Features</a>
      <a href="#pricing" className="hover:text-[var(--lux-gold)] transition-colors">Plans</a>
      <a href="#story" className="hover:text-[var(--lux-gold)] transition-colors">Story</a>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onLogin} className="lux-btn lux-btn-ghost text-xs" data-testid="nav-photographer-login">
        Photographer Login
      </button>
    </div>
  </motion.nav>
);

const Hero = ({ onLogin }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y  = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const op = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-32 pb-24 px-6 md:px-16 overflow-hidden">
      {/* Sprint 11 — Cinematic 3D rotating gold mandala + dust */}
      <HeroMandala3D />

      {/* Decorative orbits */}
      <div className="lux-orbit" style={{ width: 720, height: 720, top: -180, right: -180 }} />
      <div className="lux-orbit" style={{ width: 1100, height: 1100, top: -360, right: -360, opacity: 0.5 }} />

      <motion.div style={!reduce ? { y, opacity: op } : undefined} className="relative z-10 max-w-6xl">
        <motion.span variants={fadeUp} initial="hidden" animate="visible" custom={0} className="lux-eyebrow inline-block mb-6">
          ◆ Premium SaaS for Indian Wedding Photographers
        </motion.span>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="font-display leading-[0.95] text-[3.4rem] md:text-[6.6rem] tracking-tight"
          style={{ color: '#FFF8DC' }}
        >
          Cinematic <span className="text-gold italic font-script font-light">invitations</span>
          <br />
          worthy of your <em className="not-italic text-gold">artistry.</em>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="mt-8 max-w-2xl text-[1.05rem] md:text-[1.18rem] leading-[1.7]"
          style={{ color: 'rgba(255,248,220,0.72)' }}
        >
          A locked-luxury invitation platform built for photographers who refuse mediocrity.
          Royal Mughal to Bengali Traditional — every theme stays elegant in every hand.
          You charge premium. We protect the design.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-10 flex flex-wrap items-center gap-4">
          <button className="lux-btn" onClick={onLogin} data-testid="hero-cta-login">
            Enter Studio <ArrowRight className="w-4 h-4" />
          </button>
          <a href="#themes" className="lux-btn lux-btn-ghost" data-testid="hero-cta-themes">
            Explore Themes
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="mt-16 flex items-center gap-6 text-xs tracking-widest uppercase"
          style={{ color: 'rgba(255,248,220,0.55)' }}
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_,i)=>(<Star key={i} className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} fill="#D4AF37" />))}
          </div>
          <span>Trusted by 1,200+ Indian photographers · 38 cities</span>
        </motion.div>
      </motion.div>

      {/* Floating side card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22,1,0.36,1] }}
        className="hidden lg:block lux-glass absolute right-12 bottom-20 w-[320px] p-6"
      >
        <div className="lux-eyebrow mb-3">Today · Studio Pulse</div>
        <div className="flex items-end gap-3 mb-4">
          <span className="font-display text-5xl text-gold">12</span>
          <span className="pb-2 text-sm" style={{ color: 'rgba(255,248,220,0.65)' }}>weddings published this week</span>
        </div>
        <div className="lux-hairline my-4" />
        <div className="flex items-center justify-between text-sm" style={{ color: 'rgba(255,248,220,0.75)' }}>
          <span>Credits remaining</span>
          <span className="font-display text-2xl text-gold">182</span>
        </div>
        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,248,220,0.08)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1.6, delay: 1, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #B8902B, #E8C766)' }} />
        </div>
      </motion.div>
    </section>
  );
};

const SectionHeader = ({ eyebrow, title, kicker }) => (
  <motion.div
    variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}
    className="max-w-3xl mb-16"
  >
    <motion.span variants={fadeUp} className="lux-eyebrow block mb-5">◆ {eyebrow}</motion.span>
    <motion.h2 variants={fadeUp} className="font-display text-[2.4rem] md:text-[3.6rem] leading-[1.05] tracking-tight" style={{ color: '#FFF8DC' }}>
      {title}
    </motion.h2>
    {kicker && (
      <motion.p variants={fadeUp} className="mt-5 text-[1.02rem] leading-relaxed max-w-xl" style={{ color: 'rgba(255,248,220,0.65)' }}>
        {kicker}
      </motion.p>
    )}
  </motion.div>
);

const Themes = () => (
  <section id="themes" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="Master Theme Library"
      title="Ten cinematic worlds. Zero design destruction."
      kicker="Each theme is a locked layout with curated typography and motion. Photographers customize accent colors and content — never break the soul of the design."
    />

    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      data-testid="themes-grid"
    >
      {MASTER_THEMES.map((t, i) => (
        <motion.div
          key={t.name} variants={fadeUp} custom={i}
          whileHover={{ y: -6, transition: { duration: 0.6, ease: [0.22,1,0.36,1] } }}
          className="lux-glass p-7 group cursor-pointer"
          data-testid={`theme-card-${i}`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.45)' }}>
              0{i + 1}
            </span>
            <div className="flex -space-x-1.5">
              {t.palette.map((c, idx) => (
                <span key={idx}
                  className="w-5 h-5 rounded-full border"
                  style={{ background: c, borderColor: 'rgba(255,248,220,0.2)' }}
                />
              ))}
            </div>
          </div>
          <h3 className="font-display text-2xl md:text-[1.65rem] leading-tight mb-2" style={{ color: '#FFF8DC' }}>
            {t.name}
          </h3>
          <p className="text-sm" style={{ color: 'rgba(255,248,220,0.55)' }}>{t.hint}</p>
          <div className="lux-hairline my-5" />
          <div className="flex items-center justify-between text-xs tracking-widest uppercase"
            style={{ color: 'rgba(255,248,220,0.55)' }}>
            <span>Locked layout</span>
            <span className="group-hover:text-[var(--lux-gold)] transition-colors flex items-center gap-1">
              Preview <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

const Features = () => (
  <section id="features" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="Photographer Toolkit"
      title="Every detail crafted for your business."
      kicker="A wizard-driven studio that protects your design integrity while giving guests an experience they will never forget."
    />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      data-testid="features-grid"
    >
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title} variants={fadeUp} custom={i}
          className="lux-glass p-7 flex flex-col gap-4 hover:scale-[1.01] transition-transform duration-700"
          data-testid={`feature-card-${i}`}
        >
          <div className="w-11 h-11 rounded-xl grid place-items-center"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(139,0,0,0.18))', border: '1px solid var(--lux-border-strong)' }}>
            <f.icon className="w-5 h-5" style={{ color: '#D4AF37' }} strokeWidth={1.6} />
          </div>
          <h3 className="font-heading text-xl" style={{ color: '#FFF8DC' }}>{f.title}</h3>
          <p className="text-[0.95rem] leading-relaxed" style={{ color: 'rgba(255,248,220,0.6)' }}>{f.copy}</p>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

const Stats = () => (
  <section className="px-6 md:px-16 py-20 z-10 relative">
    <div className="lux-hairline mb-16" />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-8"
    >
      {STATS.map((s, i) => (
        <motion.div key={i} variants={fadeUp} custom={i} className="text-center md:text-left">
          <div className="font-display text-5xl md:text-6xl text-gold mb-2">{s.value}</div>
          <div className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>{s.label}</div>
        </motion.div>
      ))}
    </motion.div>
    <div className="lux-hairline mt-16" />
  </section>
);

const Story = () => (
  <section id="story" className="relative px-6 md:px-16 py-28 z-10">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <motion.div
        variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
      >
        <motion.span variants={fadeUp} className="lux-eyebrow block mb-5">◆ Our Philosophy</motion.span>
        <motion.h2 variants={fadeUp} className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.1] mb-7" style={{ color: '#FFF8DC' }}>
          Indian weddings deserve <span className="text-gold italic font-script">cinema</span>, not templates.
        </motion.h2>
        <motion.p variants={fadeUp} className="text-[1.05rem] leading-[1.85] mb-6" style={{ color: 'rgba(255,248,220,0.7)' }}>
          We built MAJA Creations for the artist behind the camera — the photographer who has shot 200 weddings
          and is tired of cheap, flashy invitation builders that ruin their brand.
        </motion.p>
        <motion.p variants={fadeUp} className="text-[1.05rem] leading-[1.85]" style={{ color: 'rgba(255,248,220,0.7)' }}>
          Every theme here is curated like a Bollywood title sequence: slow, royal, immersive.
          Wax-seal openings. Parallax stories. Glassmorphism. Mandalas that breathe.
          Your couples will weep. Your competitors will scramble.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, rotateY: -15, scale: 0.94 }} whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
        className="lux-glass p-10 relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full grid place-items-center"
          style={{ background: 'radial-gradient(circle at 30% 30%, #E8C766, #8C6A1A)' }}>
          <Crown className="w-6 h-6" style={{ color: '#16110C' }} />
        </div>
        <div className="lux-eyebrow mb-4">Customer Verdict</div>
        <p className="font-heading text-2xl md:text-[1.85rem] leading-[1.35] italic mb-6" style={{ color: '#FFF8DC' }}>
          “We doubled our wedding package price the month we moved to MAJA Creations.
          Couples opened the invite and cried before the wedding even happened.”
        </p>
        <div className="lux-hairline mb-4" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ background: 'linear-gradient(135deg, #8B0000, #D4AF37)' }} />
          <div>
            <div className="font-heading text-lg" style={{ color: '#FFF8DC' }}>Anaya Mehta</div>
            <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>Studio Aurora · Mumbai</div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="pricing" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="Studio Plans"
      title="Pay for credit. Never for time."
      kicker="Credits never expire. Drafts are free. You only spend a credit when you publish a wedding — that's it."
    />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      data-testid="pricing-grid"
    >
      {PLANS.map((p, i) => {
        const featured = i === 2; // Gold featured
        return (
          <motion.div
            key={p.name} variants={fadeUp} custom={i}
            whileHover={{ y: -6 }}
            className={`lux-glass p-7 flex flex-col ${featured ? 'ring-1' : ''}`}
            style={featured ? { borderColor: 'var(--lux-gold)', background: 'rgba(212,175,55,0.07)' } : undefined}
            data-testid={`plan-card-${p.name.toLowerCase()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>{p.name}</h3>
              {featured && <span className="text-[10px] tracking-[0.25em] uppercase px-2 py-1 rounded-full" style={{ color: '#16110C', background: '#D4AF37' }}>Studio Pick</span>}
            </div>
            <div className="font-display text-5xl text-gold mb-1">{p.credits}</div>
            <div className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: 'rgba(255,248,220,0.55)' }}>credits included</div>
            <div className="lux-hairline mb-5" />
            <ul className="flex-1 space-y-3 text-sm" style={{ color: 'rgba(255,248,220,0.75)' }}>
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
                  {perk}
                </li>
              ))}
            </ul>
            <button className={`mt-7 ${featured ? 'lux-btn' : 'lux-btn lux-btn-ghost'} justify-center`} data-testid={`plan-cta-${p.name.toLowerCase()}`}>
              Choose {p.name}
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  </section>
);

const CTA = ({ onLogin }) => (
  <section className="relative px-6 md:px-16 py-32 z-10">
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="lux-glass relative overflow-hidden p-12 md:p-20 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(139,0,0,0.25), rgba(212,175,55,0.08))', borderColor: 'var(--lux-border-strong)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(212,175,55,0.18), transparent 70%)' }} />
      <span className="lux-eyebrow block mb-4">◆ Begin Your Studio</span>
      <h2 className="font-display text-[2.6rem] md:text-[4.2rem] leading-[1.05] mb-6" style={{ color: '#FFF8DC' }}>
        Your next couple deserves <span className="text-gold italic font-script">a masterpiece.</span>
      </h2>
      <p className="max-w-xl mx-auto text-[1.05rem] mb-9" style={{ color: 'rgba(255,248,220,0.7)' }}>
        Sign in to your studio. Build a wedding in 12 minutes. Publish in one credit.
        Make couples cry the elegant way.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onLogin} className="lux-btn" data-testid="footer-cta-login">
          Enter Studio <ArrowRight className="w-4 h-4" />
        </button>
        <a href="#themes" className="lux-btn lux-btn-ghost" data-testid="footer-cta-themes">View Themes</a>
      </div>
    </motion.div>
  </section>
);

const Footer = ({ onSuperAdmin }) => (
  <footer className="relative z-10 px-6 md:px-16 py-12 border-t" style={{ borderColor: 'var(--lux-border)' }}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-sm">
      <div className="flex items-center gap-3">
        <img src="/brand/maja-icon-64.png" alt="MAJA Creations"
          className="w-7 h-7 rounded-full object-cover"
          style={{ boxShadow: '0 0 0 1px var(--lux-border-strong)' }} />
        <span className="font-display text-lg" style={{ color: '#FFF8DC' }}>MAJA<span className="text-gold"> </span>Creations</span>
      </div>
      <div className="flex flex-wrap items-center gap-6" style={{ color: 'rgba(255,248,220,0.55)' }}>
        <span>© {new Date().getFullYear()} MAJA Creations · Made in India</span>
        <a href="#features" className="hover:text-[var(--lux-gold)] transition-colors">Features</a>
        <a href="#pricing" className="hover:text-[var(--lux-gold)] transition-colors">Plans</a>
        <button onClick={onSuperAdmin} className="hover:text-[var(--lux-gold)] transition-colors text-left" data-testid="footer-super-admin-link">
          Super Admin
        </button>
      </div>
    </div>
  </footer>
);

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('luxe', 'luxe-grain', 'luxe-vignette');
    return () => document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
  }, []);

  return (
    <div className="luxe min-h-screen relative" data-testid="landing-page">
      <Nav onLogin={() => navigate('/admin/login')} />
      <Hero onLogin={() => navigate('/admin/login')} />
      <Themes />
      <Stats />
      <Features />
      <Story />
      <Pricing />
      <CTA onLogin={() => navigate('/admin/login')} />
      <Footer onSuperAdmin={() => navigate('/super-admin/login')} />
    </div>
  );
};

export default LandingPage;
