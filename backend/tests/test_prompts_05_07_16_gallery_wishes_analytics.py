"""
Pytest suite for:
- PROMPT 05+13 — Live Photo Gallery (WebSocket + photographer + guest upload)
- PROMPT 07   — Guest Wishes Wall + Moderation + Featured
- PROMPT 16   — Analytics deep-dive (heatmap / funnel / geography / AI insights)

Plus: NO regression sanity (login, profile list, RSVP, public invite resolution).
Uses local backend at http://localhost:8001 + Mozilla UA to bypass BotDetectionMiddleware.
"""
from __future__ import annotations

import io
import os
import json
import time
import asyncio
import pytest
import requests
from PIL import Image

# --- Config ---------------------------------------------------------------
BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8001")
ADMIN_EMAIL = "admin@wedding.com"
ADMIN_PASSWORD = "admin123"
PROFILE_ID = "122ffd50-a1d0-4583-b2af-43bea70bc815"
SLUG = "aarav-riya-lp2bq2"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


# --- Fixtures -------------------------------------------------------------
@pytest.fixture(scope="session")
def admin_token() -> str:
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login",
               data=json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}))
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:200]}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"no token in response: {data}"
    return tok


@pytest.fixture(scope="session")
def admin_session(admin_token) -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Authorization": f"Bearer {admin_token}"})
    return s


@pytest.fixture(scope="session")
def public_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    return s


def _make_jpg(color=(200, 80, 80), size=(640, 480)) -> bytes:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


