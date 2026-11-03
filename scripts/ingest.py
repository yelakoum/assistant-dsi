import time
from pathlib import Path

from app.chunker import decouper_markdown
from app.embedder import encoder_passages
from app.store import sauvegarder_index

DOSSIER_DOCS = Path("data/docs")
DOSSIER_INDEX = Path("data/index")


def main() -> None:
    debut = time.perf_counter()

    # 1. Inventaire des documents
    fichiers = sorted(DOSSIER_DOCS.glob("*.md"))
    if not fichiers:
        raise FileNotFoundError(f"Aucun fichier .md dans {DOSSIER_DOCS.resolve()}")
    print(f"{len(fichiers)} documents trouvés")

    # 2. Chunking de tous les documents
    chunks = []
    for fichier in fichiers:
        texte = fichier.read_text(encoding="utf-8")
        chunks.extend(decouper_markdown(texte, fichier.name))
    print(f"{len(chunks)} chunks")

    # 3. Embeddings : un seul appel pour tous les chunks (l'ordre est fixé ici)
    textes = [chunk["texte"] for chunk in chunks]
    vecteurs = encoder_passages(textes)
    print(f"Vecteurs : {vecteurs.shape}")

    # 4. Enregistrement
    sauvegarder_index(chunks, vecteurs, DOSSIER_INDEX)

    duree = time.perf_counter() - debut
    print(f"Index enregistré dans {DOSSIER_INDEX}/ en {duree:.1f} s")


if __name__ == "__main__":
    main()