import numpy as np
import pytest

from app.store import charger_index, sauvegarder_index


def faux_index(n=2, dim=384):
    """Crée n faux chunks (avec accent) et n vecteurs aléatoires."""
    chunks = [
        {
            "source": f"doc{i}.md",
            "fil_ariane": f"Doc {i} > Section",
            "texte": f"Le vidéoprojecteur n°{i} ne s'allume pas",
        }
        for i in range(n)
    ]
    vecteurs = np.random.rand(n, dim).astype(np.float32)
    return chunks, vecteurs


def test_aller_retour(tmp_path):
    chunks, vecteurs = faux_index()
    sauvegarder_index(chunks, vecteurs, tmp_path)

    chunks_recharges, vecteurs_recharges = charger_index(tmp_path)

    assert chunks_recharges == chunks
    assert np.array_equal(vecteurs_recharges, vecteurs)
    assert vecteurs_recharges.dtype == vecteurs.dtype


def test_cree_le_dossier(tmp_path):
    dossier = tmp_path / "sous" / "dossier"
    sauvegarder_index(*faux_index(), dossier)

    assert (dossier / "chunks.json").exists()
    assert (dossier / "vecteurs.npy").exists()


def test_accents_lisibles(tmp_path):
    sauvegarder_index(*faux_index(), tmp_path)

    contenu = (tmp_path / "chunks.json").read_text(encoding="utf-8")
    assert "vidéoprojecteur" in contenu


def test_sauvegarde_refuse_desalignement(tmp_path):
    chunks, _ = faux_index(n=2)
    _, vecteurs = faux_index(n=3)

    with pytest.raises(ValueError, match="désaligné"):
        sauvegarder_index(chunks, vecteurs, tmp_path)

    # La vérification est au début : rien n'a été écrit.
    assert not (tmp_path / "chunks.json").exists()


def test_chargement_detecte_desalignement(tmp_path):
    chunks, vecteurs = faux_index(n=2)
    sauvegarder_index(chunks, vecteurs, tmp_path)

    # On abîme volontairement un des deux fichiers.
    np.save(tmp_path / "vecteurs.npy", np.random.rand(3, 384))

    with pytest.raises(ValueError, match="désaligné"):
        charger_index(tmp_path)


def test_dossier_inexistant(tmp_path):
    with pytest.raises(FileNotFoundError):
        charger_index(tmp_path / "rien")