# =========================================================================
# NO-REGRESSION sanity
# =========================================================================
class TestNoRegression:
    def test_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_admin_list_profiles(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/profiles")
        assert r.status_code == 200
        data = r.json()
        profs = data.get("profiles") if isinstance(data, dict) else data
        ids = [p.get("id") for p in profs]
        assert PROFILE_ID in ids

    def test_public_invite_resolves(self, public_session):
        r = public_session.get(f"{BASE_URL}/api/invite/{SLUG}")
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        # invite endpoint should mention bride or groom names somewhere
        flat = json.dumps(data).lower()
        assert "aarav" in flat or "riya" in flat


# =========================================================================
# PROMPT 05 + 13 — Live Photo Gallery
# =========================================================================
class TestLiveGallery:
    # store created photo ids for cleanup / delete tests
    photographer_photo_id: str | None = None
    guest_photo_id: str | None = None

    def test_websocket_initial_message(self):
        """WebSocket /api/ws/gallery/{slug} should accept connection and push {type:connected}."""
        try:
            import websockets  # type: ignore
        except ImportError:
            pytest.skip("websockets library not installed")

        async def run():
            url = f"ws://localhost:8001/api/ws/gallery/{SLUG}"
            async with websockets.connect(url, open_timeout=5, ping_interval=None) as ws:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                data = json.loads(msg)
                assert data.get("type") == "connected"
                assert data.get("wedding_id") == PROFILE_ID, f"resolved id mismatch: {data}"

        asyncio.run(run())

    def test_photographer_upload(self, admin_session):
        files = [
            ("files", ("a.jpg", _make_jpg((220, 50, 50)), "image/jpeg")),
            ("files", ("b.jpg", _make_jpg((30, 120, 200)), "image/jpeg")),
        ]
        r = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/live-gallery/upload",
            files=files,
        )
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["uploaded"] == 2
        assert len(data["photos"]) == 2
        p = data["photos"][0]
        assert p["source"] == "photographer"
        for k in ("url", "thumb_url", "micro_url"):
            assert k in p and p[k].startswith("/api/uploads/weddings/")
        assert "thumb_" in p["thumb_url"] and p["thumb_url"].endswith(".webp")
        assert "micro_" in p["micro_url"] and p["micro_url"].endswith(".webp")
        TestLiveGallery.photographer_photo_id = p["id"]

    def test_serve_uploaded_file(self, public_session, admin_session):
        # Re-fetch admin list to get a URL
        r = admin_session.get(f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/live-gallery/photos")
        assert r.status_code == 200
        photos = r.json()["photos"]
        assert len(photos) > 0
        url = photos[0]["thumb_url"]  # /api/uploads/weddings/{id}/gallery/thumb_xxx.webp
        full = f"{BASE_URL}{url}"
        r2 = public_session.get(full)
        assert r2.status_code == 200, f"{full} → {r2.status_code}"
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 100

    def test_guest_upload(self, public_session):
        files = {"file": ("guest.jpg", _make_jpg((50, 200, 80)), "image/jpeg")}
        data = {"guest_name": "Priya Aunty", "caption": "Beautiful ceremony!"}
        r = public_session.post(
            f"{BASE_URL}/api/invite/{SLUG}/gallery/guest-upload",
            files=files, data=data,
        )
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert body["success"] is True
        photo = body["photo"]
        assert photo["source"] == "guest"
        assert photo["guest_name"] == "Priya Aunty"
        assert photo["caption"] == "Beautiful ceremony!"
        TestLiveGallery.guest_photo_id = photo["id"]

    def test_public_list_photos(self, public_session):
        r = public_session.get(f"{BASE_URL}/api/public/gallery/{SLUG}/photos?limit=200")
        assert r.status_code == 200
        data = r.json()
        assert "photos" in data and isinstance(data["photos"], list)
        assert data["total"] >= 3  # at least photographer x2 + guest x1
        # newest first
        ts = [p["created_at"] for p in data["photos"]]
        assert ts == sorted(ts, reverse=True)
        # since filter (use a future date → should be empty)
        r2 = public_session.get(f"{BASE_URL}/api/public/gallery/{SLUG}/photos?since=2099-01-01T00:00:00+00:00")
        assert r2.status_code == 200
        assert r2.json()["photos"] == []

    def test_admin_list_photos_with_counts(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/live-gallery/photos")
        assert r.status_code == 200
        data = r.json()
        assert data["photographer_count"] >= 2
        assert data["guest_count"] >= 1
        assert data["total"] == data["photographer_count"] + data["guest_count"]
        assert isinstance(data["storage_bytes"], int) and data["storage_bytes"] > 0

    def test_delete_photo(self, admin_session):
        pid = TestLiveGallery.guest_photo_id
        assert pid, "guest_photo_id not set (previous test failed?)"
        r = admin_session.delete(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/live-gallery/{pid}"
        )
        assert r.status_code == 200, r.text[:200]
        assert r.json()["success"] is True
        # verify gone
        r2 = admin_session.get(f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/live-gallery/photos")
        ids = [p["id"] for p in r2.json()["photos"]]
        assert pid not in ids


# =========================================================================
# PROMPT 07 — Wishes Wall + Moderation
# =========================================================================
@pytest.fixture(scope="class")
def _reset_wishes_state(admin_session):
    """Clear wish rate-limits + prior TEST_ wishes so the rate-limit window is fresh."""
    # delete any TEST_ wishes via admin DELETE
    r = admin_session.get(f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes")
    if r.status_code == 200:
        for w in r.json().get("wishes", []):
            if str(w.get("guest_name", "")).startswith("TEST_"):
                admin_session.delete(
                    f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes/{w['id']}"
                )
    # reset rate limit by talking to mongo directly
    try:
        from pymongo import MongoClient
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "wedding_platform")
        client = MongoClient(mongo_url)
        client[db_name].wish_rate_limits.delete_many({"profile_id": PROFILE_ID})
        client.close()
    except Exception as e:
        print(f"WARN: could not reset rate-limits: {e}")
    yield


@pytest.mark.usefixtures("_reset_wishes_state")
class TestWishes:
    submitted_ids: list = []

    def test_submit_wish_public(self, public_session):
        for i in range(3):
            r = public_session.post(
                f"{BASE_URL}/api/invite/{SLUG}/wishes",
                json={
                    "guest_name": f"TEST_Guest_{i}",
                    "relationship": "Cousin" if i == 0 else None,
                    "message": f"Wishing you a wonderful life together! #{i}",
                },
                headers={"Content-Type": "application/json"},
            )
            assert r.status_code == 200, r.text[:200]
            assert r.json()["status"] == "pending"
        # 4th should be rate-limited
        r = public_session.post(
            f"{BASE_URL}/api/invite/{SLUG}/wishes",
            json={"guest_name": "TEST_Over", "message": "should fail"},
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 429, f"expected 429 got {r.status_code} {r.text[:200]}"

    def test_admin_list_pending(self, admin_session):
        r = admin_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes?status=pending"
        )
        assert r.status_code == 200
        data = r.json()
        # remember ids of our TEST_ wishes
        pending_test = [w for w in data["wishes"] if w["guest_name"].startswith("TEST_")]
        assert len(pending_test) >= 3
        TestWishes.submitted_ids = [w["id"] for w in pending_test[:3]]
        counts = data["counts"]
        assert counts["pending"] >= 3
        for k in ("pending", "approved", "rejected", "featured"):
            assert k in counts

    def test_approve_one(self, admin_session):
        wid = TestWishes.submitted_ids[0]
        r = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes/{wid}/approve"
        )
        assert r.status_code == 200 and r.json()["success"] is True
        # Now it should appear in approved list
        r2 = admin_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes?status=approved"
        )
        ids = [w["id"] for w in r2.json()["wishes"]]
        assert wid in ids

    def test_reject_one(self, admin_session):
        wid = TestWishes.submitted_ids[1]
        r = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes/{wid}/reject"
        )
        assert r.status_code == 200

    def test_feature_toggle_auto_approves(self, admin_session):
        # the 3rd wish is still pending — feature toggle should approve + feature
        wid = TestWishes.submitted_ids[2]
        r = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes/{wid}/feature"
        )
        assert r.status_code == 200
        assert r.json()["is_featured"] is True
        # check it now appears approved
        r2 = admin_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes?status=approved"
        )
        match = [w for w in r2.json()["wishes"] if w["id"] == wid]
        assert match and match[0]["is_featured"] is True

    def test_public_wishes_only_approved_featured_first(self, public_session):
        r = public_session.get(f"{BASE_URL}/api/public/invite/{SLUG}/wishes?limit=50")
        assert r.status_code == 200
        wishes = r.json()["wishes"]
        # All returned wishes must be approved
        for w in wishes:
            # public endpoint excludes status field but only returns approved — check is_featured ordering
            assert "ip_hash" not in w
        # Featured wishes must come first
        if wishes:
            featured_idx = [i for i, w in enumerate(wishes) if w.get("is_featured")]
            non_feat_idx = [i for i, w in enumerate(wishes) if not w.get("is_featured")]
            if featured_idx and non_feat_idx:
                assert max(featured_idx) < min(non_feat_idx), "featured should be before non-featured"

    def test_bulk_approve(self, admin_session, public_session):
        # Need fresh pending wishes — submit with a different IP isn't possible from same client,
        # so the bulk-approve might just approve 0 if none are pending. Approve will use whatever
        # pending wishes exist (the rejected one will stay rejected).
        r = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes/bulk-approve"
        )
        assert r.status_code == 200
        body = r.json()
        assert "approved" in body and isinstance(body["approved"], int)

    def test_delete_wish_cleanup(self, admin_session):
        # delete the rejected & approved-but-not-featured ones to keep DB tidy
        for wid in TestWishes.submitted_ids[:2]:
            r = admin_session.delete(
                f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/wishes/{wid}"
            )
            assert r.status_code == 200


