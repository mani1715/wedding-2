# Test Credentials

## Photographer Admin (Studio)
- Email: `admin@wedding.com`
- Password: `admin123`
- Endpoint: `POST /api/auth/login`
- Dashboard: `/admin/dashboard`
- Credits Top-up: `/admin/credits/top-up`

## Super Admin (Platform Owner)
- Email: `superadmin@wedding.com`
- Password: `SuperAdmin@123`
- Endpoint: `POST /api/auth/login` (same endpoint, role differs)
- Dashboard: `/super-admin/dashboard`
- Credit Packs Admin: `/super-admin/credit-packs`
- Photographer Detail: `/super-admin/photographers/:adminId`

## Razorpay Test Credentials (in `/app/backend/.env`)
- RAZORPAY_KEY_ID = `rzp_test_Spuhaq4p1yWumY`
- RAZORPAY_KEY_SECRET = `vIMPwLwrHItJQmj1wFvD233u`
- RAZORPAY_WEBHOOK_SECRET = `PLACEHOLDER_WEBHOOK_SECRET` (set real value when deploying)

## Test Razorpay Card (for sandbox checkout)
- Card: `4111 1111 1111 1111`
- CVV: any 3 digits
- Expiry: any future date
- OTP: `1221`

## Seeded Credit Packs (auto-created during this run)
- Starter — ₹500 = 50 credits
- Studio — ₹1,000 = 120 credits (Most Popular badge)
- Atelier — ₹2,500 = 350 credits

## Monetization API Endpoints (NEW)

### Super Admin — Credit Packs CRUD
- `GET    /api/super-admin/credit-packs`           — list all packs
- `POST   /api/super-admin/credit-packs`           — create pack
- `PUT    /api/super-admin/credit-packs/{pack_id}` — update pack
- `DELETE /api/super-admin/credit-packs/{pack_id}` — delete pack

### Super Admin — Photographer drill-down
- `GET /api/super-admin/photographers/{admin_id}/detail`
  Returns `{ admin, summary, profiles, credit_ledger, purchases }` — pin-to-pin everything.

### Photographer — Buy credits (Razorpay)
- `GET  /api/admin/credit-packs`                       — list active packs
- `POST /api/admin/credits/purchase/create-order`      — body `{pack_id}` → returns `{order_id, amount_paise, razorpay_key_id, …}`
- `POST /api/admin/credits/purchase/verify`            — body `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` → atomic credit add
- `GET  /api/admin/credits/purchases`                  — purchase history

### Razorpay Webhook (auto-credit fallback)
- `POST /api/payments/razorpay-webhook` — idempotent, signature-verified

## Public Invite Caching (preventive scaling)
- `Cache-Control: public, max-age=30, s-maxage=60` on all `/api/invite/*` and `/api/public/*` GET responses
- Bot-detection middleware whitelists `/api/invite`, `/api/public`, `/api/uploads/`, `/api/ws/`, `/api/rsvp`, `/api/payments/razorpay-webhook`
