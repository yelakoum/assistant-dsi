import numpy as np
from sentence_transformers import SentenceTransformer

NOM_MODELE = "intfloat/multilingual-e5-small"

_modele = None   
# le modèle, chargé une seule fois


def charger_modele() -> SentenceTransformer:
    """Charge le modèle au premier appel, puis renvoie toujours le même."""
    global _modele
    if _modele is None:
        _modele = SentenceTransformer(NOM_MODELE)
    return _modele


def encoder_passages(textes: list[str]) -> np.ndarray:
    """Transforme une liste de chunks en vecteurs normalisés. Forme : (nb_textes, 384)."""
    modele = charger_modele()
    # TODO 1 : ajouter "passage: " devant chaque texte (une liste en compréhension)
    # TODO 2 : encoder avec normalize_embeddings=True, et renvoyer le résultat
    textes_prefixes = [f"passage: {t}" for t in textes]
    return  modele.encode(textes_prefixes,normalize_embeddings=True)

def encoder_question(question: str) -> np.ndarray:
    """Transforme une question en vecteur normalisé. Forme : (384,)."""
    modele = charger_modele()
    # TODO 3 : même chose, avec le préfixe "query: " (une seule question, pas une liste)
    question_prefix = f"query: {question}"
    return  modele.encode(question_prefix,normalize_embeddings=True)