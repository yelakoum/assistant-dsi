"""Vérifie, sur le vrai index, que le vecteur i correspond bien au chunk i."""
from pathlib import Path

import numpy as np
import pytest

from app.store import charger_index

DOSSIER_INDEX = Path("data/index")
DOSSIER_DOCS = Path("data/docs")


@pytest.fixture(scope="module")
def index():
    """Charge le vrai index une seule fois pour tous les tests du fichier."""
    if not (DOSSIER_INDEX / "chunks.json").exists():
        pytest.skip("Index absent : lancer d'abord `python -m scripts.ingest`.")
    return charger_index(DOSSIER_INDEX)


def test_alignement_par_sondage(index):
    # Import ici : le modèle n'est chargé que si ce test tourne vraiment.
    from app.embedder import encoder_passages

    chunks, vecteurs = index
    positions = [0, len(chunks) // 2, len(chunks) - 1]

    nouveaux = encoder_passages([chunks[i]["texte"] for i in positions])

    for i, nouveau in zip(positions, nouveaux):
        score = float(np.dot(nouveau, vecteurs[i]))
        assert score > 0.99, f"Chunk {i} désaligné (similarité {score:.3f})"


def test_vecteurs_normalises(index):
    _, vecteurs = index
    normes = np.linalg.norm(vecteurs, axis=1)
    assert np.allclose(normes, 1.0, atol=1e-3)


def test_sources_existent(index):
    chunks, _ = index
    for chunk in chunks:
        assert (DOSSIER_DOCS / chunk["source"]).exists(), chunk["source"]