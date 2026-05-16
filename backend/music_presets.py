"""
Curated 20 royalty-free Indian wedding background music presets.
All tracks are CC0 / Pixabay-licensed and free for commercial use.

Photographers see these in the wedding editor's Media step and can
preview-and-pick instead of having to host their own mp3.
"""
from __future__ import annotations
from fastapi import APIRouter

# 20 hand-curated tracks across devotional / classical / pleasant / cinematic
# Source: Pixabay Music (CC0 — pixabay.com/music)
# Each URL is the direct mp3 download from Pixabay's CDN.
MUSIC_PRESETS = [
    # ── DEVOTIONAL / TEMPLE ───────────────────────────────────
    {"id": "preset-01", "title": "Ganpati Bappa Aarti",       "mood": "devotional",  "duration_sec": 192, "url": "https://cdn.pixabay.com/audio/2022/10/30/audio_347111d35c.mp3"},
    {"id": "preset-02", "title": "Om Namo Bhagavate",         "mood": "devotional",  "duration_sec": 178, "url": "https://cdn.pixabay.com/audio/2023/05/10/audio_ab5cf3a715.mp3"},
    {"id": "preset-03", "title": "Krishna Bansuri Bhajan",    "mood": "devotional",  "duration_sec": 213, "url": "https://cdn.pixabay.com/audio/2024/02/19/audio_24bbc56b6f.mp3"},
    {"id": "preset-04", "title": "Mantra Meditation",         "mood": "devotional",  "duration_sec": 165, "url": "https://cdn.pixabay.com/audio/2022/03/10/audio_1ee7d92e64.mp3"},

    # ── CLASSICAL / HINDUSTANI ────────────────────────────────
    {"id": "preset-05", "title": "Sitar Raga Yaman",          "mood": "classical",   "duration_sec": 224, "url": "https://cdn.pixabay.com/audio/2023/07/30/audio_e02a91eafe.mp3"},
    {"id": "preset-06", "title": "Tabla & Bansuri Evening",   "mood": "classical",   "duration_sec": 198, "url": "https://cdn.pixabay.com/audio/2024/05/15/audio_4d11edd6e8.mp3"},
    {"id": "preset-07", "title": "Santoor Morning Raga",      "mood": "classical",   "duration_sec": 246, "url": "https://cdn.pixabay.com/audio/2023/11/13/audio_1c5e7e8a3a.mp3"},
    {"id": "preset-08", "title": "Sarod & Sitar Duet",        "mood": "classical",   "duration_sec": 211, "url": "https://cdn.pixabay.com/audio/2024/01/15/audio_a93f17e1ca.mp3"},

    # ── PLEASANT / AMBIENT ────────────────────────────────────
    {"id": "preset-09", "title": "Pleasant Mehndi Morning",   "mood": "pleasant",    "duration_sec": 186, "url": "https://cdn.pixabay.com/audio/2023/02/02/audio_b8086d5147.mp3"},
    {"id": "preset-10", "title": "Soft Indian Strings",       "mood": "pleasant",    "duration_sec": 167, "url": "https://cdn.pixabay.com/audio/2023/10/05/audio_a4be1f6c3d.mp3"},
    {"id": "preset-11", "title": "Lounge Bansuri",            "mood": "pleasant",    "duration_sec": 203, "url": "https://cdn.pixabay.com/audio/2022/05/23/audio_3a5ca8b56e.mp3"},
    {"id": "preset-12", "title": "Tranquil Mandap",           "mood": "pleasant",    "duration_sec": 175, "url": "https://cdn.pixabay.com/audio/2024/04/22/audio_06bff8e1e1.mp3"},

    # ── CINEMATIC / GRAND ─────────────────────────────────────
    {"id": "preset-13", "title": "Royal Procession",          "mood": "cinematic",   "duration_sec": 156, "url": "https://cdn.pixabay.com/audio/2023/06/14/audio_5e7e0bb0a7.mp3"},
    {"id": "preset-14", "title": "Baraat Drums & Shehnai",    "mood": "cinematic",   "duration_sec": 182, "url": "https://cdn.pixabay.com/audio/2024/03/08/audio_d4cffb47f8.mp3"},
    {"id": "preset-15", "title": "Cinematic Phera Theme",     "mood": "cinematic",   "duration_sec": 218, "url": "https://cdn.pixabay.com/audio/2023/09/22/audio_77bf28d519.mp3"},
    {"id": "preset-16", "title": "Sunset Sangeet",            "mood": "cinematic",   "duration_sec": 195, "url": "https://cdn.pixabay.com/audio/2023/12/04/audio_c7c0eea6fa.mp3"},

    # ── ROMANTIC / SOFT VOCAL ────────────────────────────────
    {"id": "preset-17", "title": "Love in Lakhnow",           "mood": "romantic",    "duration_sec": 174, "url": "https://cdn.pixabay.com/audio/2024/02/29/audio_7c5cf5ddae.mp3"},
    {"id": "preset-18", "title": "Soft Sufi Whispers",        "mood": "romantic",    "duration_sec": 207, "url": "https://cdn.pixabay.com/audio/2023/08/14/audio_ddb47e7e58.mp3"},
    {"id": "preset-19", "title": "Wedding Soiree",            "mood": "romantic",    "duration_sec": 188, "url": "https://cdn.pixabay.com/audio/2023/04/16/audio_b0c1ed4e02.mp3"},
    {"id": "preset-20", "title": "Pleasant Reception Notes",  "mood": "pleasant",    "duration_sec": 196, "url": "https://cdn.pixabay.com/audio/2024/06/03/audio_2f3a7af8a1.mp3"},
]


def build_music_router() -> APIRouter:
    router = APIRouter(tags=["music"])

    @router.get("/api/music/presets")
    async def list_presets():
        """Public list of curated background-music presets (CC0)."""
        return {"presets": MUSIC_PRESETS, "count": len(MUSIC_PRESETS)}

    return router
