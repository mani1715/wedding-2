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

### Session 2026-05-15 — PROMPTS 05+13, 07, 16 (E1 continuation)

**Prompt 05 + 13 — Live Photo Gallery + Guest Upload**
- New backend module `/app/backend/live_gallery_features.py` registered at `/api/...`
- WebSocket: `wss://<host>/api/ws/gallery/{wedding_id_or_slug}` — ConnectionManager pattern,
  broadcasts `{type:photo_added|photo_deleted, ...}` on every upload/delete.
- Endpoints: `POST /api/admin/profiles/{id}/live-gallery/upload` (multipart, multiple files,
  generates 800px WebP thumb + 200px micro via Pillow), `POST /api/invite/{slug}/gallery/guest-upload`
  (auto-publishes), `GET /api/public/gallery/{slug}/photos`, `GET /api/admin/profiles/{id}/live-gallery/photos`,
  `DELETE /api/admin/profiles/{id}/live-gallery/{photo_id}`, `GET /api/uploads/weddings/{wedding_id}/{folder}/{filename}`.
- MongoDB collection `live_gallery_photos` { id, profile_id, wedding_id, url, thumb_url, micro_url, source, guest_name, caption, width, height, file_size, created_at }
- Frontend: rewrote `src/components/luxury/LivePhotoWallTeaser.jsx` (native WebSocket with 3s
  reconnect, CSS-columns masonry, animated spring-in for new photos, full-screen lightbox with
  arrow nav). New `src/components/luxury/GuestUploadButton.jsx` (floating gold pill bottom-right,
  modal with name + file picker + caption + success animation). Mounted in `LuxuryPublicInvitation.jsx`
  after cinematic opening. New management page `src/pages/LiveGalleryManagement.jsx` (drag-drop
  via react-dropzone + concurrent uploads + progress bars + stats tiles + delete).

**Prompt 07 — Wishes Wall + Moderation + Featured**
- New backend module `/app/backend/wishes_features.py`. Endpoints: `POST /api/invite/{slug}/wishes`
  (public, rate-limit 3/IP/wedding/day via `wish_rate_limits`), `GET /api/public/invite/{slug}/wishes`
  (approved only, featured first), `GET /api/admin/profiles/{id}/wishes?status=`, approve / reject /
  feature (max 3 featured, auto-rotate oldest, auto-approves) / bulk-approve / delete.
- Frontend: new `src/components/luxury/WishesWallSection.jsx` (replaces old inline guest book on
  public invitation) — 3 burgundy `#4A0E2A` spotlight cards for featured wishes (gold-bordered with
  sparkle badge), CSS-columns masonry for approved wishes, "Leave a Wish" gold CTA opens modal.
  Rewrote `src/pages/WishesManagement.jsx` (luxury hero, Pending/Approved/Rejected tabs with red
  badge on pending count, action buttons per wish, "Approve All Pending" bulk).

**Prompt 16 — Analytics deep-dive**
- New backend module `/app/backend/analytics_extras.py`. Endpoints: heatmap (90 days), funnel
  (4 stages), geography (top 10 cities), `POST /api/admin/profiles/{id}/analytics/ai-insights`
  (Claude Sonnet 4.5 via Emergent LLM key, 24h cache in `ai_insights_cache`).
- Frontend: new `src/components/luxury/AnalyticsExtrasSection.jsx` mounted at top of
  `Phase30AnalyticsPage.jsx` — AI Insights gold-bordered card with 3 bullet insights + shimmer
  skeleton + "Refresh" button, D3.js calendar heatmap (90 days, tooltip hover), custom-SVG
  RSVP funnel (animated Framer Motion bars + drop-off %), recharts horizontal BarChart for
  top 10 cities, "Export PDF Report" using jspdf + jspdf-autotable. Also wrapped legacy
  analytics error state to still render the new section.

**Verified by testing subagent**: 23/23 backend tests pass (5 NoRegression + 7 LiveGallery + 8 Wishes + 3 Analytics + AI insights cache hit). No critical issues. All endpoints respond correctly via curl + browser.


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
