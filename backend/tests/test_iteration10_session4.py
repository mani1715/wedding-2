"""
Iteration 10 — Session 4 enhancements regression.
Covers:
  - GET /api/music/presets (public, 20 tracks)
  - POST /api/admin/profiles with custom_text._maja extended fields
  - Round-trip read of extended fields
  - Photo upload endpoint
  - Regression: list profiles + super-admin photographer detail
"""
import json
import os
import io
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
UA = {"User-Agent": "Mozilla/5.0"}

PHOTOGRAPHER = {"email": "admin@wedding.com", "password": "admin123"}
SUPER_ADMIN = {"email": "superadmin@wedding.com", "password": "SuperAdmin@123"}
DEMO_PHOTOGRAPHER_ID = "604db096-c1ca-4738-8663-7e640334a6ac"
DEMO_SLUG = "aarav-and-riya-demo"


@pytest.fixture(scope="session")
def photog_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=PHOTOGRAPHER,
        headers={**UA, "Content-Type": "application/json"},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"photographer login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def sa_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=SUPER_ADMIN,
        headers={**UA, "Content-Type": "application/json"},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"super-admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


# ── Music presets (public) ───────────────────────────────────────────────
class TestMusicPresets:
    def test_public_no_auth_required(self):
        r = requests.get(f"{BASE_URL}/api/music/presets", headers=UA, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "presets" in data and "count" in data
        assert data["count"] == 20
        assert len(data["presets"]) == 20

    def test_preset_shape(self):
        r = requests.get(f"{BASE_URL}/api/music/presets", headers=UA, timeout=15)
        presets = r.json()["presets"]
        for p in presets:
            assert {"id", "title", "mood", "duration_sec", "url"} <= set(p.keys()), p
            assert isinstance(p["duration_sec"], int)
            assert p["url"].startswith("http")

    def test_devotional_count_and_titles(self):
        r = requests.get(f"{BASE_URL}/api/music/presets", headers=UA, timeout=15)
        devotional = [p for p in r.json()["presets"] if p["mood"] == "devotional"]
        assert len(devotional) == 4
        titles = {p["title"] for p in devotional}
        assert {"Ganpati Bappa Aarti", "Om Namo Bhagavate",
                "Krishna Bansuri Bhajan", "Mantra Meditation"} <= titles


# ── Extended-fields custom_text._maja round trip ─────────────────────────
class TestExtendedFields:
    def test_create_with_maja_and_round_trip(self, photog_token):
        events_extended = json.dumps([
            {"type": "haldi", "title": "Haldi", "date": "2026-03-10",
             "time": "10:00", "venue": "Home", "map": "https://maps.google.com/?q=Home",
             "dresscode": "Yellow", "hero_photo_url": ""},
            {"type": "reception", "title": "Reception", "date": "2026-03-12",
             "time": "19:00", "venue": "Taj", "map": "https://maps.google.com/?q=Taj",
             "dresscode": "Formal", "hero_photo_url": ""},
        ])
        maja = {
            "bride_photo_url": "https://example.com/bride.jpg",
            "groom_photo_url": "https://example.com/groom.jpg",
            "couple_photo_url": "https://example.com/couple.jpg",
            "venue_google_map_link": "https://maps.google.com/?q=Mumbai",
            "events_extended": events_extended,
        }
        suffix = uuid.uuid4().hex[:6]
        payload = {
            "groom_name": f"TEST_Groom_{suffix}",
            "bride_name": f"TEST_Bride_{suffix}",
            "venue": "Taj Mumbai",
            "event_date": "2026-03-12",
            "event_type": "wedding",
            "events": [],
            "custom_text": {"_maja": maja},
            "map_settings": {"embed_enabled": True,
                             "map_link": "https://maps.google.com/?q=Mumbai"},
        }
        headers = {**UA, "Authorization": f"Bearer {photog_token}",
                   "Content-Type": "application/json"}
        r = requests.post(f"{BASE_URL}/api/admin/profiles",
                          json=payload, headers=headers, timeout=20)
        assert r.status_code in (200, 201), r.text
        created = r.json()
        profile_id = created.get("id")
        assert profile_id

        # Round-trip read
        r2 = requests.get(f"{BASE_URL}/api/admin/profiles/{profile_id}",
                          headers=headers, timeout=20)
        assert r2.status_code == 200, r2.text
        full = r2.json()
        ct = full.get("custom_text") or {}
        maja_back = ct.get("_maja") or {}
        assert maja_back.get("bride_photo_url") == "https://example.com/bride.jpg"
        assert maja_back.get("groom_photo_url") == "https://example.com/groom.jpg"
        assert maja_back.get("couple_photo_url") == "https://example.com/couple.jpg"
        assert maja_back.get("venue_google_map_link") == "https://maps.google.com/?q=Mumbai"
        # events_extended is a stringified JSON
        ee = maja_back.get("events_extended")
        assert ee is not None
        parsed = json.loads(ee) if isinstance(ee, str) else ee
        assert isinstance(parsed, list) and len(parsed) == 2
        assert parsed[0]["type"] == "haldi"
        assert parsed[1]["type"] == "reception"

        ms = full.get("map_settings") or {}
        assert ms.get("map_link") == "https://maps.google.com/?q=Mumbai"

        # Stash for upload test
        TestExtendedFields._profile_id = profile_id

    def test_upload_photo_to_profile(self, photog_token):
        pid = getattr(TestExtendedFields, "_profile_id", None)
        if not pid:
            pytest.skip("profile not created in previous test")
        # Generate a real tiny PNG via Pillow so backend's image validator accepts it
        from PIL import Image
        buf = io.BytesIO()
        Image.new("RGB", (16, 16), color=(180, 140, 90)).save(buf, format="JPEG")
        buf.seek(0)
        files = {"file": ("tiny.jpg", buf, "image/jpeg")}
        data = {"category": "couple"}
        headers = {**UA, "Authorization": f"Bearer {photog_token}"}
        r = requests.post(
            f"{BASE_URL}/api/admin/profiles/{pid}/upload-photo",
            files=files, data=data, headers=headers, timeout=30,
        )
        assert r.status_code in (200, 201), r.text
        body = r.json()
        url = (body.get("file_url") or body.get("url")
               or body.get("photo_url") or body.get("image_url")
               or body.get("path") or body.get("filename")
               or (body.get("media") or {}).get("file_url"))
        # If still missing, at least confirm the upload returned a media id + size
        assert url or (body.get("id") and body.get("file_size", 0) > 0), body


# ── Regression: photographer profiles + SA detail ────────────────────────
class TestRegression:
    def test_photog_list_returns_demo(self, photog_token):
        headers = {**UA, "Authorization": f"Bearer {photog_token}"}
        r = requests.get(f"{BASE_URL}/api/admin/profiles", headers=headers, timeout=20)
        assert r.status_code == 200, r.text
        profiles = r.json()
        slugs = [p.get("slug") for p in profiles]
        assert DEMO_SLUG in slugs
        demo = next(p for p in profiles if p.get("slug") == DEMO_SLUG)
        assert demo["groom_name"] == "Aarav"
        assert demo["bride_name"] == "Riya"

    def test_sa_photographer_detail(self, sa_token):
        headers = {**UA, "Authorization": f"Bearer {sa_token}"}
        r = requests.get(
            f"{BASE_URL}/api/super-admin/photographers/{DEMO_PHOTOGRAPHER_ID}/detail",
            headers=headers, timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        s = d.get("summary") or {}
        assert s.get("views_total") == 142
        assert s.get("rsvps_total") == 5
        profiles = d.get("profiles") or []
        demo = next((p for p in profiles if p.get("slug") == DEMO_SLUG), None)
        assert demo is not None
        # views can be at root or nested under metrics
        views = demo.get("views") or (demo.get("metrics") or {}).get("views")
        assert views == 142, demo
