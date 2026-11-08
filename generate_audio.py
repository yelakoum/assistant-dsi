"""Generate the TikTok voiceover with edge-tts and export frame-accurate timing.

Usage:
    .venv/bin/python generate_audio.py

Outputs:
    public/audio/segment_XX.mp3   one file per segment
    public/timing.json            text, audio file, startFrame, durationInFrames
"""

from __future__ import annotations

import asyncio
import json
import math
import os
import shutil
import subprocess
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"
AUDIO_DIR = PUBLIC_DIR / "audio"
TIMING_FILE = PUBLIC_DIR / "timing.json"

FPS = 60
VOICE = "en-US-AndrewNeural"
RATE = "+12%"  # a bit faster than normal for a punchy TikTok pace
GAP_FRAMES = 6  # 0.1 s breath between segments

SEGMENTS = [
    "Stop writing Python loops like this! There's a one-liner the pros use instead.",
    "The for loop way: create an empty list, loop over your numbers, "
    "and append each square. Three lines, just to build a list.",
    "The list comprehension way: squares equals x squared, for x in numbers. "
    "One line. Same result.",
    "Cleaner, and usually faster too. Follow for more Python tips!",
]


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


async def synthesize(text: str, out_path: Path) -> None:
    # edge-tts ignores HTTPS_PROXY by default; pass it through when set.
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, proxy=proxy)
    await communicate.save(str(out_path))


async def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    segments = []
    start_frame = 0
    for i, text in enumerate(SEGMENTS, start=1):
        filename = f"segment_{i:02d}.mp3"
        out_path = AUDIO_DIR / filename
        await synthesize(text, out_path)

        seconds = audio_duration_seconds(out_path)
        duration_frames = math.ceil(seconds * FPS)
        segments.append({
            "id": i,
            "text": text,
            "audioFile": f"audio/{filename}",  # use with staticFile() in Remotion
            "startFrame": start_frame,
            "durationInFrames": duration_frames,
            "durationSeconds": round(seconds, 3),
        })
        print(f"[{i}/{len(SEGMENTS)}] {filename}: {seconds:.3f}s -> {duration_frames} frames")
        start_frame += duration_frames + GAP_FRAMES

    total_frames = start_frame - GAP_FRAMES
    timing = {
        "fps": FPS,
        "voice": VOICE,
        "rate": RATE,
        "gapFrames": GAP_FRAMES,
        "totalDurationInFrames": total_frames,
        "totalDurationSeconds": round(total_frames / FPS, 3),
        "segments": segments,
    }
    TIMING_FILE.write_text(json.dumps(timing, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {TIMING_FILE.relative_to(ROOT)} ({timing['totalDurationSeconds']}s total)")


if __name__ == "__main__":
    asyncio.run(main())
