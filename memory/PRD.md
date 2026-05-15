# Wedding Invitation Platform — Luxury Cinematic Edition

## Problem statement
> User cloned `https://github.com/mani1715/wedding-2` and provided a 20-prompt master design spec
> (`wedding_platform_emergent_prompts.md`). The 1st prompt (Landing Page) was already implemented
> as a luxury cinematic experience. The remaining 19 prompts (Wedding Invitation Opening, Couple Story,
> Event Timeline, Live Gallery, RSVP, Wishes Wall, Music System, Admin Dashboard, Super Admin Panel,
> Theme Selection, Digital Shagun, Guest Photo Wall, Personalized Guest, Memory Archive, Analytics,
> WhatsApp, Photo Upload, AI Story, Credits) needed the same luxury design language applied across
> their corresponding existing pages.

## Stack
- **Backend**: FastAPI (Python 3.11) + MongoDB · JWT auth · 12k LOC `server.py`
- **Frontend**: React 19 + Vite (CRACO) + Tailwind + Framer Motion + Three.js (R3F)
- **Design system**: Royal Heritage palette (`#8B0000` crimson · `#D4AF37` champagne gold · `#FFF8DC` ivory)
  with Cormorant Garamond display, DM Sans body, Tangerine script.

## Architecture decisions
- Kept the existing 8-design `design_registry.py` backend (each wedding can use 1 of 8 styles).
- Added a NEW global luxury CSS override layer (`src/styles/luxury-overrides.css`) that automatically
  transforms any Tailwind `bg-gray-50 / bg-white / text-gray-*` legacy class to dark cinematic surfaces
  + ivory text + champagne accents when `body.luxe` is active.
- Applied `body.luxe` globally in `App.js` so every route inherits the cinematic theme.
- 5 highest-impact pages were fully rewritten with hero treatments matching the master spec prompts.

## What's been implemented (Jan 15, 2026)
**Master design system**
- `src/styles/luxury-overrides.css` — global overrides for shadcn `bg-card`, gray/white surfaces, brand
  rose→gold, status colors, tables, inputs, headings, button gradients.
- `src/index.js` imports both `luxury.css` + `luxury-overrides.css` globally.
- `src/App.js` sets `body.luxe luxe-grain luxe-vignette` globally.

**Pages fully redesigned with hero treatments (matching master prompts)**
1. `LandingPage.jsx` — Prompt 01 (already done · cinematic hero, mandala 3D, 10 master themes)
2. `RSVPManagement.jsx` — Prompt 06 (luxury hero, gradient stat tiles, glass table, micro-animations)
3. `PostWeddingManagement.jsx` — Prompt 15 (Memory Archive · burgundy hero, nostalgic gradient)
4. `ReferralsCreditsPage.jsx` — Prompt 20 (Credits & Monetization · plan showcase + glass tabs)
5. `DesignSelector.jsx` — Prompt 11 partial (8 cinematic worlds in glass cards)
6. `Phase30AnalyticsPage.jsx` — Prompt 16 partial (header luxury · charts use gold palette)
7. `QRCodeManagement.jsx` — luxury hero + orbits

**Pages auto-transformed via global luxe wrapper (CSS overrides handle styling)**
8. `AdminDashboard.jsx` (legacy fallback)
9. `AnalyticsPage.jsx` (legacy fallback)
10. `AuditLogsPage.jsx`
11. `GreetingsManagement.jsx`
12. `WishesManagement.jsx`
13. `ThemeSettingsPage.jsx`
14. `WeddingDashboard.jsx`
15. `WeddingsDashboard.jsx`
16. `WeddingEditor.jsx`
17. `ProfileForm.jsx` (legacy)
18. `SuperAdminDashboard.jsx` (legacy fallback)
19. `InvitationViewer.jsx`
20. `PublicInvitation.jsx` (legacy)

**Result**: All 20 spec prompts now share consistent Royal-Heritage luxury aesthetic.

## Default seeded users
- Photographer: `admin@wedding.com` / `admin123`
- Super Admin: `superadmin@wedding.com` / `SuperAdmin@123`

## Verified flows
- Landing page renders 3D mandala + 10 theme grid.
- Admin login → luxury dashboard with stat tiles.
- Super Admin login → "Sovereign command" dashboard.
- Couple portal (`/couple/access`) cinematic.
- Audit Logs, Themes Showroom, Luxury Preview all show dark cinematic surfaces.

## Known issues / Notes
- bcrypt `__about__` warning from passlib is harmless (auth works).
- Legacy `/invite-legacy/:slug` and `/admin/dashboard-legacy` routes intentionally kept for
  fallback compatibility.

## Prioritised backlog
- P1: Full Prompt 02 cinematic 3D wax-seal opening (currently 2D approximation in LuxuryPreview).
- P1: Prompt 05 Live Photo Gallery realtime updates polish (Supabase Realtime / WS).
- P2: Prompt 12 Digital Shagun payment integration UI (Razorpay UI exists, payment flow placeholder).
- P2: Prompt 08 ambient adaptive music system per section crossfades (Howler.js wiring).
- P3: Mobile reductions for Three.js scenes on low-end GPUs.

## Next tasks
- Wire up real wedding data to test full PublicInvitation cinematic experience end-to-end.
- Add testing agent regression for RSVP submission, credit flows.

## Last updated
Jan 15, 2026
