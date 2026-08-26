#!/usr/bin/env python3
"""Génère les narrations audio du chapitre 2 (socle technique) avec Inworld TTS v2.
Lit projets/rag/ch3-bonnes-reflexions/narration.json → projets/rag/ch2-socle-technique/audio/stop-<id>.mp3
Format v2 (snake_case) : model_id inworld-tts-2, delivery_mode CREATIVE, langue fr-FR.
"""
import base64, json, os, sys, time, urllib.request, urllib.parse

KEY = os.environ.get("INWORLD_API_KEY")
if not KEY:
    sys.exit("INWORLD_API_KEY manquante")

# Nouveau format de clé Inworld « id:secret » : l'auth Basic exige base64(clé)
# (comme curl -u). Ancien format (clé unique) : envoyée telle quelle.
if ":" in KEY:
    AUTH = "Basic " + base64.b64encode(KEY.encode()).decode()
else:
    AUTH = "Basic " + KEY

BASE = os.path.expanduser("~/Desktop/ragtycoon/projets/rag/ch3-bonnes-reflexions")
NARR = os.path.join(BASE, "narration.json")
OUT = os.path.join(BASE, "audio")
os.makedirs(OUT, exist_ok=True)

MODEL = "inworld-tts-2"
VOICE_FALLBACK = "Étienne"  # voix système française si Hélène introuvable


def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        "https://api.inworld.ai" + path,
        data=data,
        headers={"Authorization": AUTH, "Content-Type": "application/json"},
        method=method,
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())


def find_voice():
    """Cherche la voix Hélène (custom) dans la liste paginée ; fallback Étienne."""
    token = None
    candidates = []
    for _ in range(12):
        q = "?pageSize=100" + (f"&pageToken={urllib.parse.quote(token)}" if token else "")
        d = api("/voices/v1/voices" + q)
        for v in d.get("voices", []):
            dn = v.get("displayName") or ""
            if dn.lower() in ("hélène", "helene"):
                return v.get("voiceId") or dn
            if "hélène" in dn.lower() or "helene" in dn.lower():
                candidates.append(v.get("voiceId") or dn)
        token = d.get("nextPageToken")
        if not token:
            break
    if candidates:
        return candidates[0]
    return VOICE_FALLBACK


def synth(text, voice_id, out_path):
    body = {
        "text": text,
        "voice_id": voice_id,
        "model_id": MODEL,
        "audio_config": {"audio_encoding": "MP3", "speaking_rate": 1.0},
        "delivery_mode": "CREATIVE",
        "language": "fr-FR",
    }
    d = api("/tts/v1/voice", "POST", body)
    audio = base64.b64decode(d["audioContent"])
    with open(out_path, "wb") as f:
        f.write(audio)
    return len(audio)


def main():
    narr = json.load(open(NARR, encoding="utf-8"))
    voice_id = find_voice()
    print(f"Voix utilisée : {voice_id} | modèle : {MODEL} | {len(narr)} arrêts")
    n = len(narr)
    for i, (sid, text) in enumerate(narr.items(), 1):
        out = os.path.join(OUT, f"stop-{sid}.mp3")
        if os.path.exists(out) and os.path.getsize(out) > 1000:
            print(f"[{i}/{n}] {sid}: déjà présent, skip")
            continue
        for attempt in range(3):
            try:
                size = synth(text, voice_id, out)
                print(f"[{i}/{n}] {sid}: {size} octets")
                break
            except Exception as e:
                print(f"[{i}/{n}] {sid}: erreur {e} — tentative {attempt + 1}/3")
                time.sleep(3)
        time.sleep(1)
    print("TERMINÉ")


if __name__ == "__main__":
    main()
