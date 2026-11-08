# assistant-dsi

## Vidéo TikTok (Remotion)

Format : 1080x1920, 60 fps, H.264, `yuv420p` (BT.709), CRF 18, audio 320k — voir `remotion.config.ts` et `src/config.ts`.

```bash
npm install                      # dépendances Remotion
python3 -m venv .venv && .venv/bin/pip install -r requirements-video.txt
npm run dev                      # Remotion Studio
npm run build                    # rendu -> out/video.mp4
```

- Voix off : `.venv/bin/python generate_audio.py` → `public/audio/segment_XX.mp3` + `public/timing.json`
  (début/durée de chaque segment en frames et minutage mot par mot pour les sous-titres).
  Relancer le script puis le rendu suffit : la durée de la composition est lue dans `timing.json`.
- Composition : `src/Main.tsx` (éditeur VS Code, terminal, cartes, sous-titres dans `<TikTokSafeArea>`).
  Les zones rouges de l'interface TikTok ne s'affichent que dans le Studio, jamais dans le rendu.
- Durées : `.venv/bin/python scripts/video/audio_duration.py public/audio/*.mp3` (secondes + frames à 60 fps)
- Prérequis système : `ffmpeg` / `ffprobe`
