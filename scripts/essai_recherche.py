from pathlib import Path

from app.chunker import decouper_markdown
from app.embedder import encoder_passages, encoder_question

# 1. Découper les 10 documents en chunks
chunks = []
for fichier in sorted(Path("data/docs").glob("*.md")):
    chunks.extend(decouper_markdown(fichier.read_text(encoding="utf-8"), fichier.name))

# 2. Transformer les 84 chunks en vecteurs (avec TON embedder)
vecteurs = encoder_passages([c["texte"] for c in chunks])
print("Forme de la matrice :", vecteurs.shape)

# 3. Une question, et les 3 chunks les plus proches
question = "j’ai fait trop d’essais et je ne peux plus me connecter"
q = encoder_question(question)
scores = vecteurs @ q
meilleurs = scores.argsort()[::-1][:3]
for i in meilleurs:
    print(f"{scores[i]:.3f}  {chunks[i]['fil_ariane']}")