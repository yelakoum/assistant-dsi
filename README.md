# assistant-dsi

## Vidéos TikTok (Remotion)

Format : 1080x1920, 60 fps, H.264, `yuv420p` (BT.709), CRF 18, audio 320k — voir `remotion.config.ts` et `src/config.ts`.

| Composition | Sujet | Langue | Code |
|---|---|---|---|
| `ListComprehension` | List comprehension vs boucle `for` (~20 s) | anglais | `src/videos/list-comprehension/` |
| `LinearRegression` | Régression linéaire + exemple scikit-learn (~58 s) | français | `src/videos/linear-regression/` |
| `GradientDescent` | Partie 2 : formule, score d'erreur, descente de gradient, quiz (~79 s) | français | `src/videos/gradient-descent/` |

```bash
npm install                      # dépendances Remotion
python3 -m venv .venv && .venv/bin/pip install -r requirements-video.txt
npm run dev                      # Remotion Studio (zones TikTok en rouge)
npm run build:linear-regression  # -> out/linear-regression.mp4
npm run build:gradient-descent   # -> out/gradient-descent.mp4
npm run build                    # toutes les vidéos
```

- Voix off : `.venv/bin/python generate_audio.py linear-regression` (sans argument : toutes les vidéos).
  Les textes, voix et vitesses sont dans `VIDEOS` en haut du script. Sorties : `public/<video>/audio/*.mp3`
  et `public/<video>/timing.json` (début/durée de chaque segment en frames + minutage mot par mot).
  La durée de chaque composition est lue dans son `timing.json` : relancer le script puis le rendu suffit.
- Les animations sont calées sur des mots de la voix off (ex. « erreur », « carré ») ; si un mot change,
  l'animation retombe sur une position par défaut dans le segment.
- `scripts/video/linear_regression_demo.py` : le code exact montré dans la vidéo de régression ;
  sa sortie réelle est recopiée dans `src/videos/linear-regression/code.ts`.
- `src/videos/gradient-descent/descent.ts` : vraie descente de gradient sur les données des appartements
  (seul `a` est appris, `b` est fixé à sa meilleure valeur). Les pas montrés et les scores affichés en sortent.
- Composants partagés dans `src/components/` (`TikTokSafeArea`, éditeur, terminal, sous-titres…).
  Les zones rouges de l'interface TikTok ne s'affichent que dans le Studio, jamais dans le rendu.
- Durées : `.venv/bin/python scripts/video/audio_duration.py public/<video>/audio/*.mp3`
- Prérequis système : `ffmpeg` / `ffprobe`
