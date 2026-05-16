# Wedding Platform — Monetization Suite (continued from previous session)

## Problem Statement
User cloned `https://github.com/mani1715/wedding-2`. Previous E1 session implemented MONETIZATION features but ran out of credits before testing. Business logic to verify and complete:

1. **Three roles**: Photographer, Admin, Super Admin
2. Super-admin creates photographer credentials (email/password)
3. Photographer logs in, creates invitations (per-design credit consumption on publish)
4. **Auto credit top-up** via Razorpay payment → credits added automatically
5. **Super-admin-configurable Credit Packs** (NOT hardcoded — ₹500=50, ₹1000=120, ₹2500=350 fully editable from UI)
6. Super-admin can **drill-down** into any photographer to see: profile info, all invitations with public links, credit ledger, payment history, RSVPs/views/revenue
7. **Public invite links** must NOT crash under viral traffic (preventive caching + bot-whitelist for guest user-agents)

## Architecture
- **Backend**: FastAPI + MongoDB (motor async), JWT auth, Razorpay SDK
- **Frontend**: React 19 + Tailwind + Framer Motion (luxury "Royal Heritage" theme — burgundy/gold/ivory)
- **Payment**: Razorpay test keys configured in `/app/backend/.env`
- **Caching**: `Cache-Control: public, max-age=30, s-maxage=60` on all `/api/invite/*` and `/api/public/*` GET responses (defined in `security_middleware.py`)
- **Bot-detection bypass**: `/api/invite`, `/api/public`, `/api/uploads`, `/api/ws`, `/api/rsvp`, `/api/payments/razorpay-webhook` are whitelisted so viral invitations are never soft-blocked

## What's been implemented & verified (2026-05-16)

### Backend module — `monetization_features.py` (443 lines)
9 endpoints, all 100% pass on 14/14 pytest regression:

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/super-admin/credit-packs` | super-admin | List all packs |
| `POST /api/super-admin/credit-packs` | super-admin | Create pack |
| `PUT /api/super-admin/credit-packs/{id}` | super-admin | Update pack |
| `DELETE /api/super-admin/credit-packs/{id}` | super-admin | Delete pack |
| `GET /api/admin/credit-packs` | photographer | List active packs |
| `POST /api/admin/credits/purchase/create-order` | photographer | Razorpay order |
| `POST /api/admin/credits/purchase/verify` | photographer | Signature verify → atomic credit add |
| `POST /api/payments/razorpay-webhook` | public+HMAC | Idempotent fallback |
| `GET /api/admin/credits/purchases` | photographer | Purchase history |
| `GET /api/super-admin/photographers/{id}/detail` | super-admin | Pin-to-pin drill-down |

### Frontend pages (3 new + 3 wired buttons)
1. `/app/frontend/src/pages/CreditPacksAdmin.jsx` — super-admin CRUD UI (3 packs seeded as Starter/Studio/Atelier)
2. `/app/frontend/src/pages/PhotographerDetail.jsx` — drill-down with admin info + 6 stat tiles + Invitations/Credit Ledger/Purchases tabs
3. `/app/frontend/src/pages/CreditsTopUp.jsx` — photographer Razorpay Checkout with PAY ₹500/1000/2500 buttons + balance card

**Wired buttons:**
- `LuxurySuperAdminDashboard.jsx` line 148: `credit-packs-btn` → `/super-admin/credit-packs`
- `LuxurySuperAdminDashboard.jsx` line 201: `view-detail-<id>` → `/super-admin/photographers/<id>`
- `LuxuryDashboard.jsx` line 266: `dashboard-top-up` → `/admin/credits/top-up`

### Atomic credit-add (idempotent)
`monetization_features.py:_credit_purchase_atomic` uses `update_one({credited:{$ne:true}})` → modified_count check → `credit_service.add_credits(…)` with rollback on failure. Webhook + verify both call the same primitive so double-credit is impossible.

### Scaling (preventive)
- `security_middleware.py:62-73` — Cache-Control on origin (verified via curl at localhost:8001)
- `security_middleware.py:189-197` — Bot-detection whitelist verified: `curl/8.0.1` UA passes through `/api/invite/*`

## Default seeded users
- **Photographer**: `admin@wedding.com` / `admin123`
- **Super Admin**: `superadmin@wedding.com` / `SuperAdmin@123`

## Default seeded credit packs
- Starter — ₹500 = 50 credits
- Studio — ₹1,000 = 120 credits (`badge: Most Popular`)
- Atelier — ₹2,500 = 350 credits

## Razorpay Test Configuration
- `RAZORPAY_KEY_ID=rzp_test_Spuhaq4p1yWumY`
- `RAZORPAY_KEY_SECRET=vIMPwLwrHItJQmj1wFvD233u`
- `RAZORPAY_WEBHOOK_SECRET=PLACEHOLDER_WEBHOOK_SECRET` (replace before live deploy → enables HMAC verification)
- Test card: `4111 1111 1111 1111`, any CVV, any future expiry, OTP `1221`

## Verified test results (iteration_8)
- **Backend**: 14/14 pytest tests pass (`/app/backend/tests/test_iteration8_monetization.py`)
- **Frontend**: 4/4 flows pass — SA login+dashboard, SA credit-packs page, SA photographer-detail page, photographer top-up page
- No critical bugs. Minor cosmetic notes only (label casing).

## Action items / Backlog
- **(Infra)** Configure ingress/CDN to honor origin Cache-Control on `/api/public/*` and `/api/uploads/*` (currently CDN overrides with `no-store` on the public preview URL — works correctly on origin)
- **(P2)** Per-admin rate-limit on `/api/admin/credits/purchase/create-order` (currently a stolen token can spawn unlimited Razorpay orders)
- **(P2)** Webhook handler returns 200 even when credit-add fails — should return 500 to let Razorpay retry
- **(P3)** `photographer_detail` does N+1 count_documents per profile — switch to `$facet` aggregation when a photographer's profile count exceeds ~50
- **(P3)** Revenue sums first 100 purchases only — move to server-side aggregation for >100 purchases
- **(P2)** Set real `RAZORPAY_WEBHOOK_SECRET` before going live so HMAC verification is enforced

## Next session — pickup points
1. Test a full end-to-end Razorpay payment (requires human OTP entry — `1221` for test cards)
2. Add an audit log entry when super-admin creates/deletes a credit pack (currently only the pack doc records `created_by`)
3. Consider adding a "Plans & Pricing" tab on the super-admin dashboard that surfaces total revenue across all photographers, top spenders, MoM growth

## Last updated
2026-05-16 — Session 2 — Monetization regression complete (was in-progress in previous session, now 100% green).
