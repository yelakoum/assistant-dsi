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
    # Long-form explainer (~2 min 30): entropy in detail. One segment per visual beat:
    # 1 hook, 2 plan, 3-5 surprise (coins), 6-8 information (8-card game, bits),
    # 9-13 entropy (formula, coins, curve, more classes), 14-15 decision tree +
    # pointer to episode 3, 16 Python, 17 recap, 18 quiz.
    "entropy": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+10%",
        "segments": [
            "Entropie. Le mot qui fait peur en machine learning. Pourtant, l'idée est super simple. "
            "Dans cette vidéo, on prend le temps : à la fin, tu vas vraiment la comprendre.",
            "On va voir quatre étapes : la surprise, l'information, l'entropie, "
            "et à quoi elle sert dans un arbre de décision.",
            "Commençons par une pièce truquée, qui tombe toujours sur pile. Tu la lances : pile. "
            "Aucune surprise. Tu connaissais déjà le résultat.",
            "Maintenant, une pièce normale : pile ou face, cinquante-cinquante. "
            "Impossible de prévoir. Là, il y a de l'incertitude.",
            "L'entropie, c'est exactement ça : une mesure de l'incertitude. "
            "Zéro quand tout est prévisible, et maximale quand tout est imprévisible.",
            "Mais comment la mesurer ? Avec un jeu. Je cache une carte parmi huit. "
            "Tu as droit à des questions oui ou non. Combien en faut-il ?",
            "Est-elle dans la moitié gauche ? Oui. Dans la première paire ? Non. "
            "Est-ce la troisième ? Oui, trouvé ! Trois questions. On dit que l'information vaut trois bits.",
            "En fait, c'est log deux de huit. Et plus un événement est rare, plus il apporte d'information : "
            "moins log deux de p. Probabilité un : zéro bit. Un demi : un bit. Un huitième : trois bits.",
            "L'entropie, c'est la moyenne de cette information, pondérée par les probabilités : "
            "H égale moins la somme de p fois log deux de p.",
            "Pour la pièce normale : un demi fois un bit, plus un demi fois un bit. "
            "Résultat : un bit. C'est le maximum pour deux résultats.",
            "Et une pièce truquée à quatre-vingt-dix pour cent ? Zéro virgule neuf fois zéro virgule quinze, "
            "plus zéro virgule un fois trois virgule trois. Environ zéro virgule quarante-sept bit. Moins d'incertitude.",
            "Si on trace l'entropie selon la probabilité de pile, on obtient cette courbe en cloche : "
            "zéro aux extrémités, un bit pile au milieu.",
            "Et avec plus de choix ? Deux couleurs à égalité : un bit. Quatre couleurs : deux bits. "
            "Huit couleurs : trois bits. Plus il y a de possibilités, plus l'incertitude grandit.",
            "Et dans un arbre de décision ? L'arbre veut des groupes purs, avec une entropie proche de zéro. "
            "À chaque étape, il choisit la question qui fait le plus baisser l'entropie : c'est le gain d'information.",
            "L'exemple complet, avec les élèves et leur examen, est dans l'épisode trois de la série "
            "ML en une minute. Va le voir juste après !",
            "En Python, une ligne suffit : entropy de scipy, avec base égale deux. "
            "Un demi, un demi : un bit. Zéro virgule neuf, zéro virgule un : zéro virgule quarante-sept. "
            "Quatre couleurs égales : deux bits.",
            "À retenir : l'entropie mesure l'incertitude. Zéro, c'est prévisible. "
            "Le maximum, c'est le chaos.",
            "Petit défi : un sac avec quatre couleurs, mais une couleur sort neuf fois sur dix. "
            "L'entropie est-elle plus grande ou plus petite que deux bits ? "
            "Réponds en commentaire, et abonne-toi pour la suite !",
        ],
    },
    # Long-form explainer: the SVM in depth. 1 intro ("tu veux apprendre le ML ?"),
    # 2 code teaser, 3 plan, 4-7 the idea (data, many lines, widest road, support
    # vectors), 8-11 the margin (w.x + b, sign, +-1 edges, width question), 12-14
    # the maths (projection, subtraction, 2/||w||), 15-16 optimisation + numbers,
    # 17 code, 18 recap, 19 kernel teaser + quiz.
    "svm": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+12%",
        "segments": [
            "Tu veux apprendre le machine learning ? Alors tu es au bon endroit. "
            "Aujourd'hui, on apprend un nouvel algorithme, en profondeur : le SVM, la machine à vecteurs de support.",
            "En Python, il tient en trois lignes : on importe SVC, on crée le modèle, et on appelle fit. "
            "Mais que se passe-t-il vraiment à l'intérieur ? C'est ce qu'on va découvrir.",
            "Quatre étapes : l'idée, la marge, le calcul de la distance, et l'optimisation.",
            "Reprenons nos mails. En bleu les vrais mails, en rouge les spams, "
            "selon le nombre de liens et de mots en majuscules. On veut une frontière entre les deux.",
            "Problème : il existe une infinité de droites qui les séparent. Celle-ci, celle-là… Laquelle choisir ?",
            "L'idée du SVM : prendre la droite qui passe le plus loin possible des deux groupes. "
            "Comme la route la plus large possible entre deux villages.",
            "Les points qui touchent les bords de la route sont les vecteurs de support. "
            "Ce sont eux, et eux seuls, qui fixent la frontière. On les appelle x plus et x moins.",
            "La frontière a une équation : w point x, plus b, égale zéro. "
            "w est un vecteur perpendiculaire à la frontière, et b la décale.",
            "Pour classer un mail, on regarde le signe. Positif : c'est un spam. Négatif : c'est un vrai mail.",
            "Les deux bords de la route, on les fixe à plus un et moins un. "
            "Donc : w point x plus, plus b, égale un. Et w point x moins, plus b, égale moins un.",
            "Maintenant, la vraie question : quelle est la largeur de la route ? "
            "C'est la distance entre x plus et x moins, mesurée perpendiculairement à la frontière.",
            "Pour ça, on projette le vecteur x plus moins x moins sur la direction de w, "
            "ramenée à une longueur de un : w divisé par la norme de w.",
            "On soustrait les équations des deux bords : les b s'annulent. "
            "Il reste : w point, x plus moins x moins, égale deux.",
            "Donc la largeur de la marge vaut deux divisé par la norme de w. C'est la formule clé du SVM.",
            "Pour la route la plus large, il faut rendre la norme de w la plus petite possible, "
            "en gardant chaque point du bon côté : y fois, w point x plus b, supérieur ou égal à un.",
            "Dans notre exemple : w vaut zéro virgule cinq, zéro virgule cinq, et b vaut moins trois. "
            "La marge vaut deux sur zéro virgule soixante et onze : deux virgule quatre-vingt-trois. "
            "Exactement la distance entre x plus et x moins !",
            "En Python : SVC avec un noyau linéaire. coef et intercept donnent w et b, "
            "support vectors donne nos deux points. Un mail avec six liens et trois majuscules ? Spam !",
            "À retenir : le SVM cherche la frontière avec la plus grande marge. "
            "Seuls les vecteurs de support comptent. Et la marge vaut deux sur la norme de w.",
            "Et si une droite ne suffit pas ? C'est le kernel trick, dans la prochaine vidéo. "
            "Petit défi : si on double w, que devient la marge ? Réponds en commentaire, et abonne-toi !",
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
    # Episode 3, entropy version: 1 hook, 2 data, 3 what entropy is, 4 formula
    # + class value, 5 test "revised > 4 h", 6 test "slept > 5 h" + choice,
    # 7 second level / finished tree, 8 sklearn code + export_text, 9 takeaway.
    "decision-tree": {
        "voice": "fr-FR-HenriNeural",
        "rate": "+14%",
        "segments": [
            "Comment un arbre de décision choisit ses questions ? Pas au hasard : "
            "il calcule l'entropie. Je t'explique tout en une minute.",
            "On veut prédire si un élève réussit son examen, avec ses heures de révision et de sommeil. "
            "Dans notre classe : quatre réussis, six ratés.",
            "L'entropie mesure le désordre d'un groupe. Si tout le monde a le même résultat, "
            "elle vaut zéro : le groupe est pur. À cinquante-cinquante, elle vaut un : c'est le chaos total.",
            "La formule : moins la somme de p fois log deux de p. Pour notre classe, "
            "quatre réussis sur dix : l'entropie vaut zéro virgule quatre-vingt-dix-sept. Presque le chaos.",
            "L'arbre teste chaque question possible. Révisé plus de quatre heures ? "
            "À gauche, que des ratés : entropie zéro. En moyenne, elle tombe à zéro virgule cinquante-cinq.",
            "Dormi plus de cinq heures ? Elle ne tombe qu'à zéro virgule soixante-neuf. "
            "Le gain d'information est plus petit : l'arbre choisit donc la révision.",
            "Puis il recommence sur le groupe encore mélangé. Dormi plus de cinq heures ? "
            "Cette fois, les deux groupes sont purs : entropie zéro. L'arbre est terminé !",
            "Avec scikit-learn : Decision Tree Classifier, avec criterion égal entropy. "
            "Un fit, et export text affiche l'arbre : exactement nos deux questions.",
            "À retenir : l'arbre choisit toujours la question qui fait le plus baisser l'entropie. "
            "Abonne-toi, et dis-moi en commentaire quel algo tu veux voir !",
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
