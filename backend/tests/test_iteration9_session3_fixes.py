"""Iteration 9 — Session 3 fixes regression suite.

Covers:
 - Backend password validation on POST /api/super-admin/admins (8+ chars)
 - Super-admin impersonation via ?on_behalf_of=<photographer_admin_id>
 - Photographer cannot escalate via on_behalf_of
 - Seeded Aarav & Riya demo invitation (slug aarav-and-riya-demo)
 - Public invitation + cache-control headers
"""

import os
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        # fallback: read from frontend/.env
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        except Exception:
            pass
    assert v, "REACT_APP_BACKEND_URL missing"
    return v.rstrip("/")


BASE_URL = _load_backend_url()

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
SA_EMAIL = "superadmin@wedding.com"
SA_PASSWORD = "SuperAdmin@123"
PH_EMAIL = "admin@wedding.com"
PH_PASSWORD = "admin123"
DEMO_PHOTOGRAPHER_ID = "604db096-c1ca-4738-8663-7e640334a6ac"
DEMO_SLUG = "aarav-and-riya-demo"


def _login(email, password):
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        headers={"User-Agent": UA, "Content-Type": "application/json"},
        timeout=30,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok, f"no token in login response: {r.text}"
    return tok


@pytest.fixture(scope="module")
def sa_token():
    return _login(SA_EMAIL, SA_PASSWORD)


@pytest.fixture(scope="module")
def ph_token():
    return _login(PH_EMAIL, PH_PASSWORD)


def _hdr(token=None):
    h = {"User-Agent": UA, "Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


# ----------------------- Password validation -----------------------

class TestCreatePhotographerValidation:
    def test_short_password_rejected(self, sa_token):
        payload = {
            "name": "TEST_BadPassword",
            "email": "TEST_shortpw@example.com",
            "password": "short",
            "credits": 0,
        }
        r = requests.post(
            f"{BASE_URL}/api/super-admin/admins",
            json=payload,
            headers=_hdr(sa_token),
            timeout=30,
        )
        assert r.status_code in (400, 422), f"expected 4xx for short pw, got {r.status_code}: {r.text}"
        body = r.text.lower()
        assert "8" in body or "password" in body, f"error should mention min length, got {r.text}"

    def test_valid_password_accepted(self, sa_token):
        import uuid
        email = f"TEST_ok_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "name": "TEST_GoodPassword",
            "email": email,
            "password": "Goodpass1",
            "credits": 0,
        }
        r = requests.post(
            f"{BASE_URL}/api/super-admin/admins",
            json=payload,
            headers=_hdr(sa_token),
            timeout=30,
        )
        assert r.status_code in (200, 201), f"expected 201, got {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("email") == email
        assert "password" not in body and "password_hash" not in body, "password leaked in response"
        # cleanup
        admin_id = body.get("id")
        if admin_id:
            requests.delete(
                f"{BASE_URL}/api/super-admin/admins/{admin_id}",
                headers=_hdr(sa_token),
                timeout=30,
            )


# ----------------------- on_behalf_of impersonation -----------------------

class TestOnBehalfOf:
    def test_sa_creates_profile_on_behalf(self, sa_token):
        import uuid
        payload = {
            "groom_name": f"TEST_{uuid.uuid4().hex[:6]}",
            "bride_name": "Behalf",
            "venue": "Test Venue",
            "event_date": "2026-12-31",
            "event_type": "wedding",
            "events": [],
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/profiles",
            params={"on_behalf_of": DEMO_PHOTOGRAPHER_ID},
            json=payload,
            headers=_hdr(sa_token),
            timeout=30,
        )
        assert r.status_code in (200, 201), f"expected 201, got {r.status_code}: {r.text}"
        body = r.json()
        new_pid = body.get("id")
        assert new_pid, "no id returned"
        # ProfileResponse doesn't expose admin_id — verify via photographer's list
        ph_token = _login(PH_EMAIL, PH_PASSWORD)
        list_r = requests.get(f"{BASE_URL}/api/admin/profiles", headers=_hdr(ph_token), timeout=30)
        assert list_r.status_code == 200
        profs = list_r.json()
        if isinstance(profs, dict):
            profs = profs.get("profiles", profs)
        ids = [p.get("id") for p in profs]
        assert new_pid in ids, (
            f"new profile {new_pid} should be under photographer {DEMO_PHOTOGRAPHER_ID}'s list, got {ids}"
        )
        # cleanup
        pid = new_pid
        if pid:
            requests.delete(
                f"{BASE_URL}/api/admin/profiles/{pid}",
                headers=_hdr(sa_token),
                timeout=30,
            )

    def test_photographer_cannot_impersonate(self, ph_token):
        import uuid
        payload = {
            "groom_name": f"TEST_{uuid.uuid4().hex[:6]}",
            "bride_name": "NoEscalate",
            "venue": "Test Venue",
            "event_date": "2026-12-31",
            "event_type": "wedding",
            "events": [],
        }
        # Get own admin id first
        me = requests.get(f"{BASE_URL}/api/auth/me", headers=_hdr(ph_token), timeout=30)
        assert me.status_code == 200
        own_id = me.json().get("id") or me.json().get("admin_id")

        r = requests.post(
            f"{BASE_URL}/api/admin/profiles",
            params={"on_behalf_of": "00000000-0000-0000-0000-000000000000"},
            json=payload,
            headers=_hdr(ph_token),
            timeout=30,
        )
        assert r.status_code in (200, 201), f"expected success ignoring param, got {r.status_code}: {r.text}"
        body = r.json()
        new_pid = body.get("id")
        assert new_pid, "no id returned"
        # Verify the new profile shows up in photographer's own list (proves admin_id=own)
        list_r = requests.get(f"{BASE_URL}/api/admin/profiles", headers=_hdr(ph_token), timeout=30)
        assert list_r.status_code == 200
        profs = list_r.json()
        if isinstance(profs, dict):
            profs = profs.get("profiles", profs)
        ids = [p.get("id") for p in profs]
        assert new_pid in ids, "profile should be under photographer's own admin_id"
        pid = new_pid
        if pid:
            requests.delete(
                f"{BASE_URL}/api/admin/profiles/{pid}",
                headers=_hdr(ph_token),
                timeout=30,
            )

    def test_sa_on_behalf_unknown_id_returns_404(self, sa_token):
        payload = {
            "groom_name": "TEST_404",
            "bride_name": "Unknown",
            "venue": "x",
            "event_date": "2026-12-31",
            "event_type": "wedding",
            "events": [],
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/profiles",
            params={"on_behalf_of": "00000000-fake"},
            json=payload,
            headers=_hdr(sa_token),
            timeout=30,
        )
        assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text}"


