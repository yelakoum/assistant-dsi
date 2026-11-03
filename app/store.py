import json
from pathlib import Path

import numpy as np


def sauvegarder_index(
    chunks: list[dict],
    vecteurs: np.ndarray,
    dossier: str | Path = Path("data/index"),
) -> None:
    """Enregistre l'index (chunks + vecteurs) sur le disque.

    Écrit deux fichiers dans `dossier` :
    - chunks.json  : la liste des chunks, lisible par un humain ;
    - vecteurs.npy : le tableau des embeddings, au format NumPy.

    La ligne i de `vecteurs` doit correspondre au chunk i.

    Args:
        chunks: liste de dictionnaires {"source", "fil_ariane", "texte"}.
        vecteurs: tableau NumPy de forme (nb_chunks, dimension).
        dossier: dossier où écrire l'index (créé s'il n'existe pas).

    Raises:
        ValueError: si le nombre de chunks et de vecteurs est différent.
    """
    if len(chunks) != vecteurs.shape[0]:
        raise ValueError(
            f"Index désaligné : {len(chunks)} chunks mais {vecteurs.shape[0]} vecteurs."
        )

    dossier = Path(dossier)
    dossier.mkdir(parents=True, exist_ok=True)

    chemin_chunks = dossier / "chunks.json"
    with open(chemin_chunks, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    chemin_vecteurs = dossier / "vecteurs.npy"
    np.save(chemin_vecteurs, vecteurs)
import json
from pathlib import Path

import numpy as np


def sauvegarder_index(chunks: list[dict],vecteurs: np.ndarray,dossier: str | Path = Path("data/index")) -> None:
    """Enregistre l'index (chunks + vecteurs) sur le disque.

    Écrit deux fichiers dans `dossier` :
    - chunks.json  : la liste des chunks, lisible par un humain ;
    - vecteurs.npy : le tableau des embeddings, au format NumPy.

    La ligne i de `vecteurs` doit correspondre au chunk i.

    Args:
        chunks: liste de dictionnaires {"source", "fil_ariane", "texte"}.
        vecteurs: tableau NumPy de forme (nb_chunks, dimension).
        dossier: dossier où écrire l'index (créé s'il n'existe pas).

    Raises:
        ValueError: si le nombre de chunks et de vecteurs est différent.
    """
    if len(chunks) != vecteurs.shape[0]:
        raise ValueError(
            f"Index désaligné : {len(chunks)} chunks mais {vecteurs.shape[0]} vecteurs."
        )

    dossier = Path(dossier)
    dossier.mkdir(parents=True, exist_ok=True)

    chemin_chunks = dossier / "chunks.json"
    with open(chemin_chunks, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    chemin_vecteurs = dossier / "vecteurs.npy"
    np.save(chemin_vecteurs, vecteurs)

def charger_index(
    dossier: str | Path = Path("data/index"),
) -> tuple[list[dict], np.ndarray]:
    """Recharge l'index (chunks + vecteurs) depuis le disque.

    Lit les deux fichiers écrits par `sauvegarder_index` :
    chunks.json et vecteurs.npy.

    Args:
        dossier: dossier où se trouve l'index.

    Returns:
        (chunks, vecteurs) : la liste des chunks et le tableau des embeddings.

    Raises:
        ValueError: si le nombre de chunks et de vecteurs est différent.
    """
    dossier = Path(dossier)

    chemin_chunks = dossier / "chunks.json"
    with open(chemin_chunks, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    chemin_vecteurs = dossier / "vecteurs.npy"
    vecteurs = np.load(chemin_vecteurs)

    if len(chunks) != vecteurs.shape[0]:
        raise ValueError(
            f"Index désaligné : {len(chunks)} chunks mais {vecteurs.shape[0]} vecteurs."
        )

    return chunks, vecteurs