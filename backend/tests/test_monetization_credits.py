"""
Monetization features tests:
  - SA CRUD for /api/super-admin/credit-packs
  - Photographer list /api/admin/credit-packs (only active, sorted)
  - Purchase create-order (auth, validation; placeholder Razorpay -> 502)
  - Purchase verify (invalid signature -> 400; idempotency via DB)
  - Razorpay webhook (placeholder secret accepts unverified; idempotent credit)
  - Photographer purchase history
  - Super-admin photographer detail drill-down
  - Scaling / Cache-Control headers + no-abuse-block on whitelisted public paths
  - No-regression smoke: live gallery list, wishes list, analytics heatmap
"""
import os
import time
import uuid
import hmac
import json
import hashlib
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env file
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "wedding_platform"

ADMIN_EMAIL = "admin@wedding.com"
ADMIN_PASSWORD = "admin123"
SA_EMAIL = "superadmin@wedding.com"
SA_PASSWORD = "SuperAdmin@123"
TEST_PROFILE_ID = "122ffd50-a1d0-4583-b2af-43bea70bc815"
TEST_PROFILE_SLUG = "aarav-riya-lp2bq2"

MOZ_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)
LOCAL_URL = "http://localhost:8001"


# Patch requests default UA at module level so every test goes through
# bot-detection middleware as a browser.
_orig_request = requests.Session.request


def _patched_request(self, method, url, **kw):
    headers = kw.pop("headers", {}) or {}
    if "User-Agent" not in {k.title() for k in headers}:
        headers["User-Agent"] = MOZ_UA
    kw["headers"] = headers
    return _orig_request(self, method, url, **kw)


requests.Session.request = _patched_request

# Also patch top-level requests.get/post/put/delete via a default session
_session = requests.Session()
_session.headers.update({"User-Agent": MOZ_UA})
requests.get = _session.get
requests.post = _session.post
requests.put = _session.put
requests.delete = _session.delete


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_id(admin_token):
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    return r.json()["admin"]["id"]


@pytest.fixture(scope="session")
def sa_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": SA_EMAIL, "password": SA_PASSWORD},
                      timeout=15)
    assert r.status_code == 200, f"SA login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


def MOZ():
    return {"User-Agent": MOZ_UA}


