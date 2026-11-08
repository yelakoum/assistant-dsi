# assistant-dsi

## Vidéo TikTok (Remotion)

Format : 1080x1920, 60 fps, H.264, `yuv420p` (BT.709), CRF 18, audio 320k — voir `remotion.config.ts` et `src/config.ts`.

```bash
npm install                      # dépendances Remotion
python3 -m venv .venv && .venv/bin/pip install -r requirements-video.txt
npm run dev                      # Remotion Studio
npm run build                    # rendu -> out/video.mp4
```

- Voix : `.venv/bin/edge-tts --voice fr-FR-DeniseNeural --text "..." --write-media public/audio/scene1.mp3`
- Durées : `.venv/bin/python scripts/video/audio_duration.py public/audio/*.mp3` (secondes + frames à 60 fps)
- Prérequis système : `ffmpeg` / `ffprobe`
