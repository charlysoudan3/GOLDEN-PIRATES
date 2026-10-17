"""Tests pour la Bouteille perdue : POST /api/applications/recover."""
import os
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # Fallback: read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

MONGO = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]


@pytest.fixture(scope="module")
def seed_app():
    """Crée une candidature témoin TEST_ et nettoie à la fin."""
    MONGO.recovery_attempts.delete_many({})
    MONGO.applications.delete_many({"pseudo_lower": {"$regex": "^recov"}})
    MONGO.rejections.delete_many({"pseudo_lower": {"$regex": "^recov"}})
    payload = {
        "pseudo": "RECOV_Bottle",
        "power": "50M",
        "troops": "T10 Cavalerie",
        "activity": "Soir FR",
        "experience": "ras",
        "discord": "LostCap#1023",
        "message": "Message témoin pour test de la bouteille perdue — au moins dix caractères.",
    }
    r = requests.post(f"{BASE_URL}/api/applications", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    yield data
    # cleanup
    MONGO.applications.delete_many({"pseudo_lower": {"$regex": "^recov"}})
    MONGO.rejections.delete_many({"pseudo_lower": {"$regex": "^recov"}})
    MONGO.messages.delete_many({"conv_code": data["tracking_code"]})
    MONGO.recovery_attempts.delete_many({})


@pytest.fixture(autouse=True)
def purge_attempts():
    """Purge le compteur avant chaque test pour éviter le 429 partagé."""
    MONGO.recovery_attempts.delete_many({})
    yield


def test_recover_success(seed_app):
    r = requests.post(f"{BASE_URL}/api/applications/recover",
                      json={"pseudo": "RECOV_Bottle", "discord": "LostCap#1023"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["tracking_code"] == seed_app["tracking_code"]
    assert d["pseudo"] == "RECOV_Bottle"
    assert d["status"] == "pending"


def test_recover_discord_case_insensitive(seed_app):
    r = requests.post(f"{BASE_URL}/api/applications/recover",
                      json={"pseudo": "recov_bottle", "discord": "lostcap#1023"})
    assert r.status_code == 200
    assert r.json()["tracking_code"] == seed_app["tracking_code"]


def test_recover_wrong_discord(seed_app):
    r = requests.post(f"{BASE_URL}/api/applications/recover",
                      json={"pseudo": "RECOV_Bottle", "discord": "wrong#9999"})
    assert r.status_code == 404
    body = r.json()
    # Message générique — pas de révélation
    detail = body.get("detail", {})
    assert detail.get("code") == "recover_not_found"
    assert "pseudo" in detail.get("msg", "").lower() or "bouteille" in detail.get("msg", "").lower()


def test_recover_wrong_pseudo(seed_app):
    r = requests.post(f"{BASE_URL}/api/applications/recover",
                      json={"pseudo": "TEST_Wrong", "discord": "LostCap#1023"})
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "recover_not_found"


def test_recover_rate_limit():
    """6ème tentative → 429."""
    MONGO.recovery_attempts.delete_many({})
    for i in range(5):
        r = requests.post(f"{BASE_URL}/api/applications/recover",
                          json={"pseudo": f"TEST_nope{i}", "discord": "nope#0000"})
        assert r.status_code == 404
    r = requests.post(f"{BASE_URL}/api/applications/recover",
                      json={"pseudo": "TEST_nope5", "discord": "nope#0000"})
    assert r.status_code == 429
    assert r.json()["detail"]["code"] == "recover_limit"


def test_recover_validation():
    r = requests.post(f"{BASE_URL}/api/applications/recover",
                      json={"pseudo": "a", "discord": "x"})
    assert r.status_code == 422


def test_recovery_attempts_ttl_index():
    """Vérifie que l'index TTL existe sur recovery_attempts (2 h)."""
    idx = MONGO.recovery_attempts.index_information()
    found = any(v.get("expireAfterSeconds") == 7200 for v in idx.values())
    assert found, f"TTL index manquant: {idx}"