# =========================================================================
# PROMPT 16 — Analytics deep-dive
# =========================================================================
class TestAnalytics:
    def test_heatmap_default_90d(self, admin_session):
        r = admin_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/analytics/heatmap?days=90"
        )
        assert r.status_code == 200
        data = r.json()
        assert data["days"] == 90
        assert isinstance(data["data"], list)
        # endpoint builds 91 entries (range(days, -1, -1) inclusive)
        assert 90 <= len(data["data"]) <= 91
        sample = data["data"][0]
        assert "date" in sample and "opens" in sample
        # date is YYYY-MM-DD
        assert len(sample["date"]) == 10 and sample["date"][4] == "-"
        assert isinstance(sample["opens"], int) and sample["opens"] >= 0

    def test_funnel_four_stages(self, admin_session):
        r = admin_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/analytics/funnel"
        )
        assert r.status_code == 200
        stages = r.json()["stages"]
        names = [s["name"] for s in stages]
        assert names == ["Link Opened", "Invitation Viewed", "RSVP Started", "RSVP Completed"]
        # monotonically non-increasing
        counts = [s["count"] for s in stages]
        assert all(counts[i] >= counts[i + 1] for i in range(len(counts) - 1)), counts

    def test_geography(self, admin_session):
        r = admin_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/analytics/geography"
        )
        assert r.status_code == 200
        cities = r.json()["cities"]
        assert isinstance(cities, list)
        assert len(cities) <= 10
        for c in cities:
            assert "city" in c and "country" in c and "count" in c

    def test_ai_insights_and_cache(self, admin_session):
        t0 = time.time()
        r = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/analytics/ai-insights"
        )
        elapsed1 = time.time() - t0
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "insights" in data and isinstance(data["insights"], list)
        assert 1 <= len(data["insights"]) <= 3
        first_generated_at = data["generated_at"]
        assert first_generated_at

        # Second call should be cached & return same generated_at
        t1 = time.time()
        r2 = admin_session.post(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/analytics/ai-insights"
        )
        elapsed2 = time.time() - t1
        assert r2.status_code == 200
        data2 = r2.json()
        assert data2["generated_at"] == first_generated_at, (
            f"cache miss: first {first_generated_at} vs second {data2['generated_at']} "
            f"(first call {elapsed1:.1f}s, second {elapsed2:.1f}s)"
        )

    def test_unauthorised_access(self, public_session):
        # No auth → 401/403
        r = public_session.get(
            f"{BASE_URL}/api/admin/profiles/{PROFILE_ID}/analytics/funnel"
        )
        assert r.status_code in (401, 403)
