"""Generate TikTok voiceovers with edge-tts and export frame-accurate timing.

Usage:
    .venv/bin/python generate_audio.py linear-regression
    .venv/bin/python generate_audio.py list-comprehension linear-regression
    .venv/bin/python generate_audio.py            # every video

Outputs, per video:
    public/<video>/audio/segment_XX.mp3   one file per segment
    public/<video>/timing.json            text, audio file, startFrame, durationInFrames,
                                          plus per-word timings for synced subtitles
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"

FPS = 60
GAP_FRAMES = 6  # 0.1 s breath between segments
TICKS_PER_SECOND = 10_000_000  # edge-tts offsets are in 100 ns units

# One entry per video; one segment per visual scene of its composition.
VIDEOS: dict[str, dict] = {
    # src/videos/list-comprehension: 1 hook + typing the for loop,
    # 2 transform into a comprehension, 3 run it, 4 takeaway.
    "list-comprehension": {
        "voice": "en-US-AndrewNeural",
        "rate": "+12%",  # a bit faster than normal for a punchy TikTok pace
        "segments": [
            "Stop writing Python loops like this! Four lines, just to double a list?",
            "Watch. Collapse it into one list comprehension: x times two, for x in nums.",
            "Run it, and you get the exact same output. Two, four, six, eight, ten.",
            "Cleaner, more Pythonic, and usually faster. Follow for more Python tips!",
        ],
    },
    # src/videos/linear-regression: 1 hook, 2 data, 3 model, 4 error / MSE,
    # 5 training (least squares), 6 sklearn fit, 7 predict + score, 8 takeaway.
    "linear-regression": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+10%",
        "segments": [
            "La régression linéaire, c'est le premier algo de machine learning à connaître. "
            "Je t'explique tout en une minute !",
            "On part de données : par exemple, la surface d'un appartement et son prix. "
            "Le but : prédire le prix à partir de la surface.",
            "Le modèle, c'est une droite : y égale a fois x, plus b. "
            "a, c'est la pente, et b, l'ordonnée à l'origine.",
            "Pour juger la droite, on mesure l'erreur entre chaque point et la droite. "
            "On met ces erreurs au carré, on fait la moyenne : c'est la MSE.",
            "L'entraînement, c'est trouver le a et le b qui rendent cette erreur la plus petite possible. "
            "C'est la méthode des moindres carrés.",
            "Avec scikit-learn, c'est trois lignes : on importe LinearRegression, "
            "on crée le modèle, et on l'entraîne avec fit.",
            "Ensuite, predict donne le prix d'un appartement de 75 mètres carrés, "
            "et score donne le R carré : plus il est proche de 1, mieux c'est.",
            "À retenir : c'est simple, rapide et facile à interpréter, "
            "mais seulement si la relation est vraiment linéaire. Abonne-toi pour la suite !",
        ],
    },
}


def audio_duration_seconds(path: Path) -> float:
    """Exact duration: ffprobe if available, otherwise mutagen."""
    if shutil.which("ffprobe"):
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return float(out)
    return float(MP3(path).info.length)


async def synthesize(text: str, voice: str, rate: str, out_path: Path) -> list[dict]:
    """Write the MP3 and return word timings (frames, relative to segment start)."""
    # edge-tts ignores HTTPS_PROXY by default; pass it through when set.
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    communicate = edge_tts.Communicate(
        text, voice, rate=rate, proxy=proxy, boundary="WordBoundary"
    )
    words = []
    with out_path.open("wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # edge-tts sometimes glues punctuation to a word (e.g. ": x").
                word = re.sub(r"^[^\w'’]+|[^\w'’]+$", "", chunk["text"])
                if not word:
                    continue
                start = chunk["offset"] / TICKS_PER_SECOND
                end = (chunk["offset"] + chunk["duration"]) / TICKS_PER_SECOND
                words.append({
                    "text": word,
                    "startFrame": math.floor(start * FPS),
                    "endFrame": math.ceil(end * FPS),
                })
    return words


async def generate(video_id: str) -> None:
    config = VIDEOS[video_id]
    video_dir = PUBLIC_DIR / video_id
    audio_dir = video_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    segments = []
    start_frame = 0
    for i, text in enumerate(config["segments"], start=1):
        filename = f"segment_{i:02d}.mp3"
        out_path = audio_dir / filename
        words = await synthesize(text, config["voice"], config["rate"], out_path)

        seconds = audio_duration_seconds(out_path)
        duration_frames = math.ceil(seconds * FPS)
        segments.append({
            "id": i,
            "text": text,
            # Relative to public/, for staticFile() in Remotion.
            "audioFile": f"{video_id}/audio/{filename}",
            "startFrame": start_frame,
            "durationInFrames": duration_frames,
            "durationSeconds": round(seconds, 3),
            "words": words,
        })
        print(f"[{video_id} {i}/{len(config['segments'])}] {filename}: "
              f"{seconds:.3f}s -> {duration_frames} frames")
        start_frame += duration_frames + GAP_FRAMES

    total_frames = start_frame - GAP_FRAMES
    timing = {
        "fps": FPS,
        "voice": config["voice"],
        "rate": config["rate"],
        "gapFrames": GAP_FRAMES,
        "totalDurationInFrames": total_frames,
        "totalDurationSeconds": round(total_frames / FPS, 3),
        "segments": segments,
    }
    timing_file = video_dir / "timing.json"
    timing_file.write_text(json.dumps(timing, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {timing_file.relative_to(ROOT)} ({timing['totalDurationSeconds']}s total)")


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("videos", nargs="*", metavar="video",
                        help=f"videos to generate (default: all): {', '.join(VIDEOS)}")
    args = parser.parse_args()
    unknown = [v for v in args.videos if v not in VIDEOS]
    if unknown:
        parser.error(f"unknown video(s): {', '.join(unknown)}; choose from {', '.join(VIDEOS)}")
    for video_id in args.videos or list(VIDEOS):
        await generate(video_id)


if __name__ == "__main__":
    asyncio.run(main())
