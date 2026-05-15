# Test Credentials

## Photographer Admin
- Email: `admin@wedding.com`
- Password: `admin123`

## Super Admin
- Email: `superadmin@wedding.com`
- Password: `SuperAdmin@123`

## Test Profile
- Slug: `aarav-riya-lp2bq2`
- Profile ID: `122ffd50-a1d0-4583-b2af-43bea70bc815`
- Public invitation URL: `/invite/aarav-riya-lp2bq2`

## Test endpoints to verify (Prompts 05+13, 07, 16)

### Prompt 05 + 13 — Live Photo Gallery
- WebSocket: `wss://<host>/api/ws/gallery/{wedding_id_or_slug}` — connects with `{type:"connected", wedding_id:"..."}`
- POST `/api/admin/profiles/{id}/live-gallery/upload` — multipart files; needs Bearer admin
- POST `/api/invite/{slug}/gallery/guest-upload` — multipart: file, guest_name, caption; public
- GET `/api/public/gallery/{slug}/photos?limit=200&since={iso}` — public
- GET `/api/admin/profiles/{id}/live-gallery/photos` — admin
- DELETE `/api/admin/profiles/{id}/live-gallery/{photo_id}` — admin (broadcasts deletion)
- GET `/api/uploads/weddings/{wedding_id}/{folder}/{filename}` — serves files

### Prompt 07 — Wishes Wall + Moderation
- POST `/api/invite/{slug}/wishes` — public; rate-limit 3/IP/wedding/day
- GET `/api/public/invite/{slug}/wishes?limit=50` — approved only, featured first
- GET `/api/admin/profiles/{id}/wishes?status=pending|approved|rejected` — admin
- POST `/api/admin/profiles/{id}/wishes/{id}/approve` — admin
- POST `/api/admin/profiles/{id}/wishes/{id}/reject` — admin
- POST `/api/admin/profiles/{id}/wishes/{id}/feature` — toggle, max 3 featured (auto-rotate oldest)
- POST `/api/admin/profiles/{id}/wishes/bulk-approve` — admin
- DELETE `/api/admin/profiles/{id}/wishes/{id}` — admin

### Prompt 16 — Analytics extras
- GET `/api/admin/profiles/{id}/analytics/heatmap?days=90` — `{data:[{date, opens}]}`
- GET `/api/admin/profiles/{id}/analytics/funnel` — `{stages:[4]}`
- GET `/api/admin/profiles/{id}/analytics/geography` — `{cities:[top 10]}`
- POST `/api/admin/profiles/{id}/analytics/ai-insights` — Claude Sonnet 4.5, cached 24h
