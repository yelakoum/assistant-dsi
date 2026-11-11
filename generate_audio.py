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
# edge-tts leaves ~0.6 s of silence after the last word; keep only this much.
TAIL_SILENCE_SECONDS = 0.25
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
    # src/videos/gradient-descent (part 2, beginner-friendly): 1 hook, 2 formula in
    # plain words, 3 guess vs reality, 4 error score, 5 fog / valley,
    # 6 small steps (gradient descent), 7 cliffhanger (steps too big), 8 quiz.
    "gradient-descent": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+20%",
        "segments": [
            "Une machine qui apprend toute seule, ça a l'air magique. "
            "En vrai, elle fait exactement comme toi : elle se trompe… et elle corrige. Je te montre.",
            "Pour estimer le prix d'un appart, le modèle fait un calcul tout simple : "
            "le prix au mètre carré, fois la surface, plus un prix de départ. C'est tout. "
            "Ça, c'est la fameuse formule : y égale a fois x, plus b.",
            "Au début, la machine ne connaît pas les bons nombres. Alors elle devine. "
            "Elle compare son prix avec le vrai prix… et regarde de combien elle s'est trompée.",
            "Elle fait ça pour tous les apparts, et elle calcule un score d'erreur. Plus il est bas, mieux c'est. "
            "Petite astuce : les grosses erreurs comptent beaucoup plus que les petites. "
            "Se tromper de 2, ça coûte 4. Se tromper de 10, ça coûte 100.",
            "Le but : trouver les nombres qui donnent le score le plus bas. "
            "Imagine un randonneur perdu dans le brouillard, qui cherche le fond de la vallée. "
            "Il ne voit rien… mais il sent la pente sous ses pieds.",
            "Alors il fait un petit pas vers le bas. Puis un autre. Et encore un autre. "
            "À chaque pas, la droite s'améliore et l'erreur baisse. "
            "C'est ce que les pros appellent la descente de gradient.",
            "Mais attention : s'il fait des pas trop grands, il saute par-dessus la vallée… "
            "et se perd complètement. Alors comment choisir la bonne taille de pas ? "
            "Réponse dans la prochaine vidéo.",
            "Petit défi : tu es dans le brouillard, et le sol monte vers la droite. "
            "Tu fais ton pas à gauche ou à droite ? "
            "Réponds A ou B en commentaire, et abonne-toi pour avoir la réponse !",
        ],
    },
    # ---- Series "ML en 1 minute" (one video per day, each standalone) --------
    # Segments: 1 hook, 2 example data, 3 idea, 4 decision, 5 sklearn fit,
    # 6 predict + real output, 7 takeaway + teaser for the next episode.
    "logistic-regression": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+12%",
        "segments": [
            "Ce mail, c'est un spam ou pas ? Ton IA répond avec un seul algo : "
            "la régression logistique. Je t'explique en une minute !",
            "Exemple : pour chaque mail, on compte les liens. "
            "En bas, les vrais mails. En haut, les spams.",
            "Une droite ne marche pas ici. Alors on trace une courbe en S, la sigmoïde : "
            "elle donne une probabilité, entre zéro et cent pour cent.",
            "Ensuite, on fixe un seuil à cinquante pour cent. "
            "Au-dessus, c'est un spam. En dessous, c'est un vrai mail.",
            "Avec scikit-learn, c'est trois lignes : on importe Logistic Regression, "
            "on crée le modèle, et on l'entraîne avec fit.",
            "Un mail avec sept liens ? predict répond 1 : spam ! "
            "Et predict proba donne la probabilité : quatre-vingt-seize pour cent.",
            "À retenir : malgré son nom, c'est un algo de classification. "
            "Demain, épisode deux : le KNN. Abonne-toi pour ne pas le rater !",
        ],
    },
    "knn": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+12%",
        "segments": [
            "Chat ou chien ? Pour décider, cet algo regarde juste… tes voisins. "
            "C'est le KNN, et je te l'explique en une minute !",
            "Exemple : des animaux, avec leur poids et leur taille. "
            "En bleu les chats, en orange les chiens.",
            "Un nouvel animal arrive : six kilos, vingt-huit centimètres. "
            "On cherche ses trois voisins les plus proches.",
            "Puis on fait voter les voisins : deux chats contre un chien. "
            "Verdict : c'est un chat !",
            "Avec scikit-learn : on importe K Neighbors Classifier, "
            "on choisit trois voisins, et on appelle fit.",
            "predict répond : chat. Et predict proba montre le vote : "
            "deux tiers chat, un tiers chien.",
            "À retenir : le KNN n'apprend rien, il mémorise tout. Prends un k impair, "
            "et mets tes données à la même échelle. Demain, épisode trois : l'arbre de décision !",
        ],
    },
    "decision-tree": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+12%",
        "segments": [
            "Akinator devine ton personnage en posant des questions. "
            "L'arbre de décision fait pareil ! Je te montre en une minute.",
            "Exemple : on veut prédire si un élève réussit son examen, "
            "avec ses heures de révision et de sommeil.",
            "L'arbre cherche la meilleure question. D'abord : as-tu révisé plus de quatre heures ? "
            "Si non : raté.",
            "Si oui, deuxième question : as-tu dormi plus de cinq heures ? "
            "Si oui : réussi ! Chaque question coupe le graphique en deux.",
            "Avec scikit-learn : Decision Tree Classifier, avec max depth égal 2 "
            "pour limiter le nombre de questions. Puis fit.",
            "Six heures de révision, sept heures de sommeil ? predict répond 1 : réussi. "
            "Et le score est de cent pour cent.",
            "À retenir : c'est facile à lire, mais un arbre trop profond apprend par cœur. "
            "Et toi, quel algo tu veux voir ensuite ? Dis-le en commentaire, et abonne-toi !",
        ],
    },
}


def trim_trailing_silence(path: Path) -> None:
    """Cut silence after the last word (word timings are unaffected)."""
    if not shutil.which("ffmpeg"):
        return
    tmp = path.with_suffix(".trim.mp3")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(path), "-af",
         "areverse,silenceremove=start_periods=1:start_threshold=-50dB:"
         f"start_silence={TAIL_SILENCE_SECONDS},areverse",
         "-c:a", "libmp3lame", "-b:a", "96k", str(tmp)],
        check=True,
    )
    tmp.replace(path)


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


async def synthesize(text: str, voice: str, rate: str, out_path: Path,
                     attempts: int = 4) -> list[dict]:
    """Like _synthesize_once, retrying transient edge-tts / network failures."""
    for attempt in range(1, attempts + 1):
        try:
            return await _synthesize_once(text, voice, rate, out_path)
        except Exception as exc:  # aiohttp / edge-tts raise various error types
            if attempt == attempts:
                raise
            delay = 2 ** attempt
            print(f"  edge-tts failed ({type(exc).__name__}), retrying in {delay}s...")
            await asyncio.sleep(delay)
    raise AssertionError("unreachable")


async def _synthesize_once(text: str, voice: str, rate: str, out_path: Path) -> list[dict]:
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
        trim_trailing_silence(out_path)

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