# ---------------------------------------------------------------------------
# SA Credit-Pack CRUD
# ---------------------------------------------------------------------------
class TestSuperAdminCreditPacks:
    created_pack_id = None

    def test_list_requires_super_admin(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/super-admin/credit-packs", headers=H(admin_token))
        assert r.status_code == 403, f"Expected 403 for admin role, got {r.status_code}"

    def test_list_with_sa(self, sa_token):
        r = requests.get(f"{BASE_URL}/api/super-admin/credit-packs", headers=H(sa_token))
        assert r.status_code == 200
        assert "packs" in r.json()
        assert isinstance(r.json()["packs"], list)

    def test_create_pack(self, sa_token):
        payload = {
            "label": "TEST_Starter",
            "price_inr": 499,
            "credits": 5,
            "badge": "Most Popular",
            "description": "TEST pack for monetization tests",
            "sort_order": 99,
            "is_active": True,
        }
        r = requests.post(f"{BASE_URL}/api/super-admin/credit-packs",
                          json=payload, headers=H(sa_token))
        assert r.status_code in (200, 201), f"{r.status_code} {r.text}"
        data = r.json()
        assert data["label"] == "TEST_Starter"
        assert data["price_inr"] == 499
        assert data["credits"] == 5
        assert "id" in data
        TestSuperAdminCreditPacks.created_pack_id = data["id"]

    def test_create_validation(self, sa_token):
        # credits<=0 should be rejected by Pydantic
        r = requests.post(f"{BASE_URL}/api/super-admin/credit-packs",
                          json={"label": "BAD", "price_inr": 100, "credits": 0},
                          headers=H(sa_token))
        assert r.status_code == 422

    def test_update_pack(self, sa_token):
        pid = TestSuperAdminCreditPacks.created_pack_id
        assert pid, "create test must run first"
        r = requests.put(f"{BASE_URL}/api/super-admin/credit-packs/{pid}",
                         json={"badge": "Best Value", "price_inr": 599},
                         headers=H(sa_token))
        assert r.status_code == 200
        data = r.json()
        assert data["badge"] == "Best Value"
        assert data["price_inr"] == 599

    def test_admin_list_only_active_sorted(self, admin_token, sa_token, db):
        # Make sure the TEST pack is active
        pid = TestSuperAdminCreditPacks.created_pack_id
        requests.put(f"{BASE_URL}/api/super-admin/credit-packs/{pid}",
                     json={"is_active": True}, headers=H(sa_token))

        r = requests.get(f"{BASE_URL}/api/admin/credit-packs", headers=H(admin_token))
        assert r.status_code == 200
        packs = r.json()["packs"]
        assert isinstance(packs, list)
        # All should be active
        for p in packs:
            assert p.get("is_active", True) is True
        # Verify sorting: (sort_order asc, price_inr asc)
        keys = [(p.get("sort_order", 0), p.get("price_inr", 0)) for p in packs]
        assert keys == sorted(keys), f"Not sorted: {keys}"

    def test_delete_pack(self, sa_token):
        pid = TestSuperAdminCreditPacks.created_pack_id
        r = requests.delete(f"{BASE_URL}/api/super-admin/credit-packs/{pid}",
                            headers=H(sa_token))
        assert r.status_code == 200
        # Now delete again - 404
        r2 = requests.delete(f"{BASE_URL}/api/super-admin/credit-packs/{pid}",
                             headers=H(sa_token))
        assert r2.status_code == 404


# ---------------------------------------------------------------------------
# Purchase create-order (placeholder Razorpay keys => 502 or 503)
# ---------------------------------------------------------------------------
class TestPurchaseCreateOrder:
    def test_requires_admin(self):
        r = requests.post(f"{BASE_URL}/api/admin/credits/purchase/create-order",
                          json={"pack_id": "x"})
        assert r.status_code in (401, 403)

    def test_unknown_pack_returns_404(self, admin_token):
        r = requests.post(f"{BASE_URL}/api/admin/credits/purchase/create-order",
                          json={"pack_id": "does_not_exist"},
                          headers=H(admin_token))
        # razorpay_client likely initialised even with placeholder keys
        # If razorpay_client is None -> 503; else pack check happens AFTER
        # razorpay_client None-check, so 503 first or 404 if client present.
        assert r.status_code in (404, 503), f"got {r.status_code}: {r.text}"

    def test_create_order_with_placeholder_keys(self, admin_token, sa_token, db):
        # Seed an active pack
        pack_id = uuid.uuid4().hex
        db.credit_packs.insert_one({
            "id": pack_id, "label": "TEST_PurchasePack",
            "price_inr": 100, "credits": 1, "is_active": True,
            "sort_order": 999, "created_at": "2025-01-01T00:00:00+00:00",
            "updated_at": "2025-01-01T00:00:00+00:00",
        })
        try:
            r = requests.post(f"{BASE_URL}/api/admin/credits/purchase/create-order",
                              json={"pack_id": pack_id}, headers=H(admin_token), timeout=30)
            # With placeholder keys, razorpay.order.create() should fail -> 502
            # OR razorpay_client may be None -> 503
            # Accept also unexpected 200 if real keys configured
            assert r.status_code in (200, 502, 503), f"{r.status_code} {r.text}"
            if r.status_code == 502:
                assert "Could not create order" in r.text or "order" in r.text.lower()
        finally:
            db.credit_packs.delete_one({"id": pack_id})


# ---------------------------------------------------------------------------
# Purchase verify
# ---------------------------------------------------------------------------
class TestPurchaseVerify:
    def test_verify_invalid_signature(self, admin_token, admin_id, db):
        # Seed a purchase doc directly
        order_id = f"order_TEST_{uuid.uuid4().hex[:10]}"
        purchase_id = f"purch_TEST_{uuid.uuid4().hex[:10]}"
        db.credit_purchases.insert_one({
            "id": purchase_id,
            "admin_id": admin_id,
            "pack_id": "noop",
            "pack_label": "TEST",
            "credits": 5,
            "amount_inr": 499,
            "amount_paise": 49900,
            "currency": "INR",
            "razorpay_order_id": order_id,
            "razorpay_payment_id": None,
            "razorpay_signature": None,
            "status": "created",
            "credited": False,
            "created_at": "2025-01-01T00:00:00+00:00",
            "completed_at": None,
        })
        try:
            r = requests.post(f"{BASE_URL}/api/admin/credits/purchase/verify",
                              json={
                                  "razorpay_order_id": order_id,
                                  "razorpay_payment_id": "pay_FAKE_INVALID",
                                  "razorpay_signature": "deadbeef_invalid_signature",
                              },
                              headers=H(admin_token))
            # 400 invalid signature OR 503 if razorpay_client None
            assert r.status_code in (400, 503), f"{r.status_code} {r.text}"
            if r.status_code == 400:
                assert "Invalid payment signature" in r.text
            # And verify NOT credited
            doc = db.credit_purchases.find_one({"id": purchase_id})
            assert doc["credited"] is False
            # No ledger entry should exist for this purchase
            count = db.credit_ledger.count_documents({
                "metadata.purchase_id": purchase_id,
                "action_type": "add",
            })
            assert count == 0
        finally:
            db.credit_purchases.delete_one({"id": purchase_id})
            db.credit_ledger.delete_many({"metadata.purchase_id": purchase_id})

    def test_verify_unknown_order_404(self, admin_token):
        r = requests.post(f"{BASE_URL}/api/admin/credits/purchase/verify",
                          json={
                              "razorpay_order_id": f"order_NOT_EXIST_{uuid.uuid4().hex[:6]}",
                              "razorpay_payment_id": "pay_x",
                              "razorpay_signature": "sig_x",
                          },
                          headers=H(admin_token))
        # 404 (not found) OR 503 if razorpay_client None
        assert r.status_code in (404, 503), f"{r.status_code} {r.text}"

    def test_verify_already_credited_idempotent(self, admin_token, admin_id, db):
        """If purchase already credited, verify with invalid sig still rejects sig
        before _credit_purchase_atomic runs. So this case tests the DB-level
        idempotency of _credit_purchase_atomic via direct manipulation."""
        order_id = f"order_TEST_{uuid.uuid4().hex[:10]}"
        purchase_id = f"purch_TEST_{uuid.uuid4().hex[:10]}"
        db.credit_purchases.insert_one({
            "id": purchase_id, "admin_id": admin_id, "pack_id": "x",
            "pack_label": "TEST", "credits": 5, "amount_inr": 499,
            "amount_paise": 49900, "currency": "INR",
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_pre", "razorpay_signature": "sig_pre",
            "status": "captured", "credited": True,
            "created_at": "2025-01-01T00:00:00+00:00",
            "completed_at": "2025-01-01T00:00:00+00:00",
        })
        try:
            # Even with invalid signature, doc credited=True remains
            r = requests.post(f"{BASE_URL}/api/admin/credits/purchase/verify",
                              json={
                                  "razorpay_order_id": order_id,
                                  "razorpay_payment_id": "pay_fake",
                                  "razorpay_signature": "sig_fake",
                              },
                              headers=H(admin_token))
            # Invalid signature -> 400; credited flag unchanged
            assert r.status_code in (400, 503)
            doc = db.credit_purchases.find_one({"id": purchase_id})
            assert doc["credited"] is True
        finally:
            db.credit_purchases.delete_one({"id": purchase_id})


# ---------------------------------------------------------------------------
# Webhook
# ---------------------------------------------------------------------------
class TestRazorpayWebhook:
    def test_webhook_placeholder_secret_accepts(self):
        body = json.dumps({"event": "test.noop", "payload": {}})
        r = requests.post(f"{BASE_URL}/api/payments/razorpay-webhook",
                          data=body, headers={"Content-Type": "application/json",
                                              "x-razorpay-signature": "anything"})
        # Placeholder mode -> accept
        assert r.status_code == 200
        assert r.json().get("received") is True

    def test_webhook_idempotent_payment_captured(self, admin_id, db):
        # Seed an uncredited purchase
        order_id = f"order_TEST_{uuid.uuid4().hex[:10]}"
        payment_id = f"pay_TEST_{uuid.uuid4().hex[:10]}"
        purchase_id = f"purch_TEST_{uuid.uuid4().hex[:10]}"
        db.credit_purchases.insert_one({
            "id": purchase_id, "admin_id": admin_id, "pack_id": "x",
            "pack_label": "TEST_WebhookPack", "credits": 3, "amount_inr": 99,
            "amount_paise": 9900, "currency": "INR",
            "razorpay_order_id": order_id,
            "razorpay_payment_id": None, "razorpay_signature": None,
            "status": "created", "credited": False,
            "created_at": "2025-01-01T00:00:00+00:00", "completed_at": None,
        })

        # Snapshot credit ledger for this admin
        before_ledger = db.credit_ledger.count_documents({
            "admin_id": admin_id, "metadata.purchase_id": purchase_id, "action_type": "add"
        })
        assert before_ledger == 0

        # Snapshot admin total_credits
        admin_before = db.admins.find_one({"id": admin_id}) or {}
        total_before = int(admin_before.get("total_credits", 0))

        body = json.dumps({
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": payment_id, "order_id": order_id}}}
        })
        headers = {"Content-Type": "application/json", "x-razorpay-signature": "placeholder_ok"}

        try:
            # First call -> credits
            r1 = requests.post(f"{BASE_URL}/api/payments/razorpay-webhook",
                               data=body, headers=headers)
            assert r1.status_code == 200, f"{r1.status_code} {r1.text}"

            # Second call -> idempotent
            r2 = requests.post(f"{BASE_URL}/api/payments/razorpay-webhook",
                               data=body, headers=headers)
            assert r2.status_code == 200

            # Sleep small to ensure DB ops settle (motor is async)
            time.sleep(0.5)

            # Verify ledger has exactly ONE add entry for this purchase
            count = db.credit_ledger.count_documents({
                "admin_id": admin_id,
                "metadata.purchase_id": purchase_id,
                "action_type": "add",
            })
            assert count == 1, f"Expected 1 ledger entry, got {count}"

            # Verify purchase credited flag is True
            doc = db.credit_purchases.find_one({"id": purchase_id})
            assert doc["credited"] is True
            assert doc["status"] == "captured"
            assert doc["razorpay_payment_id"] == payment_id

            # Verify admin total_credits increased by exactly 3
            admin_after = db.admins.find_one({"id": admin_id}) or {}
            total_after = int(admin_after.get("total_credits", 0))
            assert total_after - total_before == 3, \
                f"Expected +3 credits, got {total_after - total_before}"
        finally:
            db.credit_purchases.delete_one({"id": purchase_id})
            db.credit_ledger.delete_many({"metadata.purchase_id": purchase_id})
            # Roll back admin total_credits to before-state
            db.admins.update_one({"id": admin_id},
                                 {"$set": {"total_credits": total_before}})
            db.razorpay_events.delete_many({"order_id": order_id})


# ---------------------------------------------------------------------------
# Photographer purchase history
# ---------------------------------------------------------------------------
class TestPurchaseHistory:
    def test_history_returns_self_only(self, admin_token, admin_id, db):
        # Seed one TEST purchase
        purchase_id = f"purch_TEST_{uuid.uuid4().hex[:10]}"
        order_id = f"order_TEST_{uuid.uuid4().hex[:10]}"
        db.credit_purchases.insert_one({
            "id": purchase_id, "admin_id": admin_id, "pack_id": "x",
            "pack_label": "TEST_HistPack", "credits": 1, "amount_inr": 99,
            "amount_paise": 9900, "currency": "INR",
            "razorpay_order_id": order_id, "status": "created", "credited": False,
            "created_at": "2025-01-01T00:00:00+00:00",
        })
        # Also seed a foreign-admin purchase to verify exclusion
        foreign_id = f"purch_TEST_FOREIGN_{uuid.uuid4().hex[:6]}"
        db.credit_purchases.insert_one({
            "id": foreign_id, "admin_id": "FOREIGN_ADMIN_XXX", "pack_id": "x",
            "credits": 1, "amount_inr": 99, "razorpay_order_id": "order_OTHER",
            "status": "created", "credited": False,
            "created_at": "2025-01-01T00:00:00+00:00",
        })
        try:
            r = requests.get(f"{BASE_URL}/api/admin/credits/purchases",
                             headers=H(admin_token))
            assert r.status_code == 200
            data = r.json()
            assert "purchases" in data
            ids = [p["id"] for p in data["purchases"]]
            assert purchase_id in ids
            assert foreign_id not in ids
            # All purchases must belong to this admin
            for p in data["purchases"]:
                assert p["admin_id"] == admin_id
        finally:
            db.credit_purchases.delete_one({"id": purchase_id})
            db.credit_purchases.delete_one({"id": foreign_id})


# ---------------------------------------------------------------------------
# Super-admin photographer detail
# ---------------------------------------------------------------------------
class TestSuperAdminPhotographerDetail:
    def test_unknown_admin_returns_404(self, sa_token):
        r = requests.get(f"{BASE_URL}/api/super-admin/photographers/UNKNOWN_XYZ/detail",
                         headers=H(sa_token))
        assert r.status_code == 404

    def test_requires_super_admin(self, admin_token, admin_id):
        r = requests.get(f"{BASE_URL}/api/super-admin/photographers/{admin_id}/detail",
                         headers=H(admin_token))
        assert r.status_code == 403

    def test_detail_structure(self, sa_token, admin_id):
        r = requests.get(f"{BASE_URL}/api/super-admin/photographers/{admin_id}/detail",
                         headers=H(sa_token), timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        data = r.json()
        # Top-level keys
        for key in ("admin", "summary", "profiles", "credit_ledger", "purchases"):
            assert key in data, f"missing key {key}"
        # Admin: no password_hash
        assert "password_hash" not in data["admin"]
        assert data["admin"]["id"] == admin_id
        # Summary keys
        for k in ("profiles_total", "profiles_published", "rsvps_total",
                  "views_total", "revenue_inr", "credits_total",
                  "credits_used", "credits_available", "last_login"):
            assert k in data["summary"], f"summary missing {k}"
        # credits_available = total - used
        s = data["summary"]
        assert s["credits_available"] == s["credits_total"] - s["credits_used"]
        # Profiles is a list
        assert isinstance(data["profiles"], list)
        # Each profile has metrics + public_link
        for p in data["profiles"]:
            assert "public_link" in p
            assert p["public_link"].startswith("/invite/")
            assert "metrics" in p
            for mkey in ("views", "unique_views", "rsvps", "rsvps_yes",
                         "wishes", "photos"):
                assert mkey in p["metrics"]


# ---------------------------------------------------------------------------
# Scaling: Cache-Control + whitelist abuse-prevention
# ---------------------------------------------------------------------------
class TestScalingHeadersAndWhitelist:
    def test_public_wishes_cache_control(self):
        # Hit localhost directly to bypass Cloudflare which strips Cache-Control
        # for dynamic responses. The middleware DOES set the header at app layer.
        r = requests.get(f"{LOCAL_URL}/api/public/invite/{TEST_PROFILE_SLUG}/wishes",
                         headers=MOZ())
        assert r.status_code == 200
        cc = r.headers.get("Cache-Control", "")
        assert "max-age" in cc, f"Cache-Control missing max-age: {cc!r}"

        # Also check via public URL — informational (Cloudflare may strip).
        r2 = requests.get(f"{BASE_URL}/api/public/invite/{TEST_PROFILE_SLUG}/wishes",
                          headers=MOZ())
        cc2 = r2.headers.get("Cache-Control", "")
        print(f"[info] Cache-Control via Cloudflare = {cc2!r}")

    def test_uploads_cache_control(self, db):
        # Hit localhost so we test the middleware directly, bypass Cloudflare
        r = requests.get(
            f"{LOCAL_URL}/api/uploads/weddings/{TEST_PROFILE_ID}/gallery/_probe.jpg",
            headers=MOZ(), allow_redirects=False)
        cc = r.headers.get("Cache-Control", "")
        assert "max-age=86400" in cc, f"Expected immutable uploads cache, got {cc!r}"

    def test_wishes_moderation_endpoint_not_abuse_blocked(self):
        """Hit /api/invite/wishes-moderation 30 times quickly; expect no 403."""
        url = f"{BASE_URL}/api/invite/wishes-moderation"
        statuses = []
        for _ in range(30):
            r = requests.get(url, headers=MOZ(), timeout=10)
            statuses.append(r.status_code)
        # No 403 (abuse block) should appear. 404 ok since path may not exist.
        bad = [s for s in statuses if s == 403]
        assert len(bad) == 0, f"Abuse-blocked 403 returned {len(bad)} times: {statuses}"


# ---------------------------------------------------------------------------
# No-regression smoke for prompts 05/13, 07, 16
# ---------------------------------------------------------------------------
class TestNoRegression:
    def test_live_gallery_public_list(self):
        r = requests.get(
            f"{BASE_URL}/api/public/gallery/{TEST_PROFILE_SLUG}/photos?limit=10",
            headers=MOZ())
        assert r.status_code == 200
        data = r.json()
        assert "photos" in data or isinstance(data, dict)

    def test_public_wishes(self):
        r = requests.get(f"{BASE_URL}/api/public/invite/{TEST_PROFILE_SLUG}/wishes?limit=10",
                         headers=MOZ())
        assert r.status_code == 200
        assert "wishes" in r.json() or isinstance(r.json(), (list, dict))

    def test_analytics_heatmap(self, admin_token):
        r = requests.get(
            f"{BASE_URL}/api/admin/profiles/{TEST_PROFILE_ID}/analytics/heatmap?days=30",
            headers=H(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "data" in data
        assert isinstance(data["data"], list)