# ----------------------- Demo invitation seed -----------------------

class TestDemoInvitation:
    def test_photographer_lists_demo_profile(self, ph_token):
        r = requests.get(f"{BASE_URL}/api/admin/profiles", headers=_hdr(ph_token), timeout=30)
        assert r.status_code == 200, f"status {r.status_code}: {r.text}"
        profiles = r.json()
        if isinstance(profiles, dict):
            profiles = profiles.get("profiles", profiles)
        slugs = [p.get("slug") for p in profiles]
        assert DEMO_SLUG in slugs, f"demo slug missing — found slugs: {slugs}"
        demo = next(p for p in profiles if p.get("slug") == DEMO_SLUG)
        assert demo.get("groom_name") == "Aarav"
        assert demo.get("bride_name") == "Riya"

    def test_sa_photographer_detail_metrics(self, sa_token):
        r = requests.get(
            f"{BASE_URL}/api/super-admin/photographers/{DEMO_PHOTOGRAPHER_ID}/detail",
            headers=_hdr(sa_token),
            timeout=30,
        )
        assert r.status_code == 200, f"status {r.status_code}: {r.text}"
        body = r.json()
        summary = body.get("summary", {})
        assert summary.get("profiles_total") >= 1
        assert summary.get("profiles_published") >= 1
        assert summary.get("rsvps_total") == 5, f"expected 5, got {summary.get('rsvps_total')}"
        assert summary.get("views_total") == 142, f"expected 142, got {summary.get('views_total')}"
        profiles = body.get("profiles", [])
        demo = next((p for p in profiles if p.get("slug") == DEMO_SLUG), None)
        assert demo is not None, "demo profile not in detail"
        m = demo.get("metrics", {})
        assert m.get("views") == 142
        assert m.get("rsvps") == 5
        assert m.get("wishes") == 5
        assert m.get("photos") == 6

    def test_public_gallery_photos(self):
        r = requests.get(
            f"{BASE_URL}/api/public/gallery/{DEMO_SLUG}/photos",
            headers={"User-Agent": UA},
            timeout=30,
        )
        assert r.status_code == 200, f"status {r.status_code}: {r.text}"
        body = r.json()
        photos = body if isinstance(body, list) else body.get("photos", [])
        assert len(photos) == 6, f"expected 6 photos, got {len(photos)}"

    def test_public_invite_loads(self):
        r = requests.get(
            f"{BASE_URL}/api/invite/{DEMO_SLUG}",
            headers={"User-Agent": UA},
            timeout=30,
        )
        assert r.status_code == 200, f"status {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("groom_name") == "Aarav"
        assert body.get("bride_name") == "Riya"
        assert "Leela" in (body.get("venue") or ""), f"venue: {body.get('venue')}"

    def test_public_invite_cache_header(self):
        # Hit local backend directly to bypass CDN overrides
        r = requests.get(
            "http://localhost:8001" + f"/api/invite/{DEMO_SLUG}",
            headers={"User-Agent": UA},
            timeout=30,
        )
        assert r.status_code == 200
        cc = (r.headers.get("cache-control") or "").lower()
        assert "public" in cc and "max-age=30" in cc and "s-maxage=60" in cc, (
            f"cache-control header missing/wrong: {cc!r}"
        )
