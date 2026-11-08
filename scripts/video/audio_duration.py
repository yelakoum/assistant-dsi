"""Print the duration (seconds) of audio files, e.g. edge-tts MP3 output.

Usage: .venv/bin/python scripts/video/audio_duration.py public/audio/*.mp3
"""
import json
import shutil
import subprocess
import sys

from mutagen import File as MutagenFile

FPS = 60


def duration_seconds(path: str) -> float:
    audio = MutagenFile(path)
    if audio is not None and audio.info and audio.info.length:
        return float(audio.info.length)
    if shutil.which("ffprobe"):
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return float(out)
    raise RuntimeError(f"Cannot read duration of {path}")


if __name__ == "__main__":
    result = {}
    for p in sys.argv[1:]:
        secs = duration_seconds(p)
        result[p] = {"seconds": round(secs, 3), "frames": int(-(-secs * FPS // 1))}
    print(json.dumps(result, indent=2))
