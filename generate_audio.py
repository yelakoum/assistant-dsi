"""Generate the TikTok voiceover with edge-tts and export frame-accurate timing.

Usage:
    .venv/bin/python generate_audio.py

Outputs:
    public/audio/segment_XX.mp3   one file per segment
    public/timing.json            text, audio file, startFrame, durationInFrames,
                                  plus per-word timings for synced subtitles
"""

from __future__ import annotations

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
AUDIO_DIR = PUBLIC_DIR / "audio"
TIMING_FILE = PUBLIC_DIR / "timing.json"

FPS = 60
VOICE = "en-US-AndrewNeural"
RATE = "+12%"  # a bit faster than normal for a punchy TikTok pace
GAP_FRAMES = 6  # 0.1 s breath between segments

# One entry per visual segment (see src/Main.tsx):
#   1 hook + typing the for loop, 2 transform into a comprehension,
#   3 run it / terminal output, 4 takeaway.
SEGMENTS = [
    "Stop writing Python loops like this! Four lines, just to double a list?",
    "Watch. Collapse it into one list comprehension: x times two, for x in nums.",
    "Run it, and you get the exact same output. Two, four, six, eight, ten.",
    "Cleaner, more Pythonic, and usually faster. Follow for more Python tips!",
]

TICKS_PER_SECOND = 10_000_000  # edge-tts offsets are in 100 ns units


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


async def synthesize(text: str, out_path: Path) -> list[dict]:
    """Write the MP3 and return word timings (frames, relative to segment start)."""
    # edge-tts ignores HTTPS_PROXY by default; pass it through when set.
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    communicate = edge_tts.Communicate(
        text, VOICE, rate=RATE, proxy=proxy, boundary="WordBoundary"
    )
    words = []
    with out_path.open("wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # edge-tts sometimes glues punctuation to a word (e.g. ": x").
                word = re.sub(r"^[^\w']+|[^\w']+$", "", chunk["text"])
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


async def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    segments = []
    start_frame = 0
    for i, text in enumerate(SEGMENTS, start=1):
        filename = f"segment_{i:02d}.mp3"
        out_path = AUDIO_DIR / filename
        words = await synthesize(text, out_path)

        seconds = audio_duration_seconds(out_path)
        duration_frames = math.ceil(seconds * FPS)
        segments.append({
            "id": i,
            "text": text,
            "audioFile": f"audio/{filename}",  # use with staticFile() in Remotion
            "startFrame": start_frame,
            "durationInFrames": duration_frames,
            "durationSeconds": round(seconds, 3),
            "words": words,
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
